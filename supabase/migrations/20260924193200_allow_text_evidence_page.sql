-- A plain-language description has no page, so its confirmed qualifications
-- carry evidence_page 0 with the text evidence method. Keep the CV invariant
-- intact: vision/native/ocr rows still cite a real page between 1 and 8.
alter table public.applicant_qualifications
  drop constraint applicant_qualifications_evidence_page_range;

alter table public.applicant_qualifications
  add constraint applicant_qualifications_evidence_page_range check (
    evidence_page is null
    or (evidence_method = 'text'::public.extraction_method and evidence_page = 0)
    or (
      evidence_method is distinct from 'text'::public.extraction_method
      and evidence_page between 1 and 8
    )
  );
