import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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

        {sent ? (
          <div className="text-center">
            <p className="text-4xl mb-4">📧</p>
            <h1 className="text-2xl font-black mb-2">Check your email</h1>
            <p className="text-gray-400 text-sm mb-6">
              If <span className="text-white">{email}</span> is registered, you'll receive a reset link shortly.
            </p>
            <button onClick={() => navigate("/login")}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all">
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black mb-1">Forgot password?</h1>
            <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/50 placeholder-gray-500"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember it?{" "}
              <button onClick={() => navigate("/login")} className="text-red-400 hover:text-red-300 font-semibold">
                Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
