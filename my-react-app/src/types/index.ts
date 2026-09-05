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
  login: (credential: string) => void;
  logout: () => void;
}

export type AppTab = 'dashboard' | 'jobs' | 'resume' | 'interview';

export function getDisplayName(name?: string, email?: string): string {
  if (name && name.trim() && name !== 'Google User') {
    return name.trim();
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return 'Nagasai';
}
