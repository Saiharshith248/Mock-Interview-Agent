export type InterviewType = "technical" | "behavioral" | "system_design" | "mixed";

/** Required: targetRole, jobDescription. Everything else is optional (interviewType defaults to "mixed"). */
export type CandidateProfile = {
  targetRole: string;
  jobDescription: string;
  company?: string;
  interviewType?: InterviewType;
  experienceYears?: number;
  experienceType?: string;
  /** Interview length; the backend defaults to 15 and derives the question count (~3 min each). */
  durationMinutes?: number;
  resumeText?: string;
};

export type SessionStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "error"
  | "done";

export type TranscriptLine = {
  id: string;
  role: "user" | "ava";
  text: string;
  final: boolean;
};

export type PastedKind = "JOB_DESCRIPTION" | "RESUME";

/** Result of the intake handoff (POST /api/interview/start). */
export type InterviewStart = {
  token: string;
  model: string;
  expiresAt: string;
  durationMinutes: number;
  plan: { questions: { question: string; focus: string; follow_up: string }[] };
};

export type Report = {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  question_feedback: string[];
  next_steps: string[];
  resources: { title: string; kind: string; why: string; search_query: string }[];
};

/** Contract between the UI and the Live API session (owned by teammate). */
export type LiveSession = {
  status: SessionStatus;
  transcript: TranscriptLine[];
  profile: Partial<CandidateProfile>;
  error?: string;
  /** Set once submit_profile fired and the backend prepared the interview. */
  interview?: InterviewStart;
  start: () => Promise<void>;
  stop: () => void;
  sendPasted: (kind: PastedKind, text: string) => void;
  /** Loudness (0..1) of whoever is talking right now, for animating the orb. Optional. */
  audioLevel?: () => number;
};
