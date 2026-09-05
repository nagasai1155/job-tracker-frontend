import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { sendChatMessage, ChatMessage } from '../services/aiChatService';

interface Position {
  x: number;
  y: number;
}

const SUGGESTED_PROMPTS = [
  { icon: '🎯', label: 'Interview Prep', prompt: 'How do I answer "Tell me about yourself" for a developer role?' },
  { icon: '💼', label: 'Resume Polish', prompt: 'Can you give me 3 high-impact resume bullet points for a React & Spring Boot project?' },
  { icon: '✉️', label: 'Cold Outreach', prompt: 'Draft a polite, concise LinkedIn message to a recruiter asking for a job referral.' },
  { icon: '💰', label: 'Negotiation', prompt: 'What are the best strategies to negotiate a higher base salary?' },
];

const INITIAL_GREETING: ChatMessage = {
  id: 'init-greeting',
  role: 'model',
  text: `👋 Hi! I'm your **AI Career Coach**.\n\nI can help you:\n- 🎯 Practice **tech & behavioral interview questions**\n- 💼 Write **ATS-friendly resume bullet points**\n- ✉️ Draft **outreach emails & LinkedIn messages**\n- 📈 Optimize your **job search strategy**\n\nHow can I help you today?`,
  timestamp: Date.now(),
};

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('careerbot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_GREETING];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Drag & Move State ─────────────────────────────────────────────────────
  const [windowPos, setWindowPos] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem('careerbot_win_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [launcherPos, setLauncherPos] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem('careerbot_launcher_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isDraggingWin, setIsDraggingWin] = useState(false);
  const [isDraggingLauncher, setIsDraggingLauncher] = useState(false);

  const windowRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const winDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const isWinDraggingRef = useRef(false);

  const launcherDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const isLauncherDraggingRef = useRef(false);
  const launcherMovedRef = useRef(false);

  // Persist positions
  useEffect(() => {
    if (windowPos) {
      try {
        localStorage.setItem('careerbot_win_pos', JSON.stringify(windowPos));
      } catch {}
    }
  }, [windowPos]);

  useEffect(() => {
    if (launcherPos) {
      try {
        localStorage.setItem('careerbot_launcher_pos', JSON.stringify(launcherPos));
      } catch {}
    }
  }, [launcherPos]);

  // Keep within bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowPos((prev) => {
        if (!prev) return null;
        const winWidth = windowRef.current?.offsetWidth || 400;
        const winHeight = windowRef.current?.offsetHeight || 580;
        const clampedX = Math.min(Math.max(10, prev.x), Math.max(10, window.innerWidth - winWidth - 10));
        const clampedY = Math.min(Math.max(10, prev.y), Math.max(10, window.innerHeight - winHeight - 10));
        return { x: clampedX, y: clampedY };
      });

      setLauncherPos((prev) => {
        if (!prev) return null;
        const btnWidth = launcherRef.current?.offsetWidth || 56;
        const btnHeight = launcherRef.current?.offsetHeight || 56;
        const clampedX = Math.min(Math.max(10, prev.x), Math.max(10, window.innerWidth - btnWidth - 10));
        const clampedY = Math.min(Math.max(10, prev.y), Math.max(10, window.innerHeight - btnHeight - 10));
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Window drag handlers
  const startWindowDrag = (clientX: number, clientY: number) => {
    const rect = windowRef.current?.getBoundingClientRect();
    const initX = rect ? rect.left : window.innerWidth - 420;
    const initY = rect ? rect.top : window.innerHeight - 600;

    winDragRef.current = { startX: clientX, startY: clientY, initX, initY };
    isWinDraggingRef.current = true;
    setIsDraggingWin(true);

    const onMove = (moveX: number, moveY: number) => {
      if (!isWinDraggingRef.current) return;
      const deltaX = moveX - winDragRef.current.startX;
      const deltaY = moveY - winDragRef.current.startY;

      const winWidth = windowRef.current?.offsetWidth || 400;
      const winHeight = windowRef.current?.offsetHeight || 580;

      const newX = Math.min(Math.max(10, winDragRef.current.initX + deltaX), Math.max(10, window.innerWidth - winWidth - 10));
      const newY = Math.min(Math.max(10, winDragRef.current.initY + deltaY), Math.max(10, window.innerHeight - winHeight - 10));

      setWindowPos({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const stopDrag = () => {
      isWinDraggingRef.current = false;
      setIsDraggingWin(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    e.preventDefault();
    startWindowDrag(e.clientX, e.clientY);
  };

  const handleHeaderTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    if (e.touches.length > 0) {
      startWindowDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Launcher button drag handlers
  const startLauncherDrag = (clientX: number, clientY: number) => {
    const rect = launcherRef.current?.getBoundingClientRect();
    const initX = rect ? rect.left : window.innerWidth - 80;
    const initY = rect ? rect.top : window.innerHeight - 80;

    launcherDragRef.current = { startX: clientX, startY: clientY, initX, initY };
    isLauncherDraggingRef.current = true;
    launcherMovedRef.current = false;

    const onMove = (moveX: number, moveY: number) => {
      if (!isLauncherDraggingRef.current) return;
      const deltaX = moveX - launcherDragRef.current.startX;
      const deltaY = moveY - launcherDragRef.current.startY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        if (!launcherMovedRef.current) {
          launcherMovedRef.current = true;
          setIsDraggingLauncher(true);
        }
      }

      if (launcherMovedRef.current) {
        const btnWidth = launcherRef.current?.offsetWidth || 56;
        const btnHeight = launcherRef.current?.offsetHeight || 56;

        const newX = Math.min(Math.max(10, launcherDragRef.current.initX + deltaX), Math.max(10, window.innerWidth - btnWidth - 10));
        const newY = Math.min(Math.max(10, launcherDragRef.current.initY + deltaY), Math.max(10, window.innerHeight - btnHeight - 10));

        setLauncherPos({ x: newX, y: newY });
      }
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const stopDrag = () => {
      isLauncherDraggingRef.current = false;
      setIsDraggingLauncher(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);

      if (!launcherMovedRef.current) {
        setIsOpen(true);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);
  };

  const handleLauncherMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startLauncherDrag(e.clientX, e.clientY);
  };

  const handleLauncherTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length > 0) {
      startLauncherDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('careerbot_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Pass the previous history (excluding the greeting if initial) to the AI
      const historyPayload = newHistory.filter(m => m.id !== 'init-greeting');
      const aiReplyText = await sendChatMessage(historyPayload.slice(0, -1), query);

      const aiMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: aiReplyText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Error:** ${err?.message || 'Failed to get response from AI. Please try again.'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear your conversation history with AI Career Coach?')) {
      setMessages([INITIAL_GREETING]);
      try {
        localStorage.removeItem('careerbot_history');
      } catch {}
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render basic markdown formatting (bold, code blocks, lists)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="ai-md-h4">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="ai-md-h3">{line.replace('## ', '')}</h3>;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="ai-md-quote">{line.replace('> ', '')}</blockquote>;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        const content = line.replace(/^[-*•]\s+/, '');
        return (
          <div key={idx} className="ai-md-bullet">
            <span className="ai-bullet-dot">•</span>
            <span>{formatInlineText(content)}</span>
          </div>
        );
      }

      // Numbered list
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="ai-md-num-item">
            <span className="ai-num-prefix">{numMatch[1]}.</span>
            <span>{formatInlineText(numMatch[2])}</span>
          </div>
        );
      }

      // Divider
      if (line.trim() === '---') {
        return <hr key={idx} className="ai-md-hr" />;
      }

      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="ai-md-space" />;
      }

      return <p key={idx} className="ai-md-p">{formatInlineText(line)}</p>;
    });
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Process **bold** and `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="ai-inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <>
      {/* ── Floating Launcher Chat Logo ──────────────────────────────────── */}
      {!isOpen && (
        <button
          ref={launcherRef}
          type="button"
          className={`ai-floating-launcher ${isDraggingLauncher ? 'is-dragging' : ''}`}
          onMouseDown={handleLauncherMouseDown}
          onTouchStart={handleLauncherTouchStart}
          style={
            launcherPos
              ? {
                  left: `${launcherPos.x}px`,
                  top: `${launcherPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  touchAction: 'none',
                }
              : { touchAction: 'none' }
          }
          id="openAiCoachBtn"
          aria-label="Open AI Career Coach (Drag to move)"
          title="AI Career Coach • Click to chat (Drag to move)"
        >
          <div className="ai-launcher-glow" />
          <div className="ai-chat-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="rgba(255, 255, 255, 0.22)" />
              <circle cx="9" cy="12" r="1.1" fill="#ffffff" />
              <circle cx="12" cy="12" r="1.1" fill="#ffffff" />
              <circle cx="15" cy="12" r="1.1" fill="#ffffff" />
            </svg>
          </div>
          <span className="ai-launcher-ping-dot" />
          <span className="ai-launcher-sparkle-mini">✨</span>
        </button>
      )}

      {/* ── Slide-up Chat Window ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={windowRef}
          className={`ai-chat-window ${isDraggingWin ? 'is-dragging' : ''}`}
          id="aiChatWindow"
          style={
            windowPos
              ? {
                  left: `${windowPos.x}px`,
                  top: `${windowPos.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  animation: isDraggingWin ? 'none' : undefined,
                }
              : undefined
          }
        >
          {/* Header - Drag Handle */}
          <div
            className="ai-chat-header"
            onMouseDown={handleHeaderMouseDown}
            onTouchStart={handleHeaderTouchStart}
            style={{ touchAction: 'none' }}
            title="Drag header to move chatbot anywhere on screen"
          >
            <div className="ai-chat-brand">
              <div className="ai-drag-handle-pill" title="Drag to move chatbot">
                <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                  <circle cx="2" cy="2" r="1.5" />
                  <circle cx="8" cy="2" r="1.5" />
                  <circle cx="2" cy="7" r="1.5" />
                  <circle cx="8" cy="7" r="1.5" />
                  <circle cx="2" cy="12" r="1.5" />
                  <circle cx="8" cy="12" r="1.5" />
                </svg>
              </div>
              <div className="ai-header-avatar">
                <span className="ai-avatar-sparkle">✨</span>
                <span className="ai-online-dot" />
              </div>
              <div className="ai-header-titles">
                <h3 className="ai-header-name">AI Career Coach</h3>
                <span className="ai-header-sub">Drag header to reposition</span>
              </div>
            </div>

            <div className="ai-header-controls">
              {windowPos && (
                <button
                  type="button"
                  className="ai-ctrl-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWindowPos(null);
                    try {
                      localStorage.removeItem('careerbot_win_pos');
                    } catch {}
                  }}
                  title="Reset window position to bottom-right"
                  aria-label="Reset position"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="ai-ctrl-btn"
                onClick={handleClearChat}
                title="Clear chat history"
                aria-label="Clear chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                type="button"
                className="ai-ctrl-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Prompts (Only if only 1 message) */}
          {messages.length <= 1 && (
            <div className="ai-quick-prompts-bar">
              <span className="ai-quick-title">Quick Topics:</span>
              <div className="ai-prompt-chips-grid">
                {SUGGESTED_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="ai-prompt-chip"
                    onClick={() => handleSendMessage(item.prompt)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="ai-messages-feed">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === 'user' ? 'ai-row-user' : 'ai-row-model'}`}
              >
                {msg.role === 'model' && (
                  <div className="ai-msg-avatar">
                    <span>✨</span>
                  </div>
                )}

                <div className="ai-bubble-wrap">
                  <div className={`ai-bubble ${msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-model'}`}>
                    {msg.role === 'user' ? (
                      <p>{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {msg.role === 'model' && msg.id !== 'init-greeting' && (
                    <button
                      type="button"
                      className="ai-copy-btn"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy message"
                    >
                      {copiedId === msg.id ? '✓ Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row ai-row-model">
                <div className="ai-msg-avatar">
                  <span>✨</span>
                </div>
                <div className="ai-bubble ai-bubble-model ai-typing-bubble">
                  <span className="ai-dot-typing" />
                  <span className="ai-dot-typing" />
                  <span className="ai-dot-typing" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="ai-chat-input-container">
            <div className="ai-input-wrapper">
              <textarea
                ref={inputRef}
                className="ai-chat-textarea"
                rows={1}
                placeholder="Ask CareerBot about resumes, interview tips, cold DMs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button
                type="button"
                className="ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="ai-disclaimer">
              Powered by Google Gemini 3.5 Flash • AI can make mistakes
            </div>
          </div>
        </div>
      )}
    </>
  );
}
