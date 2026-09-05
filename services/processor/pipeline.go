package main

import (
	"context"
	"errors"
	"strings"
)

// maxResumeTextCharacters keeps a single request safely below the 32k-token
// vLLM context configured for the hackathon. We reject rather than truncate so
// an applicant never receives a score based on only part of their CV.
const maxResumeTextCharacters = 100_000

type resumePipeline interface {
	process(context.Context, processingJob) (extraction, error)
}

type textExtractor interface {
	extract(context.Context, []byte) (string, error)
}

type ocrParser interface {
	parse(context.Context, []byte) (string, error)
}

type profileExtractor interface {
	extract(context.Context, string) (extraction, error)
}

type pipeline struct {
	store jobStore
	pdf   textExtractor
	ocr   ocrParser
	llm   profileExtractor
}

func newPipeline(_ config, store jobStore, pdf textExtractor, ocr ocrParser, llm profileExtractor) *pipeline {
	return &pipeline{store: store, pdf: pdf, ocr: ocr, llm: llm}
}

func (pipeline *pipeline) process(ctx context.Context, job processingJob) (extraction, error) {
	contents, err := pipeline.store.downloadResume(ctx, job)
	if err != nil {
		return extraction{}, err
	}
	if len(contents) == 0 {
		return extraction{}, errors.New("resume is empty")
	}

	text, nativeErr := pipeline.pdf.extract(ctx, contents)
	if nativeErr != nil || !usableText(text) {
		text, err = pipeline.ocr.parse(ctx, contents)
		if err != nil {
			return extraction{}, errors.New("document text could not be extracted")
		}
	}
	if !usableText(text) {
		return extraction{}, errors.New("document contains insufficient readable text")
	}
	if len([]rune(text)) > maxResumeTextCharacters {
		return extraction{}, errors.New("document contains too much text to process safely; upload a shorter CV")
	}
	return pipeline.llm.extract(ctx, text)
}

func usableText(text string) bool {
	return len(strings.Fields(text)) >= 30
}
