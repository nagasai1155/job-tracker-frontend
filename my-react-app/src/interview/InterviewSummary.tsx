import React from 'react';
import { InterviewSession } from './types';

interface InterviewSummaryProps {
  session: InterviewSession;
  onNewInterview: () => void;
  onViewHistory: () => void;
}

export function InterviewSummary({ session, onNewInterview, onViewHistory }: InterviewSummaryProps) {
  const { summary, config, transcript } = session;

  if (!summary) {
    return (
      <div className="iv-summary iv-summary-loading">
        <div className="iv-summary-spinner-wrap">
          <span className="iv-spinner-lg" />
          <h2>Analyzing your interview...</h2>
          <p>Our AI is evaluating your performance. This may take a moment.</p>
        </div>
      </div>
    );
  }

  const scoreColor =
    summary.score >= 8
      ? '#22c55e'
      : summary.score >= 6
      ? '#f59e0b'
      : summary.score >= 4
      ? '#f97316'
      : '#ef4444';

  const scoreLabel =
    summary.score >= 8
      ? 'Excellent'
      : summary.score >= 6
      ? 'Good'
      : summary.score >= 4
      ? 'Needs Improvement'
      : 'Needs Work';

  // SVG arc for score circle
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (summary.score / 10) * circumference;

  return (
    <div className="iv-summary" id="interviewSummary">
      <div className="iv-summary-header">
        <h1 className="iv-summary-title">Interview Complete</h1>
        <p className="iv-summary-meta">
          {config.role} • {config.interviewType} • {config.seniority}-level •{' '}
          {new Date(session.startedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="iv-summary-grid">
        {/* Score Card */}
        <div className="iv-summary-score-card">
          <div className="iv-score-circle-wrap">
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                transform="rotate(-90 64 64)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="iv-score-value" style={{ color: scoreColor }}>
              {summary.score}
              <span className="iv-score-max">/10</span>
            </div>
          </div>
          <div className="iv-score-label" style={{ color: scoreColor }}>
            {scoreLabel}
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="iv-summary-card iv-card-feedback">
          <h3 className="iv-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Overall Assessment
          </h3>
          <p className="iv-card-text">{summary.overallFeedback}</p>
        </div>

        {/* Strengths */}
        <div className="iv-summary-card iv-card-strengths">
          <h3 className="iv-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            Strengths
          </h3>
          <ul className="iv-card-list">
            {summary.strengths.map((s, i) => (
              <li key={i}>
                <span className="iv-list-icon iv-list-icon-good">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="iv-summary-card iv-card-weaknesses">
          <h3 className="iv-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Areas for Improvement
          </h3>
          <ul className="iv-card-list">
            {summary.weaknesses.map((w, i) => (
              <li key={i}>
                <span className="iv-list-icon iv-list-icon-warn">△</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="iv-summary-card iv-card-suggestions">
          <h3 className="iv-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Suggestions
          </h3>
          <ul className="iv-card-list">
            {summary.suggestions.map((s, i) => (
              <li key={i}>
                <span className="iv-list-icon iv-list-icon-info">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript Viewer */}
      <details className="iv-transcript-details">
        <summary className="iv-transcript-toggle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          View Full Transcript ({transcript.length} messages)
        </summary>
        <div className="iv-transcript-viewer">
          {transcript.map((entry) => (
            <div key={entry.id} className={`iv-tv-msg iv-tv-${entry.role}`}>
              <strong>{entry.role === 'interviewer' ? 'Alex' : 'You'}:</strong>{' '}
              <span>{entry.text}</span>
              {entry.codeSubmission && (
                <pre className="iv-tv-code"><code>{entry.codeSubmission}</code></pre>
              )}
            </div>
          ))}
        </div>
      </details>

      {/* Actions */}
      <div className="iv-summary-actions">
        <button className="iv-btn-primary" onClick={onNewInterview} id="newInterviewBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Interview
        </button>
        <button className="iv-btn-secondary" onClick={onViewHistory} id="viewHistoryBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          View History
        </button>
      </div>
    </div>
  );
}
