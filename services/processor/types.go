package main

// Processing job kinds the worker routes on. Applicant-authored skill
// descriptions arrive as text on the job row; CVs arrive as a stored PDF.
const (
	jobKindResume      = "resume_analysis"
	jobKindDescription = "description_analysis"
	jobKindRecalculate = "recalculate_matches"
)

type processingJob struct {
	ID          string `json:"id"`
	ResumeID    string `json:"resume_id"`
	Kind        string `json:"kind"`
	StoragePath string `json:"storage_path"`
	Attempts    int    `json:"attempts"`
	InputText   string `json:"input_text"`
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
	Contact       resumeContactDetails     `json:"contact"`
	UnmappedTerms []string                 `json:"unmapped_terms"`
}

type resumeContactDetails struct {
	FullName    resumeContactField `json:"full_name"`
	Email       resumeContactField `json:"email"`
	PhoneNumber resumeContactField `json:"phone_number"`
}

type resumeContactField struct {
	Value        string  `json:"value"`
	Evidence     string  `json:"evidence"`
	EvidencePage int     `json:"evidence_page"`
	Confidence   float64 `json:"confidence"`
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
