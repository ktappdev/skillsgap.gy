package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

const (
	maxCSECSlipBytes       = 8 * 1024 * 1024
	maxConcurrentCSECSlips = 4
	csecSlipSemaphoreWait  = 5 * time.Second
	csecSlipBucketCapacity = 5.0
	csecSlipBucketRate     = 20.0 / 60.0
)

type csecResult struct {
	Subject    string  `json:"subject"`
	Grade      string  `json:"grade"`
	Confidence float64 `json:"confidence"`
}

type csecSlipReader interface {
	extractCSECResults(context.Context, []byte, string) ([]csecResult, error)
}

type csecSlipTokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	lastRefill time.Time
}

func newCSECSlipTokenBucket() csecSlipTokenBucket {
	return csecSlipTokenBucket{tokens: csecSlipBucketCapacity, lastRefill: time.Now()}
}

func (bucket *csecSlipTokenBucket) take(now time.Time) (bool, time.Duration) {
	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	elapsed := now.Sub(bucket.lastRefill).Seconds()
	bucket.tokens = min(csecSlipBucketCapacity, bucket.tokens+elapsed*csecSlipBucketRate)
	bucket.lastRefill = now
	if bucket.tokens >= 1 {
		bucket.tokens--
		return true, 0
	}
	return false, time.Duration((1 - bucket.tokens) / csecSlipBucketRate * float64(time.Second))
}

func (service *service) limitCSECSlipRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if allowed, retryAfter := service.slipRateLimit.take(time.Now()); !allowed {
			writeCSECSlipRateLimit(writer, retryAfter)
			return
		}

		timer := time.NewTimer(service.slipSemaphoreWait)
		defer timer.Stop()
		select {
		case service.slipSlots <- struct{}{}:
			defer func() { <-service.slipSlots }()
			next.ServeHTTP(writer, request)
		case <-timer.C:
			writeCSECSlipRateLimit(writer, service.slipSemaphoreWait)
		}
	})
}

func writeCSECSlipRateLimit(writer http.ResponseWriter, retryAfter time.Duration) {
	seconds := int(math.Ceil(retryAfter.Seconds()))
	if seconds < 1 {
		seconds = 1
	}
	writer.Header().Set("Retry-After", strconv.Itoa(seconds))
	http.Error(writer, "too many requests", http.StatusTooManyRequests)
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
