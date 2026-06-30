import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '../App';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'El nombre completo es obligatorio';
    
    if (!formData.email) {
      tempErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'El formato de correo no es válido';
    }

    if (!formData.password) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      tempErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.confirmPassword !== formData.password) {
      tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Por favor corrige las validaciones', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      addToast(response.data.message, 'success');
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error al registrar usuario';
      addToast(errMsg, 'error');
      if (errMsg.includes('correo') || errMsg.includes('registrado')) {
        setErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado' }));
      }
    } finally {
      setLoading(false);
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, hsl(230, 80%, 50%) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--primary-glow)',
            }}>
              <svg viewBox="0 0 24 24" width="26" height="26" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
          </div>
          <h2 className="gradient-text" style={{ fontSize: '1.6rem', marginBottom: '0.2rem', fontWeight: 800 }}>
            Biblioteca Ruta Literaria
          </h2>
          <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            El camino del libro
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Regístrate para obtener acceso instantáneo
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nombre Completo
            </label>
            <div className="input-container">
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={handleChange}
              />
              <User className="input-icon" size={18} />
            </div>
            {errors.name && (
              <span className="validation-error">
                <AlertCircle size={14} />
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="input-container">
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="juan@correo.com"
                value={formData.email}
                onChange={handleChange}
              />
              <Mail className="input-icon" size={18} />
            </div>
            {errors.email && (
              <span className="validation-error">
                <AlertCircle size={14} />
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña (mínimo 8 caracteres)
            </label>
            <div className="input-container">
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <Lock className="input-icon" size={18} />
            </div>
            {errors.password && (
              <span className="validation-error">
                <AlertCircle size={14} />
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="confirmPassword">
              Confirmar Contraseña
            </label>
            <div className="input-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <Lock className="input-icon" size={18} />
            </div>
            {errors.confirmPassword && (
              <span className="validation-error">
                <AlertCircle size={14} />
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <UserPlus size={18} />
                Crear Cuenta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
