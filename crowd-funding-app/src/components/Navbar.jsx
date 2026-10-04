import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthUser, clearAuthUser } from '../utils/auth.js';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getAuthUser());

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser());

    syncUser();
    window.addEventListener('authChange', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('authChange', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuthUser();
    setUser(null);
    navigate('/user-login');
  };

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/', { replace: true });
    } else {
      navigate('/');
    }
  };

  const handleAboutClick = () => {
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button
            className="brand-button"
            onClick={handleHomeClick}
            title="Crowd-Fund Home"
          >
            Crowd-Fund
          </button>
        </div>

        {user && (
          <ul className="navbar-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`}
                onClick={handleHomeClick}
              >
                Home
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${location.hash === '#about' ? 'active' : ''}`}
                onClick={handleAboutClick}
              >
                About
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/create-programme' ? 'active' : ''}`}
                onClick={() => navigate('/create-programme')}
              >
                Create Programme
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/query-form' ? 'active' : ''}`}
                onClick={() => navigate('/query-form')}
              >
                Query Form
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/donation-history' ? 'active' : ''}`}
                onClick={() => navigate('/donation-history')}
              >
                My Donations
              </button>
            </li>
          </ul>
        )}

        <div className="navbar-actions">
          {user ? (
            <div className="user-action-group">
              <span className="user-identity-badge" title={user.mailid || user.name}>
                <span className="user-status-dot" />
                <span className="user-name-text">
                  {user.name || user.mailid?.split('@')[0] || 'User'}
                </span>
              </span>

              <button
                className="btn-logout"
                onClick={handleLogout}
                title={`Logged in as ${user.mailid || 'User'}`}
              >
                Logout
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;