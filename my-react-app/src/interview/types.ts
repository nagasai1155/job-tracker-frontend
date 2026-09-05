// ─── Interview Domain Types ──────────────────────────────────────────────────

export type InterviewType = 'coding' | 'technical' | 'hr' | 'behavioral' | 'mixed';
export type SeniorityLevel = 'junior' | 'mid' | 'senior';
export type InterviewDuration = 10 | 20 | 30;

export interface InterviewTrackMeta {
  id: 'coding' | 'technical' | 'hr';
  title: string;
  badge: string;
  badgeClass: string;
  description?: string;
  subtitle?: string;
  icon: string;
  features?: string[];
}

export const INTERVIEW_TRACKS: InterviewTrackMeta[] = [
  {
    id: 'coding',
    title: 'Coding Interview',
    badge: 'Live Code Editor',
    badgeClass: 'iv-badge-coding',
    subtitle: 'Data structures, algorithms & coding challenges',
    description: 'Data structures, algorithms & coding challenges',
    icon: '💻',
  },
  {
    id: 'technical',
    title: 'Technical Interview',
    badge: 'System Design',
    badgeClass: 'iv-badge-technical',
    subtitle: 'System architecture, backend & core concepts',
    description: 'System architecture, backend & core concepts',
    icon: '⚡',
  },
  {
    id: 'hr',
    title: 'HR Interview',
    badge: 'Behavioral',
    badgeClass: 'iv-badge-hr',
    subtitle: 'Culture fit, teamwork & situational scenarios',
    description: 'Culture fit, teamwork & situational scenarios',
    icon: '🤝',
  },
];

export interface InterviewConfig {
  role: string;
  resumeText: string;
  interviewType: InterviewType;
  seniority: SeniorityLevel;
  duration: InterviewDuration;
}

export interface TranscriptEntry {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
  isCodeQuestion?: boolean;
  codeSubmission?: string;
  codeLanguage?: string;
}

export interface InterviewSummaryResult {
  strengths: string[];
  weaknesses: string[];
  score: number; // 1–10
  suggestions: string[];
  overallFeedback: string;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  transcript: TranscriptEntry[];
  summary: InterviewSummaryResult | null;
  startedAt: number;
  endedAt: number | null;
}

// ─── Interview Flow State ────────────────────────────────────────────────────

export type InterviewPhase = 'history' | 'setup' | 'session' | 'summary';

export type SessionState =
  | 'waiting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'coding'
  | 'ended';

// ─── Constants ───────────────────────────────────────────────────────────────

export const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: 'coding', label: 'Coding Interview' },
  { value: 'technical', label: 'Technical Interview' },
  { value: 'hr', label: 'HR Interview' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'mixed', label: 'Mixed' },
];

export const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
];

export const DURATION_OPTIONS: { value: InterviewDuration; label: string }[] = [
  { value: 10, label: '10 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
];

export const CODE_QUESTION_MARKER = '[CODE_QUESTION]';

export const INTERVIEW_STORAGE_KEY = 'interview_history';
