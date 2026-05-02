import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import MeetingRequest from './pages/MeetingRequest';
import Inbox from './pages/Inbox';
import MyPosts from './pages/MyPosts';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Helper: decode JWT to get user info
const getUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// ── Auth Guard: redirects to /login if not authenticated ──────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ── Profile Guard: redirects to /complete-profile if profile incomplete ───
// Wraps ProtectedRoute — user must be logged in AND have completed profile
const ProfileGuard = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const profileCompleted = localStorage.getItem('profileCompleted');
  if (profileCompleted !== 'true') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

// Navigation Bar Component
function Navbar() {
  const location = useLocation();
  const user = getUser();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const isActive = (path: string) => location.pathname === path;

  // Hide navbar on complete-profile page (minimal distraction)
  if (location.pathname === '/complete-profile') {
    return (
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/complete-profile" className="navbar-brand">
            <span className="brand-icon">⚕</span>
            Health AI
          </Link>
          <div className="navbar-links">
            <button onClick={handleLogout} className="nav-link danger">
              ↪ Sign Out
            </button>
          </div>
        </div>
      </nav>
    );
  }

  if (!token) {
    return (
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/login" className="navbar-brand">
            <span className="brand-icon">⚕</span>
            Health AI
          </Link>
          <div className="navbar-links">
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
              Sign In
            </Link>
            <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">⚕</span>
          Health AI
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            🔍 Explore
          </Link>
          <Link to="/my-posts" className={`nav-link ${isActive('/my-posts') ? 'active' : ''}`}>
            📋 My Posts
          </Link>
          <Link to="/inbox" className={`nav-link ${isActive('/inbox') ? 'active' : ''}`}>
            📥 Inbox
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            👤 Profile
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              🛡️ Admin
            </Link>
          )}
          <button onClick={handleLogout} className="nav-link danger">
            ↪ Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1e1f33',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
        }}
      />

      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Profile Completion — requires auth but NOT completed profile */}
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

            {/* Protected Routes — require auth AND completed profile */}
            <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />
            <Route path="/create-post" element={<ProfileGuard><CreatePost /></ProfileGuard>} />
            <Route path="/my-posts" element={<ProfileGuard><MyPosts /></ProfileGuard>} />
            <Route path="/profile" element={<ProfileGuard><Profile /></ProfileGuard>} />
            <Route path="/inbox" element={<ProfileGuard><Inbox /></ProfileGuard>} />
            <Route path="/meeting-request/:postId" element={<ProfileGuard><MeetingRequest /></ProfileGuard>} />
            <Route path="/admin" element={<ProfileGuard><AdminDashboard /></ProfileGuard>} />

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;