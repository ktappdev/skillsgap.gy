package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

type execPDFDocument struct {
	scratchDirectory string
}

func (document execPDFDocument) pageCount(ctx context.Context, contents []byte) (int, error) {
	directory, pdfPath, err := document.privatePDF(contents)
	if err != nil {
		return 0, err
	}
	defer os.RemoveAll(directory)

	return inspectPDF(ctx, pdfPath)
}

type execPDFPageRenderer struct {
	scratchDirectory string
}

func (renderer execPDFPageRenderer) render(ctx context.Context, contents []byte, pageNumbers []int) ([]pageImage, error) {
	pageNumbers = uniquePageNumbers(pageNumbers)
	if len(pageNumbers) == 0 {
		return nil, nil
	}
	document := execPDFDocument{scratchDirectory: renderer.scratchDirectory}
	directory, pdfPath, err := document.privatePDF(contents)
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(directory)

	images := make([]pageImage, 0, len(pageNumbers))
	totalBytes := 0
	for _, page := range pageNumbers {
		prefix := filepath.Join(directory, fmt.Sprintf("page-%d", page))
		command := exec.CommandContext(ctx, "pdftoppm", "-f", strconv.Itoa(page), "-l", strconv.Itoa(page), "-singlefile", "-r", "144", "-jpeg", "-jpegopt", "quality=85", pdfPath, prefix)
		if err := command.Run(); err != nil {
			return nil, errors.New("document page could not be rendered for visual verification")
		}
		data, err := os.ReadFile(prefix + ".jpg")
		if err != nil {
			return nil, errors.New("rendered document page could not be read")
		}
		totalBytes += len(data)
		if totalBytes > maxVisionBytes {
			return nil, terminalProcessingError("This CV creates too much visual data to process safely. Upload a shorter or compressed PDF.")
		}
		images = append(images, pageImage{Page: page, MediaType: "image/jpeg", Data: data})
	}
	return images, nil
}

func (document execPDFDocument) privatePDF(contents []byte) (string, string, error) {
	if len(contents) == 0 {
		return "", "", terminalProcessingError("This CV is empty. Upload a PDF that contains your work history.")
	}
	if len(contents) > maxPDFBytes {
		return "", "", terminalProcessingError("This CV is larger than 15 MB. Upload a smaller PDF.")
	}
	if !looksLikePDF(contents) {
		return "", "", terminalProcessingError("This file is not a valid PDF. Upload a PDF CV.")
	}
	scratchDirectory := document.scratchDirectory
	if scratchDirectory == "" {
		scratchDirectory = os.TempDir()
	}
	if err := os.MkdirAll(scratchDirectory, 0o700); err != nil {
		return "", "", err
	}
	if err := os.Chmod(scratchDirectory, 0o700); err != nil {
		return "", "", err
	}
	directory, err := os.MkdirTemp(scratchDirectory, "skillsgap-pdf-")
	if err != nil {
		return "", "", err
	}
	pdfPath := filepath.Join(directory, "resume.pdf")
	if err := os.WriteFile(pdfPath, contents, 0o600); err != nil {
		_ = os.RemoveAll(directory)
		return "", "", err
	}
	return directory, pdfPath, nil
}

func inspectPDF(ctx context.Context, path string) (int, error) {
	output, err := exec.CommandContext(ctx, "pdfinfo", path).Output()
	if err != nil {
		return 0, terminalProcessingError("This PDF is locked or damaged. Upload an unlocked PDF or add your qualifications manually.")
	}
	for _, line := range strings.Split(string(output), "\n") {
		name, value, found := strings.Cut(line, ":")
		if !found || !strings.EqualFold(strings.TrimSpace(name), "Pages") {
			continue
		}
		pageCount, parseErr := strconv.Atoi(strings.TrimSpace(value))
		if parseErr != nil || pageCount < 1 {
			break
		}
		if pageCount > maxResumePages {
			return 0, terminalProcessingError("This CV is longer than 8 pages. Upload a shorter CV so every page can be reviewed.")
		}
		return pageCount, nil
	}
	return 0, terminalProcessingError("This PDF is missing readable page information. Upload a new PDF copy.")
}
