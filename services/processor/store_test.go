package main

import (
	"context"
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
