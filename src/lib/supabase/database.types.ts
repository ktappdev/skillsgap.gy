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
export type CompanyMemberRole = "owner" | "recruiter";
export type JobStatus = "draft" | "active" | "archived";
export type RequirementKind = "technical_skill" | "certification" | "compliance" | "experience";
export type ResumeStatus = "uploaded" | "processing" | "processed" | "failed" | "archived";
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed";
export type ProcessingKind = "resume_analysis" | "recalculate_matches";
export type QualificationSource = "extracted" | "applicant_confirmed" | "admin_verified";
export type ReviewStatus = "pending_review" | "confirmed" | "rejected";
export type ExtractionMethod = "native" | "ocr" | "vision";
export type MatchStatus = "current" | "stale";
export type GapStatus = "unresolved" | "plan_started" | "completed";
export type ConsentStatus = "active" | "revoked";
export type FairStatus = "draft" | "open" | "closed";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type BookingStatus = "confirmed" | "cancelled";

type Profile = {
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
type Company = Timestamps & { description: string | null; id: string; name: string; requested_by: string | null; reviewed_at: string | null; reviewed_by: string | null; status: CompanyStatus; website_url: string | null };
type CompanyMember = Timestamps & { company_id: string; role: CompanyMemberRole; user_id: string };
type PlatformAdmin = { created_at: string; user_id: string };
type Qualification = Timestamps & { category: RequirementKind; description: string | null; id: string; is_active: boolean; name: string; slug: string };
type QualificationAlias = { alias: string; created_at: string; id: string; normalized_alias: string; qualification_id: string };
type JobRole = Timestamps & { company_id: string; created_by: string | null; description: string; eligibility_threshold: number; employment_type: string | null; id: string; location: string; published_at: string | null; status: JobStatus; title: string };
type JobRequirement = Timestamps & { id: string; job_role_id: string; kind: RequirementKind; mandatory: boolean; minimum_years: number | null; qualification_id: string; weight: number };
type TrainingProvider = Timestamps & { contact_phone: string | null; contact_url: string | null; description: string | null; id: string; is_verified: boolean; location: string; name: string };
type TrainingProgram = Timestamps & { description: string | null; duration_text: string | null; enrollment_url: string | null; id: string; is_active: boolean; name: string; provider_id: string };
type TrainingProgramOutcome = { created_at: string; qualification_id: string; training_program_id: string };
type Resume = { applicant_id: string; byte_size: number; deleted_at: string | null; id: string; mime_type: string; original_filename: string; processed_at: string | null; status: ResumeStatus; storage_path: string; uploaded_at: string };
type ProcessingJob = Timestamps & { applicant_id: string; attempts: number; completed_at: string | null; error_message: string | null; id: string; kind: ProcessingKind; result_summary: Json; resume_id: string | null; started_at: string | null; status: ProcessingStatus };
type ApplicantQualification = Timestamps & { applicant_id: string; confidence: number | null; evidence: string | null; evidence_method: ExtractionMethod | null; evidence_page: number | null; id: string; original_term: string | null; qualification_id: string; resume_id: string | null; review_status: ReviewStatus; source: QualificationSource; years_experience: number | null };
type ApplicantExperience = Timestamps & { applicant_id: string; confidence: number | null; created_at: string; employer: string | null; evidence: string | null; id: string; resume_id: string | null; title: string; updated_at: string; years: number };
type JobMatch = Timestamps & { applicant_id: string; calculated_at: string; id: string; interview_eligible: boolean; job_role_id: string; mandatory_requirements_met: boolean; score: number; status: MatchStatus };
type MatchGap = Timestamps & { id: string; job_requirement_id: string; match_id: string; status: GapStatus };
type CandidateConsent = Timestamps & { applicant_id: string; company_id: string; granted_at: string; id: string; job_role_id: string; revoked_at: string | null; status: ConsentStatus };
type JobFair = Timestamps & { company_id: string; ends_at: string; id: string; location: string; name: string; starts_at: string; status: FairStatus };
type InterviewSlot = { created_at: string; ends_at: string; id: string; job_fair_id: string; starts_at: string };
type InterviewInvitation = { applicant_id: string; created_at: string; expires_at: string | null; id: string; job_fair_id: string; job_role_id: string; status: InvitationStatus };
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
      qualifications: Table<Qualification, InsertOf<Qualification> & Pick<Qualification, "name" | "slug" | "category">, Partial<Qualification>>;
      qualification_aliases: Table<QualificationAlias, InsertOf<QualificationAlias> & Pick<QualificationAlias, "qualification_id" | "alias">, Partial<QualificationAlias>>;
      job_roles: Table<JobRole, InsertOf<JobRole> & Pick<JobRole, "company_id" | "title">, Partial<JobRole>>;
      job_requirements: Table<JobRequirement, InsertOf<JobRequirement> & Pick<JobRequirement, "job_role_id" | "qualification_id" | "kind">, Partial<JobRequirement>>;
      training_providers: Table<TrainingProvider, InsertOf<TrainingProvider> & Pick<TrainingProvider, "name" | "location">, Partial<TrainingProvider>>;
      training_programs: Table<TrainingProgram, InsertOf<TrainingProgram> & Pick<TrainingProgram, "provider_id" | "name">, Partial<TrainingProgram>>;
      training_program_outcomes: Table<TrainingProgramOutcome, InsertOf<TrainingProgramOutcome> & Pick<TrainingProgramOutcome, "training_program_id" | "qualification_id">, Partial<TrainingProgramOutcome>>;
      resumes: Table<Resume, InsertOf<Resume> & Pick<Resume, "applicant_id" | "storage_path" | "original_filename" | "byte_size">, Partial<Resume>>;
      processing_jobs: Table<ProcessingJob, InsertOf<ProcessingJob> & Pick<ProcessingJob, "applicant_id" | "kind">, Partial<ProcessingJob>>;
      applicant_qualifications: Table<ApplicantQualification, InsertOf<ApplicantQualification> & Pick<ApplicantQualification, "applicant_id" | "qualification_id" | "source">, Partial<ApplicantQualification>>;
      applicant_experience: Table<ApplicantExperience, InsertOf<ApplicantExperience> & Pick<ApplicantExperience, "applicant_id" | "title">, Partial<ApplicantExperience>>;
      job_matches: Table<JobMatch, InsertOf<JobMatch> & Pick<JobMatch, "applicant_id" | "job_role_id" | "score" | "mandatory_requirements_met" | "interview_eligible">, Partial<JobMatch>>;
      match_gaps: Table<MatchGap, InsertOf<MatchGap> & Pick<MatchGap, "match_id" | "job_requirement_id">, Partial<MatchGap>>;
      candidate_consents: Table<CandidateConsent, InsertOf<CandidateConsent> & Pick<CandidateConsent, "applicant_id" | "company_id" | "job_role_id">, Partial<CandidateConsent>>;
      job_fairs: Table<JobFair, InsertOf<JobFair> & Pick<JobFair, "company_id" | "name" | "location" | "starts_at" | "ends_at">, Partial<JobFair>>;
      interview_slots: Table<InterviewSlot, InsertOf<InterviewSlot> & Pick<InterviewSlot, "job_fair_id" | "starts_at" | "ends_at">, Partial<InterviewSlot>>;
      interview_invitations: Table<InterviewInvitation, InsertOf<InterviewInvitation> & Pick<InterviewInvitation, "applicant_id" | "job_role_id" | "job_fair_id">, Partial<InterviewInvitation>>;
      interview_bookings: Table<InterviewBooking, InsertOf<InterviewBooking> & Pick<InterviewBooking, "invitation_id" | "interview_slot_id" | "applicant_id">, Partial<InterviewBooking>>;
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_processing_job: { Args: { processing_job_id: string }; Returns: ProcessingJob[] };
      apply_resume_extraction: { Args: { job_id: string; extraction: Json }; Returns: undefined };
      apply_match_recalculation: { Args: { job_id: string }; Returns: undefined };
      get_consented_resume_path: { Args: { target_job_role_id: string; target_resume_id: string }; Returns: string };
      get_consented_candidate_resume_path: { Args: { target_applicant_id: string; target_job_role_id: string }; Returns: string };
      get_consented_candidate_profile: { Args: { target_applicant_id: string; target_job_role_id: string }; Returns: Array<{ full_name: string | null; phone_number: string | null }> };
      fail_processing_job: {
        Args: { processing_job_id: string; safe_error_message: string; terminal_failure?: boolean };
        Returns: undefined;
      };
    };
    Enums: {
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
      consent_status: ConsentStatus;
      fair_status: FairStatus;
      invitation_status: InvitationStatus;
      booking_status: BookingStatus;
      extraction_method: ExtractionMethod;
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
    },
  },
} as const;
