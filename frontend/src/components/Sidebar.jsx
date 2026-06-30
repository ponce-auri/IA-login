import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Key, History, User, LogOut, Library } from 'lucide-react';
import { useAuth, useToast } from '../App';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Sesión cerrada correctamente', 'success');
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Library className="gradient-text" style={{ color: 'var(--primary)', flexShrink: 0 }} size={24} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
              Biblioteca
            </span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
              Ruta Literaria
            </span>
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.02em', paddingLeft: '32px', marginTop: '2px' }}>
          El camino del libro
        </span>
      </div>

      <nav className="sidebar-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/books" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <BookOpen size={18} />
          Gestión de Libros
        </NavLink>

        <NavLink 
          to="/readers" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <Users size={18} />
          Gestión de Usuarios
        </NavLink>

        <NavLink 
          to="/loans" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <Key size={18} />
          Préstamos
        </NavLink>

        <NavLink 
          to="/history" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <History size={18} />
          Historial
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `sidebar-item-link ${isActive ? 'active' : ''}`}
          onClick={toggleSidebar}
        >
          <User size={18} />
          Perfil
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.9rem' }} 
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
