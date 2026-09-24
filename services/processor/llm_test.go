package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeExtractionRejectsUnknownQualificationSlug(t *testing.T) {
	_, err := decodeExtraction(`{"findings":[{"original_term":"BOSIET","candidate_slugs":["not-in-taxonomy"],"years_experience":0,"evidence":"BOSIET certificate","evidence_page":1,"evidence_method":"vision","confidence":0.9}],"employment":[],"unmapped_terms":[]}`, testTaxonomy())
	if err == nil {
		t.Fatal("expected unknown slug error")
	}
}

func TestExtractionSchemaConstrainsQualificationSlugs(t *testing.T) {
	encoded, err := json.Marshal(extractionSchema(testTaxonomy()))
	if err != nil {
		t.Fatalf("marshal extraction schema: %v", err)
	}
	if !strings.Contains(string(encoded), `"enum":["domestic-services","mechanical-maintenance","warehouse-operations"]`) {
		t.Fatalf("qualification slug enum missing from schema: %s", encoded)
	}
}

func TestLLMClientEnforcesConfiguredTaxonomyLimit(t *testing.T) {
	client := newLLMClient(config{taxonomyEntryLimit: 2})
	_, err := client.extractWithVision(context.Background(), nil, testTaxonomy())
	if err == nil || !strings.Contains(err.Error(), "3 active qualifications") || !strings.Contains(err.Error(), "configured limit is 2") {
		t.Fatalf("extract vision error = %v", err)
	}
}

func TestDecodeExtractionRejectsMultipleJSONValues(t *testing.T) {
	_, err := decodeExtraction(`{"findings":[],"employment":[],"unmapped_terms":[]} {}`, testTaxonomy())
	if err == nil {
		t.Fatal("expected multiple JSON values error")
	}
}

func TestDecodeExtractionAcceptsStrictSchema(t *testing.T) {
	result, err := decodeExtraction(`{"findings":[{"original_term":"minibus diesel repair","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"Four years repairing diesel engines","evidence_page":2,"evidence_method":"vision","confidence":0.95}],"employment":[],"unmapped_terms":["route scheduling"]}`, testTaxonomy())
	if err != nil {
		fatalf(t, "unexpected error: %v", err)
	}
	if len(result.Findings) != 1 || result.Findings[0].OriginalTerm != "minibus diesel repair" || result.Findings[0].CandidateSlugs[0] != "mechanical-maintenance" || result.Findings[0].EvidencePage != 2 || result.Findings[0].EvidenceMethod != methodVision {
		t.Fatalf("findings = %#v", result.Findings)
	}
}

func TestDecodeExtractionRejectsImpossibleExperience(t *testing.T) {
	_, err := decodeExtraction(`{"findings":[{"original_term":"Diesel mechanics","candidate_slugs":["mechanical-maintenance"],"years_experience":61,"evidence":"Worked as a mechanic","evidence_page":1,"evidence_method":"vision","confidence":0.95}],"employment":[],"unmapped_terms":[]}`, testTaxonomy())
	if err == nil {
		t.Fatal("expected impossible experience to be rejected")
	}
}

func TestDecodeExtractionRejectsDuplicateAndThirdCandidate(t *testing.T) {
	tests := []string{
		`{"findings":[{"original_term":"porter","candidate_slugs":["warehouse-operations","warehouse-operations"],"years_experience":2,"evidence":"Loaded stock","evidence_page":1,"evidence_method":"vision","confidence":0.8}],"employment":[],"unmapped_terms":[]}`,
		`{"findings":[{"original_term":"porter","candidate_slugs":["domestic-services","mechanical-maintenance","warehouse-operations"],"years_experience":2,"evidence":"Loaded stock","evidence_page":1,"evidence_method":"vision","confidence":0.8}],"employment":[],"unmapped_terms":[]}`,
	}
	for _, value := range tests {
		if _, err := decodeExtraction(value, testTaxonomy()); err == nil {
			t.Fatal("expected candidate choices to be rejected")
		}
	}
}

func TestDecodeExtractionKeepsUnsupportedTermsUnmapped(t *testing.T) {
	result, err := decodeExtraction(`{"findings":[],"employment":[],"unmapped_terms":["professional drinker"]}`, testTaxonomy())
	if err != nil {
		t.Fatalf("decode unmapped term: %v", err)
	}
	if len(result.Findings) != 0 || len(result.UnmappedTerms) != 1 || result.UnmappedTerms[0] != "professional drinker" {
		t.Fatalf("result = %#v", result)
	}
}

func TestVisionExtractionUsesPrivateDataURLAndStrictSchema(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "Bearer secret" {
			t.Fatal("missing model authorization")
		}
		var payload struct {
			Model           string `json:"model"`
			ReasoningEffort string `json:"reasoning_effort"`
			Messages        []struct {
				Content json.RawMessage `json:"content"`
			} `json:"messages"`
			ResponseFormat struct {
				Type string `json:"type"`
			} `json:"response_format"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.URL.Path != "/chat/completions" || payload.Model != "test-model" || payload.ReasoningEffort != "none" || payload.ResponseFormat.Type != "json_schema" || len(payload.Messages) != 2 {
			t.Fatalf("payload = %#v", payload)
		}
		var instructions string
		if err := json.Unmarshal(payload.Messages[0].Content, &instructions); err != nil {
			t.Fatalf("decode instructions: %v", err)
		}
		if !strings.Contains(instructions, "untrusted evidence") || !strings.Contains(instructions, `evidence_method must be "vision"`) || !strings.Contains(instructions, "mechanical-maintenance") {
			t.Fatalf("instructions = %s", instructions)
		}
		content := string(payload.Messages[1].Content)
		if !strings.Contains(content, `"type":"image_url"`) || !strings.Contains(content, "data:image/jpeg;base64,aW1hZ2U=") || strings.Contains(content, "Page 1 text") {
			t.Fatalf("vision content = %s", content)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}, testTaxonomy())
	if err != nil {
		t.Fatalf("extract vision: %v", err)
	}
}

func TestCSECExtractionDisablesReasoning(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		var payload struct {
			ReasoningEffort string `json:"reasoning_effort"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if payload.ReasoningEffort != "none" {
			t.Fatalf("reasoning_effort = %q, want none", payload.ReasoningEffort)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"results":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmModel: "test-model"})
	if _, err := client.extractCSECResults(context.Background(), []byte("image"), "image/jpeg"); err != nil {
		t.Fatalf("extract CSEC results: %v", err)
	}
}

func TestVisionExtractionRejectsNonVisionEvidence(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[{"original_term":"mechanic","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"mechanic","evidence_page":1,"evidence_method":"native","confidence":0.9}],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}, testTaxonomy())
	if err == nil {
		t.Fatal("expected non-vision evidence to be rejected")
	}
}

func TestVisionExtractionRejectsOutOfRangeEvidencePage(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[{"original_term":"mechanic","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"mechanic","evidence_page":2,"evidence_method":"vision","confidence":0.9}],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}, testTaxonomy())
	if err == nil {
		t.Fatal("expected out-of-range evidence page to be rejected")
	}
}

func TestVisionExtractionWorksWithoutAPIKeyForLocalEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if value := request.Header.Get("Authorization"); value != "" {
			t.Fatalf("unexpected model authorization: %q", value)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmModel: "local-model"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}, testTaxonomy())
	if err != nil {
		t.Fatalf("extract vision without API key: %v", err)
	}
}

func fatalf(t *testing.T, format string, arguments ...any) {
	t.Helper()
	t.Fatalf(format, arguments...)
}
