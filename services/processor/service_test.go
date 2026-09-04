package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
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
