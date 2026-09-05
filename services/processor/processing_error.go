package main

import "errors"

type processingError struct {
	message  string
	terminal bool
}

func (failure processingError) Error() string {
	return failure.message
}

func terminalProcessingError(message string) error {
	return processingError{message: message, terminal: true}
}

func processingFailureDetails(cause error) (string, bool) {
	var failure processingError
	if errors.As(cause, &failure) {
		return failure.message, failure.terminal
	}
	return "We could not process this CV. Please try again.", false
}
