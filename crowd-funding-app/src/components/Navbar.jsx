import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-brand">
          <button
            className="brand-button"
            onClick={() => navigate('/')}
          >
            Crowd-Fund
          </button>
        </div>


        {/* Navigation Menu */}
        <ul className="navbar-menu">

          {/* Home */}
          <li className="nav-item">
            <button
              className="nav-link"
              onClick={() => navigate('/')}
            >
              Home
            </button>
          </li>


          {/* About */}
          <li className="nav-item">
            <button
              className="nav-link"
              onClick={() => navigate('/about')}
            >
              About
            </button>
          </li>


          {/* Create Programme */}
          <li className="nav-item">
            <button
              className="nav-link"
              onClick={() => navigate('/create-programme')}
            >
              Create Programme
            </button>
          </li>


          {/* Query Form */}
          <li className="nav-item">
            <button
              className="nav-link"
              onClick={() => navigate('/query-form')}
            >
              Query Form
            </button>
          </li>

        </ul>


        {/* User Login */}
        <div className="navbar-actions">
          <button
            className="btn-user"
            onClick={() => navigate('/user-login')}
          >
            User Login
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;