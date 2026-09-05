package main

import (
	"context"
	"errors"
	"strings"
	"testing"
)

type fakeStore struct{ document []byte }

func (store fakeStore) claim(context.Context, string) (processingJob, error) {
	return processingJob{}, nil
}
func (store fakeStore) queued(context.Context) ([]string, error) { return nil, nil }
func (store fakeStore) downloadResume(context.Context, processingJob) ([]byte, error) {
	return store.document, nil
}
func (fakeStore) complete(context.Context, processingJob, extraction) error { return nil }
func (fakeStore) recalculate(context.Context, processingJob) error          { return nil }
func (fakeStore) fail(context.Context, processingJob, error) error          { return nil }

type fakeTextExtractor struct {
	text string
	err  error
}

func (extractor fakeTextExtractor) extract(context.Context, []byte) (string, error) {
	return extractor.text, extractor.err
}

type fakeOCR struct {
	text   string
	called bool
}

func (ocr *fakeOCR) parse(context.Context, []byte) (string, error) {
	ocr.called = true
	return ocr.text, nil
}

type fakeLLM struct{ result extraction }

func (llm fakeLLM) extract(context.Context, string) (extraction, error) { return llm.result, nil }

func TestPipelineUsesOCRWhenNativeTextIsUnusable(t *testing.T) {
	ocr := &fakeOCR{text: repeatWords("OCR extracted resume text", 12)}
	pipeline := newPipeline(config{}, fakeStore{document: []byte("PDF")}, fakeTextExtractor{text: "short text"}, ocr, fakeLLM{})
	if _, err := pipeline.process(context.Background(), processingJob{}); err != nil {
		t.Fatalf("process: %v", err)
	}
	if !ocr.called {
		t.Fatal("expected OCR fallback")
	}
}

func TestLooksLikePDF(t *testing.T) {
	if !looksLikePDF([]byte("  %PDF-1.7\n")) {
		t.Fatal("expected PDF header to be accepted")
	}
	if looksLikePDF([]byte("not a PDF")) {
		t.Fatal("expected non-PDF data to be rejected")
	}
}

func TestPipelineUsesOCRWhenNativeExtractionFails(t *testing.T) {
	ocr := &fakeOCR{text: repeatWords("OCR extracted resume text", 12)}
	pipeline := newPipeline(config{}, fakeStore{document: []byte("PDF")}, fakeTextExtractor{err: errors.New("bad PDF")}, ocr, fakeLLM{})
	if _, err := pipeline.process(context.Background(), processingJob{}); err != nil {
		t.Fatalf("process: %v", err)
	}
	if !ocr.called {
		t.Fatal("expected OCR fallback")
	}
}

func TestPipelineRejectsOversizedExtractedText(t *testing.T) {
	text := strings.Repeat("a", maxResumeTextCharacters+1)
	pipeline := newPipeline(config{}, fakeStore{document: []byte("PDF")}, fakeTextExtractor{text: text}, &fakeOCR{}, fakeLLM{})
	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected oversized extracted text to be rejected")
	}
}

func repeatWords(value string, count int) string {
	result := ""
	for index := 0; index < count; index++ {
		result += value + " "
	}
	return result
}
