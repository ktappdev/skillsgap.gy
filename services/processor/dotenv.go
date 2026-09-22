package main

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

// loadLocalEnv imports a local .env file before config validation so the
// processor can run with plain `go run .`. Paths are checked in order:
// ./.env (normal run from services/processor) and
// ./services/processor/.env (binary run from the repository root).
// A missing file is not an error, and godotenv.Load never overrides
// variables already present in the process environment.
func loadLocalEnv() error {
	var last error
	for _, path := range []string{".env", filepath.Join("services", "processor", ".env")} {
		err := godotenv.Load(path)
		if err == nil {
			return nil
		}
		if !errors.Is(err, os.ErrNotExist) {
			last = err
		}
	}
	return last
}
