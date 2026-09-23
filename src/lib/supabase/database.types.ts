export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamps = { created_at: string; updated_at: string };

export type CompanyStatus = "pending" | "approved" | "rejected";
export type AccountType = "applicant" | "company" | "provider";
export type CompanyMemberRole = "owner" | "recruiter";
export type JobStatus = "draft" | "active" | "archived";
export type RequirementKind = "technical_skill" | "certification" | "compliance" | "experience" | "education";
export type ResumeStatus = "uploaded" | "processing" | "processed" | "failed" | "archived";
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed";
export type ProcessingKind = "resume_analysis" | "recalculate_matches";
export type QualificationSource = "extracted" | "applicant_confirmed" | "admin_verified";
export type ReviewStatus = "pending_review" | "confirmed" | "rejected";
export type ExtractionMethod = "native" | "ocr" | "vision";
export type ExtractionFindingStatus = "pending" | "confirmed" | "rejected" | "superseded";
export type FindingSelectionSource = "model_option" | "applicant_correction";
export type MatchStatus = "current" | "stale";
export type GapStatus = "unresolved" | "plan_started" | "completed";
export type ApplicationStatus = "applied" | "withdrawn";
export type ConsentStatus = "active" | "revoked";
export type FairStatus = "draft" | "open" | "closed";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "invited";
export type BookingStatus = "confirmed" | "cancelled";
export type PathwayKind = "guided" | "occupation";

