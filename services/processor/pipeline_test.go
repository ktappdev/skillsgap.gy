package main

import (
	"context"
	"errors"
	"testing"
)

type fakeStore struct{ document []byte }

func (store fakeStore) claim(context.Context, string) (processingJob, error) {
	return processingJob{}, nil
}
func (fakeStore) queued(context.Context) ([]string, error)              { return nil, nil }
func (fakeStore) loadTaxonomy(context.Context) ([]taxonomyEntry, error) { return testTaxonomy(), nil }
func (store fakeStore) downloadResume(context.Context, processingJob) ([]byte, error) {
	return store.document, nil
}
func (fakeStore) complete(context.Context, processingJob, extraction) error { return nil }
func (fakeStore) recalculate(context.Context, processingJob) error          { return nil }
func (fakeStore) fail(context.Context, processingJob, error) error          { return nil }

type fakePDF struct {
	pages  int
	err    error
	called bool
}

func (pdf *fakePDF) pageCount(context.Context, []byte) (int, error) {
	pdf.called = true
	return pdf.pages, pdf.err
}

type fakeRenderer struct {
	images []pageImage
	err    error
	called bool
	pages  []int
}

func (renderer *fakeRenderer) render(_ context.Context, _ []byte, pages []int) ([]pageImage, error) {
	renderer.called = true
	renderer.pages = append([]int(nil), pages...)
	return renderer.images, renderer.err
}

type fakeLLM struct {
	visionResult extraction
	visionErr    error
	visionCalls  int
	images       []pageImage
	textResult   extraction
	textErr      error
	textCalls    int
	text         string
}

func (llm *fakeLLM) extractWithVision(_ context.Context, images []pageImage, _ []taxonomyEntry) (extraction, error) {
	llm.visionCalls++
	llm.images = append([]pageImage(nil), images...)
	return llm.visionResult, llm.visionErr
}

func (llm *fakeLLM) extractWithText(_ context.Context, text string, _ []taxonomyEntry) (extraction, error) {
	llm.textCalls++
	llm.text = text
	return llm.textResult, llm.textErr
}

func TestPipelineRendersEveryPageAndUsesVisionOnly(t *testing.T) {
	pdf := &fakePDF{pages: 3}
	renderer := &fakeRenderer{images: []pageImage{
		{Page: 1, MediaType: "image/jpeg", Data: []byte("page-1")},
		{Page: 2, MediaType: "image/jpeg", Data: []byte("page-2")},
		{Page: 3, MediaType: "image/jpeg", Data: []byte("page-3")},
	}}
	llm := &fakeLLM{visionResult: supportedExtraction("Diesel mechanics")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	result, err := pipeline.process(context.Background(), processingJob{})
	if err != nil {
		t.Fatalf("process: %v", err)
	}
	if !pdf.called || !renderer.called || llm.visionCalls != 1 {
		t.Fatalf("unexpected route: pdf=%v render=%v vision=%d", pdf.called, renderer.called, llm.visionCalls)
	}
	if len(renderer.pages) != 3 || renderer.pages[0] != 1 || renderer.pages[1] != 2 || renderer.pages[2] != 3 {
		t.Fatalf("rendered pages = %#v", renderer.pages)
	}
	if len(llm.images) != 3 || string(llm.images[1].Data) != "page-2" {
		t.Fatalf("vision images = %#v", llm.images)
	}
	if result.Findings[0].EvidenceMethod != methodVision {
		t.Fatalf("evidence method = %q", result.Findings[0].EvidenceMethod)
	}
}

func TestPipelineRejectsUnsupportedPageCount(t *testing.T) {
	pdf := &fakePDF{pages: maxResumePages + 1}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, &fakeRenderer{}, &fakeLLM{})

	_, err := pipeline.process(context.Background(), processingJob{})
	if err == nil {
		t.Fatal("expected page-count failure")
	}
	var failure processingError
	if !errors.As(err, &failure) || !failure.terminal {
		t.Fatalf("error = %v", err)
	}
}

