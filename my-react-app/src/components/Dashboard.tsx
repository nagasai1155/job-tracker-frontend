import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../api';
import { Job, JobStatus, CreateJobPayload } from '../types';
import { StatsBar } from './StatsBar';
import { JobCard } from './JobCard';
import { AddJobModal } from './AddJobModal';

type LoadState = 'loading' | 'success' | 'error';
type AppTab = 'jobs' | 'resume';
type ViewMode = 'grid' | 'board' | 'list';
type SortOption = 'newest' | 'oldest' | 'company' | 'status';

interface DashboardProps {
  onNavigate: (page: 'settings') => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

const STATUSES: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // ── Keyboard shortcut: "/" to focus search ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Fetch jobs ─────────────────────────────────────────────────────────────
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

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // ── Add job ────────────────────────────────────────────────────────────────
  const handleAddJob = useCallback(async (payload: CreateJobPayload) => {
    const saved = await api.createJob(payload);
    setJobs((prev) => [saved, ...prev]);
    showToast(`Added application for ${saved.company}`);
  }, [showToast]);

  // ── Update status ──────────────────────────────────────────────────────────
  const handleUpdateStatus = useCallback(async (id: number, newStatus: JobStatus) => {
    const prevJobs = [...jobs];
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
    );
    try {
      await api.updateJob(id, { status: newStatus });
      showToast(`Status changed to ${newStatus}`);
    } catch {
      setJobs(prevJobs);
      showToast('Could not update status. Server unreachable.');
    }
  }, [jobs, showToast]);

  // ── Delete job ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: number) => {
    const jobToDelete = jobs.find((j) => j.id === id);
    if (!window.confirm(`Delete application for ${jobToDelete?.company || 'this role'}?`)) return;

    const prevJobs = [...jobs];
    setJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      await api.deleteJob(id);
      showToast('Application deleted');
    } catch {
      setJobs(prevJobs);
      showToast('Could not delete application');
    }
  }, [jobs, showToast]);

  // ── Processed Jobs ─────────────────────────────────────────────────────────
  const processedJobs = useMemo(() => {
    let list = jobs.filter((j) => {
      const matchSearch =
        j.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || j.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'oldest') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      }
      const dateA = a.date ? new Date(a.date).getTime() : a.id;
      const dateB = b.date ? new Date(b.date).getTime() : b.id;
      return dateB - dateA;
    });

    return list;
  }, [jobs, searchTerm, statusFilter, sortBy]);

  // ── Status counts ──────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<JobStatus | 'All', number> = {
      All: jobs.length,
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    jobs.forEach((j) => {
      if (j.status in counts) counts[j.status]++;
    });
    return counts;
  }, [jobs]);

  // ── Board View ─────────────────────────────────────────────────────────────
  const renderBoard = () => (
    <div className="clean-board-layout">
      {STATUSES.map((st) => {
        const colJobs = processedJobs.filter((j) => j.status === st);
        return (
          <div key={st} className="clean-board-col">
            <div className="board-col-header">
              <div className="board-col-title-wrap">
                <span className={`clean-dot status-${st}`} />
                <span className="board-col-name">{st}</span>
              </div>
              <span className="board-col-count">{colJobs.length}</span>
            </div>

            <div className="board-cards-stack">
              {colJobs.length === 0 ? (
                <div className="board-empty-placeholder">No applications</div>
              ) : (
                colJobs.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Table View ─────────────────────────────────────────────────────────────
  const renderList = () => (
    <div className="clean-table-container">
      <table className="clean-table">
        <thead>
          <tr>
            <th>Company & Role</th>
            <th>Status</th>
            <th>Date Added</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {processedJobs.map((j) => (
            <tr key={j.id}>
              <td>
                <div className="table-role-block">
                  <span className="table-role-title">{j.title}</span>
                  <span className="table-role-company">{j.company}</span>
                </div>
              </td>
              <td>
                <span className={`clean-status-pill status-${j.status}`}>
                  <span className="clean-dot" />
                  {j.status}
                </span>
              </td>
              <td className="table-text-muted">
                {j.date ? new Date(j.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="clean-delete-btn"
                  title="Delete"
                  onClick={() => handleDelete(j.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="app-toast">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Main Workspace ───────────────────────────────────────────────── */}
      <main className="app-main-content">
        {/* Top: Section Header */}
        <section className="dashboard-hero-row">
          <div>
            <h1 className="hero-page-title">Overview</h1>
            <p className="hero-page-subtitle">Track and manage your applications in one clean workspace</p>
          </div>

          <button className="clean-primary-btn" onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Application</span>
          </button>
        </section>

        {/* Section: Metrics */}
        <section className="dashboard-stats-wrapper">
          <StatsBar
            jobs={jobs}
            activeFilter={statusFilter}
            onFilterChange={(f) => setStatusFilter(f)}
          />
        </section>

        {/* Section: Filter and Controls Bar */}
        <section className="clean-toolbar">
          {/* Status Filters */}
          <div className="clean-filter-group">
            <button
              className={`clean-filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              All <span className="clean-count-badge">{statusCounts.All}</span>
            </button>
            {STATUSES.map((st) => (
              <button
                key={st}
                className={`clean-filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                <span className={`clean-dot status-${st}`} />
                {st} <span className="clean-count-badge">{statusCounts[st]}</span>
              </button>
            ))}
          </div>

          {/* Search, Sort, View mode */}
          <div className="clean-tools-group">
            <div className="clean-search-input-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search-x" onClick={() => setSearchTerm('')}>
                  &times;
                </button>
              )}
            </div>

            <select
              className="clean-select-box"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="company">Company (A-Z)</option>
              <option value="status">Status</option>
            </select>

            <div className="clean-view-switch">
              <button
                className={`view-switch-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                className={`view-switch-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
                title="Board"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="5" height="18" rx="1" />
                  <rect x="10" y="3" width="5" height="13" rx="1" />
                  <rect x="17" y="3" width="5" height="16" rx="1" />
                </svg>
              </button>
              <button
                className={`view-switch-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Section: Application Results */}
        <section className="dashboard-results-area">
          {loadState === 'loading' && (
            <div className="clean-skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="clean-skeleton-card" />
              ))}
            </div>
          )}

          {loadState === 'error' && (
            <div className="clean-error-card">
              <p>⚠️ Failed to load applications from server ({errorMsg})</p>
              <button className="clean-primary-btn" onClick={loadJobs}>Retry</button>
            </div>
          )}

          {loadState === 'success' && jobs.length === 0 && (
            <div className="clean-empty-state">
              <div className="empty-state-round-icon">💼</div>
              <h3>No applications tracked yet</h3>
              <p>Start keeping track of your job applications, interviews, and offers.</p>
              <button className="clean-primary-btn" onClick={() => setModalOpen(true)}>
                Add First Application
              </button>
            </div>
          )}

          {loadState === 'success' && jobs.length > 0 && processedJobs.length === 0 && (
            <div className="clean-empty-state">
              <div className="empty-state-round-icon">🔍</div>
              <h3>No matches found</h3>
              <p>Try adjusting your search keywords or filter status.</p>
              <button
                className="clean-secondary-btn"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {loadState === 'success' && processedJobs.length > 0 && (
            <>
              {viewMode === 'board' && renderBoard()}
              {viewMode === 'list' && renderList()}
              {viewMode === 'grid' && (
                <div className="clean-cards-grid">
                  {processedJobs.map((j) => (
                    <JobCard
                      key={j.id}
                      job={j}
                      onDelete={handleDelete}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <AddJobModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddJob}
      />
    </>
  );
}
