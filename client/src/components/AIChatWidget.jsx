import { useState, useRef, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const SUGGESTED = [
  "Is this family-friendly?",
  "Does the dog die?",
  "What do people think of it?",
  "Any similar movies?",
  "Is it worth watching?",
  "Tell me about the director",
];

/**
 * SSE streaming chat — sends conversation history (memory) + movieId (RAG).
 */
async function streamChat(movieContext, message, history, onChunk, onDone, onError) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ movieContext, message, history }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    onError(data.error || "Chat unavailable");
    onDone();
    return;
  }

  const reader = res.body.getReader();
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
        if (data.text)  onChunk(data.text);
        if (data.error) onError(data.error);
        if (data.done)  onDone();
      } catch { /* ignore parse errors */ }
    }
  }
  onDone();
}

export default function AIChatWidget({ movie }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  // Conversation history for memory: [{user, assistant}]
  const historyRef = useRef([]);
  const [historyLen, setHistoryLen] = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  if (!movie) return null;

  const movieContext = {
    movieId:  movie.id,
    title:    movie.title,
    year:     movie.release_date?.split("-")[0],
    director: movie.director,
    cast:     movie.cast,
    genres:   movie.genres?.map((g) => g.name).join(", "),
    rating:   movie.vote_average?.toFixed(1),
    overview: movie.overview,
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg = { role: "user",      text: msg };
    const botMsg  = { role: "bot",       text: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setStreaming(true);

    // Snapshot history before this turn
    const historySnapshot = [...historyRef.current];
    let assistantText = "";

    await streamChat(
      movieContext,
      msg,
      historySnapshot,
      (chunk) => {
        assistantText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "bot") last.text += chunk;
          return updated;
        });
      },
      () => {
        // Commit this turn to history
        historyRef.current = [
          ...historyRef.current,
          { user: msg, assistant: assistantText },
        ].slice(-6); // keep last 6 turns
        setHistoryLen(historyRef.current.length);

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "bot") last.streaming = false;
          return updated;
        });
        setStreaming(false);
      },
      (errMsg) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "bot") {
            last.text = errMsg.includes("not configured")
              ? "AI features require GROQ_API_KEY to be set on the server."
              : "Sorry, I couldn't answer that. Please try again.";
            last.streaming = false;
            last.error = true;
          }
          return updated;
        });
        setStreaming(false);
      }
    );
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      // Reset conversation when reopening
      setMessages([]);
      historyRef.current = [];
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-2xl transition-all duration-300 ${
          open
            ? "bg-white/10 border border-white/20 text-gray-300"
            : "bg-gradient-to-r from-purple-600 to-red-600 text-white hover:opacity-90 hover:scale-105"
        }`}
        title="Ask CineBot about this movie"
      >
        {open ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </>
        ) : (
          <>
            <span className="text-base">✦</span>
            Ask CineBot
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "520px" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0 bg-gradient-to-r from-purple-900/30 to-red-900/30">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-red-500 rounded-lg flex items-center justify-center text-sm font-black">
              ✦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">CineBot</p>
              <p className="text-xs text-gray-500 truncate">
                Ask me anything about {movie.title}
              </p>
            </div>
            {/* RAG badge — shows when reviews are being used */}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 shrink-0">
              RAG
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  I know this movie AND what CineWorld users think of it. Try:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-red-600/30 border border-red-500/20 text-gray-100"
                        : msg.error
                        ? "bg-red-900/20 border border-red-500/20 text-red-400"
                        : "bg-white/5 border border-white/10 text-gray-200"
                    }`}
                  >
                    {msg.text || (msg.streaming && (
                      <span className="flex gap-1">
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ))}
                    {msg.streaming && msg.text && (
                      <span className="inline-block w-1 h-3 bg-purple-400 ml-0.5 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={streaming}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-purple-500/40 placeholder-gray-600 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={streaming || !input.trim()}
                className="w-9 h-9 bg-gradient-to-br from-purple-600 to-red-600 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shrink-0"
              >
                {streaming ? (
                  <span className="animate-spin text-xs">⟳</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            {historyLen > 0 && (
              <p className="text-[10px] text-gray-600 mt-1 text-center">
                {historyLen} turn{historyLen > 1 ? "s" : ""} remembered
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
