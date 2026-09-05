package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var errJobNotClaimed = errors.New("processing job was not claimed")

type jobStore interface {
	claim(context.Context, string) (processingJob, error)
	queued(context.Context) ([]string, error)
	loadTaxonomy(context.Context) ([]taxonomyEntry, error)
	downloadResume(context.Context, processingJob) ([]byte, error)
	complete(context.Context, processingJob, extraction) error
	recalculate(context.Context, processingJob) error
	fail(context.Context, processingJob, error) error
}

type supabaseStore struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

func (store *supabaseStore) loadTaxonomy(ctx context.Context) ([]taxonomyEntry, error) {
	var entries []taxonomyEntry
	if err := store.postJSON(ctx, "/rest/v1/rpc/get_active_extraction_taxonomy", map[string]any{}, &entries); err != nil {
		return nil, err
	}
	if err := validateTaxonomy(entries); err != nil {
		return nil, err
	}
	return entries, nil
}

func newSupabaseStore(config config) *supabaseStore {
	return &supabaseStore{
		baseURL: config.supabaseURL,
		apiKey:  config.supabaseServiceKey,
		client:  &http.Client{Timeout: 45 * time.Second},
	}
}

func (store *supabaseStore) claim(ctx context.Context, jobID string) (processingJob, error) {
	var response []processingJob
	if err := store.postJSON(ctx, "/rest/v1/rpc/claim_processing_job", map[string]string{"processing_job_id": jobID}, &response); err != nil {
		return processingJob{}, err
	}
	if len(response) != 1 {
		return processingJob{}, errJobNotClaimed
	}
	return response[0], nil
}

func (store *supabaseStore) queued(ctx context.Context) ([]string, error) {
	query := url.Values{}
	query.Set("select", "id")
	query.Set("or", fmt.Sprintf("(status.eq.queued,and(status.eq.processing,started_at.lt.%s))", time.Now().UTC().Add(-15*time.Minute).Format(time.RFC3339)))
	query.Set("order", "created_at.asc")
	query.Set("limit", "10")
	request, err := store.request(ctx, http.MethodGet, "/rest/v1/processing_jobs?"+query.Encode(), nil)
	if err != nil {
		return nil, err
	}
	var values []struct {
		ID string `json:"id"`
	}
	if err := store.doJSON(request, &values); err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(values))
	for _, value := range values {
		if value.ID != "" {
			ids = append(ids, value.ID)
		}
	}
	return ids, nil
}

func (store *supabaseStore) downloadResume(ctx context.Context, job processingJob) ([]byte, error) {
	path := job.StoragePath
	if path == "" {
		resume, err := store.resume(ctx, job.ResumeID)
		if err != nil {
			return nil, err
		}
		path = resume.StoragePath
	}
	if path == "" {
		return nil, errors.New("resume storage path is missing")
	}
	request, err := store.request(ctx, http.MethodGet, "/storage/v1/object/resumes/"+url.PathEscape(path), nil)
	if err != nil {
		return nil, err
	}
	response, err := store.client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("download resume: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, responseError(response)
	}
	contents, err := io.ReadAll(io.LimitReader(response.Body, 15*1024*1024+1))
	if err != nil {
		return nil, fmt.Errorf("read resume: %w", err)
	}
	if len(contents) > 15*1024*1024 {
		return nil, terminalProcessingError("This CV is larger than 15 MB. Upload a smaller PDF.")
	}
	if !looksLikePDF(contents) {
		return nil, terminalProcessingError("This file is not a valid PDF. Upload a PDF CV.")
	}
	return contents, nil
}

func looksLikePDF(contents []byte) bool {
	limit := len(contents)
	if limit > 1024 {
		limit = 1024
	}
	return bytes.Contains(contents[:limit], []byte("%PDF-"))
}

func (store *supabaseStore) resume(ctx context.Context, resumeID string) (resumeRecord, error) {
	if resumeID == "" {
		return resumeRecord{}, errors.New("resume id is missing")
	}
	request, err := store.request(ctx, http.MethodGet, "/rest/v1/resumes?id=eq."+url.QueryEscape(resumeID)+"&select=id,storage_path", nil)
	if err != nil {
		return resumeRecord{}, err
	}
	var resumes []resumeRecord
	if err := store.doJSON(request, &resumes); err != nil {
		return resumeRecord{}, err
	}
	if len(resumes) != 1 {
		return resumeRecord{}, errors.New("resume was not found")
	}
	return resumes[0], nil
}

func (store *supabaseStore) complete(ctx context.Context, job processingJob, result extraction) error {
	// This RPC owns persistence and matching in one database transaction. It must
	// reject a job that is not currently claimed by this worker.
	return store.postJSON(ctx, "/rest/v1/rpc/apply_resume_extraction", map[string]any{
		"job_id":     job.ID,
		"extraction": result,
	}, nil)
}

func (store *supabaseStore) recalculate(ctx context.Context, job processingJob) error {
	return store.postJSON(ctx, "/rest/v1/rpc/apply_match_recalculation", map[string]string{"job_id": job.ID}, nil)
}

func (store *supabaseStore) fail(ctx context.Context, job processingJob, cause error) error {
	// Only explicit processingError messages are applicant-safe. All upstream
	// errors remain private because they may contain provider or document data.
	message, terminal := processingFailureDetails(cause)
	return store.postJSON(ctx, "/rest/v1/rpc/fail_processing_job", map[string]any{
		"processing_job_id":  job.ID,
		"safe_error_message": message,
		"terminal_failure":   terminal,
	}, nil)
}

func (store *supabaseStore) postJSON(ctx context.Context, path string, body any, target any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	request, err := store.request(ctx, http.MethodPost, path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	return store.doJSON(request, target)
}

func (store *supabaseStore) request(ctx context.Context, method, path string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, store.baseURL+path, body)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+store.apiKey)
	request.Header.Set("apikey", store.apiKey)
	return request, nil
}

func (store *supabaseStore) doJSON(request *http.Request, target any) error {
	response, err := store.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return responseError(response)
	}
	if target == nil || response.StatusCode == http.StatusNoContent {
		return nil
	}
	return json.NewDecoder(io.LimitReader(response.Body, 2*1024*1024)).Decode(target)
}

func responseError(response *http.Response) error {
	body, _ := io.ReadAll(io.LimitReader(response.Body, 4*1024))
	return fmt.Errorf("supabase returned %s: %s", response.Status, strings.TrimSpace(string(body)))
}
