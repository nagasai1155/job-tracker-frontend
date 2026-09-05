import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useInterviewTimer } from './hooks/useInterviewTimer';
import { CodeEditorPanel } from './CodeEditorPanel';
import {
  InterviewConfig,
  TranscriptEntry,
  SessionState,
  CODE_QUESTION_MARKER,
} from './types';
import {
  startInterviewConversation,
  sendInterviewTurn,
} from '../services/geminiInterviewService';

interface InterviewSessionProps {
  config: InterviewConfig;
  onEnd: (transcript: TranscriptEntry[]) => void;
}

let entryIdCounter = 0;
function nextEntryId(): string {
  return `entry-${Date.now()}-${++entryIdCounter}`;
}

export function InterviewSession({ config, onEnd }: InterviewSessionProps) {
  const isCodingTrack = config.interviewType === 'coding';
  const isHRTrack = config.interviewType === 'hr' || config.interviewType === 'behavioral';
  const isTechnicalTrack = config.interviewType === 'technical';

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(isCodingTrack);
  const [showStarCoach, setShowStarCoach] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const isEndedRef = useRef(false);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const {
    videoRef,
    hasPermission,
    requestPermission,
    stopStream,
  } = useCamera();

  const {
    transcript: spokenText,
    interimTranscript,
    isListening,
    isSupported: speechRecognitionSupported,
    start: startListening,
    stop: stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: speechSynthesisSupported,
  } = useSpeechSynthesis();

  const handleTimerExpired = useCallback(() => {
    if (!isEndedRef.current) {
      handleEndInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    formattedTime,
    timeRemaining,
    isRunning: timerRunning,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
  } = useInterviewTimer(config.duration, handleTimerExpired);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript]);

  // Request camera on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the interview
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const initInterview = async () => {
      setSessionState('processing');
      try {
        const opening = await startInterviewConversation(config);
        const isCodeQ = opening.includes(CODE_QUESTION_MARKER);
        const cleanText = opening.replace(CODE_QUESTION_MARKER, '').trim();

        const entry: TranscriptEntry = {
          id: nextEntryId(),
          role: 'interviewer',
          text: cleanText,
          timestamp: Date.now(),
          isCodeQuestion: isCodeQ || isCodingTrack,
        };

        setTranscript([entry]);
        startTimer();

        if (isCodeQ || isCodingTrack) {
          setShowCodeEditor(true);
        }

        setSessionState('speaking');
        if (speechSynthesisSupported) {
          speak(cleanText);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to start interview');
        setSessionState('waiting');
      }
    };

    initInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transition: speaking → listening / coding after TTS finishes
  useEffect(() => {
    if (sessionState === 'speaking' && !isSpeaking) {
      setSessionState(isCodingTrack ? 'coding' : 'listening');
      if (speechRecognitionSupported && !isMuted) {
        resetTranscript();
        startListening();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, sessionState, isCodingTrack]);

  // Silence detection: when user stops speaking for 2.5s, send their answer
  useEffect(() => {
    if (sessionState !== 'listening' && sessionState !== 'coding') return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (spokenText.trim()) {
      silenceTimeoutRef.current = setTimeout(() => {
        if ((sessionState === 'listening' || sessionState === 'coding') && spokenText.trim()) {
          sendCandidateAnswer(spokenText.trim());
        }
      }, 2500);
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenText, sessionState]);

  // Send candidate answer to Gemini
  const sendCandidateAnswer = useCallback(
    async (answer: string) => {
      if (isEndedRef.current || !answer.trim()) return;

      stopListening();
      setSessionState('processing');

      // Add candidate answer to transcript
      const candidateEntry: TranscriptEntry = {
        id: nextEntryId(),
        role: 'candidate',
        text: answer,
        timestamp: Date.now(),
      };

      const updatedTranscript = [...transcriptRef.current, candidateEntry];
      setTranscript(updatedTranscript);

      try {
        let timeWarning: string | undefined;
        if (timeRemaining <= 120 && timeRemaining > 60) {
          timeWarning = 'About 2 minutes remaining. Please start wrapping up.';
        } else if (timeRemaining <= 60) {
          timeWarning = 'Less than 1 minute remaining. Please ask your final question or wrap up.';
        }

        const response = await sendInterviewTurn(
          config,
          updatedTranscript,
          answer,
          timeWarning
        );

        if (isEndedRef.current) return;

        const isCodeQ = response.includes(CODE_QUESTION_MARKER);
        const cleanText = response.replace(CODE_QUESTION_MARKER, '').trim();

        const aiEntry: TranscriptEntry = {
          id: nextEntryId(),
          role: 'interviewer',
          text: cleanText,
          timestamp: Date.now(),
          isCodeQuestion: isCodeQ || isCodingTrack,
        };

        setTranscript((prev) => [...prev, aiEntry]);

        if (isCodeQ || isCodingTrack) {
          setShowCodeEditor(true);
        }

        setSessionState('speaking');
        if (speechSynthesisSupported) {
          speak(cleanText);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to get response');
        setSessionState(isCodingTrack ? 'coding' : 'listening');
        if (speechRecognitionSupported && !isMuted) {
          resetTranscript();
          startListening();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, timeRemaining, isCodingTrack, speechSynthesisSupported]
  );

  // Handle code submission
  const handleCodeSubmit = useCallback(
    (code: string, language: string) => {
      // In coding track, keep the code editor open side-by-side
      if (!isCodingTrack) {
        setShowCodeEditor(false);
      }

      const candidateEntry: TranscriptEntry = {
        id: nextEntryId(),
        role: 'candidate',
        text: `Submitted ${language.toUpperCase()} Solution`,
        timestamp: Date.now(),
        codeSubmission: code,
        codeLanguage: language,
      };

      const updatedTranscript = [...transcriptRef.current, candidateEntry];
      setTranscript(updatedTranscript);

      const codeAnswer = `Here is my code solution in ${language}:\n\`\`\`${language}\n${code}\n\`\`\`\nPlease review my code and provide feedback, edge cases, or the next question.`;
      setSessionState('processing');

      (async () => {
        try {
          const response = await sendInterviewTurn(config, updatedTranscript, codeAnswer);

          if (isEndedRef.current) return;

          const isCodeQ = response.includes(CODE_QUESTION_MARKER);
          const cleanText = response.replace(CODE_QUESTION_MARKER, '').trim();

          const aiEntry: TranscriptEntry = {
            id: nextEntryId(),
            role: 'interviewer',
            text: cleanText,
            timestamp: Date.now(),
            isCodeQuestion: isCodeQ || isCodingTrack,
          };

          setTranscript((prev) => [...prev, aiEntry]);

          if (isCodeQ || isCodingTrack) {
            setShowCodeEditor(true);
          }

          setSessionState('speaking');
          if (speechSynthesisSupported) {
            speak(cleanText);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to get response');
          setSessionState(isCodingTrack ? 'coding' : 'listening');
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, isCodingTrack, speechSynthesisSupported]
  );

  // Handle text input submission
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    sendCandidateAnswer(textInput.trim());
    setTextInput('');
  };

  // Mute/unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if ((sessionState === 'listening' || sessionState === 'coding') && speechRecognitionSupported) {
        startListening();
      }
    } else {
      setIsMuted(true);
      stopListening();
    }
  };

  // Pause/resume
  const togglePause = () => {
    if (timerRunning) {
      pauseTimer();
      stopListening();
      cancelSpeech();
    } else {
      resumeTimer();
      if ((sessionState === 'listening' || sessionState === 'coding') && speechRecognitionSupported && !isMuted) {
        startListening();
      }
    }
  };

  // End interview
  const handleEndInterview = useCallback(() => {
    isEndedRef.current = true;
    setSessionState('ended');
    stopListening();
    cancelSpeech();
    pauseTimer();
    stopStream();

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    setTimeout(() => {
      onEnd(transcriptRef.current);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEnd, stopStream]);

  // Manual send button for current speech
  const handleManualSend = () => {
    if (spokenText.trim()) {
      sendCandidateAnswer(spokenText.trim());
    }
  };

  const timerClass =
    timeRemaining <= 60
      ? 'iv-timer-critical'
      : timeRemaining <= 120
      ? 'iv-timer-warning'
      : '';

  // Render Transcript List helper
  const renderTranscriptContent = () => (
    <div className="iv-transcript-scroll" id="interviewTranscript">
      {transcript.length === 0 && sessionState === 'waiting' && (
        <div className="iv-transcript-placeholder">
          <span className="iv-spinner-sm" />
          Starting your interview session...
        </div>
      )}
      {transcript.map((entry, idx) => {
        const isProblemStatement = idx === 0 && entry.role === 'interviewer' && isCodingTrack;
        return (
          <div
            key={entry.id}
            className={`iv-msg iv-msg-${entry.role} ${isProblemStatement ? 'iv-msg-problem' : ''}`}
          >
            <div className="iv-msg-avatar">
              {entry.role === 'interviewer' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                </svg>
              )}
            </div>
            <div className="iv-msg-content">
              <div className="iv-msg-header">
                <span className="iv-msg-name">
                  {entry.role === 'interviewer'
                    ? isHRTrack
                      ? 'Alex (HR Lead)'
                      : isTechnicalTrack
                      ? 'Alex (System Architect)'
                      : 'Alex (Tech Interviewer)'
                    : 'You'}
                </span>
                {isProblemStatement && (
                  <span className="iv-problem-badge">
                    Coding Challenge
                  </span>
                )}
                <span className="iv-msg-time">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="iv-msg-text">{entry.text}</div>
              {entry.codeSubmission && (
                <div className="iv-submitted-code-wrapper">
                  <div className="iv-sc-header">
                    <span>{entry.codeLanguage ? entry.codeLanguage.toUpperCase() : 'CODE'}</span>
                    <span>Submitted</span>
                  </div>
                  <pre className="iv-msg-code">
                    <code>{entry.codeSubmission}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Interim speech */}
      {isListening && (interimTranscript || spokenText) && (
        <div className="iv-msg iv-msg-candidate iv-msg-interim">
          <div className="iv-msg-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <div className="iv-msg-content">
            <div className="iv-msg-header">
              <span className="iv-msg-name">You</span>
              <span className="iv-msg-live">
                <span className="iv-pulse" /> Live Voice
              </span>
            </div>
            <div className="iv-msg-text iv-msg-text-interim">
              {spokenText}
              {interimTranscript && (
                <span className="iv-interim"> {interimTranscript}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {sessionState === 'processing' && (
        <div className="iv-msg iv-msg-interviewer iv-msg-thinking">
          <div className="iv-msg-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="iv-msg-content">
            <div className="iv-thinking-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div ref={transcriptEndRef} />
    </div>
  );

  // Render Input Bar helper
  const renderInputBarContent = () => (
    <div className="iv-input-bar">
      {speechRecognitionSupported ? (
        <>
          {((sessionState === 'listening' || sessionState === 'coding') && spokenText.trim()) && (
            <button
              className="iv-send-btn"
              onClick={handleManualSend}
              title="Send speech answer now"
              id="manualSendBtn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send Voice Answer
            </button>
          )}
          {(sessionState === 'listening' || sessionState === 'coding') && !spokenText.trim() && (
            <div className="iv-listening-hint">
              <span className="iv-pulse" />
              {isCodingTrack
                ? 'Explain your approach or ask questions out loud (or type below)'
                : 'Speak your answer naturally (or type below)'}
            </div>
          )}
          <div className="iv-text-fallback">
            <input
              type="text"
              className="iv-text-input"
              placeholder={
                isCodingTrack
                  ? 'Ask clarification or explain your solution...'
                  : 'Type your answer here...'
              }
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              disabled={sessionState !== 'listening' && sessionState !== 'coding'}
              id="interviewTextInput"
            />
            <button
              className="iv-text-send-btn"
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || (sessionState !== 'listening' && sessionState !== 'coding')}
              id="interviewTextSubmitBtn"
              title="Send text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div className="iv-text-fallback iv-text-fallback-primary">
          <input
            type="text"
            className="iv-text-input"
            placeholder={
              isCodingTrack
                ? 'Type your questions or thoughts here...'
                : 'Speech recognition unavailable — type your answer here...'
            }
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            disabled={sessionState !== 'listening' && sessionState !== 'coding'}
            id="interviewTextInputFallback"
          />
          <button
            className="iv-text-send-btn"
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || (sessionState !== 'listening' && sessionState !== 'coding')}
            title="Send text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="iv-session" id="interviewSession">
      {/* Top Session Control Bar */}
      <div className="iv-session-bar">
        <div className="iv-session-bar-left">
          <div className={`iv-timer ${timerClass}`} id="interviewTimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formattedTime}
          </div>

          <div className="iv-session-role-tag">
            <span className="iv-sr-role">{config.role}</span>
            <span className={`iv-sr-track iv-track-${config.interviewType}`}>
              {isCodingTrack ? '💻 Coding Interview' : isTechnicalTrack ? '⚙️ Technical Architecture' : isHRTrack ? '🤝 HR Behavioral' : config.interviewType}
            </span>
          </div>

          <div className={`iv-session-state iv-state-${sessionState}`}>
            {sessionState === 'listening' && (
              <>
                <span className="iv-pulse" />
                Listening...
              </>
            )}
            {sessionState === 'processing' && (
              <>
                <span className="iv-spinner-sm" />
                Thinking...
              </>
            )}
            {sessionState === 'speaking' && (
              <>
                <span className="iv-speaking-wave">
                  <span /><span /><span /><span />
                </span>
                AI Speaking...
              </>
            )}
            {sessionState === 'coding' && (
              <>
                <span className="iv-state-code-dot" />
                {isCodingTrack ? 'Live Coding Mode' : 'Writing Code...'}
              </>
            )}
            {sessionState === 'waiting' && 'Starting...'}
            {sessionState === 'ended' && 'Interview Ended'}
          </div>
        </div>

        <div className="iv-session-bar-right">
          {isTechnicalTrack && (
            <button
              className={`iv-ctrl-btn ${showCodeEditor ? 'iv-ctrl-active' : ''}`}
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              title={showCodeEditor ? 'Hide Code Scratchpad' : 'Open Code Scratchpad'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              {showCodeEditor ? 'Hide Code' : 'Code Pad'}
            </button>
          )}

          {isHRTrack && (
            <button
              className={`iv-ctrl-btn ${showStarCoach ? 'iv-ctrl-active' : ''}`}
              onClick={() => setShowStarCoach(!showStarCoach)}
              title={showStarCoach ? 'Hide STAR Coach' : 'Show STAR Coach'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              STAR Coach
            </button>
          )}

          <button
            className={`iv-ctrl-btn ${isMuted ? 'iv-ctrl-active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            id="muteBtn"
          >
            {isMuted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          <button
            className={`iv-ctrl-btn ${!timerRunning ? 'iv-ctrl-active' : ''}`}
            onClick={togglePause}
            title={timerRunning ? 'Pause timer & audio' : 'Resume timer'}
            id="pauseBtn"
          >
            {timerRunning ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            className="iv-ctrl-btn iv-ctrl-end"
            onClick={handleEndInterview}
            title="Conclude Interview & View Analysis"
            id="endInterviewBtn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            End Interview
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isCodingTrack ? (
        /* CODING TRACK: Split-Screen View
           Left: Camera & AI together at top + Question & Transcript + Input Bar
           Right: Monaco Code Editor Panel */
        <div className="iv-coding-split-view" id="codingSplitView">
          {/* Left Column */}
          <div className="iv-coding-left-col">
            {/* Combined Camera & AI Interviewer Bar ("camera and ai are same") */}
            <div className="iv-combined-av-header">
              <div className="iv-av-stream iv-self-stream">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="iv-compact-video"
                />
                <span className="iv-stream-label">
                  <span className="iv-live-dot" /> You (Candidate)
                </span>
              </div>

              <div className={`iv-av-stream iv-ai-stream ${isSpeaking ? 'iv-ai-stream-active' : ''}`}>
                <div className="iv-ai-avatar-compact">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="iv-ai-stream-meta">
                  <div className="iv-stream-label">Alex (AI Tech Lead)</div>
                  {isSpeaking ? (
                    <div className="iv-speaking-wave">
                      <span /><span /><span /><span /><span />
                    </div>
                  ) : (
                    <div className="iv-stream-status">
                      {sessionState === 'processing' ? 'Reviewing Code...' : 'Online & Listening'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions & Conversation Transcript */}
            <div className="iv-coding-transcript-wrap">
              <div className="iv-coding-pane-banner">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Problem Statement & Interview Dialogue</span>
              </div>
              {renderTranscriptContent()}
            </div>

            {/* Input Bar */}
            {renderInputBarContent()}
          </div>

          {/* Right Column: Code Editor Panel */}
          <div className="iv-coding-right-col">
            <CodeEditorPanel
              onSubmit={handleCodeSubmit}
              hideCloseButton={true}
            />
          </div>
        </div>
      ) : (
        /* STANDARD VIEW (Technical & HR tracks) */
        <div className={`iv-session-content ${showCodeEditor ? 'iv-with-editor' : ''} ${isHRTrack && showStarCoach ? 'iv-with-hr-coach' : ''}`}>
          {/* Video Panel */}
          <div className="iv-video-panel">
            <div className="iv-self-view">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="iv-self-video"
              />
              <span className="iv-self-label">You</span>
            </div>
            <div className="iv-ai-panel">
              <div className="iv-ai-avatar">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="iv-ai-name">
                Alex ({isHRTrack ? 'HR Executive' : 'Staff Architect'})
              </span>
              {isSpeaking && (
                <div className="iv-ai-speaking">
                  <span className="iv-wave-bar" />
                  <span className="iv-wave-bar" />
                  <span className="iv-wave-bar" />
                  <span className="iv-wave-bar" />
                  <span className="iv-wave-bar" />
                </div>
              )}
            </div>

            {isTechnicalTrack && (
              <div className="iv-tech-focus-card">
                <div className="iv-tfc-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Architecture Focus
                </div>
                <div className="iv-tfc-list">
                  <span>• System Scalability</span>
                  <span>• Database Trade-offs</span>
                  <span>• Microservices & APIs</span>
                  <span>• Fault Tolerance</span>
                </div>
              </div>
            )}
          </div>

          {/* Transcript Panel */}
          <div className="iv-transcript-panel">
            {renderTranscriptContent()}
            {renderInputBarContent()}
          </div>

          {/* Code Editor Panel (if toggled in technical track) */}
          {showCodeEditor && (
            <CodeEditorPanel
              onSubmit={handleCodeSubmit}
              onClose={() => setShowCodeEditor(false)}
            />
          )}

          {/* HR Track: STAR Coaching Panel */}
          {isHRTrack && showStarCoach && (
            <div className="iv-star-helper-panel">
              <div className="iv-star-header">
                <div className="iv-star-badge">STAR Coaching</div>
                <h4>Behavioral Answer Framework</h4>
                <p>Structure your responses using these 4 pillars for top HR scores:</p>
              </div>
              <div className="iv-star-steps">
                <div className="iv-star-step">
                  <span className="iv-star-letter s">S</span>
                  <div className="iv-star-body">
                    <strong>Situation</strong>
                    <p>Describe the specific scenario, context, and stakeholders involved.</p>
                  </div>
                </div>
                <div className="iv-star-step">
                  <span className="iv-star-letter t">T</span>
                  <div className="iv-star-body">
                    <strong>Task</strong>
                    <p>Explain your goal, core objective, and what was at stake.</p>
                  </div>
                </div>
                <div className="iv-star-step">
                  <span className="iv-star-letter a">A</span>
                  <div className="iv-star-body">
                    <strong>Action</strong>
                    <p>Detail the exact steps YOU personally spearheaded and executed.</p>
                  </div>
                </div>
                <div className="iv-star-step">
                  <span className="iv-star-letter r">R</span>
                  <div className="iv-star-body">
                    <strong>Result</strong>
                    <p>Highlight measurable outcomes, percentages, revenue, or team impact.</p>
                  </div>
                </div>
              </div>
              <div className="iv-star-pro-tips">
                <div className="iv-spt-title">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Interview Pro-Tips
                </div>
                <ul>
                  <li>Use <strong>"I"</strong> instead of "we" to emphasize individual contribution.</li>
                  <li>Keep Situation/Task to 30 seconds; spend 70% of time on Action & Results.</li>
                  <li>Mention what you learned or how it made you a stronger leader.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="iv-error-toast" onClick={() => setError(null)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
