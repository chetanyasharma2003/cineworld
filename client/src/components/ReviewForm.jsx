import React, { useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

// Star Picker Component
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? null : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-all duration-100 hover:scale-125"
          >
            <span className={
              star <= (hovered || value)
                ? "text-yellow-400"
                : "text-gray-700"
            }>
              ★
            </span>
          </button>
        ))}
      </div>
      {(hovered || value) ? (
        <span className="text-xs text-gray-400 font-medium">
          {labels[hovered || value]}
          {value && !hovered && " — click to change"}
        </span>
      ) : (
        <span className="text-xs text-gray-600">Optional rating</span>
      )}
    </div>
  );
}

// Rating Distribution Bar
function RatingDistribution({ distribution, totalRatings }) {
  if (!totalRatings) return null;

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const pct = totalRatings ? Math.round((count / totalRatings) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="text-yellow-400 w-3">{star}</span>
            <span className="text-yellow-400 text-xs">★</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-gray-600 w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Inline edit component for existing reviews
export function ReviewEditInline({ review, onSave, onCancel }) {
  const [content, setContent] = useState(review.content);
  const [rating, setRating] = useState(review.rating || null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (content.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await api.put(`/reviews/${review._id}`, { content, rating });
      onSave(res.data);
      toast.success("Review updated!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update review."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-white/5 border border-yellow-500/30 rounded-2xl">
      <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest">Editing your review</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-red-500/60 transition-all resize-none"
      />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading || content.trim().length < 2}
          className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-sm font-semibold transition-all">
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReviewForm({ movieId, movieTitle = "", setReviews, openLogin, ratingData, setRatingData }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return openLogin();

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/reviews", { movieId, movieTitle, content, rating });
      setReviews((prev) => [res.data, ...prev]);
      setContent("");
      setRating(null);
      setSubmitted(true);
      toast.success("Review submitted! ⭐");
      setTimeout(() => setSubmitted(false), 3000);

      if (rating && setRatingData) {
        try {
          const ratingRes = await api.get(`/reviews/${movieId}/rating`);
          setRatingData(ratingRes.data);
        } catch { /* ignore */ }
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Could not submit your review.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* CineWorld Community Rating */}
      {ratingData && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
            CineWorld Community Rating
          </h3>
          {ratingData.totalRatings > 0 ? (
            <div className="flex gap-6 items-start">
              {/* Big score */}
              <div className="text-center shrink-0">
                <p className="text-4xl font-black text-yellow-400">{ratingData.avgRating}</p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-sm ${s <= Math.round(ratingData.avgRating) ? "text-yellow-400" : "text-gray-700"}`}>★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{ratingData.totalRatings} ratings</p>
              </div>
              {/* Distribution */}
              <div className="flex-1">
                <RatingDistribution
                  distribution={ratingData.distribution}
                  totalRatings={ratingData.totalRatings}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No ratings yet — be the first!</p>
          )}
        </div>
      )}

      {/* Review Form */}
      {submitted ? (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          ✓ Review submitted! Thank you.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Star Rating */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Your Rating</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Text Area */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Your Review</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={user ? "Write your thoughts about this movie..." : "Sign in to write a review"}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/60 transition-all resize-none"
              required
              onClick={() => { if (!user) openLogin(); }}
              readOnly={!user}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : !user ? (
              "Sign in to Review"
            ) : (
              `Submit Review${rating ? ` · ${rating}★` : ""}`
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default ReviewForm;