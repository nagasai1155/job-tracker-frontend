const BASE_URL = '/api'; // Proxied by Vite to http://localhost:5051/api (no CORS!)

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getJobs: async () => {
    const res = await fetch(`${BASE_URL}/jobs`, { headers: authHeaders() });
    return handleResponse(res);
  },

  createJob: async (job) => {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(job),
    });
    return handleResponse(res);
  },

  updateJob: async (id, job) => {
    const res = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(job),
    });
    return handleResponse(res);
  },

  deleteJob: async (id) => {
    const res = await fetch(`${BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
