package main

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakeSlipReader struct {
	results []csecResult
	err     error
}

func (reader fakeSlipReader) extractCSECResults(context.Context, []byte, string) ([]csecResult, error) {
	return reader.results, reader.err
}

func TestCSECSlipRequiresSecretAndAllowsSupportedImages(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	service.slipReader = fakeSlipReader{results: []csecResult{{Subject: "Mathematics", Grade: "I", Confidence: 0.95}}}

	unauthorized := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
	unauthorized.Header.Set("Content-Type", "image/jpeg")
	unauthorizedRecorder := httptest.NewRecorder()
	service.routes().ServeHTTP(unauthorizedRecorder, unauthorized)
	if unauthorizedRecorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", unauthorizedRecorder.Code)
	}

	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", bytes.NewReader([]byte{0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00}))
	request.Header.Set("Content-Type", "image/jpeg")
	request.Header.Set("X-CSEC-Slip-Secret", "slip")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"Mathematics"`) {
		t.Fatalf("response = %d %q", recorder.Code, recorder.Body.String())
	}
}

func TestCSECSlipReturns429WhenSemaphoreWaitExpires(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	service.slipSemaphoreWait = 50 * time.Millisecond
	for range maxConcurrentCSECSlips {
		service.slipSlots <- struct{}{}
	}

	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
	request.Header.Set("Content-Type", "image/jpeg")
	request.Header.Set("X-CSEC-Slip-Secret", "slip")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
	if recorder.Header().Get("Retry-After") != "1" {
		t.Fatalf("Retry-After = %q, want 1", recorder.Header().Get("Retry-After"))
	}
}

func TestCSECSlipSucceedsWhenSemaphoreSlotFrees(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	service.slipReader = fakeSlipReader{results: []csecResult{{Subject: "Mathematics", Grade: "I", Confidence: 0.95}}}
	for range maxConcurrentCSECSlips {
		service.slipSlots <- struct{}{}
	}

	type response struct {
		status int
		body   string
	}
	responses := make(chan response, 1)
	go func() {
		request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", bytes.NewReader([]byte{0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00}))
		request.Header.Set("Content-Type", "image/jpeg")
		request.Header.Set("X-CSEC-Slip-Secret", "slip")
		recorder := httptest.NewRecorder()
		service.routes().ServeHTTP(recorder, request)
		responses <- response{status: recorder.Code, body: recorder.Body.String()}
	}()

	time.Sleep(25 * time.Millisecond)
	<-service.slipSlots
	select {
	case result := <-responses:
		if result.status != http.StatusOK || !strings.Contains(result.body, `"Mathematics"`) {
			t.Fatalf("response = %d %q, want successful extraction", result.status, result.body)
		}
	case <-time.After(time.Second):
		t.Fatal("request did not proceed after a semaphore slot freed")
	}
}

func TestCSECSlipRateLimitReturns429OverBurst(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	for range int(csecSlipBucketCapacity) {
		request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
		request.Header.Set("Content-Type", "application/pdf")
		request.Header.Set("X-CSEC-Slip-Secret", "slip")
		recorder := httptest.NewRecorder()
		service.routes().ServeHTTP(recorder, request)
		if recorder.Code != http.StatusUnsupportedMediaType {
			t.Fatalf("request before burst limit returned %d, want 415", recorder.Code)
		}
	}

	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
	request.Header.Set("Content-Type", "application/pdf")
	request.Header.Set("X-CSEC-Slip-Secret", "slip")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", recorder.Code)
	}
	if recorder.Header().Get("Retry-After") == "" {
		t.Fatal("Retry-After header is missing")
	}
}

func TestCSECSlipAuthPrecedesSaturatedLimiter(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	for range maxConcurrentCSECSlips {
		service.slipSlots <- struct{}{}
	}
	for range int(csecSlipBucketCapacity) {
		service.slipRateLimit.take(time.Now())
	}

	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
	request.Header.Set("Content-Type", "image/jpeg")
	request.Header.Set("X-CSEC-Slip-Secret", "wrong")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
}

func TestCSECSlipRejectsUnsupportedImageType(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("image"))
	request.Header.Set("Content-Type", "application/pdf")
	request.Header.Set("X-CSEC-Slip-Secret", "slip")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("status = %d, want 415", recorder.Code)
	}
}

func TestDecodeCSECResultsRejectsPIIAndInvalidValues(t *testing.T) {
	valid, err := decodeCSECResults(`{"results":[{"subject":"Mathematics","grade":"I","confidence":0.9}]}`)
	if err != nil || len(valid) != 1 {
		t.Fatalf("valid result = %#v, err = %v", valid, err)
	}
	if _, err := decodeCSECResults(`{"results":[{"subject":"Mathematics","grade":"I","confidence":2}]}`); err == nil {
		t.Fatal("expected invalid confidence to be rejected")
	}
	if _, err := decodeCSECResults(`{"results":[{"subject":"Mathematics","grade":"I","confidence":0.9,"name":"A Person"}]}`); err == nil {
		t.Fatal("expected unknown fields to be rejected")
	}
}

func TestCSECSlipRejectsSpoofedImageBody(t *testing.T) {
	service := newService(config{webhookSecret: "webhook", csecSlipSecret: "slip"}, fakeStore{}, fakePipeline{})
	request := httptest.NewRequest(http.MethodPost, "/public/csec-result-slip", strings.NewReader("not an image"))
	request.Header.Set("Content-Type", "image/jpeg")
	request.Header.Set("X-CSEC-Slip-Secret", "slip")
	recorder := httptest.NewRecorder()
	service.routes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
}
