package main

import (
	"errors"
	"fmt"
	"net/http"
	"testing"
)

// The applicant only ever sees the messages chosen here: explicit processing
// errors and permanent model statuses fail immediately, everything else keeps
// the retry policy.
func TestProcessingFailureDetailsRoutesTerminalAndTransientCauses(t *testing.T) {
	tests := []struct {
		name     string
		cause    error
		kind     string
		message  string
		terminal bool
	}{
		{
			name:     "safe terminal message",
			cause:    terminalProcessingError("Upload an unlocked PDF."),
			kind:     jobKindResume,
			message:  "Upload an unlocked PDF.",
			terminal: true,
		},
		{
			name:     "permanent model status",
			cause:    modelHTTPError{status: http.StatusUnauthorized},
			kind:     jobKindResume,
			message:  modelRejectedMessage,
			terminal: true,
		},
		{
			name:     "wrapped permanent model status",
			cause:    fmt.Errorf("request: %w", modelHTTPError{status: http.StatusNotFound}),
			kind:     jobKindDescription,
			message:  modelRejectedMessage,
			terminal: true,
		},
		{
			name:     "rate limited model",
			cause:    modelHTTPError{status: http.StatusTooManyRequests, retryAfter: "9"},
			kind:     jobKindResume,
			message:  "We could not process this CV. Please try again.",
			terminal: false,
		},
		{
			name:     "model server error",
			cause:    modelHTTPError{status: http.StatusBadGateway},
			kind:     jobKindDescription,
			message:  "We could not read your description. Please try again.",
			terminal: false,
		},
		{
			name:     "upstream failure",
			cause:    errors.New("dialog exploded"),
			kind:     jobKindResume,
			message:  "We could not process this CV. Please try again.",
			terminal: false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			message, terminal := processingFailureDetails(test.cause, test.kind)
			if message != test.message || terminal != test.terminal {
				t.Fatalf("details = %q, %v; want %q, %v", message, terminal, test.message, test.terminal)
			}
		})
	}
}
