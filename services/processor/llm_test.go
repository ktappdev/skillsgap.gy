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
	_, err := decodeExtraction(`{"findings":[{"original_term":"BOSIET","candidate_slugs":["not-in-taxonomy"],"years_experience":0,"evidence":"BOSIET certificate","evidence_page":1,"evidence_method":"vision","confidence":0.9}],"employment":[],"unmapped_terms":[]}`, testTaxonomy(), methodVision)
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
	_, err := decodeExtraction(`{"findings":[],"employment":[],"unmapped_terms":[]} {}`, testTaxonomy(), methodVision)
	if err == nil {
		t.Fatal("expected multiple JSON values error")
	}
}

func TestDecodeExtractionAcceptsStrictSchema(t *testing.T) {
	result, err := decodeExtraction(`{"findings":[{"original_term":"minibus diesel repair","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"Four years repairing diesel engines","evidence_page":2,"evidence_method":"vision","confidence":0.95}],"employment":[],"unmapped_terms":["route scheduling"]}`, testTaxonomy(), methodVision)
	if err != nil {
		fatalf(t, "unexpected error: %v", err)
	}
	if len(result.Findings) != 1 || result.Findings[0].OriginalTerm != "minibus diesel repair" || result.Findings[0].CandidateSlugs[0] != "mechanical-maintenance" || result.Findings[0].EvidencePage != 2 || result.Findings[0].EvidenceMethod != methodVision {
		t.Fatalf("findings = %#v", result.Findings)
	}
}

func TestDecodeExtractionRejectsImpossibleExperience(t *testing.T) {
	_, err := decodeExtraction(`{"findings":[{"original_term":"Diesel mechanics","candidate_slugs":["mechanical-maintenance"],"years_experience":61,"evidence":"Worked as a mechanic","evidence_page":1,"evidence_method":"vision","confidence":0.95}],"employment":[],"unmapped_terms":[]}`, testTaxonomy(), methodVision)
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
		if _, err := decodeExtraction(value, testTaxonomy(), methodVision); err == nil {
			t.Fatal("expected candidate choices to be rejected")
		}
	}
}

func TestDecodeExtractionKeepsUnsupportedTermsUnmapped(t *testing.T) {
	result, err := decodeExtraction(`{"findings":[],"employment":[],"unmapped_terms":["professional drinker"]}`, testTaxonomy(), methodVision)
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

func TestExtractionSchemaConstrainsTextMethod(t *testing.T) {
	encoded, err := json.Marshal(textExtractionSchema(testTaxonomy()))
	if err != nil {
		t.Fatalf("marshal text schema: %v", err)
	}
	schema := string(encoded)
	if !strings.Contains(schema, `"enum":["text"]`) || !strings.Contains(schema, `"mechanical-maintenance"`) {
		t.Fatalf("text schema missing method enum or slugs: %s", schema)
	}
	if strings.Contains(schema, "employment") || strings.Contains(schema, `"enum":["vision"]`) {
		t.Fatalf("text schema must stay skills-only: %s", schema)
	}
}

func TestTextExtractionSendsApplicantWordsWithStrictSchema(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "Bearer secret" {
			t.Fatal("missing model authorization")
		}
		var payload struct {
			Model    string `json:"model"`
			Messages []struct {
				Content json.RawMessage `json:"content"`
			} `json:"messages"`
			ResponseFormat struct {
				Type       string `json:"type"`
				JSONSchema struct {
					Name   string `json:"name"`
					Strict bool   `json:"strict"`
				} `json:"json_schema"`
			} `json:"response_format"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.URL.Path != "/chat/completions" || payload.Model != "test-model" || len(payload.Messages) != 2 {
			t.Fatalf("payload = %#v", payload)
		}
		if payload.ResponseFormat.Type != "json_schema" || !payload.ResponseFormat.JSONSchema.Strict || payload.ResponseFormat.JSONSchema.Name != "skills_gap_description_extraction" {
			t.Fatalf("response format = %#v", payload.ResponseFormat)
		}
		var instructions string
		if err := json.Unmarshal(payload.Messages[0].Content, &instructions); err != nil {
			t.Fatalf("decode instructions: %v", err)
		}
		if !strings.Contains(instructions, "untrusted evidence") || !strings.Contains(instructions, `evidence_method must be "text"`) || !strings.Contains(instructions, "mechanical-maintenance") {
			t.Fatalf("instructions = %s", instructions)
		}
		var description string
		if err := json.Unmarshal(payload.Messages[1].Content, &description); err != nil {
			t.Fatalf("decode user message: %v", err)
		}
		if !strings.Contains(description, "I operate boats in the interior") || !strings.Contains(description, "<DESCRIPTION>") {
			t.Fatalf("user content = %s", description)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[{"original_term":"operates boats","candidate_slugs":["mechanical-maintenance"],"years_experience":0,"evidence":"I operate boats in the interior","evidence_page":0,"evidence_method":"text","confidence":0.8}],"unmapped_terms":["gold diving"]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	result, err := client.extractWithText(context.Background(), "I operate boats in the interior", testTaxonomy())
	if err != nil {
		t.Fatalf("extract text: %v", err)
	}
	if len(result.Findings) != 1 || result.Findings[0].EvidenceMethod != methodText || result.Findings[0].EvidencePage != 0 {
		t.Fatalf("findings = %#v", result.Findings)
	}
	if len(result.UnmappedTerms) != 1 || result.UnmappedTerms[0] != "gold diving" {
		t.Fatalf("unmapped terms = %#v", result.UnmappedTerms)
	}
}

func TestTextExtractionRejectsVisionEvidence(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[{"original_term":"mechanic","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"mechanic","evidence_page":0,"evidence_method":"vision","confidence":0.9}],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	if _, err := client.extractWithText(context.Background(), "I fix diesel engines", testTaxonomy()); err == nil {
		t.Fatal("expected vision evidence to be rejected by the text path")
	}
}

func TestTextExtractionRejectsNonZeroEvidencePage(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"findings":[{"original_term":"mechanic","candidate_slugs":["mechanical-maintenance"],"years_experience":4,"evidence":"mechanic","evidence_page":2,"evidence_method":"text","confidence":0.9}],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{llmBaseURL: server.URL, llmAPIKey: "secret", llmModel: "test-model"})
	if _, err := client.extractWithText(context.Background(), "I fix diesel engines", testTaxonomy()); err == nil {
		t.Fatal("expected a non-zero text evidence page to be rejected")
	}
}

func TestTextExtractionRejectsShortDescriptionBeforeCallingModel(t *testing.T) {
	client := newLLMClient(config{llmBaseURL: "http://127.0.0.1:1", llmModel: "test-model"})
	if _, err := client.extractWithText(context.Background(), "fix", testTaxonomy()); err == nil {
		t.Fatal("expected a too-short description to be rejected")
	}
}

func fatalf(t *testing.T, format string, arguments ...any) {
	t.Helper()
	t.Fatalf(format, arguments...)
}
