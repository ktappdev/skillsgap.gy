package main

import (
	"bytes"
	"context"
	"errors"
	"image/jpeg"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestInspectPDFFixturesRejectUnsafeDocuments(t *testing.T) {
	for _, fixture := range []string{"encrypted.pdf", "malformed.pdf", "over-page-limit.pdf"} {
		_, err := inspectPDF(context.Background(), fixturePath(fixture))
		if err == nil {
			t.Fatalf("%s should fail inspection", fixture)
		}
		var failure processingError
		if !errors.As(err, &failure) || !failure.terminal {
			t.Fatalf("%s error = %v", fixture, err)
		}
	}
}

func TestInspectPDFRecognizesCleanFixture(t *testing.T) {
	pages, err := inspectPDF(context.Background(), fixturePath("clean-text.pdf"))
	if err != nil || pages != 1 {
		t.Fatalf("pages=%d err=%v", pages, err)
	}
}

func TestPrivatePDFRejectsOversizedAndNonPDFContent(t *testing.T) {
	document := execPDFDocument{scratchDirectory: t.TempDir()}
	if _, _, err := document.privatePDF([]byte("not a PDF")); err == nil {
		t.Fatal("expected non-PDF failure")
	}
	if _, _, err := document.privatePDF(make([]byte, maxPDFBytes+1)); err == nil {
		t.Fatal("expected oversized failure")
	}
}

func TestPDFDocumentCountsPagesWithoutTextExtraction(t *testing.T) {
	document := execPDFDocument{scratchDirectory: t.TempDir()}
	contents, err := os.ReadFile(fixturePath("clean-text.pdf"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	pages, err := document.pageCount(context.Background(), contents)
	if err != nil || pages != 1 {
		t.Fatalf("pages=%d err=%v", pages, err)
	}
}

func TestRenderedPagesArePrivateAndCleanedUp(t *testing.T) {
	scratch := t.TempDir()
	contents, err := os.ReadFile(fixturePath("clean-text.pdf"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	images, err := (execPDFPageRenderer{scratchDirectory: scratch}).render(context.Background(), contents, []int{1})
	if err != nil || len(images) != 1 || len(images[0].Data) == 0 {
		t.Fatalf("render images=%d err=%v", len(images), err)
	}
	entries, err := os.ReadDir(scratch)
	if err != nil || len(entries) != 0 {
		t.Fatalf("scratch entries=%v err=%v", entries, err)
	}
}

func fixturePath(name string) string {
	return filepath.Join("testdata", "generated", name)
}

// A missing Poppler binary is an operator problem, not a damaged document, so
// the applicant must not receive the terminal 'locked or damaged' failure.
func TestMissingPDFBinaryIsTransient(t *testing.T) {
	t.Setenv("PATH", t.TempDir())

	_, err := inspectPDF(context.Background(), fixturePath("clean-text.pdf"))
	if err == nil {
		t.Fatal("expected a missing pdfinfo failure")
	}
	var failure processingError
	if errors.As(err, &failure) {
		t.Fatalf("missing binary must not be a processing error: %v", err)
	}
	if !strings.Contains(err.Error(), "pdfinfo") {
		t.Fatalf("error must name the missing binary: %v", err)
	}
	if _, terminal := processingFailureDetails(err, jobKindResume); terminal {
		t.Fatalf("missing binary must stay retryable: %v", err)
	}
}

func TestMissingRendererBinaryIsTransient(t *testing.T) {
	contents, err := os.ReadFile(fixturePath("clean-text.pdf"))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	t.Setenv("PATH", t.TempDir())

	_, err = (execPDFPageRenderer{scratchDirectory: t.TempDir()}).render(context.Background(), contents, []int{1})
	if err == nil {
		t.Fatal("expected a missing pdftoppm failure")
	}
	if !strings.Contains(err.Error(), "pdftoppm") {
		t.Fatalf("error must name the missing binary: %v", err)
	}
	if _, terminal := processingFailureDetails(err, jobKindResume); terminal {
		t.Fatalf("missing binary must stay retryable: %v", err)
	}
}

func TestPDFToolFailureLeavesDocumentErrorsToTheCaller(t *testing.T) {
	missing := pdfToolFailure(context.Background(), &exec.Error{Name: "pdfinfo", Err: exec.ErrNotFound}, "pdfinfo")
	if missing == nil {
		t.Fatal("expected a transient error for a missing binary")
	}

	cancelled, cancel := context.WithCancel(context.Background())
	cancel()
	if interrupted := pdfToolFailure(cancelled, errors.New("signal: killed"), "pdfinfo"); interrupted == nil {
		t.Fatal("expected a transient error for an interrupted run")
	}

	if documentFailure := pdfToolFailure(context.Background(), &exec.ExitError{}, "pdfinfo"); documentFailure != nil {
		t.Fatalf("a rejected document must stay terminal, got %v", documentFailure)
	}
}

// A huge MediaBox must not reach the renderer at full size: the long edge is
// capped before memory use can grow with the declared page size.
func TestRenderedPagesAreBoundedByLongEdge(t *testing.T) {
	contents := []byte("%PDF-1.4\n" +
		"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
		"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
		"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 1800 1800]>>endobj\n" +
		"trailer<</Root 1 0 R>>\n")

	images, err := (execPDFPageRenderer{scratchDirectory: t.TempDir()}).render(context.Background(), contents, []int{1})
	if err != nil || len(images) != 1 {
		t.Fatalf("render images=%d err=%v", len(images), err)
	}
	config, err := jpeg.DecodeConfig(bytes.NewReader(images[0].Data))
	if err != nil {
		t.Fatalf("decode rendered page: %v", err)
	}
	if config.Width != maxRenderedLongEdge || config.Height != maxRenderedLongEdge {
		t.Fatalf("rendered page = %dx%d, want both edges at %d", config.Width, config.Height, maxRenderedLongEdge)
	}
}
