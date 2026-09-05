package main

import (
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
