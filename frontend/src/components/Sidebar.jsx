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
      <div className="sidebar-brand">
        <Library className="gradient-text" style={{ color: 'var(--primary)' }} size={28} />
        <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          BiblioControl
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
