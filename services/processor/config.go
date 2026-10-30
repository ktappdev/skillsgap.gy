package main

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultWorkerConcurrency = 2
	maxWorkerConcurrency     = 8
)

type config struct {
	port               string
	webhookSecret      string
	supabaseURL        string
	supabaseServiceKey string
	llmBaseURL         string
	llmAPIKey          string
	llmModel           string
	taxonomyEntryLimit int
	scratchDirectory   string
	pollInterval       time.Duration
	workerConcurrency  int
	csecSlipSecret     string
	// skillPreviewSecret is not startup-required: an empty value leaves the
	// public skill-preview route unmounted instead of failing startup.
	skillPreviewSecret string
}

func loadConfig() (config, error) {
	if err := loadLocalEnv(); err != nil {
		return config{}, err
	}
	taxonomyEntryLimit, err := configuredTaxonomyEntryLimit(os.Getenv("LLM_MAX_TAXONOMY_ENTRIES"))
	if err != nil {
		return config{}, err
	}
	workerConcurrency, err := configuredWorkerConcurrency(os.Getenv("WORKER_CONCURRENCY"))
	if err != nil {
		return config{}, err
	}
	csecSlipSecret := strings.TrimSpace(os.Getenv("CSEC_SLIP_PROCESSOR_SECRET"))
	skillPreviewSecret := strings.TrimSpace(os.Getenv("SKILL_PREVIEW_SECRET"))
	if skillPreviewSecret == "" {
		skillPreviewSecret = csecSlipSecret
	}
	value := config{
		port:               envOrDefault("PORT", "8080"),
		webhookSecret:      strings.TrimSpace(os.Getenv("WEBHOOK_SECRET")),
		supabaseURL:        strings.TrimRight(strings.TrimSpace(os.Getenv("SUPABASE_URL")), "/"),
		supabaseServiceKey: strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
		llmBaseURL:         strings.TrimRight(strings.TrimSpace(os.Getenv("LLM_BASE_URL")), "/"),
		llmAPIKey:          strings.TrimSpace(os.Getenv("LLM_API_KEY")),
		llmModel:           strings.TrimSpace(os.Getenv("LLM_MODEL")),
		taxonomyEntryLimit: taxonomyEntryLimit,
		scratchDirectory:   envOrDefault("PROCESSOR_SCRATCH_DIR", "/ephemeral/skillsgap-processor"),
		pollInterval:       20 * time.Second,
		workerConcurrency:  workerConcurrency,
		csecSlipSecret:     csecSlipSecret,
		skillPreviewSecret: skillPreviewSecret,
	}
	if value.webhookSecret == "" {
		return config{}, errors.New("WEBHOOK_SECRET must be set")
	}
	if value.supabaseURL == "" || value.supabaseServiceKey == "" {
		return config{}, errors.New("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
	}
	if value.llmBaseURL == "" {
		return config{}, errors.New("LLM_BASE_URL must be set")
	}
	if value.llmModel == "" {
		return config{}, errors.New("LLM_MODEL must be set")
	}
	return value, nil
}

func configuredTaxonomyEntryLimit(value string) (int, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return defaultMaxTaxonomyEntries, nil
	}
	limit, err := strconv.Atoi(trimmed)
	if err != nil || limit < 1 {
		return 0, errors.New("LLM_MAX_TAXONOMY_ENTRIES must be a positive integer")
	}
	return limit, nil
}

func configuredWorkerConcurrency(value string) (int, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return defaultWorkerConcurrency, nil
	}
	concurrency, err := strconv.Atoi(trimmed)
	if err != nil || concurrency < 1 || concurrency > maxWorkerConcurrency {
		return 0, fmt.Errorf("WORKER_CONCURRENCY must be an integer between 1 and %d", maxWorkerConcurrency)
	}
	return concurrency, nil
}

// workerCount enforces the concurrency bounds even for a config that was built
// without loadConfig.
func (value config) workerCount() int {
	if value.workerConcurrency < 1 {
		return defaultWorkerConcurrency
	}
	return min(value.workerConcurrency, maxWorkerConcurrency)
}

// requiredPDFTools are the Poppler binaries the document path shells out to.
var requiredPDFTools = []string{"pdfinfo", "pdftoppm"}

// verifyPDFTools refuses to start without Poppler. Without this check a missing
// binary would surface as a failed CV job that looks like a damaged document.
func verifyPDFTools(lookPath func(string) (string, error)) error {
	for _, tool := range requiredPDFTools {
		if _, err := lookPath(tool); err != nil {
			return fmt.Errorf("%s was not found on PATH: the processor needs Poppler for PDF validation and page rendering", tool)
		}
	}
	return nil
}

func envOrDefault(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}
