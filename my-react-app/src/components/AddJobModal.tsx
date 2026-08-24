import React, { useState, FormEvent } from 'react';
import { CreateJobPayload, JobStatus } from '../types';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
}

const JOB_STATUSES: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

export function AddJobModal({ isOpen, onClose, onSubmit }: AddJobModalProps) {
  const [title, setTitle]     = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus]   = useState<JobStatus>('Applied');
  const [saving, setSaving]   = useState(false);

  if (!isOpen) return null;

  const reset = () => { setTitle(''); setCompany(''); setStatus('Applied'); };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), company: company.trim(), status });
      reset();
      onClose();
    } catch {
      alert('Failed to save job. Is the backend running on port 5051?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>Add New Application</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="jobTitle">Job Title</label>
            <input
              id="jobTitle"
              type="text"
              required
              placeholder="e.g. Frontend Developer"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="jobCompany">Company</label>
            <input
              id="jobCompany"
              type="text"
              required
              placeholder="e.g. Google"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="jobStatus">Status</label>
            <select
              id="jobStatus"
              value={status}
              onChange={e => setStatus(e.target.value as JobStatus)}
            >
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
