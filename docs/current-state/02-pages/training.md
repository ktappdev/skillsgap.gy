# `/training` and `/training/[programId]`

Sources: `src/app/training/page.tsx:14`, `src/app/training/[programId]/page.tsx:43`

## List page

`getPublicCourses` returns active programs owned by verified providers. The page shows a public header, intro, count, two-column `CourseCard` grid, empty state, and a warning that dates, fees, and entry requirements can change.

## Detail page

`getPublicCourse` requires an active program and verified provider. The page shows:

- Course name, provider, location, duration, share action, and optional HTTPS enrollment link.
- About this course.
- Skills it builds, derived from active qualification outcomes.
- A “Know someone this fits?” share panel.
- Provider description, phone, and optional provider website.
- A before-enrolling freshness notice.
- `← All training` footer link.

When the current viewer resolves to the applicant dashboard, a banner links `← Back to my pathway`.

## Data and access

Public, dynamic, verified-only content. No course enrollment is performed inside the app; the enrollment URL opens externally.

## Current UX observations

Course detail has two sharing surfaces and two possible onward links. It has good back behavior, but its “Check current intake” link is the only action that reaches a provider workflow.
