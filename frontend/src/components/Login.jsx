import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth, useToast } from '../App';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Al montar el Login, limpiar cualquier token residual
  useEffect(() => {
    localStorage.clear();
  }, []);

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Por favor complete todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      addToast(`¡Bienvenido de nuevo, ${response.data.name}!`, 'success');
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al iniciar sesión';
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary) 0%, hsl(230, 80%, 50%) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--primary-glow)',
            }}>
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Biblioteca
            </span>
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.9rem', marginBottom: '0.25rem', fontWeight: 800, lineHeight: 1.1 }}>
            Ruta Literaria
          </h1>
          <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            El camino del libro
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Accede a tu panel de control seguro
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="input-container">
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
                Contraseña
              </label>
              <Link to="/forgot-password" className="link-action" style={{ fontSize: '0.8rem' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="input-container">
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <LogIn size={18} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            ¿No tienes una cuenta aún?
          </p>
          <Link to="/register" className="btn btn-secondary">
            <UserPlus size={18} />
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}
