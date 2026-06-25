import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function EmailVerifyBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("ev_banner_dismissed") === "1"
  );
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent! Check your inbox.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("ev_banner_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 text-sm flex-1">
          <span className="text-yellow-400 shrink-0">⚠️</span>
          <p className="text-yellow-200 text-xs sm:text-sm">
            Email not verified. <span className="hidden sm:inline">Some features may be limited.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {sending ? "Sending..." : "Resend Email"}
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none px-2 py-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
