import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Register from './pages/Register';
import Login from './pages/Login';
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
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

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/meeting-request/:postId" element={<ProtectedRoute><MeetingRequest /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;