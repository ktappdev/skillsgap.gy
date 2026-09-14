package main

import (
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
