package main

import (
	"errors"
	"os"
	"strings"
	"time"
)

type config struct {
	port               string
	webhookSecret      string
	supabaseURL        string
	supabaseServiceKey string
	ocrURL             string
	ocrSecret          string
	llmBaseURL         string
	llmAPIKey          string
	llmModel           string
	scratchDirectory   string
	pollInterval       time.Duration
	csecSlipSecret     string
}

func loadConfig() (config, error) {
	value := config{
		port:               envOrDefault("PORT", "8080"),
		webhookSecret:      strings.TrimSpace(os.Getenv("WEBHOOK_SECRET")),
		supabaseURL:        strings.TrimRight(strings.TrimSpace(os.Getenv("SUPABASE_URL")), "/"),
		supabaseServiceKey: strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
		ocrURL:             envOrDefault("OCR_URL", "http://127.0.0.1:8090"),
		ocrSecret:          strings.TrimSpace(os.Getenv("OCR_SERVICE_SECRET")),
		llmBaseURL:         strings.TrimRight(strings.TrimSpace(os.Getenv("LLM_BASE_URL")), "/"),
		llmAPIKey:          strings.TrimSpace(os.Getenv("LLM_API_KEY")),
		llmModel:           strings.TrimSpace(os.Getenv("LLM_MODEL")),
		scratchDirectory:   envOrDefault("PROCESSOR_SCRATCH_DIR", "/ephemeral/skillsgap-processor"),
		pollInterval:       20 * time.Second,
		csecSlipSecret:     strings.TrimSpace(os.Getenv("CSEC_SLIP_PROCESSOR_SECRET")),
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

func envOrDefault(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}
