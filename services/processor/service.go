package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

type service struct {
	config   config
	store    jobStore
	pipeline resumePipeline
	jobs     chan string
	stopPoll context.CancelFunc
	workers  sync.WaitGroup
}

func newService(config config, store jobStore, pipeline resumePipeline) *service {
	return &service{config: config, store: store, pipeline: pipeline, jobs: make(chan string, 20)}
}

func (service *service) start() {
	context, cancel := context.WithCancel(context.Background())
	service.stopPoll = cancel
	service.workers.Add(2)
	go service.worker(context)
	go service.poller(context)
}

func (service *service) stop() {
	if service.stopPoll != nil {
		service.stopPoll()
	}
	service.workers.Wait()
}

func (service *service) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", service.healthz)
	mux.Handle("POST /webhooks/resume", service.requireWebhookSecret(http.HandlerFunc(service.resumeWebhook)))
	return requestLogger(mux)
}

func (service *service) healthz(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func (service *service) resumeWebhook(writer http.ResponseWriter, request *http.Request) {
	defer request.Body.Close()
	request.Body = http.MaxBytesReader(writer, request.Body, 64*1024)
	var payload struct {
		JobID  string `json:"job_id"`
		Record *struct {
			ID string `json:"id"`
		} `json:"record"`
	}
	decoder := json.NewDecoder(request.Body)
	if err := decoder.Decode(&payload); err != nil {
		http.Error(writer, "webhook body must be JSON", http.StatusBadRequest)
		return
	}
	jobID := strings.TrimSpace(payload.JobID)
	if jobID == "" && payload.Record != nil {
		jobID = strings.TrimSpace(payload.Record.ID)
	}
	if jobID == "" {
		http.Error(writer, "webhook body must contain job_id or record.id", http.StatusBadRequest)
		return
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		http.Error(writer, "webhook body must contain one JSON value", http.StatusBadRequest)
		return
	}
	select {
	case service.jobs <- jobID:
	default:
		// The poller will recover durable queued work if a burst fills the in-memory signal channel.
	}
	writeJSON(writer, http.StatusAccepted, map[string]any{"accepted": true, "message": "queued"})
}

func (service *service) worker(ctx context.Context) {
	defer service.workers.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case jobID := <-service.jobs:
			service.process(ctx, jobID)
		}
	}
}

func (service *service) poller(ctx context.Context) {
	defer service.workers.Done()
	ticker := time.NewTicker(service.config.pollInterval)
	defer ticker.Stop()
	for {
		service.enqueueQueued(ctx)
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (service *service) enqueueQueued(ctx context.Context) {
	ids, err := service.store.queued(ctx)
	if err != nil {
		log.Printf("queued job poll failed: %v", err)
		return
	}
	for _, id := range ids {
		select {
		case service.jobs <- id:
		default:
			return
		}
	}
}

func (service *service) process(ctx context.Context, jobID string) {
	job, err := service.store.claim(ctx, jobID)
	if errors.Is(err, errJobNotClaimed) {
		return
	}
	if err != nil {
		log.Printf("job claim failed: %v", err)
		return
	}
	processingContext, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()
	if job.Kind == "recalculate_matches" {
		err = service.store.recalculate(processingContext, job)
	} else {
		var result extraction
		result, err = service.pipeline.process(processingContext, job)
		if err == nil {
			err = service.store.complete(ctx, job, result)
		}
	}
	if err != nil {
		log.Printf("resume processing failed for job %s: %v", job.ID, err)
		if failErr := service.store.fail(ctx, job, err); failErr != nil {
			log.Printf("could not mark job as failed: %v", failErr)
		}
	}
}

func (service *service) requireWebhookSecret(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		provided := request.Header.Get("X-Webhook-Secret")
		if subtle.ConstantTimeCompare([]byte(provided), []byte(service.config.webhookSecret)) != 1 {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(writer, request)
	})
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		started := time.Now()
		next.ServeHTTP(writer, request)
		log.Printf("%s %s %s", request.Method, request.URL.Path, time.Since(started).Round(time.Millisecond))
	})
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(value)
}
