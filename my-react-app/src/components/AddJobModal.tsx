import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { CreateJobPayload, JobStatus } from '../types';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
  initialStatus?: JobStatus;
}

const JOB_STATUS_CONFIG: { status: JobStatus; label: string; desc: string; colorClass: string }[] = [
  { status: 'Applied', label: 'Applied', desc: 'Application submitted', colorClass: 'status-opt-applied' },
  { status: 'Interview', label: 'Interview', desc: 'Screening / round scheduled', colorClass: 'status-opt-interview' },
  { status: 'Offer', label: 'Offer', desc: 'Job offer received', colorClass: 'status-opt-offer' },
  { status: 'Rejected', label: 'Rejected', desc: 'Archived / not selected', colorClass: 'status-opt-rejected' },
];

export function AddJobModal({ isOpen, onClose, onSubmit, initialStatus = 'Applied' }: AddJobModalProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setCompany('');
    setStatus('Applied');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), company: company.trim(), status });
      reset();
      onClose();
    } catch {
      alert('Failed to save job. Is the backend server running?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-content add-job-modal-content">
        <div className="modal-header-custom">
          <div className="modal-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div>
            <h2 className="modal-title">Track New Application</h2>
            <p className="modal-subtitle">Add a role to keep your search pipeline organized</p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
            disabled={saving}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="jobTitle">
              Job Title <span className="req-star">*</span>
            </label>
            <input
              id="jobTitle"
              ref={titleInputRef}
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobCompany">
              Company Name <span className="req-star">*</span>
            </label>
            <input
              id="jobCompany"
              type="text"
              required
              placeholder="e.g. Stripe, Google, Linear"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Current Status</label>
            <div className="status-selector-grid">
              {JOB_STATUS_CONFIG.map((cfg) => {
                const isSelected = status === cfg.status;
                return (
                  <button
                    key={cfg.status}
                    type="button"
                    className={`status-opt-card ${cfg.colorClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setStatus(cfg.status)}
                    disabled={saving}
                  >
                    <div className="status-opt-header">
                      <span className="status-opt-dot" />
                      <span className="status-opt-label">{cfg.label}</span>
                    </div>
                    <span className="status-opt-desc">{cfg.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-gradient"
              disabled={saving || !title.trim() || !company.trim()}
            >
              {saving ? (
                <>
                  <div className="btn-spinner" />
                  <span>Adding…</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Add Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