func TestPipelineStopsWhenRenderingFails(t *testing.T) {
	pdf := &fakePDF{pages: 1}
	renderer := &fakeRenderer{err: errors.New("render failed")}
	llm := &fakeLLM{}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected render failure")
	}
	if llm.visionCalls != 0 {
		t.Fatal("vision should not run after render failure")
	}
}

func TestPipelineRejectsIncompleteRenderedPageSet(t *testing.T) {
	pdf := &fakePDF{pages: 2}
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("page-1")}}}
	llm := &fakeLLM{}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected incomplete page set failure")
	}
	if llm.visionCalls != 0 {
		t.Fatal("vision should not run with an incomplete page set")
	}
}

func TestPipelineRejectsOutOfOrderRenderedPages(t *testing.T) {
	pdf := &fakePDF{pages: 2}
	renderer := &fakeRenderer{images: []pageImage{
		{Page: 2, MediaType: "image/jpeg", Data: []byte("page-2")},
		{Page: 1, MediaType: "image/jpeg", Data: []byte("page-1")},
	}}
	llm := &fakeLLM{}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected out-of-order page failure")
	}
	if llm.visionCalls != 0 {
		t.Fatal("vision should not run with out-of-order pages")
	}
}

func TestPipelineReturnsVisionFailureWithoutOCRFallback(t *testing.T) {
	pdf := &fakePDF{pages: 1}
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("page-1")}}}
	llm := &fakeLLM{visionErr: errors.New("vision unavailable")}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	if _, err := pipeline.process(context.Background(), processingJob{}); err == nil {
		t.Fatal("expected vision failure")
	}
	if llm.visionCalls != 1 {
		t.Fatalf("vision calls = %d", llm.visionCalls)
	}
}

// The description path must never touch the PDF renderer: the text is already
// on the job row.
func TestPipelineRoutesDescriptionTextWithoutRenderingPDF(t *testing.T) {
	pdf := &fakePDF{pages: 3}
	renderer := &fakeRenderer{images: []pageImage{{Page: 1, MediaType: "image/jpeg", Data: []byte("page-1")}}}
	llm := &fakeLLM{textResult: extraction{Findings: []extractedQualification{{OriginalTerm: "boat captain", CandidateSlugs: []string{"mechanical-maintenance"}, Evidence: "I operate boats in the interior", EvidencePage: 0, EvidenceMethod: methodText, Confidence: 0.9}}}}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, pdf, renderer, llm)

	result, err := pipeline.process(context.Background(), processingJob{ID: "job-1", Kind: jobKindDescription, InputText: "I operate boats in the interior."})
	if err != nil {
		t.Fatalf("process: %v", err)
	}
	if pdf.called || renderer.called || llm.visionCalls != 0 {
		t.Fatalf("description must skip the PDF path: pdf=%v render=%v vision=%d", pdf.called, renderer.called, llm.visionCalls)
	}
	if llm.textCalls != 1 || llm.text != "I operate boats in the interior." {
		t.Fatalf("text calls = %d, text = %q", llm.textCalls, llm.text)
	}
	if len(result.Findings) != 1 || result.Findings[0].EvidenceMethod != methodText || result.Findings[0].EvidencePage != 0 {
		t.Fatalf("findings = %#v", result.Findings)
	}
}

func TestPipelineRejectsBlankDescriptionText(t *testing.T) {
	llm := &fakeLLM{}
	pipeline := newPipeline(fakeStore{document: []byte("PDF")}, &fakePDF{}, &fakeRenderer{}, llm)

	_, err := pipeline.process(context.Background(), processingJob{ID: "job-1", Kind: jobKindDescription, InputText: "   "})
	if err == nil {
		t.Fatal("expected blank description failure")
	}
	var failure processingError
	if !errors.As(err, &failure) || !failure.terminal {
		t.Fatalf("error = %v", err)
	}
	if llm.textCalls != 0 {
		t.Fatal("model should not run for a blank description")
	}
}

func supportedExtraction(name string) extraction {
	return extraction{Findings: []extractedQualification{{OriginalTerm: name, CandidateSlugs: []string{"mechanical-maintenance"}, Evidence: "Four years repairing diesel engines", EvidencePage: 1, EvidenceMethod: methodVision, Confidence: 0.9}}}
}