type Profile = {
  account_type: AccountType;
  avatar_url: string | null;
  created_at: string;
  full_name: string | null;
  id: string;
  onboarding_completed: boolean;
  parish_or_region: string | null;
  phone_number: string | null;
  updated_at: string;
  username: string | null;
};
type Company = Timestamps & { contact_phone: string | null; description: string | null; id: string; industry: string | null; location: string | null; name: string; requested_by: string | null; reviewed_at: string | null; reviewed_by: string | null; status: CompanyStatus; website_url: string | null };
type CompanyMember = { company_id: string; created_at: string; invited_email: string | null; role: CompanyMemberRole; user_id: string };
type CompanyRecruiterInvitation = Timestamps & { accepted_at: string | null; accepted_by: string | null; company_id: string; email: string; expires_at: string; id: string; invited_by: string; revoked_at: string | null; token_hash: string };
type PlatformAdmin = { created_at: string; user_id: string };
type Qualification = Timestamps & { category: RequirementKind; description: string | null; id: string; is_active: boolean; name: string; slug: string };
type QualificationAlias = { alias: string; created_at: string; id: string; normalized_alias: string; qualification_id: string };
type Occupation = Timestamps & { id: string; industry_transfer_summary: string; is_active: boolean; isco08_code: string; isco08_level: "unit" | "minor" | "sub_major" | "major"; role_family: string; slug: string; source_locator: string | null; source_summary: string; source_url: string; title: string; value_chain_stages: string[] };
type OccupationAlias = { alias: string; created_at: string; id: string; normalized_alias: string; occupation_id: string; source_locator: string | null; source_url: string };
type LocalContentCategory = Timestamps & { id: string; is_active: boolean; name: string; slug: string; source_locator: string; source_url: string; target_percentage: number | null };
type OccupationLocalContentCategory = { created_at: string; local_content_category_id: string; occupation_id: string; relevance_note: string };
type CareerPreparationSubject = Timestamps & { id: string; is_active: boolean; last_verified_at: string; minimum_grade: string | null; occupation_id: string; guidance_note: string; source_locator: string; source_url: string; subject_name: string };
type OccupationPathwayAction = Timestamps & { action_type: "learn" | "practice" | "register" | "find_work" | "guidance"; contact_text: string | null; id: string; instruction: string; is_active: boolean; is_verified: boolean; last_verified_at: string; location: string | null; occupation_id: string; organization_name: string; sort_order: number; source_locator: string; source_url: string; title: string; training_program_id: string | null; url: string; why_it_helps: string };
type ApplicantPathwayPlan = Timestamps & { applicant_id: string; pathway_kind: PathwayKind; pathway_key: string; pathway_title: string; interests_note: string; selected_interests: string[]; csec_results: Json; planned_requirement_names: string[]; completed_action_ids: string[] };
type JobRole = Timestamps & { company_id: string; created_by: string | null; description: string; eligibility_threshold: number; employment_type: string | null; id: string; is_demo: boolean; location: string; occupation_id: string | null; published_at: string | null; status: JobStatus; title: string };
type JobRequirement = Timestamps & { id: string; job_role_id: string; kind: RequirementKind; mandatory: boolean; minimum_years: number | null; qualification_id: string; weight: number };
type TrainingProvider = Timestamps & { contact_phone: string | null; contact_url: string | null; description: string | null; id: string; is_verified: boolean; location: string; name: string; owner_user_id: string | null };
type TrainingProgram = Timestamps & { description: string | null; duration_text: string | null; enrollment_url: string | null; id: string; is_active: boolean; name: string; provider_id: string };
type TrainingProgramOutcome = { created_at: string; qualification_id: string; training_program_id: string };
type Resume = { applicant_id: string; byte_size: number; deleted_at: string | null; id: string; mime_type: string; original_filename: string; processed_at: string | null; status: ResumeStatus; storage_path: string; uploaded_at: string };
type ProcessingJob = Timestamps & { applicant_id: string; attempts: number; completed_at: string | null; error_message: string | null; id: string; kind: ProcessingKind; result_summary: Json; resume_id: string | null; started_at: string | null; status: ProcessingStatus };
type ApplicantQualification = Timestamps & { applicant_id: string; confidence: number | null; evidence: string | null; evidence_method: ExtractionMethod | null; evidence_page: number | null; id: string; original_term: string | null; qualification_id: string; resume_id: string | null; review_status: ReviewStatus; source: QualificationSource; years_experience: number | null };
type ResumeExtractionFinding = Timestamps & { applicant_id: string; confidence: number; created_at: string; evidence: string; evidence_method: ExtractionMethod; evidence_page: number; id: string; original_term: string; resume_id: string; selected_qualification_id: string | null; selection_source: FindingSelectionSource | null; status: ExtractionFindingStatus; updated_at: string; years_experience: number | null };
type ResumeExtractionFindingCandidate = { created_at: string; finding_id: string; qualification_id: string; rank: number };
type ApplicantExperience = Timestamps & { applicant_id: string; confidence: number | null; created_at: string; employer: string | null; evidence: string | null; id: string; resume_id: string | null; title: string; updated_at: string; years: number };
type JobMatch = Timestamps & { applicant_id: string; calculated_at: string; id: string; interview_eligible: boolean; job_role_id: string; mandatory_requirements_met: boolean; score: number; status: MatchStatus };
type MatchGap = Timestamps & { id: string; job_requirement_id: string; match_id: string; status: GapStatus };
type JobApplication = Timestamps & { applicant_id: string; company_id: string; id: string; job_role_id: string; status: ApplicationStatus };
type CandidateConsent = Timestamps & { applicant_id: string; company_id: string; granted_at: string; id: string; job_role_id: string; revoked_at: string | null; status: ConsentStatus };
type JobFair = Timestamps & { company_id: string; ends_at: string; id: string; location: string; name: string; starts_at: string; status: FairStatus };
type InterviewSlot = { created_at: string; ends_at: string; id: string; job_fair_id: string; starts_at: string };
type InterviewInvitation = { applicant_id: string; created_at: string; expires_at: string | null; id: string; job_fair_id: string | null; job_role_id: string; status: InvitationStatus };
type InterviewBooking = { applicant_id: string; created_at: string; id: string; interview_slot_id: string; invitation_id: string; status: BookingStatus };
type InsertOf<T> = Partial<T>;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      profiles: Table<Profile, InsertOf<Profile> & Pick<Profile, "id">, Partial<Profile>>;
      platform_admins: Table<PlatformAdmin, InsertOf<PlatformAdmin> & Pick<PlatformAdmin, "user_id">, Partial<PlatformAdmin>>;
      companies: Table<Company, InsertOf<Company> & Pick<Company, "name">, Partial<Company>>;
      company_members: Table<CompanyMember, InsertOf<CompanyMember> & Pick<CompanyMember, "company_id" | "user_id">, Partial<CompanyMember>>;
      company_recruiter_invitations: Table<CompanyRecruiterInvitation, InsertOf<CompanyRecruiterInvitation> & Pick<CompanyRecruiterInvitation, "company_id" | "email" | "token_hash" | "invited_by" | "expires_at">, Partial<CompanyRecruiterInvitation>>;
      qualifications: Table<Qualification, InsertOf<Qualification> & Pick<Qualification, "name" | "slug" | "category">, Partial<Qualification>>;
      qualification_aliases: Table<QualificationAlias, InsertOf<QualificationAlias> & Pick<QualificationAlias, "qualification_id" | "alias">, Partial<QualificationAlias>>;
      occupations: Table<Occupation, InsertOf<Occupation> & Pick<Occupation, "slug" | "title" | "isco08_code" | "isco08_level" | "role_family" | "source_summary" | "source_url">, Partial<Occupation>>;
      occupation_aliases: Table<OccupationAlias, InsertOf<OccupationAlias> & Pick<OccupationAlias, "occupation_id" | "alias" | "source_url">, Partial<OccupationAlias>>;
      local_content_categories: Table<LocalContentCategory, InsertOf<LocalContentCategory> & Pick<LocalContentCategory, "slug" | "name" | "source_url" | "source_locator">, Partial<LocalContentCategory>>;
      occupation_local_content_categories: Table<OccupationLocalContentCategory, InsertOf<OccupationLocalContentCategory> & Pick<OccupationLocalContentCategory, "occupation_id" | "local_content_category_id" | "relevance_note">, Partial<OccupationLocalContentCategory>>;
      career_preparation_subjects: Table<CareerPreparationSubject, InsertOf<CareerPreparationSubject> & Pick<CareerPreparationSubject, "occupation_id" | "subject_name" | "guidance_note" | "source_url" | "source_locator" | "last_verified_at">, Partial<CareerPreparationSubject>>;
      occupation_pathway_actions: Table<OccupationPathwayAction, InsertOf<OccupationPathwayAction> & Pick<OccupationPathwayAction, "occupation_id" | "action_type" | "title" | "instruction" | "why_it_helps" | "organization_name" | "url" | "source_url" | "source_locator" | "last_verified_at">, Partial<OccupationPathwayAction>>;
      applicant_pathway_plans: Table<ApplicantPathwayPlan, InsertOf<ApplicantPathwayPlan> & Pick<ApplicantPathwayPlan, "applicant_id" | "pathway_kind" | "pathway_key" | "pathway_title">, Partial<ApplicantPathwayPlan>>;
      job_roles: Table<JobRole, InsertOf<JobRole> & Pick<JobRole, "company_id" | "title">, Partial<JobRole>>;
      job_requirements: Table<JobRequirement, InsertOf<JobRequirement> & Pick<JobRequirement, "job_role_id" | "qualification_id" | "kind">, Partial<JobRequirement>>;
      training_providers: Table<TrainingProvider, InsertOf<TrainingProvider> & Pick<TrainingProvider, "name" | "location">, Partial<TrainingProvider>>;
      training_programs: Table<TrainingProgram, InsertOf<TrainingProgram> & Pick<TrainingProgram, "provider_id" | "name">, Partial<TrainingProgram>>;
      training_program_outcomes: Table<TrainingProgramOutcome, InsertOf<TrainingProgramOutcome> & Pick<TrainingProgramOutcome, "training_program_id" | "qualification_id">, Partial<TrainingProgramOutcome>>;
      resumes: Table<Resume, InsertOf<Resume> & Pick<Resume, "applicant_id" | "storage_path" | "original_filename" | "byte_size">, Partial<Resume>>;
      processing_jobs: Table<ProcessingJob, InsertOf<ProcessingJob> & Pick<ProcessingJob, "applicant_id" | "kind">, Partial<ProcessingJob>>;
      applicant_qualifications: Table<ApplicantQualification, InsertOf<ApplicantQualification> & Pick<ApplicantQualification, "applicant_id" | "qualification_id" | "source">, Partial<ApplicantQualification>>;
      resume_extraction_findings: Table<ResumeExtractionFinding, InsertOf<ResumeExtractionFinding> & Pick<ResumeExtractionFinding, "applicant_id" | "resume_id" | "original_term" | "evidence" | "evidence_page" | "evidence_method" | "confidence">, Partial<ResumeExtractionFinding>>;
      resume_extraction_finding_candidates: Table<ResumeExtractionFindingCandidate, InsertOf<ResumeExtractionFindingCandidate> & Pick<ResumeExtractionFindingCandidate, "finding_id" | "qualification_id" | "rank">, Partial<ResumeExtractionFindingCandidate>>;
      applicant_experience: Table<ApplicantExperience, InsertOf<ApplicantExperience> & Pick<ApplicantExperience, "applicant_id" | "title">, Partial<ApplicantExperience>>;
      job_matches: Table<JobMatch, InsertOf<JobMatch> & Pick<JobMatch, "applicant_id" | "job_role_id" | "score" | "mandatory_requirements_met" | "interview_eligible">, Partial<JobMatch>>;
      match_gaps: Table<MatchGap, InsertOf<MatchGap> & Pick<MatchGap, "match_id" | "job_requirement_id">, Partial<MatchGap>>;
      job_applications: Table<JobApplication, InsertOf<JobApplication> & Pick<JobApplication, "applicant_id" | "job_role_id" | "company_id">, Partial<JobApplication>>;
      candidate_consents: Table<CandidateConsent, InsertOf<CandidateConsent> & Pick<CandidateConsent, "applicant_id" | "company_id" | "job_role_id">, Partial<CandidateConsent>>;
      job_fairs: Table<JobFair, InsertOf<JobFair> & Pick<JobFair, "company_id" | "name" | "location" | "starts_at" | "ends_at">, Partial<JobFair>>;
      interview_slots: Table<InterviewSlot, InsertOf<InterviewSlot> & Pick<InterviewSlot, "job_fair_id" | "starts_at" | "ends_at">, Partial<InterviewSlot>>;
      interview_invitations: Table<InterviewInvitation, InsertOf<InterviewInvitation> & Pick<InterviewInvitation, "applicant_id" | "job_role_id" | "job_fair_id">, Partial<InterviewInvitation>>;
      interview_bookings: Table<InterviewBooking, InsertOf<InterviewBooking> & Pick<InterviewBooking, "invitation_id" | "interview_slot_id" | "applicant_id">, Partial<InterviewBooking>>;
    };
    Views: { [_ in never]: never };
    Functions: {
      clear_applicant_pathway: { Args: { target_applicant_id: string }; Returns: string[] };
      claim_processing_job: { Args: { processing_job_id: string }; Returns: ProcessingJob[] };
      apply_resume_extraction: { Args: { job_id: string; extraction: Json }; Returns: undefined };
      apply_match_recalculation: { Args: { job_id: string }; Returns: undefined };
      get_consented_resume_path: { Args: { target_job_role_id: string; target_resume_id: string }; Returns: string };
      get_consented_candidate_resume_path: { Args: { target_applicant_id: string; target_job_role_id: string }; Returns: string };
      get_consented_candidate_profile: { Args: { target_applicant_id: string; target_job_role_id: string }; Returns: Array<{ full_name: string | null; phone_number: string | null }> };
      get_active_extraction_taxonomy: { Args: Record<string, never>; Returns: Array<{ id: string; slug: string; name: string; category: RequirementKind; description: string | null; aliases: string[] }> };
      confirm_extraction_finding: { Args: { target_finding_id: string; target_qualification_id: string }; Returns: undefined };
      reject_extraction_finding: { Args: { target_finding_id: string }; Returns: undefined };
      accept_company_recruiter_invitation: { Args: { target_token_hash: string }; Returns: string };
      fail_processing_job: {
        Args: { processing_job_id: string; safe_error_message: string; terminal_failure?: boolean };
        Returns: undefined;
      };
      get_public_occupations: { Args: Record<string, never>; Returns: Array<{ id: string; slug: string; title: string; isco08_code: string; isco08_level: "unit" | "minor" | "sub_major" | "major"; role_family: string; value_chain_stages: string[]; source_summary: string; source_url: string; source_locator: string | null; local_content_categories: string[]; example_titles: string[]; industry_transfer_summary: string }> };
      get_public_occupation_pathway: { Args: { occupation_slug: string }; Returns: Array<{ id: string; slug: string; title: string; isco08_code: string; isco08_level: "unit" | "minor" | "sub_major" | "major"; role_family: string; value_chain_stages: string[]; source_summary: string; source_url: string; source_locator: string | null; local_content_categories: string[]; example_titles: string[]; industry_transfer_summary: string; preparation_subjects: Json; actions: Json }> };
    };
    Enums: {
      account_type: AccountType;
      company_status: CompanyStatus;
      company_member_role: CompanyMemberRole;
      job_status: JobStatus;
      requirement_kind: RequirementKind;
      resume_status: ResumeStatus;
      processing_status: ProcessingStatus;
      processing_kind: ProcessingKind;
      qualification_source: QualificationSource;
      review_status: ReviewStatus;
      match_status: MatchStatus;
      gap_status: GapStatus;
      application_status: ApplicationStatus;
      consent_status: ConsentStatus;
      fair_status: FairStatus;
      invitation_status: InvitationStatus;
      booking_status: BookingStatus;
      extraction_method: ExtractionMethod;
      extraction_finding_status: ExtractionFindingStatus;
      finding_selection_source: FindingSelectionSource;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;

export const Constants = {
  public: {
    Enums: {
      company_status: ["pending", "approved", "rejected"],
      company_member_role: ["owner", "recruiter"],
      job_status: ["draft", "active", "archived"],
      requirement_kind: ["technical_skill", "certification", "compliance", "experience"],
      resume_status: ["uploaded", "processing", "processed", "failed", "archived"],
      processing_status: ["queued", "processing", "completed", "failed"],
      processing_kind: ["resume_analysis", "recalculate_matches"],
      qualification_source: ["extracted", "applicant_confirmed", "admin_verified"],
      review_status: ["pending_review", "confirmed", "rejected"],
      match_status: ["current", "stale"],
      gap_status: ["unresolved", "plan_started", "completed"],
      consent_status: ["active", "revoked"],
      fair_status: ["draft", "open", "closed"],
      invitation_status: ["pending", "accepted", "declined", "expired"],
      booking_status: ["confirmed", "cancelled"],
      extraction_method: ["native", "ocr", "vision"],
      extraction_finding_status: ["pending", "confirmed", "rejected", "superseded"],
      finding_selection_source: ["model_option", "applicant_correction"],
    },
  },
} as const;
