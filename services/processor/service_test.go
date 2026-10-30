package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestResumeWebhookRequiresSecretAndJobID(t *testing.T) {
	service := newService(config{webhookSecret: "secret"}, fakeStore{}, fakePipeline{})
	handler := service.routes()

	unauthorized := httptest.NewRequest(http.MethodPost, "/webhooks/resume", strings.NewReader(`{"job_id":"job"}`))
	unauthorizedRecorder := httptest.NewRecorder()
	handler.ServeHTTP(unauthorizedRecorder, unauthorized)
	if unauthorizedRecorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", unauthorizedRecorder.Code)
	}

	invalid := httptest.NewRequest(http.MethodPost, "/webhooks/resume", strings.NewReader(`{}`))
	invalid.Header.Set("X-Webhook-Secret", "secret")
	invalidRecorder := httptest.NewRecorder()
	handler.ServeHTTP(invalidRecorder, invalid)
	if invalidRecorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", invalidRecorder.Code)
	}
}

func TestResumeWebhookAcceptsSupabaseEventEnvelope(t *testing.T) {
	service := newService(config{webhookSecret: "secret"}, fakeStore{}, fakePipeline{})
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/webhooks/resume", strings.NewReader(`{"type":"INSERT","table":"processing_jobs","record":{"id":"job"}}`))
	request.Header.Set("X-Webhook-Secret", "secret")
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202", recorder.Code)
	}
}

