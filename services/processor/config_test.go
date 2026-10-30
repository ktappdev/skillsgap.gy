package main

import (
	"os"
	"strings"
	"testing"
)

func setRequiredConfig(t *testing.T) {
	t.Helper()
	t.Setenv("WEBHOOK_SECRET", "webhook-secret")
	t.Setenv("SUPABASE_URL", "https://supabase.example")
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
	t.Setenv("LLM_BASE_URL", "http://127.0.0.1:1234/v1")
	t.Setenv("LLM_MODEL", "local-model")
	t.Setenv("LLM_API_KEY", "")
	t.Setenv("LLM_MAX_TAXONOMY_ENTRIES", "")
	t.Setenv("WORKER_CONCURRENCY", "")
}

func TestLoadConfigAllowsKeylessOpenAICompatibleEndpoint(t *testing.T) {
	setRequiredConfig(t)

	value, err := loadConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if value.llmBaseURL != "http://127.0.0.1:1234/v1" || value.llmModel != "local-model" || value.llmAPIKey != "" {
		t.Fatalf("LLM config = %#v", value)
	}
	if value.taxonomyEntryLimit != defaultMaxTaxonomyEntries {
		t.Fatalf("taxonomy limit = %d, want default %d", value.taxonomyEntryLimit, defaultMaxTaxonomyEntries)
	}
}

func TestLoadConfigReadsTaxonomyLimit(t *testing.T) {
	for _, test := range []struct {
		name  string
		value string
		want  int
	}{
		{name: "below default", value: " 125 ", want: 125},
		{name: "above default", value: "25000", want: 25000},
	} {
		t.Run(test.name, func(t *testing.T) {
			setRequiredConfig(t)
			t.Setenv("LLM_MAX_TAXONOMY_ENTRIES", test.value)

			value, err := loadConfig()
			if err != nil {
				t.Fatalf("load config: %v", err)
			}
			if value.taxonomyEntryLimit != test.want {
				t.Fatalf("taxonomy limit = %d, want %d", value.taxonomyEntryLimit, test.want)
			}
		})
	}
}

func TestConfiguredTaxonomyLimitDefaultsForWhitespace(t *testing.T) {
	limit, err := configuredTaxonomyEntryLimit(" \t\n")
	if err != nil {
		t.Fatalf("parse whitespace taxonomy limit: %v", err)
	}
	if limit != defaultMaxTaxonomyEntries {
		t.Fatalf("taxonomy limit = %d, want default %d", limit, defaultMaxTaxonomyEntries)
	}
}

func TestLoadConfigRejectsInvalidTaxonomyLimit(t *testing.T) {
	for _, invalid := range []string{"0", "-1", "3.5", "many"} {
		t.Run(invalid, func(t *testing.T) {
			setRequiredConfig(t)
			t.Setenv("LLM_MAX_TAXONOMY_ENTRIES", invalid)

			_, err := loadConfig()
			if err == nil || !strings.Contains(err.Error(), "LLM_MAX_TAXONOMY_ENTRIES must be a positive integer") {
				t.Fatalf("load config error = %v", err)
			}
		})
	}
}

func TestLoadConfigTreatsSkillPreviewSecretAsOptional(t *testing.T) {
	setRequiredConfig(t)
	t.Setenv("SKILL_PREVIEW_SECRET", "")
	t.Setenv("CSEC_SLIP_PROCESSOR_SECRET", "")

	value, err := loadConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if value.skillPreviewSecret != "" {
		t.Fatalf("skill preview secret = %q, want empty", value.skillPreviewSecret)
	}

	t.Setenv("CSEC_SLIP_PROCESSOR_SECRET", "  shared-secret  ")
	value, err = loadConfig()
	if err != nil {
		t.Fatalf("load config with shared secret: %v", err)
	}
	if value.skillPreviewSecret != "shared-secret" {
		t.Fatalf("skill preview secret = %q, want CSEC shared secret", value.skillPreviewSecret)
	}

	t.Setenv("SKILL_PREVIEW_SECRET", "  preview-secret  ")
	value, err = loadConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if value.skillPreviewSecret != "preview-secret" {
		t.Fatalf("skill preview secret = %q, want the trimmed value", value.skillPreviewSecret)
	}
}

