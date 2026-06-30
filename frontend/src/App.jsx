import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './services/api';

// Components (to be created next)
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import FakeMailbox from './components/FakeMailbox';
import Books from './components/Books';
import AddBook from './components/AddBook';
import EditBook from './components/EditBook';
import Readers from './components/Readers';
import Loans from './components/Loans';
import History from './components/History';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Contexts
const AuthContext = createContext(null);
const ToastContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useToast = () => useContext(ToastContext);

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Layout component for administrative panels
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

// Route callback to handle email verification link
const VerifyAccount = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { token } = useParamsHook();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify/${token}`);
        addToast(response.data.message || 'Cuenta verificada exitosamente', 'success');
        navigate('/', { replace: true });
      } catch (err) {
        addToast(err.response?.data?.message || 'Token de verificación inválido o expirado', 'error');
        navigate('/', { replace: true });
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [token, navigate, addToast]);

  return (
    <div className="auth-wrapper">
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <h2 className="gradient-text mb-4" style={{ marginBottom: '1.5rem' }}>Verificando tu cuenta</h2>
        <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }}></div>
        <p className="validation-info">Por favor espera un momento...</p>
      </div>
    </div>
  );
};

// Custom Hook to extract params since React Router DOM useParams can be tricky when not nested cleanly
const useParamsHook = () => {
  const location = useLocation();
  const parts = location.pathname.split('/');
  return { token: parts[parts.length - 1] };
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast functions
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check if token exists on boot and load profile
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Token inválido o vencido al arrancar, limpiando sesión...', error);
          // Limpiar TODO localStorage para garantizar estado limpio
          localStorage.clear();
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    setUser({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt,
      isVerified: userData.isVerified,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUserInfo = (updatedData) => {
    if (updatedData.token) {
      localStorage.setItem('token', updatedData.token);
    }
    setUser((prev) => ({
      ...prev,
      name: updatedData.name,
      email: updatedData.email,
    }));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <AuthContext.Provider value={{ user, loading, login, logout, updateUserInfo }}>
        <Router>
          <div className="app-container">
            {/* Animated Library Background */}
            <div className="library-bg-animation">
              <div className="bg-glow-orb orb-top-left"></div>
              <div className="bg-glow-orb orb-bottom-right"></div>
              
              {/* SVG Floating Books and Pages */}
              <div className="floating-book book-1">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="floating-book book-2">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div className="floating-book book-3">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="floating-book book-4">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="floating-book book-5">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div className="floating-book book-6">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="floating-book book-7">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="floating-book book-8">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div className="floating-book book-9">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="floating-book book-10">
                <svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            </div>

            {/* Application Routes */}
            <Routes>
              <Route
                path="/"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <Login />
                }
              />
              <Route
                path="/register"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <Register />
                }
              />
              <Route
                path="/forgot-password"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
                }
              />
              <Route path="/verify/:token" element={<VerifyAccount />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/books"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Books />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/books/add"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AddBook />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/books/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditBook />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/readers"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Readers />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/loans"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Loans />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <History />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Persistent Simulated Email Inbox */}
            <FakeMailbox />

            {/* Toast Notifications */}
            <div className="toast-container">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`toast toast-${t.type}`}
                  onClick={() => removeToast(t.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>{t.message}</div>
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>✕</span>
                </div>
              ))}
            </div>
          </div>
        </Router>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}
