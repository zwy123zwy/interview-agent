import type {
  ErrorInfo,
  MatchReport,
  SessionStatus,
} from "@/server/domain/contracts";

export interface CreateSessionRequestDto {
  client_request_id?: string;
}

export interface SessionResponseDto {
  session_id: string;
  status: SessionStatus;
  resume_asset_id?: string;
  job_id?: string;
  report_id?: string;
  error?: ErrorInfo | null;
}

export interface RunSessionRequestDto {
  mode?: "mvp_pipeline_v1";
}

export interface RunSessionResponseDto {
  status: SessionStatus;
  report: Pick<MatchReport, "report_id" | "score_total">;
}
