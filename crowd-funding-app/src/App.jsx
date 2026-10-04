import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import IndexPage from './components/IndexPage.jsx';
import CreateProgramme from './pages/CreateProgramme.jsx';
import QueryForm from './pages/QueryForm.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DonationForm from './pages/DonationForm.jsx';
import DonationHistory from './pages/DonationHistory.jsx';
import { getAuthUser } from './utils/auth.js';

export const getStoredUser = getAuthUser;

function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/user-login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredUser()));

  useEffect(() => {
    const handleAuthSync = () => setIsAuthenticated(Boolean(getStoredUser()));

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
        {/* Auth routes */}
        <Route path="/user-login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/user-login" replace />} />
        <Route path="/signup" element={<Login initialSignUp={true} />} />
        <Route path="/register" element={<Login initialSignUp={true} />} />

        {/* Protected application routes */}
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

        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>

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
