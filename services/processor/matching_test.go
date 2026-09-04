package main

import (
	"testing"
	"time"
)

func TestCalculateMatchBlocksMandatoryGap(t *testing.T) {
	originalNow := now
	now = func() time.Time { return time.Date(2026, 9, 4, 0, 0, 0, 0, time.UTC) }
	t.Cleanup(func() { now = originalNow })

	result := calculateMatch([]jobRequirement{
		{QualificationID: "mechanical", Weight: 3},
		{QualificationID: "bosiet", Weight: 2, Mandatory: true},
	}, []applicantQualification{{QualificationID: "mechanical"}}, 50)

	if result.Score != 60 {
		t.Fatalf("score = %d, want 60", result.Score)
	}
	if result.Eligible {
		t.Fatal("mandatory missing requirement must block eligibility")
	}
	if len(result.Missing) != 1 || result.Missing[0].QualificationID != "bosiet" {
		t.Fatalf("missing = %#v", result.Missing)
	}
}

func TestCalculateMatchDoesNotAwardPartialExperienceCredit(t *testing.T) {
	result := calculateMatch([]jobRequirement{{QualificationID: "hydraulics", Weight: 5, MinimumExperienceYears: 2}}, []applicantQualification{{QualificationID: "hydraulics", YearsExperience: 1.9}}, 75)
	if result.Score != 0 || result.Eligible {
		t.Fatalf("result = %#v, expected unmet requirement", result)
	}
}

func TestCalculateMatchRoundsAndUsesHighestExperience(t *testing.T) {
	result := calculateMatch([]jobRequirement{
		{QualificationID: "mechanical", Weight: 2, MinimumExperienceYears: 3},
		{QualificationID: "safety", Weight: 1},
	}, []applicantQualification{
		{QualificationID: "mechanical", YearsExperience: 1},
		{QualificationID: "mechanical", YearsExperience: 3},
	}, 67)
	if result.Score != 67 || !result.Eligible {
		t.Fatalf("result = %#v, expected rounded eligible match", result)
	}
}
