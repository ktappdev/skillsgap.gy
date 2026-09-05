package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOCRClientSendsPDFContentType(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Header.Get("X-OCR-Secret") != "secret" {
			t.Fatal("missing OCR secret")
		}
		file, header, err := request.FormFile("file")
		if err != nil {
			t.Fatalf("form file: %v", err)
		}
		defer file.Close()
		if header.Header.Get("Content-Type") != "application/pdf" {
			t.Fatalf("part content type = %q", header.Header.Get("Content-Type"))
		}
		if request.FormValue("pages") != "2" {
			t.Fatalf("pages = %q", request.FormValue("pages"))
		}
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]any{"pages": []map[string]any{{"page": 2, "text": "readable resume text"}}})
	}))
	defer server.Close()

	client := newOCRClient(config{ocrURL: server.URL, ocrSecret: "secret"})
	document, err := client.parse(context.Background(), []byte("%PDF-1.7"), []int{2})
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(document.Pages) != 1 || document.Pages[0].Text != "readable resume text" || document.Pages[0].Method != methodOCR {
		t.Fatalf("document = %#v", document)
	}
}
