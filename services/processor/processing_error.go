package main

import "errors"

// modelRejectedMessage is applicant-safe. A provider status is never the
// applicant's fault, so it must not be described as a damaged CV.
const modelRejectedMessage = "Our skills reader could not accept this request. Please try again later."

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

func processingFailureDetails(cause error, kind string) (string, bool) {
	var failure processingError
	if errors.As(cause, &failure) {
		return failure.message, failure.terminal
	}
	// A permanent provider status will not change on retry, so the job fails now
	// instead of burning its remaining attempts.
	var modelFailure modelHTTPError
	if errors.As(cause, &modelFailure) && permanentModelStatus(modelFailure.status) {
		return modelRejectedMessage, true
	}
	if kind == jobKindDescription {
		return "We could not read your description. Please try again.", false
	}
	return "We could not process this CV. Please try again.", false
}
