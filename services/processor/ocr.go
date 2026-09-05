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

func (client *ocrClient) parse(ctx context.Context, pdf []byte, pageNumbers []int) (parsedDocument, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreatePart(textproto.MIMEHeader{
		"Content-Disposition": []string{`form-data; name="file"; filename="resume.pdf"`},
		"Content-Type":        []string{"application/pdf"},
	})
	if err != nil {
		return parsedDocument{}, err
	}
	if _, err := part.Write(pdf); err != nil {
		return parsedDocument{}, err
	}
	if err := writer.WriteField("pages", joinPageNumbers(pageNumbers)); err != nil {
		return parsedDocument{}, err
	}
	if err := writer.Close(); err != nil {
		return parsedDocument{}, err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+"/parse", &body)
	if err != nil {
		return parsedDocument{}, err
	}
	request.Header.Set("Content-Type", writer.FormDataContentType())
	request.Header.Set("X-OCR-Secret", client.secret)
	response, err := client.client.Do(request)
	if err != nil {
		return parsedDocument{}, fmt.Errorf("OCR request failed: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return parsedDocument{}, errors.New("OCR service did not accept the document")
	}
	var payload struct {
		Pages []struct {
			Page int    `json:"page"`
			Text string `json:"text"`
		} `json:"pages"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 4*1024*1024)).Decode(&payload); err != nil {
		return parsedDocument{}, errors.New("OCR service returned invalid JSON")
	}
	pages := make([]documentPage, 0, len(payload.Pages))
	for _, page := range payload.Pages {
		if page.Page < 1 || page.Page > maxResumePages {
			return parsedDocument{}, errors.New("OCR service returned an invalid page number")
		}
		pages = append(pages, documentPage{Number: page.Page, Text: strings.TrimSpace(page.Text), Method: methodOCR})
	}
	return parsedDocument{Pages: pages}, nil
}

func joinPageNumbers(pageNumbers []int) string {
	values := make([]string, 0, len(pageNumbers))
	for _, page := range uniquePageNumbers(pageNumbers) {
		values = append(values, fmt.Sprintf("%d", page))
	}
	return strings.Join(values, ",")
}
