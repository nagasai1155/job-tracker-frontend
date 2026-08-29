import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { sendChatMessage, ChatMessage } from '../services/aiChatService';

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
      {/* ── Floating Launcher Pill ────────────────────────────────────────── */}
      {!isOpen && (
        <button
          type="button"
          className="ai-floating-launcher"
          onClick={() => setIsOpen(true)}
          id="openAiCoachBtn"
          aria-label="Open AI Career Coach"
        >
          <div className="ai-launcher-glow" />
          <span className="ai-sparkle-icon">✨</span>
          <span className="ai-launcher-text">AI Career Coach</span>
          <span className="ai-launcher-badge">Live</span>
        </button>
      )}

      {/* ── Slide-up Chat Window ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="ai-chat-window" id="aiChatWindow">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-header-avatar">
                <span className="ai-avatar-sparkle">✨</span>
                <span className="ai-online-dot" />
              </div>
              <div className="ai-header-titles">
                <h3 className="ai-header-name">AI Career Coach</h3>
                <span className="ai-header-sub">Powered by Gemini AI</span>
              </div>
            </div>

            <div className="ai-header-controls">
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
