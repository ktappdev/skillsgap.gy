package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"
)

const maxCSECSlipBytes = 8 * 1024 * 1024

type csecResult struct {
	Subject    string  `json:"subject"`
	Grade      string  `json:"grade"`
	Confidence float64 `json:"confidence"`
}

type csecSlipReader interface {
	extractCSECResults(context.Context, []byte, string) ([]csecResult, error)
}

func (service *service) csecResultSlip(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()
	if !allowedCSECImageType(request.Header.Get("Content-Type")) {
		http.Error(writer, "unsupported image type", http.StatusUnsupportedMediaType)
		return
	}
	request.Body = http.MaxBytesReader(writer, request.Body, maxCSECSlipBytes)
	image, err := io.ReadAll(request.Body)
	if err != nil || len(image) == 0 || !allowedCSECImageType(http.DetectContentType(image)) {
		http.Error(writer, "invalid result slip image", http.StatusBadRequest)
		return
	}
	extractionContext, cancel := context.WithTimeout(request.Context(), 25*time.Second)
	defer cancel()
	results, err := service.slipReader.extractCSECResults(extractionContext, image, request.Header.Get("Content-Type"))
	if err != nil {
		http.Error(writer, "result slip could not be read", http.StatusServiceUnavailable)
		return
	}
	writeJSON(writer, http.StatusOK, map[string]any{"results": results})
}

func (service *service) requireCSECSlipSecret(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		provided := request.Header.Get("X-CSEC-Slip-Secret")
		if subtle.ConstantTimeCompare([]byte(provided), []byte(service.config.csecSlipSecret)) != 1 {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(writer, request)
	})
}

func allowedCSECImageType(value string) bool {
	mediaType := strings.ToLower(strings.TrimSpace(strings.Split(value, ";")[0]))
	return mediaType == "image/jpeg" || mediaType == "image/png" || mediaType == "image/webp"
}

func decodeCSECResults(value string) ([]csecResult, error) {
	var payload struct {
		Results []csecResult `json:"results"`
	}
	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&payload); err != nil {
		return nil, errors.New("CSEC extraction does not match schema")
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return nil, errors.New("CSEC extraction contained multiple JSON values")
	}
	if len(payload.Results) > 30 {
		return nil, errors.New("CSEC extraction contains too many results")
	}
	for _, result := range payload.Results {
		if strings.TrimSpace(result.Subject) == "" || utf8.RuneCountInString(result.Subject) > 120 || strings.TrimSpace(result.Grade) == "" || utf8.RuneCountInString(result.Grade) > 20 || result.Confidence < 0 || result.Confidence > 1 {
			return nil, errors.New("CSEC extraction contains an invalid result")
		}
	}
	return payload.Results, nil
}
