import type { MatchReport } from "@/server/domain/contracts";
import { createSessionSeed, type AnalysisSession } from "@/server/domain/models";
import { createId } from "@/server/infrastructure/ids";
import {
  getReport,
  getSession,
  saveReport,
  saveSession,
} from "@/server/infrastructure/store/memory-store";

function createMockReport(sessionId: string): MatchReport {
  const reportId = createId("rep");
  const jobId = createId("job");
  const candidateId = createId("cand");

  return {
    report_id: reportId,
    session_id: sessionId,
    candidate_id: candidateId,
    job_id: jobId,
    score_total: 78,
    score_breakdown: [
      {
        dimension: "skills",
        score: 82,
        reason: "Java 和 Spring 证据较充分，但容器化经验待确认。",
      },
      {
        dimension: "experience",
        score: 75,
        reason: "年限基本匹配，但系统规模信息仍然有限。",
      },
      {
        dimension: "projects",
        score: 79,
        reason: "有性能优化项目经历，但缺少监控治理细节。",
      },
    ],
    strengths: [
      {
        point: "Java 后端经验较扎实",
        evidence: ["Spring Boot 项目经历", "接口性能优化结果"],
      },
    ],
    gaps: [
      {
        point: "Kubernetes 经验不足",
        impact: "会影响部署与运维协作效率",
        suggestion: "后续在面试中补问容器化与 CI/CD 实践",
      },
    ],
    suggested_questions: [
      {
        topic: "缓存一致性",
        question: "你如何处理缓存与数据库一致性，请结合真实项目说明。",
        why: "岗位关注高并发与一致性设计。",
      },
      {
        topic: "系统扩展性",
        question: "订单量翻倍后你会先改哪些服务和存储层设计？",
        why: "用于验证候选人的架构演进能力。",
      },
    ],
    assumptions: ["当前报告为内存原型数据，用于打通会话与报告链路。"],
    created_at: new Date().toISOString(),
    model_trace: {
      llm_provider: "mock",
      llm_model: "mock-model",
      prompt_version: "v0",
    },
  };
}

export function createSession(): AnalysisSession {
  const session = createSessionSeed(createId("sess"));
  return saveSession(session);
}

export function findSession(sessionId: string) {
  return getSession(sessionId);
}

export function runSession(sessionId: string) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  const runningSession: AnalysisSession = {
    ...session,
    status: "RUNNING",
    updatedAt: new Date().toISOString(),
  };
  saveSession(runningSession);

  const report = createMockReport(sessionId);
  saveReport(report);

  const succeededSession: AnalysisSession = {
    ...runningSession,
    status: "SUCCEEDED",
    jobId: report.job_id,
    reportId: report.report_id,
    updatedAt: new Date().toISOString(),
  };
  saveSession(succeededSession);

  return {
    session: succeededSession,
    report,
  };
}

export function findReport(reportId: string) {
  return getReport(reportId);
}
