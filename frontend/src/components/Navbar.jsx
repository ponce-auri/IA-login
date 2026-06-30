import React from 'react';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

export default function Navbar({ toggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn-icon" 
          onClick={toggleSidebar} 
          style={{ display: 'none', cursor: 'pointer' }}
          id="sidebar-toggle-btn"
        >
          <Menu size={20} />
        </button>
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            #sidebar-toggle-btn { display: inline-flex !important; }
          }
        `}} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }} className="gradient-text">Biblioteca Ruta Literaria</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500, letterSpacing: '0.03em' }}>El camino del libro</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrador</span>
          </div>
          <div className="profile-avatar" style={{ width: '40px', height: '40px', fontSize: '1.1rem', margin: 0 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </Link>
      </div>
    </header>
  );
}
