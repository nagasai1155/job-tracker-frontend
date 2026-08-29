import { Job, CreateJobPayload } from './types';
import { ResumeData, sanitizeResumeData } from './resume/types';

// CRA proxy forwards /api → http://localhost:5051/api (no CORS needed)
//const BASE_URL = 'https://job-tracker-backend-1-0ri4.onrender.com/api';
const BASE_URL = 'http://localhost:5051/api';

let authToken: string = '';

export function setAuthToken(token: string): void {
  authToken = token;
}

function getStoredToken(): string {
  if (authToken) return authToken;
  try {
    return localStorage.getItem('authToken') || '';
  } catch {
    return '';
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T | null> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

function parseJsonArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

// Multi-endpoint fetch helper that attempts primary URL and falls back to proxy / render
async function fetchWithFallback(
  path: string,
  options: RequestInit
): Promise<Response> {
  const urlsToTry = [
    `${BASE_URL}${path}`,
    `/api${path}`,
    `https://job-tracker-backend-1-0ri4.onrender.com/api${path}`,
  ];

  let lastError: any = null;
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status === 400 || res.status === 401 || res.status === 403 || res.status === 422) {
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Backend server is unreachable');
}

export const resumeApi = {
  saveResume: async (data: ResumeData): Promise<ResumeData> => {
    // Save to local cache immediately so changes are never lost
    try {
      localStorage.setItem('cached_resume_data', JSON.stringify(data));
    } catch { }

    const payload = {
      fullName: data.fullName || '',
      title: data.title || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      linkedin: data.linkedin || '',
      github: data.github || '',
      portfolio: data.portfolio || '',
      summary: data.summary || '',
      experience: data.experience || [],
      education: data.education || [],
      skills: data.skills || [],
      projects: data.projects || [],
      certifications: data.certifications || [],
      sectionOrder: data.sectionOrder || [],
      experienceJson: JSON.stringify(data.experience || []),
      educationJson: JSON.stringify(data.education || []),
      skillsJson: JSON.stringify(data.skills || []),
      projectsJson: JSON.stringify(data.projects || []),
      certificationsJson: JSON.stringify(data.certifications || []),
      sectionOrderJson: JSON.stringify(data.sectionOrder || []),
    };

    const res = await fetchWithFallback('/resume', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse<any>(res);
    if (!result) return data;

    return sanitizeResumeData({
      fullName: result.fullName || data.fullName,
      title: result.title || data.title,
      email: result.email || data.email,
      phone: result.phone || data.phone,
      location: result.location || data.location,
      linkedin: result.linkedin || data.linkedin,
      github: result.github || data.github,
      portfolio: result.portfolio || data.portfolio,
      summary: result.summary || data.summary,
      experience: parseJsonArray(result.experienceJson ?? result.experience) || data.experience,
      education: parseJsonArray(result.educationJson ?? result.education) || data.education,
      skills: parseJsonArray(result.skillsJson ?? result.skills) || data.skills,
      projects: parseJsonArray(result.projectsJson ?? result.projects) || data.projects,
      certifications: parseJsonArray(result.certificationsJson ?? result.certifications) || data.certifications,
      sectionOrder: parseJsonArray(result.sectionOrderJson ?? result.sectionOrder) || data.sectionOrder,
    });
  },

  getResume: async (): Promise<ResumeData | null> => {
    try {
      const res = await fetchWithFallback('/resume', { headers: authHeaders() });
      const result = await handleResponse<any>(res);
      if (result) {
        const parsed = sanitizeResumeData({
          fullName: result.fullName || '',
          title: result.title || '',
          email: result.email || '',
          phone: result.phone || '',
          location: result.location || '',
          linkedin: result.linkedin || '',
          github: result.github || '',
          portfolio: result.portfolio || '',
          summary: result.summary || '',
          experience: parseJsonArray(result.experienceJson ?? result.experience),
          education: parseJsonArray(result.educationJson ?? result.education),
          skills: parseJsonArray(result.skillsJson ?? result.skills),
          projects: parseJsonArray(result.projectsJson ?? result.projects),
          certifications: parseJsonArray(result.certificationsJson ?? result.certifications),
          sectionOrder: parseJsonArray(result.sectionOrderJson ?? result.sectionOrder),
        });
        localStorage.setItem('cached_resume_data', JSON.stringify(parsed));
        return parsed;
      }
    } catch {
      // Fallback to locally cached data
      try {
        const cached = localStorage.getItem('cached_resume_data');
        if (cached) {
          return sanitizeResumeData(JSON.parse(cached));
        }
      } catch { }
    }
    return null;
  },

  parseResumePdf: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithFallback('/resume/parse', {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<any>(res);
  },
};

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

  // ── Resume API ──────────────────────────────────────────────────────────────
  saveResume: resumeApi.saveResume,
  getResume: resumeApi.getResume,
  parseResumePdf: resumeApi.parseResumePdf,
};

