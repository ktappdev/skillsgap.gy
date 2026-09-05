package main

type processingJob struct {
	ID          string `json:"id"`
	ResumeID    string `json:"resume_id"`
	Kind        string `json:"kind"`
	StoragePath string `json:"storage_path"`
	Attempts    int    `json:"attempts"`
}

type taxonomyEntry struct {
	ID          string   `json:"id"`
	Slug        string   `json:"slug"`
	Name        string   `json:"name"`
	Category    string   `json:"category"`
	Description string   `json:"description"`
	Aliases     []string `json:"aliases"`
}

type resumeRecord struct {
	ID          string `json:"id"`
	StoragePath string `json:"storage_path"`
}

type extraction struct {
	Findings      []extractedQualification `json:"findings"`
	Employment    []employmentRecord       `json:"employment"`
	UnmappedTerms []string                 `json:"unmapped_terms"`
}

type extractedQualification struct {
	OriginalTerm    string           `json:"original_term"`
	CandidateSlugs  []string         `json:"candidate_slugs"`
	YearsExperience float64          `json:"years_experience"`
	Evidence        string           `json:"evidence"`
	EvidencePage    int              `json:"evidence_page"`
	EvidenceMethod  extractionMethod `json:"evidence_method"`
	Confidence      float64          `json:"confidence"`
}

type employmentRecord struct {
	Title      string  `json:"title"`
	Employer   string  `json:"employer"`
	Years      float64 `json:"years"`
	Evidence   string  `json:"evidence"`
	Confidence float64 `json:"confidence"`
}
