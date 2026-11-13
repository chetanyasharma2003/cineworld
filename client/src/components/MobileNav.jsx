import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useResponsive";
import "./MobileNav.css";

export default function MobileNav({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const handleNavClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await onLogout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <nav className={`mobile-nav ${isOpen ? "open" : ""}`}>
        <div className="mobile-nav-header">
          <h2>Menu</h2>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-nav-content">
          {/* Main Navigation */}
          <div className="nav-section">
            <button onClick={() => handleNavClick("/")} className="nav-link">
              🏠 Home
            </button>
            <button onClick={() => handleNavClick("/browse")} className="nav-link">
              🎬 Browse Movies
            </button>
            <button onClick={() => handleNavClick("/search")} className="nav-link">
              🔍 Search
            </button>
          </div>

          {/* User Navigation */}
          {user && (
            <div className="nav-section">
              <button onClick={() => handleNavClick("/watchlist")} className="nav-link">
                📋 Watchlist
              </button>
              <button onClick={() => handleNavClick("/reviews")} className="nav-link">
                ⭐ My Reviews
              </button>
              <button onClick={() => handleNavClick("/following")} className="nav-link">
                👥 Following
              </button>
              <button onClick={() => handleNavClick("/profile")} className="nav-link">
                👤 Profile
              </button>
            </div>
          )}

          {/* AI Features */}
          <div className="nav-section">
            <button onClick={() => handleNavClick("/ai-recommendations")} className="nav-link">
              ✨ AI Recommendations
            </button>
            <button onClick={() => handleNavClick("/mood-picks")} className="nav-link">
              😊 Mood Picks
            </button>
          </div>

          {/* Admin */}
          {user?.role === "admin" && (
            <div className="nav-section">
              <button onClick={() => handleNavClick("/admin/dashboard")} className="nav-link admin">
                🛡️ Admin Panel
              </button>
            </div>
          )}

          {/* Auth */}
          <div className="nav-section nav-auth">
            {user ? (
              <>
                <div className="user-info">
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick("/login")}
                  className="nav-link"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavClick("/signup")}
                  className="nav-link"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
