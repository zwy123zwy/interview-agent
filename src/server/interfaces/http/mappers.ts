import type { AnalysisSession } from "@/server/domain/models";
import type { SessionResponseDto } from "@/server/interfaces/http/dto";

export function toSessionResponse(session: AnalysisSession): SessionResponseDto {
  return {
    session_id: session.sessionId,
    status: session.status,
    resume_asset_id: session.resumeAssetId,
    job_id: session.jobId,
    report_id: session.reportId,
    error: session.error,
  };
}
