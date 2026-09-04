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
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]string{"text": "readable resume text"})
	}))
	defer server.Close()

	client := newOCRClient(config{ocrURL: server.URL, ocrSecret: "secret"})
	text, err := client.parse(context.Background(), []byte("%PDF-1.7"))
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if text != "readable resume text" {
		t.Fatalf("text = %q", text)
	}
}
