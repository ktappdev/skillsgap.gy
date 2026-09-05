# Guyana workforce taxonomy expansion

Checkpoint 37 widens the controlled qualification vocabulary used by resume
extraction and job matching. It covers the people and supplier capabilities
that appear around Guyana's offshore, onshore, construction, marine, logistics,
hospitality, facilities, and office-support work.

## What was added

The migration adds canonical concepts for:

- offshore and onshore operations, HSE supervision, marine deck work, diving,
  vessel support, drilling support, and SURF support;
- mechanical, welding, pipefitting, plumbing, pipe welding, coatings,
  refrigeration/HVAC, carpentry, masonry, steel fixing, cargo, dredging,
  surveying, metrology, environmental fieldwork, ventilation, ICT, industrial
  cleaning, and waste management;
- office administration, human resources, finance and accounting,
  communications/PR, procurement/logistics, accommodation, catering/food
  safety, custodial services, security, medical support, domestic services,
  and transportation/personnel driving;
- local-content compliance and gold-mining/alluvial work.

Each concept is either a `technical_skill`, `experience`, or `compliance`
record. It is not a certificate unless the name explicitly says so. For
example, “Diving Operations” can preserve a person's reported diving
experience, but it cannot award a commercial-diving credential.

## How matching uses it

Qwen may propose a canonical candidate or preserve an original term. The Go
processor and PostgreSQL resolve that proposal only through this canonical
table or an approved alias. Aliases are normalized exact matches; there is no
fuzzy spelling or semantic auto-match. The applicant must still confirm an
extracted record before it can contribute to a score or interview eligibility.

Examples:

| CV wording | Controlled result |
| --- | --- |
| `Gold minor`, `gold miner`, `alluvial mining` | Gold Mining and Alluvial Work |
| `Diver`, `underwater work` | Diving Operations (experience to verify) |
| `Plumber`, `plumbing maintenance` | Plumbing |
| `Pipe welder`, `pipeline welding` | Pipe Welding |
| `Safety Officer`, `HSE Officer` | HSE Supervision |
| `Driver`, `personnel transport`, `truck driver` | Transportation and Personnel Driving |

The spelling in the original CV remains visible to the applicant. A broad
alias such as “Mechanic” maps to a broad maintenance concept, so a company can
still require the more specific diesel, hydraulic, electrical, or other skill
when publishing a role.

## Source and verification policy

The catalogue expansion was checked against public Guyana sources on 2026-09-05:

- [Local Content Register opportunities](https://lcregister.petroleum.gov.gy/opportunities/)
- [Ministry of Education TVET resources](https://education.gov.gy/web2/index.php/technical-vocational-education?format=html)
- [Board of Industrial Training](https://srms.bit.gov.gy/)
- [Ministry of Natural Resources annual-plan guideline](https://petroleum.gov.gy/wp-content/uploads/2025/01/MNR-Local-Content-Annual-Plan-Submission-Guideline-Version-3.pdf)

These sources establish the kinds of services and work around the sector; they
do not guarantee a current vacancy, course intake, license, medical clearance,
or employment outcome. Admins should add or deactivate aliases when a term is
verified in local employer or training-provider material. New credentials must
be added as their own qualification with an explicit verification rule rather
than hidden inside a broad experience alias.
