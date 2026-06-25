import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, { name, email, password });
      if (res.data.emailVerificationSent) {
        setVerificationSent(true);
        toast.success("Account created! Check your email to verify.");
      } else {
        toast.success("Account created! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 60%)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-xl">C</div>
          <span className="text-2xl font-black">Cine<span className="text-red-500">World</span></span>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

          {verificationSent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-black mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-4">
                We sent a verification link to <span className="text-white font-semibold">{email}</span>.
                Click the link to activate your account.
              </p>
              <p className="text-xs text-gray-600 mb-6">Link expires in 24 hours.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-all"
              >
                Go to Login
              </button>
            </div>
          ) : (
          <>
          <h2 className="text-2xl font-black mb-1">Create account</h2>
          <p className="text-gray-400 text-sm mb-6">Join CineWorld — it's free</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all placeholder-gray-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all placeholder-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-red-500/60 transition-all placeholder-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          </>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          © 2024 CineWorld. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;