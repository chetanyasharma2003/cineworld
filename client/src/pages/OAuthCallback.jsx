/**
 * OAuthCallback — landing page after Google OAuth redirect.
 *
 * The server redirects to /oauth-callback?token=<accessToken> after a
 * successful Google login. This page reads the token, saves it, fetches
 * the user profile, then redirects to home (or wherever the user came from).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api";

export default function OAuthCallback() {
  const navigate         = useNavigate();
  const { loginUser }    = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const err    = params.get("error");

    if (err || !token) {
      setError("Google login failed. Please try again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    // Temporarily set token so axios can fetch /auth/me
    localStorage.setItem("token", token);

    api.get("/auth/me")
      .then(res => {
        loginUser({ token, user: res.data.user });
        window.history.replaceState({}, "", "/");
        navigate("/", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setError("Could not load your profile. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      {error ? (
        <>
          <div className="text-red-400 text-sm">{error}</div>
          <p className="text-gray-600 text-xs">Redirecting to login…</p>
        </>
      ) : (
        <>
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Signing you in with Google…</p>
        </>
      )}
    </div>
  );
}
