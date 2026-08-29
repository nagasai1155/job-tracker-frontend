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
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>('waiting');
  const [isMuted, setIsMuted] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
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
          isCodeQuestion: isCodeQ,
        };

        setTranscript([entry]);
        startTimer();

        if (isCodeQ) {
          setShowCodeEditor(true);
          setSessionState('coding');
        } else {
          setSessionState('speaking');
          if (speechSynthesisSupported) {
            speak(cleanText);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to start interview');
        setSessionState('waiting');
      }
    };

    initInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transition: speaking → listening after TTS finishes
  useEffect(() => {
    if (sessionState === 'speaking' && !isSpeaking) {
      setSessionState('listening');
      if (speechRecognitionSupported && !isMuted) {
        resetTranscript();
        startListening();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking, sessionState]);

  // Silence detection: when user stops speaking for 2s, send their answer
  useEffect(() => {
    if (sessionState !== 'listening') return;

    // Clear any existing timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // Only start silence timer when we have some spoken text
    if (spokenText.trim()) {
      silenceTimeoutRef.current = setTimeout(() => {
        if (sessionState === 'listening' && spokenText.trim()) {
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
        // Add time warning if close to end
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
          isCodeQuestion: isCodeQ,
        };

        setTranscript((prev) => [...prev, aiEntry]);

        if (isCodeQ) {
          setShowCodeEditor(true);
          setSessionState('coding');
        } else {
          setSessionState('speaking');
          if (speechSynthesisSupported) {
            speak(cleanText);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to get response');
        setSessionState('listening');
        if (speechRecognitionSupported && !isMuted) {
          resetTranscript();
          startListening();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, timeRemaining]
  );

  // Handle code submission
  const handleCodeSubmit = useCallback(
    (code: string, language: string) => {
      setShowCodeEditor(false);

      const candidateEntry: TranscriptEntry = {
        id: nextEntryId(),
        role: 'candidate',
        text: 'Here is my code solution:',
        timestamp: Date.now(),
        codeSubmission: code,
        codeLanguage: language,
      };

      const updatedTranscript = [...transcriptRef.current, candidateEntry];
      setTranscript(updatedTranscript);

      // Send code as answer
      const codeAnswer = `Here is my code solution in ${language}:\n\`\`\`${language}\n${code}\n\`\`\``;
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
            isCodeQuestion: isCodeQ,
          };

          setTranscript((prev) => [...prev, aiEntry]);

          if (isCodeQ) {
            setShowCodeEditor(true);
            setSessionState('coding');
          } else {
            setSessionState('speaking');
            if (speechSynthesisSupported) {
              speak(cleanText);
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to get response');
          setSessionState('listening');
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config]
  );

  // Handle text input submission (fallback for no speech recognition)
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    sendCandidateAnswer(textInput.trim());
    setTextInput('');
  };

  // Mute/unmute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (sessionState === 'listening' && speechRecognitionSupported) {
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
      if (sessionState === 'listening' && speechRecognitionSupported && !isMuted) {
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

    // Small delay to ensure state is updated
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

  // Timer color
  const timerClass =
    timeRemaining <= 60
      ? 'iv-timer-critical'
      : timeRemaining <= 120
      ? 'iv-timer-warning'
      : '';

  return (
    <div className="iv-session" id="interviewSession">
      {/* Top Control Bar */}
      <div className="iv-session-bar">
        <div className="iv-session-bar-left">
          <div className={`iv-timer ${timerClass}`} id="interviewTimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formattedTime}
          </div>
          <div className="iv-session-role">{config.role}</div>
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
            {sessionState === 'coding' && 'Writing Code...'}
            {sessionState === 'waiting' && 'Starting...'}
            {sessionState === 'ended' && 'Interview Ended'}
          </div>
        </div>
        <div className="iv-session-bar-right">
          <button
            className={`iv-ctrl-btn ${isMuted ? 'iv-ctrl-active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
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
            title={timerRunning ? 'Pause' : 'Resume'}
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
            title="End Interview"
            id="endInterviewBtn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            End
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`iv-session-content ${showCodeEditor ? 'iv-with-editor' : ''}`}>
        {/* Video + AI panel */}
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
            <span className="iv-ai-name">Alex (Interviewer)</span>
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
        </div>

        {/* Transcript */}
        <div className="iv-transcript-panel">
          <div className="iv-transcript-scroll" id="interviewTranscript">
            {transcript.length === 0 && sessionState === 'waiting' && (
              <div className="iv-transcript-placeholder">
                <span className="iv-spinner-sm" />
                Starting your interview...
              </div>
            )}
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`iv-msg iv-msg-${entry.role}`}
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
                      {entry.role === 'interviewer' ? 'Alex' : 'You'}
                    </span>
                    <span className="iv-msg-time">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="iv-msg-text">{entry.text}</div>
                  {entry.codeSubmission && (
                    <pre className="iv-msg-code">
                      <code>{entry.codeSubmission}</code>
                    </pre>
                  )}
                </div>
              </div>
            ))}

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
                      <span className="iv-pulse" /> Live
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

          {/* Text input fallback or manual send */}
          <div className="iv-input-bar">
            {speechRecognitionSupported ? (
              <>
                {sessionState === 'listening' && spokenText.trim() && (
                  <button
                    className="iv-send-btn"
                    onClick={handleManualSend}
                    title="Send answer now"
                    id="manualSendBtn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send
                  </button>
                )}
                {sessionState === 'listening' && !spokenText.trim() && (
                  <div className="iv-listening-hint">
                    <span className="iv-pulse" />
                    Speak your answer... (or type below)
                  </div>
                )}
                <div className="iv-text-fallback">
                  <input
                    type="text"
                    className="iv-text-input"
                    placeholder="Type your answer here..."
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
                  placeholder="Speech recognition not available — type your answer..."
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
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor Panel */}
        {showCodeEditor && (
          <CodeEditorPanel
            onSubmit={handleCodeSubmit}
            onClose={() => setShowCodeEditor(false)}
          />
        )}
      </div>

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
