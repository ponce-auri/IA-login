import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, KeyRound, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from '../App';
import api from '../services/api';

export default function ForgotPassword() {
  const { token } = useParams(); // Returns { token } if routed via /reset-password/:token
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State for request flow
  const [recoveryType, setRecoveryType] = useState('password'); // 'username' or 'password'
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // State for reset flow
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast('Por favor ingrese su correo electrónico', 'error');
      return;
    }

    setRequestLoading(true);
    try {
      if (recoveryType === 'username') {
        await api.post('/recovery/username', { email });
        addToast('Correo enviado', 'success');
      } else {
        await api.post('/recovery/password-request', { email });
        addToast('Correo enviado', 'success');
      }
      setEmail('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error en el proceso de recuperación';
      addToast(errMsg, 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  const validateReset = () => {
    const tempErrors = {};
    if (!password) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 8) {
      tempErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!validateReset()) {
      addToast('Por favor corrige las validaciones', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/recovery/password-reset', {
        token,
        password,
        confirmPassword,
      });
      addToast(response.data.message || 'Contraseña actualizada exitosamente', 'success');
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al restablecer contraseña';
      addToast(errMsg, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Render Reset Form if token exists in parameters
  if (token) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              Restablecer Contraseña
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Ingrese su nueva contraseña de acceso
            </p>
          </div>

          <form onSubmit={handleResetSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Nueva Contraseña (mínimo 8 caracteres)
              </label>
              <div className="input-container">
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
                <Lock className="input-icon" size={18} />
              </div>
              {errors.password && <span className="validation-error">{errors.password}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="confirmPassword">
                Confirmar Nueva Contraseña
              </label>
              <div className="input-container">
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                />
                <Lock className="input-icon" size={18} />
              </div>
              {errors.confirmPassword && <span className="validation-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={resetLoading}>
              {resetLoading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Actualizar Contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Otherwise render Recovery Request Form
  return (
    <div className="auth-wrapper">
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" className="link-action" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={16} />
            Volver al Login
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Recuperar Cuenta
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sigue los pasos para restablecer tu cuenta
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.75rem', textAlign: 'center', display: 'block' }}>
            ¿Qué olvidaste?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${recoveryType === 'username' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.9rem', padding: '0.6rem 0.5rem' }}
              onClick={() => setRecoveryType('username')}
            >
              <UserCheck size={16} />
              Recuperar Usuario
            </button>
            <button
              type="button"
              className={`btn ${recoveryType === 'password' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.9rem', padding: '0.6rem 0.5rem' }}
              onClick={() => setRecoveryType('password')}
            >
              <KeyRound size={16} />
              Recuperar Contraseña
            </button>
          </div>
        </div>

        <form onSubmit={handleRequestSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="email">
              Ingresa tu Correo Electrónico
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
            <p className="validation-info">
              {recoveryType === 'username'
                ? 'Te enviaremos un correo simulado con tu nombre de usuario registrado.'
                : 'Te enviaremos un correo simulado con un enlace seguro para restablecer tu contraseña.'}
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={requestLoading}>
            {requestLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Mail size={18} />
                Enviar Correo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
