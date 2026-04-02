export type SessionStatus =
  | "CREATED"
  | "UPLOADED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type Seniority = "junior" | "mid" | "senior" | "lead";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface CandidateProfile {
  candidate_id: string;
  source: {
    resume_asset_id: string;
    resume_sha256?: string;
    language: string;
  };
  basic: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary: {
    title_guess?: string;
    years_total?: number;
    strengths: string[];
    risks: string[];
  };
  skills: Array<{
    name: string;
    level: SkillLevel;
    years?: number;
    evidence: string[];
    confidence: number;
  }>;
}

export interface JobSpec {
  job_id: string;
  source: {
    jd_text_sha256?: string;
    language: string;
  };
  title: string;
  seniority: Seniority;
  must_have: Array<{
    name: string;
    weight: number;
    requirements: string[];
    evidence_hint?: string[];
  }>;
  nice_to_have: Array<{
    name: string;
    weight: number;
    requirements: string[];
  }>;
  responsibilities: string[];
  interview_focus: string[];
}

export interface MatchReport {
  report_id: string;
  session_id: string;
  candidate_id: string;
  job_id: string;
  score_total: number;
  score_breakdown: Array<{
    dimension: "skills" | "experience" | "projects" | "education" | "other";
    score: number;
    reason: string;
  }>;
  strengths: Array<{
    point: string;
    evidence: string[];
  }>;
  gaps: Array<{
    point: string;
    impact: string;
    suggestion: string;
  }>;
  suggested_questions: Array<{
    topic: string;
    question: string;
    why: string;
  }>;
  assumptions: string[];
  created_at: string;
  model_trace: {
    llm_provider: string;
    llm_model: string;
    prompt_version: string;
  };
}

export interface ErrorInfo {
  error_code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, string>;
}
