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
	_, err := decodeExtraction(`{"qualifications":[{"name":"BOSIET","kind":"instruction","years_experience":0,"evidence":"BOSIET certificate","confidence":0.9}],"employment":[],"unmapped_terms":[]}`)
	if err == nil {
		t.Fatal("expected unsupported kind error")
	}
}

func TestDecodeExtractionRejectsMultipleJSONValues(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[],"employment":[],"unmapped_terms":[]} {}`)
	if err == nil {
		t.Fatal("expected multiple JSON values error")
	}
}

func TestDecodeExtractionAcceptsStrictSchema(t *testing.T) {
	result, err := decodeExtraction(`{"qualifications":[{"name":"Diesel mechanics","kind":"skill","years_experience":4,"evidence":"Four years repairing diesel engines","confidence":0.95}],"employment":[],"unmapped_terms":["minibus engines"]}`)
	if err != nil {
		fatalf(t, "unexpected error: %v", err)
	}
	if len(result.Qualifications) != 1 {
		t.Fatalf("qualifications = %#v", result.Qualifications)
	}
}

func TestDecodeExtractionRejectsImpossibleExperience(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[{"name":"Diesel mechanics","kind":"skill","years_experience":61,"evidence":"Worked as a mechanic","confidence":0.95}],"employment":[],"unmapped_terms":[]}`)
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
		content := string(payload.Messages[1].Content)
		if !strings.Contains(content, `"type":"image_url"`) || !strings.Contains(content, "data:image/jpeg;base64,aW1hZ2U=") {
			t.Fatalf("vision content = %s", content)
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"choices": []map[string]any{{"message": map[string]string{"content": `{"qualifications":[],"employment":[],"unmapped_terms":[]}`}}}})
	}))
	defer server.Close()

	client := newLLMClient(config{vllmURL: server.URL, vllmAPIKey: "secret", modelName: "qwen"})
	_, err := client.extractWithVision(context.Background(), "Page 1 text", []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}})
	if err != nil {
		t.Fatalf("extract vision: %v", err)
	}
}

func fatalf(t *testing.T, format string, arguments ...any) {
	t.Helper()
	t.Fatalf(format, arguments...)
}
