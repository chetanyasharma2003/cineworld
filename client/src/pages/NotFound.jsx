import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-black text-red-600 mb-2">404</p>
      <h1 className="text-2xl md:text-3xl font-black mb-3">Page not found</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or was moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all"
        >
          ← Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition-all"
        >
          🏠 Home
        </button>
      </div>
    </div>
  );
}
