package main

type processingJob struct {
	ID          string `json:"id"`
	ResumeID    string `json:"resume_id"`
	Kind        string `json:"kind"`
	StoragePath string `json:"storage_path"`
	Attempts    int    `json:"attempts"`
}

type resumeRecord struct {
	ID          string `json:"id"`
	StoragePath string `json:"storage_path"`
}

type extraction struct {
	Qualifications []extractedQualification `json:"qualifications"`
	Employment     []employmentRecord       `json:"employment"`
	UnmappedTerms  []string                 `json:"unmapped_terms"`
}

type extractedQualification struct {
	OriginalTerm       string           `json:"original_term"`
	CanonicalCandidate string           `json:"canonical_candidate"`
	Kind               string           `json:"kind"`
	YearsExperience    float64          `json:"years_experience"`
	Evidence           string           `json:"evidence"`
	EvidencePage       int              `json:"evidence_page"`
	EvidenceMethod     extractionMethod `json:"evidence_method"`
	Confidence         float64          `json:"confidence"`
}

type employmentRecord struct {
	Title      string  `json:"title"`
	Employer   string  `json:"employer"`
	Years      float64 `json:"years"`
	Evidence   string  `json:"evidence"`
	Confidence float64 `json:"confidence"`
}
