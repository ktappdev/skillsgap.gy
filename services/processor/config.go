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
	vllmURL            string
	vllmAPIKey         string
	modelName          string
	scratchDirectory   string
	pollInterval       time.Duration
}

func loadConfig() (config, error) {
	value := config{
		port:               envOrDefault("PORT", "8080"),
		webhookSecret:      strings.TrimSpace(os.Getenv("WEBHOOK_SECRET")),
		supabaseURL:        strings.TrimRight(strings.TrimSpace(os.Getenv("SUPABASE_URL")), "/"),
		supabaseServiceKey: strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
		ocrURL:             envOrDefault("OCR_URL", "http://127.0.0.1:8090"),
		ocrSecret:          strings.TrimSpace(os.Getenv("OCR_SERVICE_SECRET")),
		vllmURL:            envOrDefault("VLLM_URL", "http://127.0.0.1:8000/v1"),
		vllmAPIKey:         strings.TrimSpace(os.Getenv("VLLM_API_KEY")),
		modelName:          envOrDefault("VLLM_MODEL", "qwen3.6-35b-a3b"),
		scratchDirectory:   envOrDefault("PROCESSOR_SCRATCH_DIR", "/ephemeral/skillsgap-processor"),
		pollInterval:       20 * time.Second,
	}
	if value.webhookSecret == "" {
		return config{}, errors.New("WEBHOOK_SECRET must be set")
	}
	if value.supabaseURL == "" || value.supabaseServiceKey == "" {
		return config{}, errors.New("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
	}
	if value.ocrSecret == "" || value.vllmAPIKey == "" {
		return config{}, errors.New("OCR_SERVICE_SECRET and VLLM_API_KEY must be set")
	}
	return value, nil
}

func envOrDefault(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}
