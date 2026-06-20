import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, CheckCircle, Bookmark, ArrowUpRight, Activity } from 'lucide-react';
import { useAuth, useToast } from '../App';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalReaders: 0,
    loanedBooks: 0,
    availableBooks: 0,
    activeLoans: 0,
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/loans/stats');
      setStats(statsRes.data);

      const loansRes = await api.get('/loans');
      // Take the first 5 recent loans
      setRecentLoans(loansRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
      addToast('Error al cargar datos del dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Welcome Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.25rem' }}>¡Hola, {user?.name}!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Bienvenido al panel de control de la biblioteca. Aquí tienes el resumen del día.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        
        {/* Total Books */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.totalBooks}</h3>
            <p>Libros Registrados</p>
          </div>
          <div className="stat-icon primary">
            <BookOpen size={24} />
          </div>
        </div>

        {/* Total Readers */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.totalReaders}</h3>
            <p>Lectores</p>
          </div>
          <div className="stat-icon success">
            <Users size={24} />
          </div>
        </div>

        {/* Books Loaned */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.loanedBooks}</h3>
            <p>Libros Prestados</p>
          </div>
          <div className="stat-icon danger">
            <Bookmark size={24} />
          </div>
        </div>

        {/* Books Available */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.availableBooks}</h3>
            <p>Libros Disponibles</p>
          </div>
          <div className="stat-icon info">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Active Loans */}
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats.activeLoans}</h3>
            <p>Préstamos Activos</p>
          </div>
          <div className="stat-icon warning">
            <Calendar size={24} />
          </div>
        </div>

      </div>

      {/* Content Columns */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '1rem' }}>
        
        {/* Recent Activity Card */}
        <div className="glass-card" style={{ maxWidth: 'none', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Préstamos Recientes
            </h3>
            <Link to="/history" className="link-action" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
              Ver todo <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentLoans.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
              No hay préstamos registrados en el sistema.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentLoans.map((l) => (
                <div 
                  key={l._id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255, 255, 255, 0.04)' 
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {l.bookId?.title || 'Libro Eliminado'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Lector: {l.readerId?.name || 'Lector Eliminado'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${l.status === 'Prestado' ? 'badge-warning' : 'badge-success'}`}>
                      {l.status}
                    </span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {formatDate(l.loanDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links / Guide Card */}
        <div className="glass-card" style={{ maxWidth: 'none', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
            Accesos Rápidos
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <Link to="/books" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}>
                <BookOpen size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Gestionar Libros</h4>
              </div>
            </Link>

            <Link to="/readers" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--success)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}>
                <Users size={24} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Gestionar Lectores</h4>
              </div>
            </Link>

            <Link to="/loans" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warning)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}>
                <Calendar size={24} style={{ color: 'var(--warning)', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Registrar Préstamo</h4>
              </div>
            </Link>

            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}>
                <Users size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Mi Cuenta</h4>
              </div>
            </Link>

          </div>
        </div>

      </div>

    </div>
  );
}
