import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onDelete: (id: number) => void;
  onUpdateStatus?: (id: number, status: any) => void;
  onStatusChange?: (id: number, status: any) => void;
  onTabChange?: (tab: any) => void;
}

export function JobCard({ job, onDelete }: JobCardProps) {
  const appliedDate = job.date
    ? new Date(job.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="job-card" data-status={job.status}>
      <div className="job-header">
        <div>
          <div className="job-title">{job.title}</div>
          <div className="job-company">{job.company}</div>
        </div>
        <span className={`job-status status-${job.status}`}>{job.status}</span>
      </div>
      <div className="job-footer">
        <span>📅 {appliedDate}</span>
        <button
          className="btn-delete"
          title="Delete application"
          aria-label={`Delete ${job.title} at ${job.company}`}
          onClick={() => onDelete(job.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
