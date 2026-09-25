package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"
)

const (
	maxSkillPreviewBytes          = 64 * 1024
	maxConcurrentSkillPreviews    = 4
	skillPreviewSemaphoreWait     = 5 * time.Second
	skillPreviewBucketCapacity    = 5.0
	skillPreviewBucketRefillRate  = 20.0 / 60.0
	skillPreviewExtractionTimeout = 25 * time.Second
)

// skillPreviewExtractor is the narrow slice of the model client the public
// preview route needs: one taxonomy-mapped extraction from applicant text.
// *llmClient already satisfies it.
type skillPreviewExtractor interface {
	extractWithText(context.Context, string, []taxonomyEntry) (extraction, error)
}

type skillPreviewFinding struct {
	Slugs        []string `json:"slugs"`
	OriginalTerm string   `json:"original_term"`
}

type skillPreviewResponse struct {
	Findings      []skillPreviewFinding `json:"findings"`
	UnmappedTerms []string              `json:"unmapped_terms"`
}

type skillPreviewTokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	lastRefill time.Time
}

func newSkillPreviewTokenBucket() skillPreviewTokenBucket {
	return skillPreviewTokenBucket{tokens: skillPreviewBucketCapacity, lastRefill: time.Now()}
}

func (bucket *skillPreviewTokenBucket) take(now time.Time) (bool, time.Duration) {
	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	elapsed := now.Sub(bucket.lastRefill).Seconds()
	bucket.tokens = min(skillPreviewBucketCapacity, bucket.tokens+elapsed*skillPreviewBucketRefillRate)
	bucket.lastRefill = now
	if bucket.tokens >= 1 {
		bucket.tokens--
		return true, 0
	}
	return false, time.Duration((1 - bucket.tokens) / skillPreviewBucketRefillRate * float64(time.Second))
}

func (service *service) limitSkillPreviewRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if allowed, retryAfter := service.skillPreviewRateLimit.take(time.Now()); !allowed {
			writeSkillPreviewRateLimit(writer, retryAfter)
			return
		}

		timer := time.NewTimer(service.skillPreviewSemaphoreWait)
		defer timer.Stop()
		select {
		case service.skillPreviewSlots <- struct{}{}:
			defer func() { <-service.skillPreviewSlots }()
			next.ServeHTTP(writer, request)
		case <-timer.C:
			writeSkillPreviewRateLimit(writer, service.skillPreviewSemaphoreWait)
		}
	})
}

func writeSkillPreviewRateLimit(writer http.ResponseWriter, retryAfter time.Duration) {
	seconds := int(math.Ceil(retryAfter.Seconds()))
	if seconds < 1 {
		seconds = 1
	}
	writer.Header().Set("Retry-After", strconv.Itoa(seconds))
	http.Error(writer, "too many requests", http.StatusTooManyRequests)
}

// skillPreviewHandler maps an anonymous visitor's own words onto the active
// taxonomy so the signup form can preview matched skills before an account
// exists. The route lives under /public/ HTTPS, so the shared secret is the
// only gate: browsers never receive the processor URL or secret. The handler
// is stateless and persists nothing, and it never logs the submitted text or
// the model response.
func (service *service) skillPreviewHandler(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()
	request.Body = http.MaxBytesReader(writer, request.Body, maxSkillPreviewBytes)
	var payload struct {
		Text string `json:"text"`
	}
	decoder := json.NewDecoder(request.Body)
	if err := decoder.Decode(&payload); err != nil {
		http.Error(writer, "skill preview body must be JSON", http.StatusBadRequest)
		return
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		http.Error(writer, "skill preview body must contain one JSON value", http.StatusBadRequest)
		return
	}
	if err := validateDescriptionText(payload.Text); err != nil {
		http.Error(writer, "describe your work in 10 to 2000 characters", http.StatusBadRequest)
		return
	}

	// The shared model client allows 5 minutes; this route must answer well
	// inside the server's 35s WriteTimeout.
	extractionContext, cancel := context.WithTimeout(request.Context(), skillPreviewExtractionTimeout)
	defer cancel()
	taxonomy, err := service.store.loadTaxonomy(extractionContext)
	if err != nil {
		skillPreviewDebugLog("skill_preview.go: taxonomy load failed: %v", err)
		http.Error(writer, "skill preview could not be read", http.StatusServiceUnavailable)
		return
	}
	result, err := service.skillPreview.extractWithText(extractionContext, payload.Text, taxonomy)
	if err != nil {
		skillPreviewDebugLog("skill_preview.go: extraction failed: %v", err)
		http.Error(writer, "skill preview could not be read", http.StatusServiceUnavailable)
		return
	}
	writeJSON(writer, http.StatusOK, previewResponse(result))
}

// previewResponse reduces a full extraction to the two fields a preview needs.
// The text extraction path always carries null employment and zeroed contact
// fields, and those must never reach an anonymous caller.
func previewResponse(result extraction) skillPreviewResponse {
	findings := result.Findings
	if len(findings) > maxExtractionItems {
		findings = findings[:maxExtractionItems]
	}
	terms := result.UnmappedTerms
	if len(terms) > maxExtractionItems {
		terms = terms[:maxExtractionItems]
	}
	response := skillPreviewResponse{
		Findings:      make([]skillPreviewFinding, 0, len(findings)),
		UnmappedTerms: make([]string, 0, len(terms)),
	}
	for _, finding := range findings {
		slugs := finding.CandidateSlugs
		if slugs == nil {
			slugs = []string{}
		}
		response.Findings = append(response.Findings, skillPreviewFinding{Slugs: slugs, OriginalTerm: finding.OriginalTerm})
	}
	response.UnmappedTerms = append(response.UnmappedTerms, terms...)
	return response
}

func (service *service) requireSkillPreviewSecret(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		provided := request.Header.Get("X-Skill-Preview-Secret")
		if subtle.ConstantTimeCompare([]byte(provided), []byte(service.config.skillPreviewSecret)) != 1 {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(writer, request)
	})
}

func skillPreviewDebugLog(format string, args ...any) {
	if os.Getenv("PICODE_DEBUG") == "1" {
		log.Printf("[pdbg] "+format, args...)
	}
}
