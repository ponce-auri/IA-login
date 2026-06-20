import React, { useState, useEffect } from 'react';
import { Search, History as HistoryIcon, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function History() {
  const { addToast } = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchHistory = async () => {
    try {
      const response = await api.get('/loans');
      setHistory(response.data);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar el historial de préstamos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Check if a return was late or is currently overdue
  const checkLate = (item) => {
    if (item.status === 'Devuelto') {
      if (!item.returnDate) return false;
      return new Date(item.returnDate).setHours(0,0,0,0) > new Date(item.dueDate).setHours(0,0,0,0);
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      return today > new Date(item.dueDate).setHours(0,0,0,0);
    }
  };

  // Filter list in memory
  const filteredHistory = history.filter(item => {
    const readerName = item.readerId?.name || '';
    const bookTitle = item.bookId?.title || '';
    const bookCode = item.bookId?.code || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = readerName.toLowerCase().includes(term) ||
                          bookTitle.toLowerCase().includes(term) ||
                          bookCode.toLowerCase().includes(term);

    const matchesStatus = statusFilter === '' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleExportExcel = () => {
    if (filteredHistory.length === 0) {
      addToast('No hay datos para exportar', 'error');
      return;
    }

    const headers = [
      'Lector',
      'Correo Lector',
      'Código de Libro',
      'Título de Libro',
      'Fecha Préstamo',
      'Fecha Límite',
      'Fecha Devolución Real',
      'Estado',
      'Fuera de Tiempo?'
    ];

    const rows = filteredHistory.map(item => {
      const loanDateStr = new Date(item.loanDate).toLocaleDateString('es-ES');
      const dueDateStr = new Date(item.dueDate).toLocaleDateString('es-ES');
      const returnDateStr = item.returnDate ? new Date(item.returnDate).toLocaleDateString('es-ES') : 'Pendiente';
      const isLate = checkLate(item);

      return [
        item.readerId?.name || 'N/A',
        item.readerId?.email || 'N/A',
        item.bookId?.code || 'N/A',
        item.bookId?.title || 'N/A',
        loanDateStr,
        dueDateStr,
        returnDateStr,
        item.status,
        isLate ? 'SI' : 'NO'
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_prestamos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Excel exportado correctamente', 'success');
  };

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Historial de Movimientos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Consulta las bitácoras completas de préstamos, devoluciones e incidencias de la biblioteca.
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ width: 'auto' }} 
          onClick={handleExportExcel}
          disabled={filteredHistory.length === 0}
        >
          <Download size={16} />
          Exportar Excel
        </button>
      </div>

      {/* Admin actions bar */}
      <div className="admin-header-actions">
        <div className="search-filters-bar">
          
          {/* Search bar */}
          <div className="input-container" style={{ minWidth: '280px', flex: 1 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por libro o lector..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }} 
            />
            <Search className="input-icon" size={18} />
          </div>

          {/* Status Filter */}
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="Prestado">Activos (Prestados)</option>
            <option value="Devuelto">Devueltos</option>
          </select>

        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <div className="glass-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '4rem 2rem' }}>
          <HistoryIcon size={40} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Historial vacío</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay registros de transacciones con los criterios indicados.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Lector</th>
                <th>Código Libro</th>
                <th>Libro</th>
                <th>Fecha Préstamo</th>
                <th>Fecha Límite</th>
                <th>Fecha Devolución</th>
                <th>Estado</th>
                <th>Incidencia</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => {
                const isLate = checkLate(item);
                return (
                  <tr key={item._id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.readerId?.name || 'Lector Eliminado'}</span>
                    </td>
                    <td><strong>{item.bookId?.code || '-'}</strong></td>
                    <td>{item.bookId?.title || 'Libro Eliminado'}</td>
                    <td>{formatDate(item.loanDate)}</td>
                    <td>{formatDate(item.dueDate)}</td>
                    <td>
                      {item.returnDate ? (
                        formatDate(item.returnDate)
                      ) : (
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Prestado' ? 'badge-warning' : 'badge-success'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {isLate ? (
                        <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Devolución fuera de tiempo
                        </span>
                      ) : (
                        item.status === 'Devuelto' ? (
                          <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Sin incidencias
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredHistory.length)} de {filteredHistory.length} registros
              </span>
              <div className="pagination-pages">
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i + 1} 
                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
