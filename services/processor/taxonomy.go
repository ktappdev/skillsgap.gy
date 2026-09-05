package main

import (
	"errors"
	"fmt"
	"strings"
)

const maxTaxonomyEntries = 500

func validateTaxonomy(entries []taxonomyEntry) error {
	if len(entries) == 0 {
		return errors.New("taxonomy snapshot is empty")
	}
	if len(entries) > maxTaxonomyEntries {
		return fmt.Errorf("taxonomy snapshot contains too many qualifications")
	}
	seenSlugs := make(map[string]struct{}, len(entries))
	for _, entry := range entries {
		if strings.TrimSpace(entry.ID) == "" || strings.TrimSpace(entry.Slug) == "" || strings.TrimSpace(entry.Name) == "" {
			return errors.New("taxonomy snapshot contains an incomplete qualification")
		}
		if _, exists := seenSlugs[entry.Slug]; exists {
			return fmt.Errorf("taxonomy snapshot contains duplicate slug %q", entry.Slug)
		}
		seenSlugs[entry.Slug] = struct{}{}
	}
	return nil
}
