import type { MatchReport } from "@/server/domain/contracts";
import type { AnalysisSession } from "@/server/domain/models";

const sessionStore = new Map<string, AnalysisSession>();
const reportStore = new Map<string, MatchReport>();

export function saveSession(session: AnalysisSession) {
  sessionStore.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string) {
  return sessionStore.get(sessionId) ?? null;
}

export function saveReport(report: MatchReport) {
  reportStore.set(report.report_id, report);
  return report;
}

export function getReport(reportId: string) {
  return reportStore.get(reportId) ?? null;
}
