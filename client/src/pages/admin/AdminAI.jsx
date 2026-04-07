import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import './AdminAI.css';

const QUICK_PROMPTS = [
  { label: '💰 Income strategy', text: 'Based on my current data, what are the top 3 ways I can increase revenue this month?' },
  { label: '✍️ Draft a blog post', text: 'Write a compelling blog post about the importance of professional proofreading before self-publishing. Include an SEO-friendly title and meta description.' },
  { label: '📊 Analyse my analytics', text: 'Analyse my current website traffic and content performance. What should I focus on to grow my audience?' },
  { label: '📋 Quote template', text: 'Create a professional quote/invoice template for a 70,000-word developmental edit. Include line items, payment terms, and a brief scope of work.' },
  { label: '📥 Review my inbox', text: 'Summarise my recent quote submissions and identify which service types are most in demand. Suggest any pricing or packaging opportunities.' },
  { label: '📅 Content calendar', text: 'Build a 4-week content calendar for my blog and social media, themed around helping aspiring authors prepare their manuscripts for submission.' },
];

const TypingIndicator = () => (
  <div className="ai-bubble ai-bubble--ai">
    <div className="ai-typing">
      <span></span><span></span><span></span>
    </div>
  </div>
);

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`ai-bubble ai-bubble--${isUser ? 'user' : 'ai'}`}>
      {!isUser && <div className="ai-bubble__label">Booky AI</div>}
      <div className="ai-bubble__text">{msg.content}</div>
    </div>
  );
};

const AdminAI = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text.trim();
    if (!userText || streaming) return;

    setError('');
    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    // Placeholder for the AI response that we'll stream into
    const aiPlaceholder = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, aiPlaceholder]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/ai/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: newMessages }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + data.text,
                };
                return updated;
              });
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages((prev) => prev.slice(0, -1)); // remove empty AI placeholder
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleClear = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setError('');
    setStreaming(false);
  };

  const isEmpty = messages.length === 0;

  return (
    <AdminLayout>
      <div className="ai-page">
        <div className="ai-page__header">
          <div>
            <h1>Booky AI</h1>
            <p className="ai-page__subtitle">Your financial, content &amp; analytics assistant</p>
          </div>
          {!isEmpty && (
            <button className="btn btn-outline ai-clear-btn" onClick={handleClear}>
              New Chat
            </button>
          )}
        </div>

        <div className="ai-chat">
          {isEmpty ? (
            <div className="ai-welcome">
              <div className="ai-welcome__icon">✦</div>
              <h2>How can I help you today?</h2>
              <p>I have live access to your website data — blog posts, quote submissions, analytics, and more. Ask me anything.</p>
              <div className="ai-prompts">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    className="ai-prompt-chip"
                    onClick={() => sendMessage(p.text)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-messages">
              {messages.map((msg, i) => (
                msg.role === 'assistant' && msg.content === '' && streaming
                  ? <TypingIndicator key={i} />
                  : <MessageBubble key={i} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {error && (
            <div className="ai-error">{error}</div>
          )}

          <div className="ai-input-bar">
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              rows={1}
              placeholder="Ask anything — income ideas, content drafts, analytics insights..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            {streaming ? (
              <button className="ai-send-btn ai-send-btn--stop" onClick={handleStop} aria-label="Stop">
                ■
              </button>
            ) : (
              <button
                className="ai-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                aria-label="Send"
              >
                ↑
              </button>
            )}
          </div>
          <p className="ai-input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
