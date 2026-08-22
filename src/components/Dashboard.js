import { state } from '../state.js';
import { logout } from '../auth.js';
import { JobCard } from './JobCard.js';
import { AddJobModal } from './AddJobModal.js';
import { api } from '../api.js';

/**
 * Renders the full dashboard with stats, job grid, and modal.
 */
export function renderDashboard(container) {
  const avatarUrl = state.user.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.name)}&background=2563eb&color=fff`;

  container.innerHTML = `
    <div class="dashboard">

      <!-- Header / Navbar -->
      <header class="header">
        <div class="header-brand">
          <div class="brand-icon">💼</div>
          <h1>Job Tracker Pro</h1>
        </div>
        <div class="user-profile">
          <span class="user-name">${state.user.name || 'User'}</span>
          <img src="${avatarUrl}" alt="${state.user.name} profile picture">
          <button class="btn btn-outline" id="logoutBtn">Logout</button>
        </div>
      </header>

      <!-- Stats Bar -->
      <div class="stats-bar">
        ${renderStats()}
      </div>

      <!-- Controls -->
      <div class="controls">
        <h2>Applications (Loading...)</h2>
        <button class="btn" id="addJobBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Job
        </button>
      </div>

      <!-- Job Grid -->
      <div class="job-grid" id="jobGrid">
        <div class="empty-state">
           <p>Connecting to backend... 🔄</p>
        </div>
      </div>

      <!-- Add Job Modal -->
      ${AddJobModal()}
    </div>
  `;

  attachEventListeners(container);
  loadJobsFromBackend(container);
}

/**
 * Fetches jobs from the Spring Boot backend and refreshes the grid.
 */
async function loadJobsFromBackend(container) {
  try {
    const jobs = await api.getJobs();
    state.jobs = jobs; // Replace mock data with real data!
    refreshGrid(container);
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    container.querySelector('#jobGrid').innerHTML = `
      <div class="empty-state" style="color: #be123c; border-color: #fca5a5; background: #fff1f2;">
        <p>⚠️ <strong>Failed to connect to backend.</strong></p>
        <p style="font-size: 0.82rem; margin-top: 0.5rem; font-family: monospace;">${error.message}</p>
        <p style="font-size: 0.8rem; margin-top: 0.75rem; color: #9f1239;">Check browser Console (F12) for details.</p>
      </div>
    `;
    container.querySelector('.controls h2').textContent = `Applications (Error)`;
  }
}

/**
 * Renders the 4 stat summary cards.
 */
function renderStats() {
  const counts = {
    Applied: 0, Interview: 0, Offer: 0, Rejected: 0
  };
  state.jobs.forEach(j => {
    if (counts[j.status] !== undefined) counts[j.status]++;
  });

  return `
    <div class="stat-card">
      <div class="stat-label">Total</div>
      <div class="stat-value">${state.jobs.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Applied</div>
      <div class="stat-value" style="color:var(--status-applied-text)">${counts.Applied}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Interview</div>
      <div class="stat-value" style="color:var(--status-interview-text)">${counts.Interview}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Offers</div>
      <div class="stat-value" style="color:var(--status-offer-text)">${counts.Offer}</div>
    </div>
  `;
}

/**
 * Renders the job grid content.
 */
function renderJobGrid() {
  if (state.jobs.length === 0) {
    return `
      <div class="empty-state">
        <p>No applications yet. Hit <strong>Add Job</strong> to start tracking!</p>
      </div>
    `;
  }
  return state.jobs.map(job => JobCard(job)).join('');
}

/**
 * Attaches all event listeners for the dashboard.
 */
function attachEventListeners(container) {
  const modal = container.querySelector('#jobModal');

  container.querySelector('#logoutBtn').addEventListener('click', logout);

  container.querySelector('#addJobBtn').addEventListener('click', () => {
    modal.classList.add('active');
  });

  container.querySelector('#closeModalBtn').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Add job form submit
  const form = container.querySelector('#addJobForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
      const newJob = {
        title: container.querySelector('#jobTitle').value.trim(),
        company: container.querySelector('#jobCompany').value.trim(),
        status: container.querySelector('#jobStatus').value
      };
      
      // Call Spring Boot backend
      const savedJob = await api.createJob(newJob);
      
      state.jobs.unshift(savedJob);
      modal.classList.remove('active');
      e.target.reset();
      refreshGrid(container);
    } catch (error) {
      alert("Failed to save job to backend. Is the server running?");
      console.error(error);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  attachDeleteListeners(container);
}

/**
 * Refreshes just the grid and stats without full re-render.
 */
function refreshGrid(container) {
  container.querySelector('#jobGrid').innerHTML = renderJobGrid();
  container.querySelector('.stats-bar').innerHTML = renderStats();
  container.querySelector('.controls h2').textContent = `Applications (${state.jobs.length})`;
  attachDeleteListeners(container);
}

/**
 * Attaches delete listeners to each job card.
 */
function attachDeleteListeners(container) {
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      
      if (confirm("Are you sure you want to delete this job?")) {
        try {
          await api.deleteJob(id); // Tell Spring Boot to delete it
          state.jobs = state.jobs.filter(j => j.id !== id);
          refreshGrid(container);
        } catch (error) {
           alert("Failed to delete from backend.");
           console.error(error);
        }
      }
    });
  });
}
