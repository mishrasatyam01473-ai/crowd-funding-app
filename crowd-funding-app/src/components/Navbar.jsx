import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthUser, clearAuthUser } from '../utils/auth.js';
import { getStoredTheme, setStoredTheme } from '../utils/theme.js';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getAuthUser());
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser());
    const syncTheme = () => setTheme(getStoredTheme());

    syncUser();
    syncTheme();

    window.addEventListener('authChange', syncUser);
    window.addEventListener('storage', syncUser);
    window.addEventListener('themeChange', syncTheme);

    return () => {
      window.removeEventListener('authChange', syncUser);
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('themeChange', syncTheme);
    };
  }, [location.pathname]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
    setIsMobileOpen(false);
    navigate('/user-login');
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
  };

  const handleHomeClick = () => {
    setIsMobileOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/', { replace: true });
    } else {
      navigate('/');
    }
  };

  const handleAboutClick = () => {
    setIsMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      navigate('/#about', { replace: true });
    } else {
      navigate('/#about');
    }
  };

  const navigateTo = (path) => {
    setIsMobileOpen(false);
    navigate(path);
  };

  // If user is logged out (e.g. login/signup page)
  if (!user) {
    return (
      <header className="navbar-top-logged-out">
        <div className="navbar-top-container">
          <div className="navbar-brand">
            <button
              className="brand-button"
              onClick={() => navigate('/user-login')}
              title="Crowd-Fund Home"
            >
              Crowd-Fund
            </button>
          </div>

          <div className="navbar-actions">
            <button
              className="theme-toggle-btn"
              onClick={handleToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <div className="user-action-group">
              <button
                className="btn-user"
                onClick={() => navigate('/user-login')}
                title="Log in to your account"
              >
                Sign In
              </button>
              <button
                className="btn-signup"
                onClick={() => navigate('/signup')}
                title="Create a new account"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // When user is authenticated: Vertical Sidebar Navbar
  return (
    <>
      {/* Mobile Top Bar for Phone & Tablet (<960px) */}
      <div className="navbar-mobile-header">
        <div className="mobile-header-content">
          <button
            className="mobile-menu-trigger"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle navigation menu"
            title="Toggle menu"
          >
            {isMobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <button
            className="mobile-brand-btn"
            onClick={handleHomeClick}
            title="Crowd-Fund Home"
          >
            Crowd-Fund
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="navbar-drawer-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Vertical Navigation Bar */}
      <aside className={`navbar-vertical ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand header */}
        <div className="navbar-vertical-brand">
          <div className="vertical-brand-row">
            <button className="brand-button" onClick={handleHomeClick} title="Crowd-Fund Home">
              Crowd-Fund
            </button>
            <button
              className="drawer-close-btn"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
              title="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <span className="brand-tagline">Open Funding Platform</span>
        </div>

        {/* Vertical menu navigation */}
        <nav className="navbar-vertical-nav">
          <div className="nav-section-label">Navigation</div>
          <ul className="navbar-vertical-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`}
                onClick={handleHomeClick}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="nav-text">Home</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${location.hash === '#about' ? 'active' : ''}`}
                onClick={handleAboutClick}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span className="nav-text">About</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/create-programme' ? 'active' : ''}`}
                onClick={() => navigateTo('/create-programme')}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="nav-text">Create Programme</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/query-form' ? 'active' : ''}`}
                onClick={() => navigateTo('/query-form')}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="nav-text">Query Form</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={() => navigateTo('/dashboard')}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span className="nav-text">Dashboard</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/donation-history' ? 'active' : ''}`}
                onClick={() => navigateTo('/donation-history')}
              >
                <svg className="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="nav-text">My Donations</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Bottom actions: Theme Toggle + User Info + Logout */}
        <div className="navbar-vertical-footer">
          {/* Light / Dark Mode Toggle Button */}
          <button
            className="vertical-theme-toggle"
            onClick={handleToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Light and Dark Mode"
          >
            <div className="theme-toggle-info">
              {theme === 'dark' ? (
                <>
                  <svg className="theme-icon sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span className="theme-name">Light Mode</span>
                </>
              ) : (
                <>
                  <svg className="theme-icon moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span className="theme-name">Dark Mode</span>
                </>
              )}
            </div>
            <span className={`theme-toggle-switch ${theme}`}>
              <span className="toggle-switch-handle" />
            </span>
          </button>

          {/* User profile identifier badge */}
          <div className="vertical-user-badge" title={user.mailid || user.name}>
            <span className="user-status-dot" />
            <div className="user-meta">
              <span className="user-name-text">
                {user.name || user.mailid?.split('@')[0] || 'User'}
              </span>
              <span className="user-role-label">Supporter</span>
            </div>
          </div>

          {/* Logout button */}
          <button
            className="btn-vertical-logout"
            onClick={handleLogout}
            title={`Log out from ${user.mailid || 'account'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;