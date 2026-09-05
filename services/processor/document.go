package main

import (
	"fmt"
	"strings"
	"unicode"
)

const (
	maxPDFBytes             = 15 * 1024 * 1024
	maxResumePages          = 8
	maxResumeTextCharacters = 100_000
	maxVisionBytes          = 20 * 1024 * 1024
	minimumPageWords        = 8
	minimumDocumentWords    = 30
)

type extractionMethod string

const (
	methodNative extractionMethod = "native"
	methodOCR    extractionMethod = "ocr"
	methodVision extractionMethod = "vision"
)

type documentPage struct {
	Number int
	Text   string
	Method extractionMethod
}

type parsedDocument struct {
	Pages []documentPage
}

type pageImage struct {
	Page      int
	MediaType string
	Data      []byte
}

func (document parsedDocument) orderedText() string {
	parts := make([]string, 0, len(document.Pages))
	for _, page := range document.Pages {
		text := strings.TrimSpace(page.Text)
		if text == "" {
			continue
		}
		parts = append(parts, fmt.Sprintf("--- Page %d (%s) ---\n%s", page.Number, page.Method, text))
	}
	return strings.Join(parts, "\n\n")
}

func usablePageText(text string) bool {
	if len(strings.Fields(text)) < minimumPageWords {
		return false
	}

	var visible, letters, replacement, longestRepeat, currentRepeat int
	var previous rune
	for _, value := range text {
		if unicode.IsSpace(value) {
			continue
		}
		visible++
		if unicode.IsLetter(value) {
			letters++
		}
		if value == unicode.ReplacementChar || (!unicode.IsPrint(value) && !unicode.IsSpace(value)) {
			replacement++
		}
		if value == previous {
			currentRepeat++
		} else {
			previous = value
			currentRepeat = 1
		}
		if currentRepeat > longestRepeat {
			longestRepeat = currentRepeat
		}
	}

	return visible > 0 && float64(letters)/float64(visible) >= 0.40 && float64(replacement)/float64(visible) <= 0.02 && longestRepeat < 20
}

func usableDocumentText(text string) bool {
	return len(strings.Fields(text)) >= minimumDocumentWords
}

func pageHasLayoutRisk(text string) bool {
	columnLines := 0
	tableLines := 0
	for _, line := range strings.Split(text, "\n") {
		if strings.Count(line, "|") >= 2 {
			tableLines++
		}
		if containsWideColumnGap(line) {
			columnLines++
		}
	}
	return tableLines >= 2 || columnLines >= 3
}

func containsWideColumnGap(line string) bool {
	trimmed := strings.TrimSpace(line)
	for index := 1; index < len(trimmed)-1; index++ {
		if trimmed[index] != ' ' || trimmed[index-1] == ' ' {
			continue
		}
		end := index
		for end < len(trimmed) && trimmed[end] == ' ' {
			end++
		}
		if end-index >= 8 && end < len(trimmed) {
			return true
		}
	}
	return false
}

func uniquePageNumbers(values []int) []int {
	seen := make(map[int]struct{}, len(values))
	result := make([]int, 0, len(values))
	for _, value := range values {
		if value < 1 || value > maxResumePages {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
