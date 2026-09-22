package main

import (
	"os"
	"path/filepath"
	"testing"
)

func chdir(t *testing.T, dir string) {
	t.Helper()
	previous, err := os.Getwd()
	if err != nil {
		t.Fatalf("get working directory: %v", err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatalf("change working directory: %v", err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(previous); err != nil {
			t.Fatalf("restore working directory: %v", err)
		}
	})
}

func writeDotenv(t *testing.T, dir, contents string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte(contents), 0o600); err != nil {
		t.Fatalf("write .env: %v", err)
	}
}

func TestLoadLocalEnvPopulatesMissingVariables(t *testing.T) {
	dir := t.TempDir()
	writeDotenv(t, dir, "DOTENV_FROM_FILE=loaded\n")
	chdir(t, dir)
	t.Setenv("DOTENV_FROM_FILE", "")

	if err := os.Unsetenv("DOTENV_FROM_FILE"); err != nil {
		t.Fatalf("unset variable: %v", err)
	}

	if err := loadLocalEnv(); err != nil {
		t.Fatalf("load local env: %v", err)
	}
	if os.Getenv("DOTENV_FROM_FILE") != "loaded" {
		t.Fatalf("DOTENV_FROM_FILE = %q, want %q", os.Getenv("DOTENV_FROM_FILE"), "loaded")
	}
}

func TestLoadLocalEnvPreservesExistingEnvironment(t *testing.T) {
	dir := t.TempDir()
	writeDotenv(t, dir, "DOTENV_PRECEDENCE=from-file\n")
	chdir(t, dir)
	t.Setenv("DOTENV_PRECEDENCE", "from-environment")

	if err := loadLocalEnv(); err != nil {
		t.Fatalf("load local env: %v", err)
	}
	if os.Getenv("DOTENV_PRECEDENCE") != "from-environment" {
		t.Fatalf("DOTENV_PRECEDENCE = %q, want %q", os.Getenv("DOTENV_PRECEDENCE"), "from-environment")
	}
}

func TestLoadLocalEnvIgnoresMissingFile(t *testing.T) {
	chdir(t, t.TempDir())

	if err := loadLocalEnv(); err != nil {
		t.Fatalf("load local env with no .env: %v", err)
	}
}

func TestLoadLocalEnvFallsBackToProcessorDirectory(t *testing.T) {
	root := t.TempDir()
	processorDir := filepath.Join(root, "services", "processor")
	if err := os.MkdirAll(processorDir, 0o755); err != nil {
		t.Fatalf("create processor directory: %v", err)
	}
	if err := os.WriteFile(filepath.Join(processorDir, ".env"), []byte("DOTENV_FROM_ROOT=loaded\n"), 0o600); err != nil {
		t.Fatalf("write processor .env: %v", err)
	}
	chdir(t, root)

	if err := loadLocalEnv(); err != nil {
		t.Fatalf("load local env from repository root: %v", err)
	}
	if os.Getenv("DOTENV_FROM_ROOT") != "loaded" {
		t.Fatalf("DOTENV_FROM_ROOT = %q, want %q", os.Getenv("DOTENV_FROM_ROOT"), "loaded")
	}
}
