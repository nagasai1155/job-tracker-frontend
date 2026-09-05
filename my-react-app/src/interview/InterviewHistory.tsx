import React, { useState } from 'react';
import { InterviewSession, InterviewType, INTERVIEW_TRACKS, INTERVIEW_STORAGE_KEY } from './types';

interface InterviewHistoryProps {
  onStartNew: (track?: InterviewType) => void;
  onViewSession: (session: InterviewSession) => void;
}

export function InterviewHistory({ onStartNew, onViewSession }: InterviewHistoryProps) {
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [sessions, setSessions] = useState<InterviewSession[]>(() => {
    try {
      const saved = localStorage.getItem(INTERVIEW_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setSessions([]);
    localStorage.removeItem(INTERVIEW_STORAGE_KEY);
  };

  const scoreColor = (score: number) =>
    score >= 8
      ? '#22c55e'
      : score >= 6
      ? '#f59e0b'
      : score >= 4
      ? '#f97316'
      : '#ef4444';

  const handleSelectTrack = (track: InterviewType) => {
    setShowTrackModal(false);
    onStartNew(track);
  };

  return (
    <div className="iv-history" id="interviewHistory">
      {/* ── Track Selector Modal ── */}
      {showTrackModal && (
        <div className="iv-track-modal-overlay" onClick={() => setShowTrackModal(false)}>
          <div className="iv-track-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="iv-track-modal-header">
              <div>
                <h2 className="iv-track-modal-title">Select Interview Track</h2>
                <p className="iv-track-modal-subtitle">Choose the type of mock interview you want to practice</p>
              </div>
              <button
                className="iv-track-modal-close"
                onClick={() => setShowTrackModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="iv-track-modal-grid">
              {INTERVIEW_TRACKS.map((track) => (
                <div
                  key={track.id}
                  className="iv-track-select-card"
                  onClick={() => handleSelectTrack(track.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelectTrack(track.id);
                  }}
                >
                  <span className="iv-tsc-icon">{track.icon}</span>
                  <div className="iv-tsc-info">
                    <div className="iv-tsc-top">
                      <h3 className="iv-tsc-title">{track.title}</h3>
                      <span className={`iv-tsc-badge ${track.id}`}>{track.badge}</span>
                    </div>
                    <p className="iv-tsc-desc">{track.subtitle || track.description}</p>
                  </div>
                  <div className="iv-tsc-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="iv-history-header">
        <div>
          <h2 className="iv-history-title">Past Interview Sessions</h2>
          <p className="iv-history-subtitle">
            {sessions.length === 0
              ? 'No interviews yet. Click New Interview to begin!'
              : `${sessions.length} interview${sessions.length !== 1 ? 's' : ''} completed`}
          </p>
        </div>
        <div className="iv-history-actions">
          {sessions.length > 0 && (
            <button className="iv-btn-ghost" onClick={clearAll} id="clearHistoryBtn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear All
            </button>
          )}
          <button className="iv-btn-primary" onClick={() => setShowTrackModal(true)} id="startNewInterviewBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Interview
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="iv-history-empty">
          <div className="iv-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h3>No Interview History</h3>
          <p>Complete a mock interview to see your results here.</p>
          <button className="iv-btn-primary" onClick={() => setShowTrackModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Your First Interview
          </button>
        </div>
      ) : (
        <div className="iv-history-list">
          {sessions
            .sort((a, b) => b.startedAt - a.startedAt)
            .map((session) => (
              <div
                key={session.id}
                className="iv-history-card"
                onClick={() => onViewSession(session)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onViewSession(session);
                }}
              >
                <div className="iv-hc-left">
                  {session.summary && (
                    <div
                      className="iv-hc-score"
                      style={{ background: scoreColor(session.summary.score) }}
                    >
                      {session.summary.score}
                    </div>
                  )}
                  <div className="iv-hc-info">
                    <h3 className="iv-hc-role">{session.config.role}</h3>
                    <div className="iv-hc-meta">
                      <span className="iv-hc-badge">{session.config.interviewType}</span>
                      <span className="iv-hc-badge">{session.config.seniority}</span>
                      <span className="iv-hc-date">
                        {new Date(session.startedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="iv-hc-msgs">
                        {session.transcript.length} messages
                      </span>
                    </div>
                  </div>
                </div>
                <div className="iv-hc-right">
                  <button
                    className="iv-hc-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    title="Delete this session"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
