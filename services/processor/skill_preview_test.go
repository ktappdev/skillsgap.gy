package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakeExtractor struct {
	result   extraction
	err      error
	calls    int
	text     string
	taxonomy []taxonomyEntry
}

func (extractor *fakeExtractor) extractWithText(_ context.Context, text string, taxonomy []taxonomyEntry) (extraction, error) {
	extractor.calls++
	extractor.text = text
	extractor.taxonomy = taxonomy
	return extractor.result, extractor.err
}

const previewDescription = "I repair diesel engines and weld aluminium boat hulls"

func newSkillPreviewService(extractor skillPreviewExtractor) *service {
	service := newService(config{webhookSecret: "webhook", skillPreviewSecret: "preview"}, fakeStore{}, fakePipeline{})
	service.skillPreview = extractor
	return service
}

func postSkillPreview(service *service, secret string, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, "/public/skill-preview", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	if secret != "" {
		request.Header.Set("X-Skill-Preview-Secret", secret)
	}
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	return recorder
}

func TestSkillPreviewRequiresSecret(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})

	for _, test := range []struct {
		name   string
		secret string
	}{
		{name: "missing", secret: ""},
		{name: "wrong", secret: "wrong"},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := postSkillPreview(service, test.secret, `{"text":"`+previewDescription+`"}`)
			if recorder.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want 401", recorder.Code)
			}
			if !strings.Contains(recorder.Body.String(), "unauthorized") {
				t.Fatalf("body = %q, want unauthorized", recorder.Body.String())
			}
		})
	}
}

func TestSkillPreviewRouteIsUnmountedWithoutSecret(t *testing.T) {
	service := newService(config{webhookSecret: "webhook"}, fakeStore{}, fakePipeline{})
	service.skillPreview = &fakeExtractor{}

	recorder := postSkillPreview(service, "", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
}

func TestSkillPreviewRejectsOutOfRangeText(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})

	for _, test := range []struct {
		name string
		text string
	}{
		{name: "too short", text: "short"},
		{name: "too long", text: strings.Repeat("a", 2001)},
		{name: "whitespace only", text: "          "},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := postSkillPreview(service, "preview", `{"text":"`+test.text+`"}`)
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", recorder.Code)
			}
		})
	}
}

