import { useState, useRef, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const SUGGESTIONS = [
  "What should I watch tonight?",
  "Which movie on my list is the most thrilling?",
  "Which one has the best reviews?",
  "What's a good pick for a date night?",
  "Give me your top pick from my watched list",
];

export default function WatchlistChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! Ask me anything about your watchlist. I know every movie you've saved." },
  ]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  // Conversation history for memory: [{user, assistant}]
  const historyRef = useRef([]);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setStreaming(true);

    const token = localStorage.getItem("token");
    const streamMsg = { role: "assistant", text: "" };
    setMessages(prev => [...prev, streamMsg]);

    const historySnapshot = [...historyRef.current];
    let assistantText = "";

    try {
      const res = await fetch(`${API_BASE}/ai/watchlist-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg, history: historySnapshot }),
      });

      if (!res.ok) throw new Error("failed");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantText += data.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  text: next[next.length - 1].text + data.text,
                };
                return next;
              });
            }
            if (data.done) break;
          } catch {}
        }
      }

      // Commit turn to history
      historyRef.current = [
        ...historyRef.current,
        { user: msg, assistant: assistantText },
      ].slice(-6);

    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          text: "Sorry, I couldn't connect. Please try again.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => {
          setOpen(o => !o);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          background: open
            ? "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(229,9,20,0.3))"
            : "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(229,9,20,0.12))",
          border: "1px solid rgba(139,92,246,0.35)",
          color: "#c4b5fd",
        }}
      >
        <span>✦</span>
        {open ? "Close Chat" : "Ask AI About Your List"}
      </button>

      {open && (
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(135deg, rgba(10,10,15,0.97), rgba(20,10,30,0.97))",
            border: "1px solid rgba(139,92,246,0.2)",
            height: "400px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
          >
            <span className="text-purple-400">✦</span>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Watchlist AI</p>
            <div className="ml-auto flex items-center gap-2">
              {historyRef.current.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {historyRef.current.length} turn{historyRef.current.length > 1 ? "s" : ""} remembered
                </span>
              )}
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-xs text-gray-600">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? {
                          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(229,9,20,0.2))",
                          border: "1px solid rgba(139,92,246,0.3)",
                          color: "#e9d5ff",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#d1d5db",
                        }
                  }
                >
                  {m.text || (
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div
              className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0"
              style={{ scrollbarWidth: "none" }}
            >
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    color: "#a78bfa",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-2.5"
            style={{ borderTop: "1px solid rgba(139,92,246,0.15)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about your watchlist..."
              disabled={streaming}
              className="flex-1 bg-transparent text-sm outline-none text-white placeholder-gray-600"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(229,9,20,0.4))",
              }}
            >
              {streaming ? (
                <span className="text-xs animate-spin">✦</span>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
