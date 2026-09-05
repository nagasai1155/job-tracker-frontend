import React, { useState, useEffect } from 'react';
import { useCamera } from './hooks/useCamera';
import {
  InterviewConfig,
  InterviewType,
  SeniorityLevel,
  InterviewDuration,
  INTERVIEW_TRACKS,
  SENIORITY_LEVELS,
  DURATION_OPTIONS,
} from './types';

interface InterviewSetupProps {
  initialType?: InterviewType;
  onStart: (config: InterviewConfig) => void;
  onBack: () => void;
}

export function InterviewSetup({ initialType, onStart, onBack }: InterviewSetupProps) {
  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>(initialType || 'coding');
  const [seniority, setSeniority] = useState<SeniorityLevel>('mid');
  const [duration, setDuration] = useState<InterviewDuration>(20);
  const [resumeSource, setResumeSource] = useState<'saved' | 'paste'>('saved');
  const [pastedResume, setPastedResume] = useState('');
  const [savedResumeText, setSavedResumeText] = useState('');
  const [hasSavedResume, setHasSavedResume] = useState(false);

  const {
    videoRef,
    hasPermission,
    isRequesting,
    requestPermission,
    stopStream,
    error: cameraError,
  } = useCamera();

  // Load saved resume from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_resume_data');
      if (cached) {
        const data = JSON.parse(cached);
        // Convert resume data to readable text
        const parts: string[] = [];
        if (data.fullName) parts.push(`Name: ${data.fullName}`);
        if (data.title) parts.push(`Title: ${data.title}`);
        if (data.email) parts.push(`Email: ${data.email}`);
        if (data.summary) parts.push(`Summary: ${data.summary}`);
        if (data.experience?.length) {
          parts.push('Experience:');
          data.experience.forEach((exp: any) => {
            if (exp.role || exp.company) {
              parts.push(`  - ${exp.role || ''} at ${exp.company || ''} (${exp.duration || ''})`);
              if (exp.description) parts.push(`    ${exp.description}`);
              if (exp.techStack) parts.push(`    Tech: ${exp.techStack}`);
            }
          });
        }
        if (data.skills?.length) {
          parts.push(`Skills: ${data.skills.filter((s: string) => s.trim()).join(', ')}`);
        }
        if (data.education?.length) {
          parts.push('Education:');
          data.education.forEach((edu: any) => {
            if (edu.school || edu.degree) {
              parts.push(`  - ${edu.degree || ''} at ${edu.school || ''} (${edu.year || ''})`);
            }
          });
        }
        if (data.projects?.length) {
          parts.push('Projects:');
          data.projects.forEach((proj: any) => {
            if (proj.name) {
              parts.push(`  - ${proj.name} (${proj.techStack || ''})`);
              proj.bullets?.forEach((b: string) => {
                if (b.trim()) parts.push(`    • ${b}`);
              });
            }
          });
        }
        if (data.certifications?.length) {
          parts.push('Certifications:');
          data.certifications.forEach((cert: any) => {
            if (cert.name) parts.push(`  - ${cert.name} (${cert.issuer || ''})`);
          });
        }

        const resumeText = parts.join('\n');
        if (resumeText.trim().length > 20) {
          setSavedResumeText(resumeText);
          setHasSavedResume(true);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const canStart =
    role.trim().length > 0 &&
    hasPermission &&
    (resumeSource === 'saved' ? hasSavedResume : pastedResume.trim().length > 0);

  const handleStart = () => {
    if (!canStart) return;
    const config: InterviewConfig = {
      role: role.trim(),
      resumeText: resumeSource === 'saved' ? savedResumeText : pastedResume.trim(),
      interviewType,
      seniority,
      duration,
    };
    // Don't stop the stream — the session will use it
    onStart(config);
  };

  // Cleanup camera if user navigates away without starting
  useEffect(() => {
    return () => {
      // Only stop if we're unmounting (navigating away)
    };
  }, [stopStream]);

  return (
    <div className="iv-setup">
      <div className="iv-setup-header">
        <button className="iv-back-btn" onClick={onBack} id="interviewSetupBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="iv-setup-title-group">
          <h1 className="iv-setup-title">Interview Setup</h1>
          <p className="iv-setup-subtitle">Configure your mock interview session</p>
        </div>
      </div>

      <div className="iv-setup-grid">
        {/* Left column: Form */}
        <div className="iv-setup-form">
          {/* ── Choose Interview Track ── */}
          <div className="iv-form-group">
            <label className="iv-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Interview Track
            </label>
            <div className="iv-track-pill-selector">
              {INTERVIEW_TRACKS.map((track) => {
                const isSelected = interviewType === track.id;
                return (
                  <button
                    type="button"
                    key={track.id}
                    className={`iv-track-pill-item ${isSelected ? 'active ' + track.id : ''}`}
                    onClick={() => setInterviewType(track.id)}
                  >
                    <span className="iv-pill-icon">{track.icon}</span>
                    <span className="iv-pill-label">{track.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role */}
          <div className="iv-form-group">
            <label className="iv-label" htmlFor="interviewRole">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Target Role / Job Title
            </label>
            <input
              type="text"
              id="interviewRole"
              className="iv-input"
              placeholder="e.g. Backend Developer, Full Stack Engineer..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoFocus
            />
          </div>

          {/* Resume Source */}
          <div className="iv-form-group">
            <label className="iv-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Resume
            </label>
            <div className="iv-resume-toggle">
              <button
                type="button"
                className={`iv-toggle-btn ${resumeSource === 'saved' ? 'active' : ''}`}
                onClick={() => setResumeSource('saved')}
                disabled={!hasSavedResume}
                title={!hasSavedResume ? 'No saved resume found' : ''}
              >
                Use Saved Resume
              </button>
              <button
                type="button"
                className={`iv-toggle-btn ${resumeSource === 'paste' ? 'active' : ''}`}
                onClick={() => setResumeSource('paste')}
              >
                Paste Resume
              </button>
            </div>
            {resumeSource === 'saved' ? (
              hasSavedResume ? (
                <div className="iv-saved-resume-preview">
                  <div className="iv-preview-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Resume loaded from Resume Builder
                  </div>
                  <p className="iv-preview-text">
                    {savedResumeText.slice(0, 200)}
                    {savedResumeText.length > 200 ? '...' : ''}
                  </p>
                </div>
              ) : (
                <div className="iv-no-resume">
                  <p>No saved resume found. Build one in the <strong>Resume Builder</strong> tab, or paste your resume text below.</p>
                </div>
              )
            ) : (
              <textarea
                className="iv-textarea"
                id="interviewResumeText"
                placeholder="Paste your resume text here..."
                value={pastedResume}
                onChange={(e) => setPastedResume(e.target.value)}
                rows={6}
              />
            )}
          </div>

          {/* Seniority & Duration — in a row */}
          <div className="iv-options-row">
            <div className="iv-form-group iv-form-group-sm">
              <label className="iv-label" htmlFor="interviewSeniority">Seniority</label>
              <select
                id="interviewSeniority"
                className="iv-select"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
              >
                {SENIORITY_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="iv-form-group iv-form-group-sm">
              <label className="iv-label" htmlFor="interviewDuration">Duration</label>
              <select
                id="interviewDuration"
                className="iv-select"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as InterviewDuration)}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Camera Preview & Permissions */}
        <div className="iv-camera-section">
          <label className="iv-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Camera & Mic Preview
          </label>
          <div className="iv-camera-preview-container">
            {hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="iv-camera-video"
                id="interviewCameraPreview"
              />
            ) : (
              <div className="iv-camera-placeholder">
                <div className="iv-camera-icon">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <p className="iv-camera-text">
                  {cameraError || 'Enable camera and microphone for live AI interview'}
                </p>
                <button
                  type="button"
                  className="iv-camera-enable-btn"
                  onClick={requestPermission}
                  disabled={isRequesting}
                  id="enableCameraBtn"
                >
                  {isRequesting ? (
                    <>
                      <span className="iv-spinner" />
                      Requesting Access...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      Enable Camera & Mic
                    </>
                  )}
                </button>
              </div>
            )}
            {hasPermission && (
              <div className="iv-camera-ready-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Camera & Mic Ready
              </div>
            )}
          </div>

          <div className="iv-camera-actions">
            <button
              className="iv-start-btn"
              onClick={handleStart}
              disabled={!canStart}
              id="startInterviewBtn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Interview
            </button>
            {!canStart && (
              <p className="iv-start-hint">
                {!role.trim()
                  ? 'Enter a target job role to proceed'
                  : !hasPermission
                  ? 'Enable camera & mic to start interview'
                  : 'Add or select a resume'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
