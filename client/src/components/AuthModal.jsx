import React, { useState } from "react";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";

function AuthModal({ closeModal }) {
  const { loginUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const toggle = () => setIsLogin(!isLogin);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? "/login" : "/signup";

    try {
      setError("");
      const res = await api.post(`/auth${url}`, form);
      loginUser(res.data);
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err, "Authentication failed"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{isLogin ? "Login" : "Signup"}</h2>
        {error && <p className="mb-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              className="p-2 rounded bg-gray-800 text-white"
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
          />
          <input
            type="password"
            name="password"
            placeholder={isLogin ? "Password" : "Min. 8 characters"}
            value={form.password}
            onChange={handleChange}
            className="p-2 rounded bg-gray-800 text-white"
            required
            minLength={isLogin ? undefined : 8}
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>
        <p className="mt-3 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span className="underline cursor-pointer" onClick={toggle}>
            {isLogin ? "Signup" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
