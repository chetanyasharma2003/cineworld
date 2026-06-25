import { useState } from "react";
import { api } from "../lib/api";

export default function AIReviewSummary({ reviews }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!reviews?.length) return null;

  const analyse = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/review-summary", { reviews });
      setSummary(res.data.summary);
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (!done && !loading) {
    return (
      <button
        onClick={analyse}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(229,9,20,0.15))",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "#a78bfa",
        }}
      >
        <span style={{ fontSize: "14px" }}>✦</span>
        AI Sentiment Analysis
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-purple-400 text-sm py-2">
        <span className="animate-spin inline-block">✦</span>
        Analysing {reviews.length} reviews...
      </div>
    );
  }

  if (!summary) return null;

  const total = summary.positive + summary.mixed + summary.negative;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(229,9,20,0.06))",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-purple-400">✦</span>
        <p className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Review Analysis</p>
        <span className="text-xs text-gray-600 ml-auto">{reviews.length} reviews</span>
      </div>

      {/* Headline */}
      <p className="text-sm font-semibold text-white leading-relaxed">{summary.headline}</p>

      {/* Sentiment bar */}
      <div>
        <div className="flex rounded-full overflow-hidden h-2.5 gap-0.5">
          {summary.positive > 0 && (
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(summary.positive / total) * 100}%`, background: "linear-gradient(90deg, #10b981, #34d399)" }}
            />
          )}
          {summary.mixed > 0 && (
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(summary.mixed / total) * 100}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}
            />
          )}
          {summary.negative > 0 && (
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(summary.negative / total) * 100}%`, background: "linear-gradient(90deg, #ef4444, #f87171)" }}
            />
          )}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-xs text-emerald-400">✓ {summary.positive}% positive</span>
          <span className="text-xs text-amber-400">~ {summary.mixed}% mixed</span>
          <span className="text-xs text-red-400">✕ {summary.negative}% negative</span>
        </div>
      </div>

      {/* Themes */}
      {summary.themes?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.themes.map((t, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Best quote */}
      {summary.bestQuote && (
        <blockquote className="text-xs text-gray-400 italic border-l-2 border-purple-500/40 pl-3 leading-relaxed">
          "{summary.bestQuote}"
        </blockquote>
      )}
    </div>
  );
}