func TestHealthzDoesNotNeedSecrets(t *testing.T) {
	service := newService(config{webhookSecret: "secret"}, fakeStore{}, fakePipeline{})
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"status":"ok"`) {
		t.Fatalf("health response = %d %q", recorder.Code, recorder.Body.String())
	}
}

type fakePipeline struct{}

func (fakePipeline) process(context.Context, processingJob) (extraction, error) {
	return extraction{}, nil
}

// recordingJobStore records the lifecycle calls service.process makes so the
// failure routing and shutdown guarantees can be asserted.
type recordingJobStore struct {
	mu             sync.Mutex
	job            processingJob
	claimErr       error
	completeErr    error
	failErr        error
	failed         []processingJob
	completed      []processingJob
	failCause      error
	failCtxErr     error
	completeCtxErr error
}

func (store *recordingJobStore) claim(context.Context, string) (processingJob, error) {
	return store.job, store.claimErr
}

func (store *recordingJobStore) queued(context.Context) ([]string, error) { return nil, nil }

func (store *recordingJobStore) loadTaxonomy(context.Context) ([]taxonomyEntry, error) {
	return testTaxonomy(), nil
}

func (store *recordingJobStore) downloadResume(context.Context, processingJob) ([]byte, error) {
	return []byte("PDF"), nil
}

func (store *recordingJobStore) recalculate(context.Context, processingJob) error { return nil }

func (store *recordingJobStore) complete(ctx context.Context, job processingJob, _ extraction) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.completed = append(store.completed, job)
	store.completeCtxErr = ctx.Err()
	return store.completeErr
}

func (store *recordingJobStore) fail(ctx context.Context, job processingJob, cause error) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.failed = append(store.failed, job)
	store.failCause = cause
	store.failCtxErr = ctx.Err()
	return store.failErr
}

// scriptedPipeline returns one fixed result or failure and counts the jobs it
// was asked to process.
type scriptedPipeline struct {
	result extraction
	err    error
	calls  int
}

func (pipeline *scriptedPipeline) process(context.Context, processingJob) (extraction, error) {
	pipeline.calls++
	return pipeline.result, pipeline.err
}

func TestProcessReturnsEarlyWhenJobIsNotClaimed(t *testing.T) {
	store := &recordingJobStore{claimErr: errJobNotClaimed}
	pipeline := &scriptedPipeline{}
	newService(config{}, store, pipeline).process(context.Background(), "job-1")

	if pipeline.calls != 0 || len(store.completed) != 0 || len(store.failed) != 0 {
		t.Fatalf("claim miss must stop the lifecycle: calls=%d completed=%d failed=%d", pipeline.calls, len(store.completed), len(store.failed))
	}
}

func TestProcessCompletesSuccessfulJob(t *testing.T) {
	store := &recordingJobStore{job: processingJob{ID: "job-1", Kind: jobKindResume}}
	pipeline := &scriptedPipeline{result: supportedExtraction("Diesel mechanics")}
	newService(config{}, store, pipeline).process(context.Background(), "job-1")

	if pipeline.calls != 1 || len(store.completed) != 1 || len(store.failed) != 0 {
		t.Fatalf("calls=%d completed=%d failed=%d", pipeline.calls, len(store.completed), len(store.failed))
	}
	if store.completed[0].ID != "job-1" || store.completeCtxErr != nil {
		t.Fatalf("completed job = %#v context error = %v", store.completed[0], store.completeCtxErr)
	}
}

func TestProcessFailsJobWhenPipelineFails(t *testing.T) {
	cause := terminalProcessingError("Upload an unlocked PDF.")
	store := &recordingJobStore{job: processingJob{ID: "job-1", Kind: jobKindResume}}
	pipeline := &scriptedPipeline{err: cause}
	newService(config{}, store, pipeline).process(context.Background(), "job-1")

	if len(store.completed) != 0 || len(store.failed) != 1 {
		t.Fatalf("completed=%d failed=%d", len(store.completed), len(store.failed))
	}
	if store.failCause != cause {
		t.Fatalf("failure cause = %v, want the pipeline error", store.failCause)
	}
}

func TestProcessFailsUnknownJobKindTerminally(t *testing.T) {
	store := &recordingJobStore{job: processingJob{ID: "job-1", Kind: "mystery_kind"}}
	pipeline := &scriptedPipeline{}

	var logged bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&logged)
	defer log.SetOutput(previous)

	newService(config{}, store, pipeline).process(context.Background(), "job-1")

	if pipeline.calls != 0 {
		t.Fatalf("unknown kind must not reach the CV pipeline, calls = %d", pipeline.calls)
	}
	if len(store.failed) != 1 || len(store.completed) != 0 {
		t.Fatalf("completed=%d failed=%d", len(store.completed), len(store.failed))
	}
	var failure processingError
	if !errors.As(store.failCause, &failure) || !failure.terminal {
		t.Fatalf("unknown kind must fail terminally, cause = %v", store.failCause)
	}
	if !strings.Contains(logged.String(), "mystery_kind") {
		t.Fatalf("log must name the unsupported kind: %s", logged.String())
	}
}

// A SIGTERM cancels the worker context; the final state write must still reach
// the store or the job stays in 'processing' until stale recovery.
func TestProcessStillFailsJobAfterWorkerContextIsCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	store := &recordingJobStore{job: processingJob{ID: "job-1", Kind: jobKindResume}}
	pipeline := &scriptedPipeline{err: context.Canceled}
	newService(config{}, store, pipeline).process(ctx, "job-1")

	if len(store.failed) != 1 {
		t.Fatalf("failed write attempts = %d, want 1", len(store.failed))
	}
	if store.failCtxErr != nil {
		t.Fatalf("terminal fail ran on a cancelled context: %v", store.failCtxErr)
	}
}

func TestProcessStillCompletesJobAfterWorkerContextIsCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	store := &recordingJobStore{job: processingJob{ID: "job-1", Kind: jobKindResume}}
	pipeline := &scriptedPipeline{result: supportedExtraction("Diesel mechanics")}
	newService(config{}, store, pipeline).process(ctx, "job-1")

	if len(store.completed) != 1 || len(store.failed) != 0 {
		t.Fatalf("completed=%d failed=%d", len(store.completed), len(store.failed))
	}
	if store.completeCtxErr != nil {
		t.Fatalf("terminal complete ran on a cancelled context: %v", store.completeCtxErr)
	}
}

// The terminal flag the applicant's retry policy depends on is decided by the
// real store, so drive the lifecycle through it instead of the recorder.
func TestProcessSendsFailureTerminalityToTheStore(t *testing.T) {
	tests := []struct {
		name     string
		cause    error
		message  string
		terminal bool
	}{
		{name: "terminal document failure", cause: terminalProcessingError("Upload an unlocked PDF."), message: "Upload an unlocked PDF.", terminal: true},
		{name: "permanent model status", cause: modelHTTPError{status: http.StatusUnauthorized}, message: modelRejectedMessage, terminal: true},
		{name: "rate limited model", cause: modelHTTPError{status: http.StatusTooManyRequests}, message: "We could not process this CV. Please try again.", terminal: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var recorded struct {
				Message  string `json:"safe_error_message"`
				Terminal bool   `json:"terminal_failure"`
			}
			server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
				switch request.URL.Path {
				case "/rest/v1/rpc/claim_processing_job":
					writer.Header().Set("Content-Type", "application/json")
					_, _ = writer.Write([]byte(`[{"id":"job-1","kind":"resume_analysis"}]`))
				case "/rest/v1/rpc/fail_processing_job":
					if err := json.NewDecoder(request.Body).Decode(&recorded); err != nil {
						t.Errorf("decode fail payload: %v", err)
					}
					writer.WriteHeader(http.StatusNoContent)
				default:
					t.Errorf("unexpected path %q", request.URL.Path)
					writer.WriteHeader(http.StatusNotFound)
				}
			}))
			defer server.Close()

			store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
			newService(config{}, store, &scriptedPipeline{err: test.cause}).process(context.Background(), "job-1")

			if recorded.Terminal != test.terminal || recorded.Message != test.message {
				t.Fatalf("fail payload = %#v, want terminal=%v message=%q", recorded, test.terminal, test.message)
			}
		})
	}
}

// blockingPipeline parks inside process until the test releases it, so the
// number of simultaneously running jobs is observable.
type blockingPipeline struct {
	started chan struct{}
	release chan struct{}
}

func (pipeline blockingPipeline) process(context.Context, processingJob) (extraction, error) {
	pipeline.started <- struct{}{}
	<-pipeline.release
	return extraction{}, errors.New("pipeline stopped")
}

func TestServiceRunsConfiguredNumberOfWorkers(t *testing.T) {
	const workerCount = 3
	store := &recordingJobStore{job: processingJob{ID: "job", Kind: jobKindResume}}
	pipeline := blockingPipeline{started: make(chan struct{}, workerCount), release: make(chan struct{})}
	service := newService(config{workerConcurrency: workerCount, pollInterval: time.Hour}, store, pipeline)
	service.start()
	defer service.stop()

	for index := range workerCount {
		service.jobs <- fmt.Sprintf("job-%d", index)
	}
	timeout := time.After(10 * time.Second)
	for index := range workerCount {
		select {
		case <-pipeline.started:
		case <-timeout:
			t.Fatalf("only %d of %d workers started a job", index, workerCount)
		}
	}
	close(pipeline.release)
}
