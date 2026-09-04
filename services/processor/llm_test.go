package main

import "testing"

func TestDecodeExtractionRejectsUnsupportedQualificationKind(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[{"name":"BOSIET","kind":"instruction","years_experience":0,"evidence":"BOSIET certificate","confidence":0.9}],"employment":[],"unmapped_terms":[]}`)
	if err == nil {
		t.Fatal("expected unsupported kind error")
	}
}

func TestDecodeExtractionRejectsMultipleJSONValues(t *testing.T) {
	_, err := decodeExtraction(`{"qualifications":[],"employment":[],"unmapped_terms":[]} {}`)
	if err == nil {
		t.Fatal("expected multiple JSON values error")
	}
}

func TestDecodeExtractionAcceptsStrictSchema(t *testing.T) {
	result, err := decodeExtraction(`{"qualifications":[{"name":"Diesel mechanics","kind":"skill","years_experience":4,"evidence":"Four years repairing diesel engines","confidence":0.95}],"employment":[],"unmapped_terms":["minibus engines"]}`)
	if err != nil {
		fatalf(t, "unexpected error: %v", err)
	}
	if len(result.Qualifications) != 1 {
		t.Fatalf("qualifications = %#v", result.Qualifications)
	}
}

func fatalf(t *testing.T, format string, arguments ...any) {
	t.Helper()
	t.Fatalf(format, arguments...)
}
