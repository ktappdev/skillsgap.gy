package main

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// execPDFTextExtractor uses Poppler's pdftotext. It keeps raw CV data in a
// mode-0700 temporary directory and removes it before returning.
type execPDFTextExtractor struct {
	scratchDirectory string
}

func (extractor execPDFTextExtractor) extract(ctx context.Context, contents []byte) (string, error) {
	scratchDirectory := extractor.scratchDirectory
	if scratchDirectory == "" {
		scratchDirectory = os.TempDir()
	}
	if err := os.MkdirAll(scratchDirectory, 0o700); err != nil {
		return "", err
	}
	if err := os.Chmod(scratchDirectory, 0o700); err != nil {
		return "", err
	}
	directory, err := os.MkdirTemp(scratchDirectory, "skillsgap-pdf-")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(directory)

	path := filepath.Join(directory, "resume.pdf")
	if err := os.WriteFile(path, contents, 0o600); err != nil {
		return "", err
	}
	command := exec.CommandContext(ctx, "pdftotext", "-layout", path, "-")
	output, err := command.Output()
	if err != nil {
		return "", errors.New("native PDF extraction failed")
	}
	return strings.TrimSpace(string(output)), nil
}
