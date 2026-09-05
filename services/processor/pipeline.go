package main

import (
	"context"
	"errors"
)

type resumePipeline interface {
	process(context.Context, processingJob) (extraction, error)
}

type textExtractor interface {
	extract(context.Context, []byte) (parsedDocument, error)
}

type ocrParser interface {
	parse(context.Context, []byte, []int) (parsedDocument, error)
}

type pageRenderer interface {
	render(context.Context, []byte, []int) ([]pageImage, error)
}

type profileExtractor interface {
	extract(context.Context, string) (extraction, error)
	extractWithVision(context.Context, string, []pageImage) (extraction, error)
}

type pipeline struct {
	store    jobStore
	pdf      textExtractor
	ocr      ocrParser
	renderer pageRenderer
	llm      profileExtractor
}

func newPipeline(store jobStore, pdf textExtractor, ocr ocrParser, renderer pageRenderer, llm profileExtractor) *pipeline {
	return &pipeline{store: store, pdf: pdf, ocr: ocr, renderer: renderer, llm: llm}
}

func (pipeline *pipeline) process(ctx context.Context, job processingJob) (extraction, error) {
	contents, err := pipeline.store.downloadResume(ctx, job)
	if err != nil {
		return extraction{}, err
	}
	document, err := pipeline.pdf.extract(ctx, contents)
	if err != nil {
		return extraction{}, err
	}
	if len(document.Pages) == 0 || len(document.Pages) > maxResumePages {
		return extraction{}, terminalProcessingError("This PDF has an unsupported number of pages. Upload a CV between 1 and 8 pages.")
	}

	ocrPages := unreadablePageNumbers(document)
	if len(ocrPages) > 0 {
		ocrDocument, ocrErr := pipeline.ocr.parse(ctx, contents, ocrPages)
		if ocrErr == nil {
			document = replacePages(document, ocrDocument)
		}
	}

	text := document.orderedText()
	if len([]rune(text)) > maxResumeTextCharacters {
		return extraction{}, terminalProcessingError("This CV contains too much text to process safely. Upload a shorter CV.")
	}

	visionPages := riskyPageNumbers(document)
	var textResult extraction
	textErr := errors.New("document contains insufficient readable text")
	if usableDocumentText(text) {
		textResult, textErr = pipeline.llm.extract(ctx, text)
		if textErr == nil && extractionNeedsVision(textResult) && len(visionPages) == 0 {
			visionPages = allPageNumbers(document)
		}
	}
	if textErr != nil && len(visionPages) == 0 {
		visionPages = allPageNumbers(document)
	}
	if len(visionPages) == 0 {
		return textResult, textErr
	}

	images, renderErr := pipeline.renderer.render(ctx, contents, visionPages)
	if renderErr != nil {
		if textErr == nil {
			return textResult, nil
		}
		return extraction{}, renderErr
	}
	visionResult, visionErr := pipeline.llm.extractWithVision(ctx, text, images)
	if visionErr == nil {
		return visionResult, nil
	}
	if textErr == nil {
		return textResult, nil
	}
	return extraction{}, errors.New("document text and page images could not be interpreted")
}

func unreadablePageNumbers(document parsedDocument) []int {
	pages := make([]int, 0, len(document.Pages))
	for _, page := range document.Pages {
		if !usablePageText(page.Text) {
			pages = append(pages, page.Number)
		}
	}
	return pages
}

func riskyPageNumbers(document parsedDocument) []int {
	pages := make([]int, 0, len(document.Pages))
	for _, page := range document.Pages {
		if !usablePageText(page.Text) || pageHasLayoutRisk(page.Text) {
			pages = append(pages, page.Number)
		}
	}
	return uniquePageNumbers(pages)
}

func allPageNumbers(document parsedDocument) []int {
	pages := make([]int, 0, len(document.Pages))
	for _, page := range document.Pages {
		pages = append(pages, page.Number)
	}
	return uniquePageNumbers(pages)
}

func replacePages(document parsedDocument, replacements parsedDocument) parsedDocument {
	byPage := make(map[int]documentPage, len(replacements.Pages))
	for _, page := range replacements.Pages {
		byPage[page.Number] = page
	}
	pages := make([]documentPage, 0, len(document.Pages))
	for _, page := range document.Pages {
		if replacement, exists := byPage[page.Number]; exists && usablePageText(replacement.Text) {
			pages = append(pages, replacement)
			continue
		}
		pages = append(pages, page)
	}
	return parsedDocument{Pages: pages}
}
