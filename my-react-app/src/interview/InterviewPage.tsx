import React, { useState, useCallback } from 'react';
import { InterviewSetup } from './InterviewSetup';
import { InterviewSession as InterviewSessionComponent } from './InterviewSession';
import { InterviewSummary } from './InterviewSummary';
import { InterviewHistory } from './InterviewHistory';
import {
  InterviewConfig,
  InterviewType,
  InterviewPhase,
  InterviewSession,
  TranscriptEntry,
  INTERVIEW_STORAGE_KEY,
} from './types';
import { getInterviewSummary } from '../services/geminiInterviewService';
import './interview.css';

interface InterviewPageProps {
  onNavigate?: (page: 'settings') => void;
  onBackToDashboard?: () => void;
}

export function InterviewPage({ onBackToDashboard }: InterviewPageProps) {
  const [phase, setPhase] = useState<InterviewPhase>('history');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);

  // Handle starting a new interview
  const handleStartInterview = useCallback((newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setPhase('session');
  }, []);

  // Handle interview end — generate summary
  const handleInterviewEnd = useCallback(
    async (transcript: TranscriptEntry[]) => {
      if (!config) return;

      const session: InterviewSession = {
        id: `interview-${Date.now()}`,
        config,
        transcript,
        summary: null,
        startedAt: Date.now() - config.duration * 60 * 1000,
        endedAt: Date.now(),
      };

      setCurrentSession(session);
      setPhase('summary');

      try {
        const summary = await getInterviewSummary(config, transcript);
        const completedSession: InterviewSession = {
          ...session,
          summary,
        };

        setCurrentSession(completedSession);

        // Save to localStorage
        try {
          const existing = localStorage.getItem(INTERVIEW_STORAGE_KEY);
          const history: InterviewSession[] = existing ? JSON.parse(existing) : [];
          history.unshift(completedSession);
          // Keep only the last 50 sessions
          if (history.length > 50) history.length = 50;
          localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(history));
        } catch {
          console.warn('Failed to save interview to localStorage');
        }
      } catch (err: any) {
        console.error('Failed to generate interview summary:', err);
        // Still save the session without a summary
        const fallbackSession: InterviewSession = {
          ...session,
          summary: {
            strengths: ['Interview completed'],
            weaknesses: [],
            score: 5,
            suggestions: ['Summary generation failed. Try reviewing the transcript manually.'],
            overallFeedback: `Failed to generate AI evaluation: ${err.message || 'Unknown error'}`,
          },
        };
        setCurrentSession(fallbackSession);

        try {
          const existing = localStorage.getItem(INTERVIEW_STORAGE_KEY);
          const history: InterviewSession[] = existing ? JSON.parse(existing) : [];
          history.unshift(fallbackSession);
          if (history.length > 50) history.length = 50;
          localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify(history));
        } catch {
          // ignore
        }
      }
    },
    [config]
  );

  // Handle viewing a historical session
  const handleViewSession = useCallback((session: InterviewSession) => {
    setCurrentSession(session);
    setConfig(session.config);
    setPhase('summary');
  }, []);

  const [selectedTrack, setSelectedTrack] = useState<InterviewType>('coding');

  // Navigate between phases
  const goToSetup = useCallback((track?: InterviewType) => {
    if (track) setSelectedTrack(track);
    setPhase('setup');
    setCurrentSession(null);
  }, []);

  const goToHistory = useCallback(() => {
    setPhase('history');
    setCurrentSession(null);
    setConfig(null);
  }, []);

  return (
    <div className="iv-page" id="interviewPage">
      {onBackToDashboard && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 1.25rem', width: '100%' }}>
          <button
            className="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            title="Return to Dashboard"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {phase === 'history' && (
        <InterviewHistory
          onStartNew={goToSetup}
          onViewSession={handleViewSession}
        />
      )}

      {phase === 'setup' && (
        <InterviewSetup
          initialType={selectedTrack}
          onStart={handleStartInterview}
          onBack={goToHistory}
        />
      )}

      {phase === 'session' && config && (
        <InterviewSessionComponent
          config={config}
          onEnd={handleInterviewEnd}
        />
      )}

      {phase === 'summary' && currentSession && (
        <InterviewSummary
          session={currentSession}
          onNewInterview={goToSetup}
          onViewHistory={goToHistory}
        />
      )}
    </div>
  );
}
