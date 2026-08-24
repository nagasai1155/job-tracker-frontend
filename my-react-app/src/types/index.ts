// ─── Domain Types ─────────────────────────────────────────────────────────────

export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: number;
  title: string;
  company: string;
  status: JobStatus;
  date?: string;
}

export interface CreateJobPayload {
  title: string;
  company: string;
  status: JobStatus;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
  picture?: string;
}

export interface AuthContextValue {
  user: User | null;
  login: (credential: string, isMock?: boolean) => void;
  logout: () => void;
}
