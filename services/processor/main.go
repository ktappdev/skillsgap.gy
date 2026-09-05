package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	config, err := loadConfig()
	if err != nil {
		log.Fatal(err)
	}

	store := newSupabaseStore(config)
	pdf := execPDFTextExtractor{scratchDirectory: config.scratchDirectory}
	renderer := execPDFPageRenderer{scratchDirectory: config.scratchDirectory}
	pipeline := newPipeline(store, pdf, newOCRClient(config), renderer, newLLMClient(config))
	service := newService(config, store, pipeline)
	service.start()
	defer service.stop()

	server := &http.Server{
		Addr:              ":" + config.port,
		Handler:           service.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		log.Printf("processor listening on %s", server.Addr)
		if listenErr := server.ListenAndServe(); listenErr != nil && !errors.Is(listenErr, http.ErrServerClosed) {
			log.Fatal(listenErr)
		}
	}()

	<-stop
	shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		log.Printf("server shutdown failed: %v", err)
	}
}
