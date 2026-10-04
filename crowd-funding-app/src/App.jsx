import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import IndexPage from './components/IndexPage.jsx'
import CreateProgramme from './pages/CreateProgramme.jsx'
import QueryForm from './pages/QueryForm.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DonationForm from './pages/DonationForm.jsx'
import DonationHistory from './pages/DonationHistory.jsx'

// Helper to retrieve and validate the stored authenticated user
export function getStoredUser() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  try {
    const parsed = JSON.parse(storedUser);
    return parsed && (parsed.id || parsed.mailid) ? parsed : null;
  } catch {
    return null;
  }
}

// Protected Route Component: Restricts access so unauthenticated visitors cannot access any page
function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    // Redirect unauthenticated visitors immediately to login or signup
    return <Navigate to="/user-login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredUser()));

  // Synchronize authentication state across window events and storage
  useEffect(() => {
    const handleAuthSync = () => {
      setIsAuthenticated(Boolean(getStoredUser()));
    };

    window.addEventListener('authChange', handleAuthSync);
    window.addEventListener('storage', handleAuthSync);
    return () => {
      window.removeEventListener('authChange', handleAuthSync);
      window.removeEventListener('storage', handleAuthSync);
    };
  }, []);

  const isAuthRoute = ['/user-login', '/login', '/signup', '/register'].includes(location.pathname);

  return (
    <div className="mainPage">
      <Navbar />

      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/user-login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/user-login" replace />} />
        <Route path="/signup" element={<Login initialSignUp={true} />} />
        <Route path="/register" element={<Login initialSignUp={true} />} />

        {/* All App Routes are Protected: Login or Signup required */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <IndexPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-programme"
          element={
            <ProtectedRoute>
              <CreateProgramme />
            </ProtectedRoute>
          }
        />
        <Route
          path="/query-form"
          element={
            <ProtectedRoute>
              <QueryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <ProtectedRoute>
              <DonationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donation-history"
          element={
            <ProtectedRoute>
              <DonationHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-donations"
          element={
            <ProtectedRoute>
              <DonationHistory />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: Any undefined route redirects to login */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>

      {/* Footer is only displayed when authenticated on main app pages */}
      {isAuthenticated && !isAuthRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
