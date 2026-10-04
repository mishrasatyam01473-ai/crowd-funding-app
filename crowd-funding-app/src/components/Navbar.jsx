import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthUser, clearAuthUser } from '../utils/auth.js';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getAuthUser());

  // Sync logged in user state on mount, navigation, and custom auth events
  useEffect(() => {
    const syncUser = () => {
      setUser(getAuthUser());
    };

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

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-brand">
          <button
            className="brand-button"
            onClick={() => navigate(user ? '/' : '/user-login')}
          >
            Crowd-Fund
          </button>
        </div>


        {/* Navigation Menu (Visible only when logged in) */}
        {user && (
          <ul className="navbar-menu">

            {/* Home */}
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => navigate('/')}
              >
                Home
              </button>
            </li>


            {/* About */}
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
                onClick={() => navigate('/about')}
              >
                About
              </button>
            </li>


            {/* Create Programme */}
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/create-programme' ? 'active' : ''}`}
                onClick={() => navigate('/create-programme')}
              >
                Create Programme
              </button>
            </li>


            {/* Query Form */}
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/query-form' ? 'active' : ''}`}
                onClick={() => navigate('/query-form')}
              >
                Query Form
              </button>
            </li>


            {/* Dashboard */}
            <li className="nav-item">
              <button
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            </li>


            {/* Donation History Nav Link */}
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


        {/* User Actions */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-action-group">
              <button
                className="btn-history"
                onClick={() => navigate('/donation-history')}
                title="View your donation history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: '5px' }}>
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                My Donations
              </button>

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