import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Job, CreateJobPayload } from '../types';
import { StatsBar } from './StatsBar';
import { JobCard } from './JobCard';
import { AddJobModal } from './AddJobModal';

type LoadState = 'loading' | 'success' | 'error';

type AppTab = 'jobs' | 'resume';

interface DashboardProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onNavigate: (page: 'settings') => void;
}

export function Dashboard({ activeTab, onTabChange, onNavigate }: DashboardProps) {
  const { user, logout } = useAuth();
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const avatarUrl =
    user?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'User')}&background=2563eb&color=fff`;

  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Fetch jobs from Spring Boot backend ───────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await api.getJobs();
      setJobs(data);
      setLoadState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setLoadState('error');
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // ── Add job ───────────────────────────────────────────────────────────────
  const handleAddJob = useCallback(async (payload: CreateJobPayload) => {
    const saved = await api.createJob(payload);
    setJobs(prev => [saved, ...prev]);
  }, []);

  // ── Delete job ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await api.deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch {
      alert('Failed to delete. Is the backend running?');
    }
  }, []);

  // ── Grid content ─────────────────────────────────────────────────────────
  const renderGrid = () => {
    if (loadState === 'loading') {
      return (
        <div className="spinner-wrap">
          <div className="spinner" />
          Connecting to backend…
        </div>
      );
    }
    if (loadState === 'error') {
      return (
        <div className="error-state">
          <strong>⚠️ Failed to connect to backend.</strong>
          <code>{errorMsg}</code>
          <p style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
            Make sure Spring Boot is running on{' '}
            <strong>http://localhost:5051</strong>
          </p>
          <button className="btn" style={{ marginTop: '1rem' }} onClick={loadJobs}>
            Retry
          </button>
        </div>
      );
    }
    if (jobs.length === 0) {
      return (
        <div className="empty-state">
          <p>No applications yet.<br />Hit <strong>Add Job</strong> to start tracking! 🚀</p>
        </div>
      );
    }
    if (filteredJobs.length === 0) {
      return (
        <div className="empty-state">
          <p>No applications match your search for "<strong>{searchTerm}</strong>".<br />Try adjusting your search terms! 🔍</p>
        </div>
      );
    }
    return filteredJobs.map(job => (
      <JobCard key={job.id} job={job} onDelete={handleDelete} />
    ));
  };

  return (
    <div className="dashboard">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">💼</div>
          <h1>Job Tracker Pro</h1>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" id="mainNavTabs">
          <button
            className={`nav-tab ${activeTab === 'jobs' ? 'nav-tab-active' : ''}`}
            onClick={() => onTabChange('jobs')}
            id="navTabJobs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            Job Tracker
          </button>
          <button
            className={`nav-tab ${activeTab === 'resume' ? 'nav-tab-active' : ''}`}
            onClick={() => onTabChange('resume')}
            id="navTabResume"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Resume Builder
          </button>
        </nav>

        <div className="user-profile">
          <span className="user-name">{user?.name ?? 'User'}</span>
          <img src={avatarUrl} alt={`${user?.name ?? 'User'} avatar`} />
          <button
            className="settings-icon-btn"
            id="settingsNavBtn"
            onClick={() => onNavigate('settings')}
            title="Profile & Settings"
            aria-label="Open profile settings"
          >
            ⚙️
          </button>
          <button className="btn btn-outline" id="logoutBtn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Stats Bar */}
        <div className="stats-bar">
          <StatsBar jobs={jobs} />
        </div>

        {/* Controls */}
        <div className="controls">
          <h2>
            {loadState === 'loading' ? (
              'Applications (…)'
            ) : searchTerm ? (
              <>
                Applications <span className="controls-count">({filteredJobs.length} of {jobs.length})</span>
              </>
            ) : (
              <>
                Applications <span className="controls-count">({jobs.length})</span>
              </>
            )}
          </h2>

          <div className="controls-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-btn" onClick={() => setSearchTerm('')} aria-label="Clear search">
                  &times;
                </button>
              )}
            </div>

            <button className="btn" id="addJobBtn" onClick={() => setModalOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Job
            </button>
          </div>
        </div>

        {/* Job Grid */}
        <div className="job-grid">{renderGrid()}</div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <AddJobModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddJob}
      />
    </div>
  );
}
