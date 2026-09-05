package main

import (
	"context"
	"errors"
	"os"
	"path/filepath"
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
