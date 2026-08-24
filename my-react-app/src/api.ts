import { Job, CreateJobPayload } from './types';

// CRA proxy forwards /api → http://localhost:5051/api (no CORS needed)
const BASE_URL = '/api';

let authToken: string = '';

export function setAuthToken(token: string): void {
  authToken = token;
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T | null> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

export const api = {
  getJobs: async (): Promise<Job[]> => {
    const res = await fetch(`${BASE_URL}/jobs`, { headers: authHeaders() });
    return (await handleResponse<Job[]>(res)) ?? [];
  },

  createJob: async (payload: CreateJobPayload): Promise<Job> => {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await handleResponse<Job>(res);
    if (!result) throw new Error('No job returned from server');
    return result;
  },

  updateJob: async (id: number, payload: Partial<CreateJobPayload>): Promise<Job> => {
    const res = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await handleResponse<Job>(res);
    if (!result) throw new Error('No job returned from server');
    return result;
  },

  deleteJob: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse<null>(res);
  },
};