func TestLoadConfigReadsWorkerConcurrency(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		setRequiredConfig(t)

		value, err := loadConfig()
		if err != nil {
			t.Fatalf("load config: %v", err)
		}
		if value.workerConcurrency != defaultWorkerConcurrency {
			t.Fatalf("worker concurrency = %d, want %d", value.workerConcurrency, defaultWorkerConcurrency)
		}
	})

	for _, test := range []struct {
		name  string
		value string
		want  int
	}{
		{name: "minimum", value: "1", want: 1},
		{name: "trimmed", value: " 3 ", want: 3},
		{name: "maximum", value: "8", want: 8},
	} {
		t.Run(test.name, func(t *testing.T) {
			setRequiredConfig(t)
			t.Setenv("WORKER_CONCURRENCY", test.value)

			value, err := loadConfig()
			if err != nil {
				t.Fatalf("load config: %v", err)
			}
			if value.workerConcurrency != test.want {
				t.Fatalf("worker concurrency = %d, want %d", value.workerConcurrency, test.want)
			}
		})
	}
}

func TestLoadConfigRejectsInvalidWorkerConcurrency(t *testing.T) {
	for _, invalid := range []string{"0", "9", "-2", "two", "1.5"} {
		t.Run(invalid, func(t *testing.T) {
			setRequiredConfig(t)
			t.Setenv("WORKER_CONCURRENCY", invalid)

			_, err := loadConfig()
			if err == nil || !strings.Contains(err.Error(), "WORKER_CONCURRENCY must be an integer between 1 and 8") {
				t.Fatalf("load config error = %v", err)
			}
		})
	}
}

// workerCount keeps the pool inside its bounds even for a config built without
// loadConfig.
func TestWorkerCountDefaultsAndClamps(t *testing.T) {
	for _, test := range []struct {
		name  string
		value int
		want  int
	}{
		{name: "unset", value: 0, want: defaultWorkerConcurrency},
		{name: "negative", value: -3, want: defaultWorkerConcurrency},
		{name: "single", value: 1, want: 1},
		{name: "above maximum", value: 64, want: maxWorkerConcurrency},
	} {
		t.Run(test.name, func(t *testing.T) {
			if got := (config{workerConcurrency: test.value}).workerCount(); got != test.want {
				t.Fatalf("worker count = %d, want %d", got, test.want)
			}
		})
	}
}

func TestVerifyPDFToolsNamesTheMissingBinary(t *testing.T) {
	missing := "pdftoppm"
	err := verifyPDFTools(func(name string) (string, error) {
		if name == missing {
			return "", os.ErrNotExist
		}
		return "/usr/bin/" + name, nil
	})
	if err == nil || !strings.Contains(err.Error(), missing) {
		t.Fatalf("verify PDF tools error = %v", err)
	}

	available := verifyPDFTools(func(name string) (string, error) { return "/usr/bin/" + name, nil })
	if available != nil {
		t.Fatalf("verify available PDF tools error = %v", available)
	}
}

func TestLoadConfigRequiresEndpointAndModel(t *testing.T) {
	tests := []struct {
		name    string
		envName string
		message string
	}{
		{name: "endpoint", envName: "LLM_BASE_URL", message: "LLM_BASE_URL"},
		{name: "model", envName: "LLM_MODEL", message: "LLM_MODEL"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			setRequiredConfig(t)
			t.Setenv(test.envName, "")

			_, err := loadConfig()
			if err == nil || !strings.Contains(err.Error(), test.message) {
				t.Fatalf("load config error = %v", err)
			}
		})
	}
}
