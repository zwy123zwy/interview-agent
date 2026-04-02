import type { ErrorInfo, SessionStatus } from "@/server/domain/contracts";

export interface AnalysisSession {
  sessionId: string;
  status: SessionStatus;
  resumeAssetId?: string;
  jobId?: string;
  reportId?: string;
  createdAt: string;
  updatedAt: string;
  error?: ErrorInfo | null;
}

export function createSessionSeed(sessionId: string): AnalysisSession {
  const now = new Date().toISOString();

  return {
    sessionId,
    status: "CREATED",
    createdAt: now,
    updatedAt: now,
    error: null,
  };
}
