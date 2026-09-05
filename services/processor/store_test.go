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

func TestLoadTaxonomyUsesPrivateRPCAndReturnsAliases(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/rest/v1/rpc/get_active_extraction_taxonomy" {
			t.Fatalf("path = %q", request.URL.Path)
		}
		if request.Header.Get("Authorization") != "Bearer service-key" || request.Header.Get("apikey") != "service-key" {
			t.Fatal("expected service-role headers")
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`[{"id":"qualification-1","slug":"manual-handling-and-lifting","name":"Manual Handling and Safe Lifting","category":"technical_skill","description":"Moves materials safely.","aliases":["heavy lifting","porter"]}]`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
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
		_, _ = writer.Write([]byte(`[{"id":"one","slug":"same","name":"One"},{"id":"two","slug":"same","name":"Two"}]`))
	}))
	defer server.Close()

	store := &supabaseStore{baseURL: server.URL, apiKey: "service-key", client: server.Client()}
	if _, err := store.loadTaxonomy(context.Background()); err == nil {
		t.Fatal("expected duplicate taxonomy slug to be rejected")
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
