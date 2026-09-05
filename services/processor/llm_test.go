package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeExtractionRejectsUnsupportedQualificationKind(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[{"original_term":"BOSIET","canonical_candidate":"BOSIET","kind":"instruction","years_experience":0,"evidence":"BOSIET certificate","evidence_page":1,"evidence_method":"native","confidence":0.9}],"employment":[],"unmapped_terms":[]}`)
	if err == nil {
		t.Fatal("expected unsupported kind error")
	}
}

func TestExtractionSchemaConstrainsQualificationKinds(t *testing.T) {
	encoded, err := json.Marshal(extractionSchema())
	if err != nil {
		t.Fatalf("marshal extraction schema: %v", err)
	}
	if !strings.Contains(string(encoded), `"enum":["skill","certification","education","compliance"]`) {
		t.Fatalf("qualification kind enum missing from schema: %s", encoded)
	}
}

func TestDecodeExtractionRejectsMultipleJSONValues(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[],"employment":[],"unmapped_terms":[]} {}`)
	if err == nil {
		t.Fatal("expected multiple JSON values error")
	}
}

func TestDecodeExtractionAcceptsStrictSchema(t *testing.T) {
	result, err := decodeExtraction(`{"qualifications":[{"original_term":"minibus diesel repair","canonical_candidate":"Mechanical Maintenance","kind":"skill","years_experience":4,"evidence":"Four years repairing diesel engines","evidence_page":2,"evidence_method":"ocr","confidence":0.95}],"employment":[],"unmapped_terms":["route scheduling"]}`)
	if err != nil {
		fatalf(t, "unexpected error: %v", err)
	}
	if len(result.Qualifications) != 1 || result.Qualifications[0].OriginalTerm != "minibus diesel repair" || result.Qualifications[0].CanonicalCandidate != "Mechanical Maintenance" || result.Qualifications[0].EvidencePage != 2 || result.Qualifications[0].EvidenceMethod != methodOCR {
		t.Fatalf("qualifications = %#v", result.Qualifications)
	}
}

func TestDecodeExtractionRejectsImpossibleExperience(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[{"original_term":"Diesel mechanics","canonical_candidate":"Diesel Mechanics","kind":"skill","years_experience":61,"evidence":"Worked as a mechanic","evidence_page":1,"evidence_method":"native","confidence":0.95}],"employment":[],"unmapped_terms":[]}`)
	if err == nil {
		t.Fatal("expected impossible experience to be rejected")
	}
}

func TestVisionExtractionUsesPrivateDataURLAndStrictSchema(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Authorization") != "Bearer secret" {
			t.Fatal("missing model authorization")
		}
		var payload struct {
			Messages []struct {
				Content json.RawMessage `json:"content"`
			} `json:"messages"`
			ResponseFormat struct {
				Type string `json:"type"`
			} `json:"response_format"`
		}
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if payload.ResponseFormat.Type != "json_schema" || len(payload.Messages) != 2 {
			t.Fatalf("payload = %#v", payload)
		}
		var instructions string
		if err := json.Unmarshal(payload.Messages[0].Content, &instructions); err != nil {
			t.Fatalf("decode instructions: %v", err)
		}
		if !strings.Contains(instructions, "untrusted evidence") || !strings.Contains(instructions, `evidence_method must be "vision"`) {
			t.Fatalf("instructions = %s", instructions)
		}
		content := string(payload.Messages[1].Content)
		if !strings.Contains(content, `"type":"image_url"`) || !strings.Contains(content, "data:image/jpeg;base64,aW1hZ2U=") || strings.Contains(content, "Page 1 text") {
			t.Fatalf("vision content = %s", content)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"qualifications":[],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{vllmURL: server.URL, vllmAPIKey: "secret", modelName: "qwen"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}})
	if err != nil {
		t.Fatalf("extract vision: %v", err)
	}
}

func TestVisionExtractionRejectsNonVisionEvidence(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"qualifications":[{"original_term":"mechanic","canonical_candidate":"Mechanical Maintenance","kind":"skill","years_experience":4,"evidence":"mechanic","evidence_page":1,"evidence_method":"native","confidence":0.9}],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{vllmURL: server.URL, vllmAPIKey: "secret", modelName: "qwen"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}})
	if err == nil {
		t.Fatal("expected non-vision evidence to be rejected")
	}
}

func TestVisionExtractionRejectsOutOfRangeEvidencePage(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"qualifications":[{"original_term":"mechanic","canonical_candidate":"Mechanical Maintenance","kind":"skill","years_experience":4,"evidence":"mechanic","evidence_page":2,"evidence_method":"vision","confidence":0.9}],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{vllmURL: server.URL, vllmAPIKey: "secret", modelName: "qwen"})
	_, err := client.extractWithVision(context.Background(), []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}})
	if err == nil {
		t.Fatal("expected out-of-range evidence page to be rejected")
	}
}

func fatalf(t *testing.T, format string, arguments ...any) {
	t.Helper()
	t.Fatalf(format, arguments...)
}
