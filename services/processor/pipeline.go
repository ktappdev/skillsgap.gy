package main

import (
	"context"
	"errors"
	"strings"
)

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
	return pipeline.llm.extract(ctx, text)
}

func usableText(text string) bool {
	return len(strings.Fields(text)) >= 30
}
