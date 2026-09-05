package main

import (
	"context"
	"errors"
)

type resumePipeline interface {
	process(context.Context, processingJob) (extraction, error)
}

type pdfPageCounter interface {
	pageCount(context.Context, []byte) (int, error)
}

type pageRenderer interface {
	render(context.Context, []byte, []int) ([]pageImage, error)
}

type profileExtractor interface {
	extractWithVision(context.Context, []pageImage, []taxonomyEntry) (extraction, error)
}

type pipeline struct {
	store    jobStore
	pdf      pdfPageCounter
	renderer pageRenderer
	llm      profileExtractor
}

func newPipeline(store jobStore, pdf pdfPageCounter, renderer pageRenderer, llm profileExtractor) *pipeline {
	return &pipeline{store: store, pdf: pdf, renderer: renderer, llm: llm}
}

func (pipeline *pipeline) process(ctx context.Context, job processingJob) (extraction, error) {
	contents, err := pipeline.store.downloadResume(ctx, job)
	if err != nil {
		return extraction{}, err
	}
	pageCount, err := pipeline.pdf.pageCount(ctx, contents)
	if err != nil {
		return extraction{}, err
	}
	if pageCount < 1 || pageCount > maxResumePages {
		return extraction{}, terminalProcessingError("This PDF has an unsupported number of pages. Upload a CV between 1 and 8 pages.")
	}

	pages := make([]int, pageCount)
	for index := range pages {
		pages[index] = index + 1
	}
	images, err := pipeline.renderer.render(ctx, contents, pages)
	if err != nil {
		return extraction{}, err
	}
	if len(images) != pageCount {
		return extraction{}, errors.New("document renderer returned an incomplete page set")
	}
	for index, image := range images {
		if image.Page != index+1 {
			return extraction{}, errors.New("document renderer returned pages out of order")
		}
	}
	taxonomy, err := pipeline.store.loadTaxonomy(ctx)
	if err != nil {
		return extraction{}, err
	}
	return pipeline.llm.extractWithVision(ctx, images, taxonomy)
}
