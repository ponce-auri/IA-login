import React, { useState } from 'react';
import { Edit3, ShieldAlert, KeyRound, Calendar, Mail, User, X, CheckCircle } from 'lucide-react';
import { useAuth, useToast } from '../App';
import api from '../services/api';

export default function Profile() {
  const { user, updateUserInfo } = useAuth();
  const { addToast } = useToast();

  // Modal open states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      addToast('El nombre y el correo electrónico son obligatorios', 'error');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/auth/profile', profileForm);
      updateUserInfo(response.data);
      addToast('Perfil actualizado correctamente', 'success');
      setIsEditProfileOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al actualizar el perfil', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      addToast('Todos los campos son obligatorios', 'error');
      return;
    }

    if (newPassword.length < 8) {
      addToast('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      addToast('La nueva contraseña y su confirmación no coinciden', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.put('/auth/change-password', passwordForm);
      addToast(response.data.message || 'Contraseña actualizada exitosamente', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setIsChangePasswordOpen(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cambiar la contraseña', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Mi Perfil</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Configura tus datos de acceso y seguridad de tu cuenta de administrador
        </p>
      </div>

      {/* Profile Dashboard Layout */}
      <div className="dashboard-grid">
        
        {/* Left Column: Avatar & Quick Info Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user?.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{user?.email}</p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => {
              setProfileForm({ name: user.name, email: user.email });
              setIsEditProfileOpen(true);
            }}>
              <Edit3 size={16} />
              Editar Perfil
            </button>
            <button className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(true)}>
              <KeyRound size={16} />
              Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Right Column: Account Details */}
        <div className="glass-card" style={{ maxWidth: 'none', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
            Detalles de la Cuenta
          </h3>
          
          <div className="profile-info-item">
            <span className="profile-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} />
              Nombre Completo
            </span>
            <span style={{ fontWeight: 500 }}>{user?.name}</span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} />
              Correo Electrónico
            </span>
            <span style={{ fontWeight: 500 }}>{user?.email}</span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} />
              Fecha de Registro
            </span>
            <span style={{ fontWeight: 500 }}>{formatDate(user?.createdAt)}</span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.isVerified ? <CheckCircle size={16} className="badge-success" style={{ background: 'none', border: 'none', padding: 0 }} /> : <ShieldAlert size={16} className="badge-warning" style={{ background: 'none', border: 'none', padding: 0 }} />}
              Estado de Verificación
            </span>
            <span>
              {user?.isVerified ? (
                <span className="badge badge-success">Verificado</span>
              ) : (
                <span className="badge badge-warning">Pendiente</span>
              )}
            </span>
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">
              <h3 style={{ fontSize: '1.25rem' }}>Editar Perfil</h3>
              <button className="modal-close-btn" onClick={() => setIsEditProfileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Nombre Completo</label>
                <div className="input-container">
                  <input
                    id="edit-name"
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                  <User className="input-icon" size={18} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="edit-email">Correo Electrónico</label>
                <div className="input-container">
                  <input
                    id="edit-email"
                    type="email"
                    className="form-input"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                  <Mail className="input-icon" size={18} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditProfileOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                  {profileLoading ? <span className="spinner"></span> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">
              <h3 style={{ fontSize: '1.25rem' }}>Cambiar Contraseña</h3>
              <button className="modal-close-btn" onClick={() => setIsChangePasswordOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="currentPassword">Contraseña Actual</label>
                <div className="input-container">
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                  <KeyRound className="input-icon" size={18} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">Nueva Contraseña (mín. 8 caracteres)</label>
                <div className="input-container">
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                  <KeyRound className="input-icon" size={18} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
                <div className="input-container">
                  <input
                    id="confirmNewPassword"
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    required
                  />
                  <KeyRound className="input-icon" size={18} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? <span className="spinner"></span> : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
