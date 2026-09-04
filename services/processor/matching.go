package main

import (
	"math"
	"time"
)

// calculateMatch applies the platform's transparent requirement rules. It never
// awards partial credit: a qualification either meets the complete requirement or it does not.
func calculateMatch(requirements []jobRequirement, qualifications []applicantQualification, threshold int) roleMatch {
	byQualification := make(map[string]applicantQualification, len(qualifications))
	for _, qualification := range qualifications {
		if existing, ok := byQualification[qualification.QualificationID]; !ok || qualification.YearsExperience > existing.YearsExperience {
			byQualification[qualification.QualificationID] = qualification
		}
	}

	totalWeight := 0
	satisfiedWeight := 0
	mandatoryMissing := false
	result := roleMatch{CalculatedAt: now()}
	for _, requirement := range requirements {
		if requirement.Weight < 1 || requirement.Weight > 5 {
			continue
		}
		totalWeight += requirement.Weight
		qualification, found := byQualification[requirement.QualificationID]
		isSatisfied := found && qualification.YearsExperience >= requirement.MinimumExperienceYears
		if isSatisfied {
			satisfiedWeight += requirement.Weight
			result.Satisfied = append(result.Satisfied, requirement)
			continue
		}
		result.Missing = append(result.Missing, requirement)
		mandatoryMissing = mandatoryMissing || requirement.Mandatory
	}
	if totalWeight > 0 {
		result.Score = int(math.Round(float64(satisfiedWeight) * 100 / float64(totalWeight)))
	}
	result.Eligible = totalWeight > 0 && result.Score >= threshold && !mandatoryMissing
	return result
}

var now = func() time.Time { return time.Now().UTC() }
