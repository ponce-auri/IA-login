import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, User, BookOpen, Key, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function Loans() {
  const { addToast } = useToast();

  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New Loan Form Modal
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [lendForm, setLendForm] = useState({
    readerId: '',
    bookId: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Devolución confirming ID
  const [returnConfirmId, setReturnConfirmId] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch loans
      const loansRes = await api.get('/loans?status=Prestado');
      setLoans(loansRes.data);

      // Fetch readers & books for form selection
      const readersRes = await api.get('/readers');
      setReaders(readersRes.data);

      const booksRes = await api.get('/books');
      setBooks(booksRes.data);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar la información de préstamos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter loans in memory
  const filteredLoans = loans.filter(l => {
    const readerName = l.readerId?.name || '';
    const bookTitle = l.bookId?.title || '';
    const bookCode = l.bookId?.code || '';
    const term = searchTerm.toLowerCase();

    return readerName.toLowerCase().includes(term) ||
           bookTitle.toLowerCase().includes(term) ||
           bookCode.toLowerCase().includes(term);
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLoans = filteredLoans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleLendSubmit = async (e) => {
    e.preventDefault();
    if (!lendForm.readerId || !lendForm.bookId) {
      addToast('Por favor selecciona un lector y un libro', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/loans', lendForm);
      addToast('Préstamo registrado exitosamente', 'success');
      setIsLendModalOpen(false);
      setLendForm({ readerId: '', bookId: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al procesar el préstamo', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReturnBook = async () => {
    if (!returnConfirmId) return;

    setReturnLoading(true);
    try {
      const response = await api.put(`/loans/${returnConfirmId}`);
      
      const { message, isLate } = response.data;
      
      // If late, show warning alert toast
      if (isLate) {
        addToast(message || 'Devolución fuera de tiempo', 'error');
      } else {
        addToast(message || 'Devolución registrada exitosamente', 'success');
      }

      setReturnConfirmId(null);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al registrar la devolución', 'error');
      setReturnConfirmId(null);
    } finally {
      setReturnLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isLoanOverdue = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  // Only show books with stock > 0 for new loans
  const availableBooks = books.filter(b => b.stock > 0);

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
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Préstamos Activos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Registra nuevos préstamos y gestiona las devoluciones de libros.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setIsLendModalOpen(true)}>
          <Plus size={16} />
          Nuevo Préstamo
        </button>
      </div>

      {/* Admin Actions Bar */}
      <div className="admin-header-actions" style={{ justifyContent: 'flex-start' }}>
        <div className="input-container" style={{ minWidth: '280px', maxWidth: '400px', flex: 1 }}>
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
      </div>

      {/* Active Loans Table */}
      {filteredLoans.length === 0 ? (
        <div className="glass-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '4rem 2rem' }}>
          <Key size={40} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>No hay préstamos activos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Todos los libros están devueltos o la búsqueda no coincide.</p>
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
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentLoans.map((l) => {
                const overdue = isLoanOverdue(l.dueDate);
                return (
                  <tr key={l._id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{l.readerId?.name || 'Lector Eliminado'}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.readerId?.email}</div>
                    </td>
                    <td><strong>{l.bookId?.code || '-'}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.bookId?.title || 'Libro Eliminado'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>por {l.bookId?.author}</div>
                    </td>
                    <td>{formatDate(l.loanDate)}</td>
                    <td>
                      <span style={{ color: overdue ? 'var(--error)' : 'inherit', fontWeight: overdue ? 600 : 'normal' }}>
                        {formatDate(l.dueDate)}
                      </span>
                    </td>
                    <td>
                      {overdue ? (
                        <span className="badge badge-warning" style={{ color: 'var(--error)', backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Fuera de plazo
                        </span>
                      ) : (
                        <span className="badge badge-warning">En tiempo</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => setReturnConfirmId(l._id)}
                      >
                        <CheckCircle size={14} />
                        Devolver
                      </button>
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
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredLoans.length)} de {filteredLoans.length} préstamos
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

      {/* Lend Book Modal */}
      {isLendModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.25rem' }}>Registrar Préstamo de Libro</h3>
              <button className="modal-close-btn" onClick={() => setIsLendModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLendSubmit}>
              
              {/* Select Reader */}
              <div className="form-group">
                <label className="form-label" htmlFor="select-reader">Seleccionar Lector *</label>
                <div className="input-container">
                  <select 
                    id="select-reader"
                    className="form-input" 
                    value={lendForm.readerId}
                    onChange={(e) => setLendForm({ ...lendForm, readerId: e.target.value })}
                    required
                    style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">-- Elige un lector registrado --</option>
                    {readers.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.email})</option>
                    ))}
                  </select>
                  <User className="input-icon" size={18} />
                </div>
              </div>

              {/* Select Book */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="select-book">Seleccionar Libro (Disponible) *</label>
                <div className="input-container">
                  <select 
                    id="select-book"
                    className="form-input" 
                    value={lendForm.bookId}
                    onChange={(e) => setLendForm({ ...lendForm, bookId: e.target.value })}
                    required
                    style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">-- Elige un libro del inventario --</option>
                    {availableBooks.map(b => (
                      <option key={b._id} value={b._id}>{b.title} [Disp: {b.stock}] ({b.code})</option>
                    ))}
                  </select>
                  <BookOpen className="input-icon" size={18} />
                </div>
                {availableBooks.length === 0 && (
                  <p className="validation-error" style={{ color: 'var(--warning)' }}>
                    <AlertTriangle size={12} /> No hay libros con stock disponible. Registra o devuelve libros primero.
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsLendModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={formLoading || availableBooks.length === 0}>
                  {formLoading ? <span className="spinner"></span> : 'Registrar Préstamo'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {returnConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>¿Confirmar devolución de libro?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Esta acción registrará la entrada del ejemplar y lo devolverá al stock disponible.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setReturnConfirmId(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleReturnBook} disabled={returnLoading}>
                {returnLoading ? <span className="spinner"></span> : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
