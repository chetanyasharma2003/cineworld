import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }

    fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) { setStatus("success"); setMessage(data.message); }
        else { setStatus("error"); setMessage(data.message || "Verification failed."); }
      })
      .catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(229,9,20,0.15) 0%, transparent 60%)" }}>
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-xl">C</div>
          <span className="text-2xl font-black">Cine<span className="text-red-500">World</span></span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {status === "loading" && (
            <>
              <div className="w-10 h-10 border-2 border-white/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Verifying your email...</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-black mb-2">Email Verified!</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <button onClick={() => navigate("/login")}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-sm transition-all">
                Sign In
              </button>
            </>
          )}
          {status === "error" && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-black mb-2">Verification Failed</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <button onClick={() => navigate("/signup")}
                className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-semibold text-sm transition-all">
                Back to Signup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
