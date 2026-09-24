package main

import (
	"encoding/json"
	"strconv"
	"strings"
	"testing"
)

func testTaxonomy() []taxonomyEntry {
	return []taxonomyEntry{
		{ID: "qualification-1", Slug: "domestic-services", Name: "Domestic Services", Category: "experience", Description: "Household and residential support.", Aliases: []string{"House Cleaner"}},
		{ID: "qualification-2", Slug: "mechanical-maintenance", Name: "Mechanical Maintenance", Category: "technical_skill", Description: "Planned and corrective mechanical maintenance.", Aliases: []string{"Mechanic"}},
		{ID: "qualification-3", Slug: "warehouse-operations", Name: "Warehouse Operations", Category: "technical_skill", Description: "Inventory, receiving, dispatch, and stock handling.", Aliases: []string{"Warehouse Worker"}},
	}
}

func TestTaxonomyPromptIncludesMeaningAndAliases(t *testing.T) {
	prompt, err := taxonomyPrompt(testTaxonomy())
	if err != nil {
		t.Fatalf("build taxonomy prompt: %v", err)
	}
	for _, expected := range []string{"Household and residential support.", "House Cleaner", "Inventory, receiving, dispatch, and stock handling.", "<TAXONOMY>"} {
		if !strings.Contains(prompt, expected) {
			t.Fatalf("taxonomy prompt does not contain %q: %s", expected, prompt)
		}
	}
	if strings.Contains(prompt, "job_requirements") || strings.Contains(prompt, "eligibility_threshold") || strings.Contains(prompt, "match score") {
		t.Fatalf("taxonomy prompt contains job decision data: %s", prompt)
	}
}

func TestValidateTaxonomyAcceptsConfiguredLimit(t *testing.T) {
	entries := make([]taxonomyEntry, defaultMaxTaxonomyEntries)
	for index := range entries {
		entries[index] = taxonomyEntry{
			ID:   "qualification-" + strconv.Itoa(index),
			Slug: "qualification-" + strconv.Itoa(index),
			Name: "Qualification " + strconv.Itoa(index),
		}
	}
	if err := validateTaxonomy(entries, defaultMaxTaxonomyEntries); err != nil {
		t.Fatalf("validate exact default limit: %v", err)
	}
	if err := validateTaxonomy(entries[:125], 125); err != nil {
		t.Fatalf("validate exact lower override: %v", err)
	}

	entries = append(entries, taxonomyEntry{ID: "extra", Slug: "extra", Name: "Extra"})
	err := validateTaxonomy(entries, defaultMaxTaxonomyEntries)
	if err == nil || !strings.Contains(err.Error(), "2001 active qualifications") || !strings.Contains(err.Error(), "configured limit is 2000") {
		t.Fatalf("over-limit error = %v", err)
	}
}

func TestValidateTaxonomyAllowsOverrideAboveDefault(t *testing.T) {
	entries := make([]taxonomyEntry, defaultMaxTaxonomyEntries+1)
	for index := range entries {
		name := "Qualification " + strconv.Itoa(index)
		entries[index] = taxonomyEntry{ID: name, Slug: "qualification-" + strconv.Itoa(index), Name: name}
	}
	if err := validateTaxonomy(entries, len(entries)); err != nil {
		t.Fatalf("validate configured override: %v", err)
	}
}

func TestTaxonomyPromptAndSchemaIncludeEveryConfiguredEntry(t *testing.T) {
	entries := make([]taxonomyEntry, defaultMaxTaxonomyEntries)
	for index := range entries {
		entries[index] = taxonomyEntry{
			ID:          "qualification-" + strconv.Itoa(index),
			Slug:        "qualification-" + strconv.Itoa(index),
			Name:        "Qualification " + strconv.Itoa(index),
			Category:    "technical_skill",
			Description: "Description " + strconv.Itoa(index),
			Aliases:     []string{"Alias " + strconv.Itoa(index)},
		}
	}

	last := entries[len(entries)-1]
	prompt, err := taxonomyPrompt(entries)
	if err != nil {
		t.Fatalf("build taxonomy prompt: %v", err)
	}
	if !strings.Contains(prompt, last.Slug) || !strings.Contains(prompt, last.Aliases[0]) {
		t.Fatal("taxonomy prompt omitted an entry at the configured limit")
	}

	encodedSchema, err := json.Marshal(extractionSchema(entries))
	if err != nil {
		t.Fatalf("marshal extraction schema: %v", err)
	}
	if !strings.Contains(string(encodedSchema), last.Slug) {
		t.Fatal("extraction schema omitted an entry at the configured limit")
	}
}
