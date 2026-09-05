package main

func testTaxonomy() []taxonomyEntry {
	return []taxonomyEntry{
		{ID: "qualification-1", Slug: "domestic-services", Name: "Domestic Services", Category: "experience", Description: "Household and residential support.", Aliases: []string{"House Cleaner"}},
		{ID: "qualification-2", Slug: "mechanical-maintenance", Name: "Mechanical Maintenance", Category: "technical_skill", Description: "Planned and corrective mechanical maintenance.", Aliases: []string{"Mechanic"}},
		{ID: "qualification-3", Slug: "warehouse-operations", Name: "Warehouse Operations", Category: "technical_skill", Description: "Inventory, receiving, dispatch, and stock handling.", Aliases: []string{"Warehouse Worker"}},
	}
}
