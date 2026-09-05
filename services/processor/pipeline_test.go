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
func (fakeStore) queued(context.Context) ([]string, error) { return nil, nil }
func (store fakeStore) downloadResume(context.Context, processingJob) ([]byte, error) {
	return store.document, nil
}
func (fakeStore) complete(context.Context, processingJob, extraction) error { return nil }
func (fakeStore) recalculate(context.Context, processingJob) error          { return nil }
func (fakeStore) fail(context.Context, processingJob, error) error          { return nil }

type fakeTextExtractor struct {
	document parsedDocument
	err      error
}

func (extractor fakeTextExtractor) extract(context.Context, []byte) (parsedDocument, error) {
	return extractor.document, extractor.err
}

type fakeOCR struct {
	document parsedDocument
	err      error
	called   bool
	pages    []int
}

func (ocr *fakeOCR) parse(_ context.Context, _ []byte, pages []int) (parsedDocument, error) {
	ocr.called = true
	ocr.pages = pages
	return ocr.document, ocr.err
}

type fakeRenderer struct {
	images []pageImage
	err    error
	called bool
	pages  []int
}

func (renderer *fakeRenderer) render(_ context.Context, _ []byte, pages []int) ([]pageImage, error) {
	renderer.called = true
	renderer.pages = pages
	return renderer.images, renderer.err
}

type fakeLLM struct {
	textResult   extraction
	textErr      error
	visionResult extraction
	visionErr    error
	textCalls    int
	visionCalls  int
}

func (llm *fakeLLM) extract(context.Context, string) (extraction, error) {
	llm.textCalls++
	return llm.textResult, llm.textErr
}

func (llm *fakeLLM) extractWithVision(context.Context, string, []pageImage) (extraction, error) {
	llm.visionCalls++
	return llm.visionResult, llm.visionErr
}

func TestPipelineKeepsCleanResumeOnTextFastPath(t *testing.T) {
	ocr := &fakeOCR{}
	renderer := &fakeRenderer{}
	llm := &fakeLLM{textResult: supportedExtraction("Diesel mechanics")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument(cleanResumeText()), ocr, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err != nil {
		t.Fatalf("process: %v", err)
	}
	if ocr.called || renderer.called || llm.visionCalls != 0 || llm.textCalls != 1 {
		t.Fatalf("unexpected route: ocr=%v render=%v text=%d vision=%d", ocr.called, renderer.called, llm.textCalls, llm.visionCalls)
	}
}

func TestPipelineReplacesUnreadablePageWithOCR(t *testing.T) {
	ocr := &fakeOCR{document: parsedDocument{Pages: []documentPage{{Number: 1, Text: cleanResumeText(), Method: methodOCR}}}}
	renderer := &fakeRenderer{}
	llm := &fakeLLM{textResult: supportedExtraction("Mechanical maintenance")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument("short"), ocr, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err != nil {
		t.Fatalf("process: %v", err)
	}
	if !ocr.called || len(ocr.pages) != 1 || ocr.pages[0] != 1 {
		t.Fatalf("OCR pages = %#v", ocr.pages)
	}
	if renderer.called || llm.visionCalls != 0 {
		t.Fatal("good OCR should not require vision")
	}
}

func TestPipelineUsesVisionForRiskyLayout(t *testing.T) {
	columns := repeatLines("Diesel mechanic        Hydraulics maintenance", 12)
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}}
	llm := &fakeLLM{textResult: supportedExtraction("Diesel mechanics"), visionResult: supportedExtraction("Hydraulics maintenance")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument(columns), &fakeOCR{}, renderer, llm)

	result, err := pipeline.process(context.Background(), processingJob{})
	if err != nil {
		t.Fatalf("process: %v", err)
	}
	if !renderer.called || llm.visionCalls != 1 || result.Qualifications[0].Name != "Hydraulics maintenance" {
		t.Fatalf("vision route failed: render=%v vision=%d result=%#v", renderer.called, llm.visionCalls, result)
	}
}

func TestPipelineKeepsValidTextResultWhenOptionalVisionFails(t *testing.T) {
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}}
	llm := &fakeLLM{textResult: supportedExtractionWithConfidence("Diesel mechanics", 0.4), visionErr: errors.New("vision unavailable")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument(cleanResumeText()), &fakeOCR{}, renderer, llm)

	result, err := pipeline.process(context.Background(), processingJob{})
	if err != nil {
		t.Fatalf("process: %v", err)
	}
	if result.Qualifications[0].Name != "Diesel mechanics" || llm.visionCalls != 1 {
		t.Fatalf("fallback result = %#v", result)
	}
}

func TestPipelineFailsWhenTextAndVisionCannotBeRead(t *testing.T) {
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("image")}}}
	llm := &fakeLLM{textErr: errors.New("text unavailable"), visionErr: errors.New("vision unavailable")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument("short"), &fakeOCR{err: errors.New("OCR unavailable")}, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected unreadable document error")
	}
}

func TestPipelineRejectsOversizedExtractedText(t *testing.T) {
	text := strings.Repeat("a", maxResumeTextCharacters+1) + " " + cleanResumeText()
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, fakeTextDocument(text), &fakeOCR{}, &fakeRenderer{}, &fakeLLM{})
	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected oversized extracted text to be rejected")
	}
}

func TestTextQualityRejectsGarbledAndRepeatedContent(t *testing.T) {
	if usablePageText("123 456 789 012 345 678 901 234") {
		t.Fatal("expected low-alphabetic-ratio content to fail")
	}
	if usablePageText(strings.Repeat("A", 30) + " mechanic mechanic mechanic mechanic mechanic mechanic mechanic mechanic") {
		t.Fatal("expected repeated content to fail")
	}
	if !usablePageText(cleanResumeText()) {
		t.Fatal("expected normal resume text to pass")
	}
}

func fakeTextDocument(text string) fakeTextExtractor {
	return fakeTextExtractor{document: parsedDocument{Pages: []documentPage{{Number: 1, Text: text, Method: methodNative}}}}
}

func supportedExtraction(name string) extraction {
	return supportedExtractionWithConfidence(name, 0.9)
}

func supportedExtractionWithConfidence(name string, confidence float64) extraction {
	return extraction{Qualifications: []extractedQualification{{Name: name, Kind: "skill", Evidence: "Four years repairing diesel engines", Confidence: confidence}}}
}

func cleanResumeText() string {
	return repeatLines("Experienced diesel mechanic maintained buses engines hydraulic systems and workshop safety procedures for local transport operations", 4)
}

func repeatLines(value string, count int) string {
	return strings.TrimSpace(strings.Repeat(value+"\n", count))
}
