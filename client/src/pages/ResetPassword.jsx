import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function ResetPassword() {
  const [searchParams]        = useSearchParams();
  const [password, setPass]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();
  const token                 = searchParams.get("token");

  if (!token) return (
    <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">Invalid or missing reset token.</p>
        <button onClick={() => navigate("/forgot-password")} className="px-5 py-2.5 bg-red-600 rounded-xl text-sm font-semibold">
          Request New Link
        </button>
      </div>
    </div>
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-lg">C</div>
          <span className="text-xl font-black">Cine<span className="text-red-500">World</span></span>
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-4xl mb-4">✅</p>
            <h1 className="text-2xl font-black mb-2">Password reset!</h1>
            <p className="text-gray-400 text-sm mb-6">You can now sign in with your new password.</p>
            <button onClick={() => navigate("/login")}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all">
              Sign In
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-1">Set new password</h1>
            <p className="text-gray-400 text-sm mb-6">Choose a strong password for your account.</p>
            <form onSubmit={submit} className="space-y-4">
              <input type="password" placeholder="New password" value={password}
                onChange={e => setPass(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 placeholder-gray-500" />
              <input type="password" placeholder="Confirm password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 placeholder-gray-500" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
