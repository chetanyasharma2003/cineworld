import { lazy, Suspense } from "react";
import BackToTop from "./components/BackToTop";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

// Lazy-load all pages — splits each into its own JS chunk
const Home          = lazy(() => import("./pages/Home"));
const MovieDetail   = lazy(() => import("./pages/MovieDetail"));
const Login         = lazy(() => import("./pages/Login"));
const Signup        = lazy(() => import("./pages/Signup"));
const Watchlist     = lazy(() => import("./pages/Watchlist"));
const Compare       = lazy(() => import("./pages/Compare"));
const NotFound      = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail   = lazy(() => import("./pages/VerifyEmail"));
const Profile       = lazy(() => import("./pages/Profile"));
const Genre         = lazy(() => import("./pages/Genre"));
const ActorDetail   = lazy(() => import("./pages/ActorDetail"));
const TVShows       = lazy(() => import("./pages/TVShows"));
const TVDetail      = lazy(() => import("./pages/TVDetail"));
const Search        = lazy(() => import("./pages/Search"));
const Actors        = lazy(() => import("./pages/Actors"));
const AIMood        = lazy(() => import("./pages/AIMood"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const UserProfile   = lazy(() => import("./pages/UserProfile"));
const MovieCalendar = lazy(() => import("./pages/MovieCalendar"));

// Full-screen spinner shown while a lazy chunk is loading
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movie/:id" element={
          <div className="bg-[#0a0a0a] min-h-screen">
            <Navbar />
            <MovieDetail />
          </div>
        } />
        <Route path="/login"   element={<Login />} />
        <Route path="/signup"  element={<Signup />} />
        <Route path="/mylist"  element={<Navigate to="/watchlist" replace />} />
        <Route path="/watchlist" element={
          <ProtectedRoute>
            <div className="bg-[#0a0a0a] min-h-screen">
              <Navbar />
              <Watchlist />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/genre/:slug"  element={<Genre />} />
        <Route path="/actor/:id"    element={<ActorDetail />} />
        <Route path="/actors"       element={<Actors />} />
        <Route path="/tv"           element={<TVShows />} />
        <Route path="/tv/:id"       element={<TVDetail />} />
        <Route path="/compare"      element={<Compare />} />
        <Route path="/ai"           element={<AIMood />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/oauth-callback"  element={<OAuthCallback />} />
        <Route path="/user/:id"        element={<UserProfile />} />
        <Route path="/calendar"        element={<MovieCalendar />} />
        <Route path="*"                element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppWithExtras() {
  return (
    <>
      <App />
      <BackToTop />
    </>
  );
}

export default AppWithExtras;
