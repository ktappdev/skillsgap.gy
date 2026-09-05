package main

const (
	maxPDFBytes    = 15 * 1024 * 1024
	maxResumePages = 8
	maxVisionBytes = 20 * 1024 * 1024
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
