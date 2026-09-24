package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestQueuedIncludesStaleProcessingJobs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/processing_jobs" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		if request.URL.Query().Get("select") != "id" {
			t.Fatalf("select query = %q", request.URL.Query().Get("select"))
		}
		orQuery := request.URL.Query().Get("or")
		if !strings.Contains(orQuery, "status.eq.queued") || !strings.Contains(orQuery, "status.eq.processing") || !strings.Contains(orQuery, "started_at.lt.") {
			t.Fatalf("stale recovery query = %q", orQuery)
		}
		if request.Header.Get("Authorization") != "Bearer service-key" || request.Header.Get("apikey") != "service-key" {
			t.Fatal("expected service-role headers")
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`[{"id":"job-1"}]`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
	ids, err := store.queued(context.Background())
	if err != nil {
		t.Fatalf("queued: %v", err)
	}
	if len(ids) != 1 || ids[0] != "job-1" {
		t.Fatalf("ids = %#v", ids)
	}
}

func TestLoadTaxonomyUsesSnapshotRPCAndReturnsAliases(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/rpc/get_active_extraction_taxonomy_snapshot" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		var payload struct {
			PLimit int `json:"p_limit"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if payload.PLimit != 2000 {
			t.Fatalf("p_limit = %d, want 2000", payload.PLimit)
		}
		if request.Header.Get("Authorization") != "Bearer service-key" || request.Header.Get("apikey") != "service-key" {
			t.Fatal("expected service-role headers")
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"active_count":1,"entries":[{"id":"qualification-1","slug":"manual-handling-and-lifting","name":"Manual Handling and Safe Lifting","category":"technical_skill","description":"Moves materials safely.","aliases":["heavy lifting","porter"]}]}`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", taxonomyEntryLimit: defaultMaxTaxonomyEntries, client: server.Client()}
	entries, err := store.loadTaxonomy(context.Background())
	if err != nil {
		t.Fatalf("load taxonomy: %v", err)
	}
	if len(entries) != 1 || entries[0].Slug != "manual-handling-and-lifting" || len(entries[0].Aliases) != 2 {
		t.Fatalf("taxonomy = %#v", entries)
	}
}

func TestLoadTaxonomyRejectsDuplicateSlugs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"active_count":2,"entries":[{"id":"one","slug":"same","name":"One"},{"id":"two","slug":"same","name":"Two"}]}`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", taxonomyEntryLimit: 10, client: server.Client()}
	if _, err := store.loadTaxonomy(context.Background()); err == nil {
		t.Fatal("expected duplicate taxonomy slug to be rejected")
	}
}

func TestLoadTaxonomyReportsActualCountAboveConfiguredLimit(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		var payload struct {
			PLimit int `json:"p_limit"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if payload.PLimit != 3 {
			t.Fatalf("p_limit = %d, want 3", payload.PLimit)
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"active_count":4,"entries":[{"id":"one","slug":"one","name":"One"},{"id":"two","slug":"two","name":"Two"},{"id":"three","slug":"three","name":"Three"}]}`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", taxonomyEntryLimit: 3, client: server.Client()}
	if _, err := store.loadTaxonomy(context.Background()); err == nil || !strings.Contains(err.Error(), "4 active qualifications") || !strings.Contains(err.Error(), "configured limit is 3") {
		t.Fatalf("load taxonomy error = %v", err)
	}
}

func TestDecodeTaxonomySnapshotDetectsResponseOverflow(t *testing.T) {
	oversized := strings.NewReader(strings.Repeat(" ", int(maxTaxonomySnapshotResponseBytes+1)))
	_, err := decodeTaxonomySnapshot(oversized)
	if err == nil || !strings.Contains(err.Error(), "exceeds the 32 MiB limit") {
		t.Fatalf("decode overflow error = %v", err)
	}
}

func TestCompleteRoutesDescriptionJobsToDescriptionRPC(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/rpc/apply_description_extraction" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		var payload struct {
			JobID string `json:"job_id"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if payload.JobID != "job-1" {
			t.Fatalf("job_id = %q", payload.JobID)
		}
		writer.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
	if err := store.complete(context.Background(), processingJob{ID: "job-1", Kind: jobKindDescription}, extraction{}); err != nil {
		t.Fatalf("complete: %v", err)
	}
}

func TestCompleteRoutesResumeJobsToContactRPC(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/rpc/apply_resume_extraction_with_contact_details" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		writer.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
	if err := store.complete(context.Background(), processingJob{ID: "job-2", Kind: jobKindResume}, extraction{}); err != nil {
		t.Fatalf("complete: %v", err)
	}
}

func TestPermanentFailureIsMarkedTerminalWithoutLeakingCause(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/rpc/fail_processing_job" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		var payload struct {
			JobID    string `json:"processing_job_id"`
			Message  string `json:"safe_error_message"`
			Terminal bool   `json:"terminal_failure"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if payload.JobID != "job-1" || !payload.Terminal || payload.Message != "Upload an unlocked PDF." {
			t.Fatalf("payload = %#v", payload)
		}
		writer.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
	if err := store.fail(context.Background(), processingJob{ID: "job-1"}, terminalProcessingError("Upload an unlocked PDF.")); err != nil {
		t.Fatalf("fail: %v", err)
	}
}
