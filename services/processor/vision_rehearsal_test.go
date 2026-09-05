package main

import (
	"context"
	"os"
	"testing"
)

func TestVisionOnlyPipelineRehearsesRepresentativeFixtures(t *testing.T) {
	fixtures := []struct {
		name  string
		pages int
	}{
		{name: "clean-text.pdf", pages: 1},
		{name: "scanned.pdf", pages: 1},
		{name: "mixed-text-scan.pdf", pages: 2},
		{name: "two-column.pdf", pages: 1},
		{name: "table-heavy.pdf", pages: 1},
	}

	for _, fixture := range fixtures {
		t.Run(fixture.name, func(t *testing.T) {
			contents, err := os.ReadFile(fixturePath(fixture.name))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}

			llm := &fakeLLM{visionResult: supportedExtraction("synthetic fixture evidence")}
			pipeline := newPipeline(
				fakeStore{document: contents},
				execPDFDocument{scratchDirectory: t.TempDir()},
				execPDFPageRenderer{scratchDirectory: t.TempDir()},
				llm,
			)

			result, err := pipeline.process(context.Background(), processingJob{})
			if err != nil {
				t.Fatalf("process fixture: %v", err)
			}
			if llm.visionCalls != 1 {
				t.Fatalf("vision calls = %d, want one complete request", llm.visionCalls)
			}
			if len(llm.images) != fixture.pages {
				t.Fatalf("vision images = %d, want %d", len(llm.images), fixture.pages)
			}
			for page, image := range llm.images {
				if image.Page != page+1 {
					t.Fatalf("image %d has page number %d", page, image.Page)
				}
				if image.MediaType != "image/jpeg" || len(image.Data) == 0 {
					t.Fatalf("image %d was not a non-empty JPEG", page+1)
				}
			}
			if len(result.Qualifications) == 0 || result.Qualifications[0].EvidenceMethod != methodVision {
				t.Fatalf("result provenance = %#v", result.Qualifications)
			}
		})
	}
}

func TestRenderedPagesCleanUpAfterRenderFailure(t *testing.T) {
	contents, err := os.ReadFile(fixturePath("malformed.pdf"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	scratch := t.TempDir()
	if _, err := (execPDFPageRenderer{scratchDirectory: scratch}).render(context.Background(), contents, []int{1}); err == nil {
		t.Fatal("expected malformed PDF render failure")
	}
	entries, err := os.ReadDir(scratch)
	if err != nil {
		t.Fatalf("read scratch directory: %v", err)
	}
	if len(entries) != 0 {
		t.Fatalf("render scratch files were not cleaned up: %v", entries)
	}
}