func TestSkillPreviewRejectsMalformedBodies(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})

	for _, test := range []struct {
		name string
		body string
	}{
		{name: "not json", body: previewDescription},
		{name: "multiple values", body: `{"text":"` + previewDescription + `"}{"text":"` + previewDescription + `"}`},
		{name: "wrong field", body: `{"description":"` + previewDescription + `"}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			recorder := postSkillPreview(service, "preview", test.body)
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", recorder.Code)
			}
		})
	}
}

func TestSkillPreviewReturnsFindingsAndUnmappedTermsOnly(t *testing.T) {
	extractor := &fakeExtractor{result: extraction{
		Findings: []extractedQualification{
			{OriginalTerm: "diesel mechanic", CandidateSlugs: []string{"heavy-duty-mechanic"}, Evidence: "I repair diesel engines", EvidencePage: 0, EvidenceMethod: methodText, Confidence: 0.9},
			{OriginalTerm: "aluminium welding", CandidateSlugs: []string{"welder", "fabricator"}, Evidence: "weld aluminium boat hulls", EvidencePage: 0, EvidenceMethod: methodText, Confidence: 0.8},
		},
		Employment:    []employmentRecord{{Title: "Mechanic", Employer: "Private", Years: 4, Evidence: "I repair diesel engines", Confidence: 0.7}},
		UnmappedTerms: []string{"boat hulls"},
	}}
	service := newSkillPreviewService(extractor)

	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %q, want 200", recorder.Code, recorder.Body.String())
	}
	want := `{"findings":[{"slugs":["heavy-duty-mechanic"],"original_term":"diesel mechanic"},{"slugs":["welder","fabricator"],"original_term":"aluminium welding"}],"unmapped_terms":["boat hulls"]}` + "\n"
	if recorder.Body.String() != want {
		t.Fatalf("body = %q, want %q", recorder.Body.String(), want)
	}
	if strings.Contains(recorder.Body.String(), "employment") || strings.Contains(recorder.Body.String(), "contact") {
		t.Fatalf("body leaked non-preview fields: %q", recorder.Body.String())
	}
	if extractor.calls != 1 || extractor.text != previewDescription {
		t.Fatalf("extractor calls = %d, text = %q", extractor.calls, extractor.text)
	}
	if len(extractor.taxonomy) == 0 {
		t.Fatal("extractor received no taxonomy")
	}
}

func TestSkillPreviewSerialisesEmptyCollectionsAsArrays(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})

	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	if recorder.Body.String() != `{"findings":[],"unmapped_terms":[]}`+"\n" {
		t.Fatalf("body = %q, want empty arrays", recorder.Body.String())
	}
}

func TestSkillPreviewCapsItemsAtTheExtractionLimit(t *testing.T) {
	findings := make([]extractedQualification, 0, maxExtractionItems+5)
	for range maxExtractionItems + 5 {
		findings = append(findings, extractedQualification{OriginalTerm: "term", CandidateSlugs: []string{"welder"}})
	}
	terms := make([]string, 0, maxExtractionItems+5)
	for range maxExtractionItems + 5 {
		terms = append(terms, "unmapped")
	}
	service := newSkillPreviewService(&fakeExtractor{result: extraction{Findings: findings, UnmappedTerms: terms}})

	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	response := recorder.Body.String()
	if got := strings.Count(response, `"original_term"`); got != maxExtractionItems {
		t.Fatalf("findings = %d, want %d", got, maxExtractionItems)
	}
	if got := strings.Count(response, `"unmapped"`); got != maxExtractionItems {
		t.Fatalf("unmapped terms = %d, want %d", got, maxExtractionItems)
	}
}

func TestSkillPreviewReturns503WhenExtractionFails(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{err: context.DeadlineExceeded})

	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", recorder.Code)
	}
	if !strings.Contains(recorder.Body.String(), "skill preview could not be read") {
		t.Fatalf("body = %q", recorder.Body.String())
	}
}

func TestSkillPreviewRateLimitReturns429OverBurst(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})
	for range int(skillPreviewBucketCapacity) {
		recorder := postSkillPreview(service, "preview", `{"text":"short"}`)
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("request before burst limit returned %d, want 400", recorder.Code)
		}
	}

	recorder := postSkillPreview(service, "preview", `{"text":"short"}`)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
	if recorder.Header().Get("Retry-After") == "" {
		t.Fatal("Retry-After header is missing")
	}
}

func TestSkillPreviewReturns429WhenSemaphoreWaitExpires(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})
	service.skillPreviewSemaphoreWait = 50 * time.Millisecond
	for range maxConcurrentSkillPreviews {
		service.skillPreviewSlots <- struct{}{}
	}

	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
}

func TestSkillPreviewAuthPrecedesLimiterAndKeepsItsOwnBucket(t *testing.T) {
	service := newSkillPreviewService(&fakeExtractor{})
	service.slipReader = fakeSlipReader{}
	for range maxConcurrentCSECSlips {
		service.slipSlots <- struct{}{}
	}

	unauthorized := 0
	for range int(skillPreviewBucketCapacity) + 5 {
		recorder := postSkillPreview(service, "wrong", `{"text":"`+previewDescription+`"}`)
		if recorder.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", recorder.Code)
		}
		unauthorized++
	}
	if unauthorized != int(skillPreviewBucketCapacity)+5 {
		t.Fatalf("unauthorized requests = %d", unauthorized)
	}

	// Rejected callers must not consume shared tokens, and the saturated CSEC
	// slip semaphore must not block this route.
	recorder := postSkillPreview(service, "preview", `{"text":"`+previewDescription+`"}`)
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %q, want 200", recorder.Code, recorder.Body.String())
	}
}
