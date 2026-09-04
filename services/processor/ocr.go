package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"time"
)

type ocrClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func newOCRClient(config config) *ocrClient {
	return &ocrClient{baseURL: strings.TrimRight(config.ocrURL, "/"), secret: config.ocrSecret, client: &http.Client{Timeout: 3 * time.Minute}}
}

func (client *ocrClient) parse(ctx context.Context, pdf []byte) (string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreatePart(textproto.MIMEHeader{
		"Content-Disposition": []string{`form-data; name="file"; filename="resume.pdf"`},
		"Content-Type":        []string{"application/pdf"},
	})
	if err != nil {
		return "", err
	}
	if _, err := part.Write(pdf); err != nil {
		return "", err
	}
	if err := writer.Close(); err != nil {
		return "", err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+"/parse", &body)
	if err != nil {
		return "", err
	}
	request.Header.Set("Content-Type", writer.FormDataContentType())
	request.Header.Set("X-OCR-Secret", client.secret)
	response, err := client.client.Do(request)
	if err != nil {
		return "", fmt.Errorf("OCR request failed: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", errors.New("OCR service did not accept the document")
	}
	var payload struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 4*1024*1024)).Decode(&payload); err != nil {
		return "", errors.New("OCR service returned invalid JSON")
	}
	return strings.TrimSpace(payload.Text), nil
}
