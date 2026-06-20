import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, FileText, Download, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function Books() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals / Details State
  const [selectedBook, setSelectedBook] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Categories list extracted dynamically from books
  const [categories, setCategories] = useState([]);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data);
      
      // Extract unique categories
      const uniqueCats = [...new Set(response.data.map(b => b.category).filter(Boolean))];
      setCategories(uniqueCats);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar la lista de libros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter books in memory for real-time reactivity
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === '' || book.category.toLowerCase() === selectedCategory.toLowerCase();
    
    let matchesAvailability = true;
    if (availabilityFilter === 'available') {
      matchesAvailability = book.stock > 0;
    } else if (availabilityFilter === 'unavailable') {
      matchesAvailability = book.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Calculate Paginated Books
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, availabilityFilter]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/books/${deleteConfirmId}`);
      addToast('Libro eliminado correctamente', 'success');
      setDeleteConfirmId(null);
      fetchBooks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar el libro', 'error');
      setDeleteConfirmId(null);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Reporte de Libros - Sistema de Biblioteca</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; background-color: #ffffff; }
            h1 { text-align: center; color: #1e3a8a; margin-bottom: 5px; font-size: 24px; }
            p.subtitle { text-align: center; margin-bottom: 30px; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-size: 12px; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Reporte de Inventario de Libros</h1>
          <p class="subtitle">Generado el: ${new Date().toLocaleString('es-ES')}</p>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Editorial</th>
                <th>Año</th>
                <th>ISBN</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBooks.map(b => `
                <tr>
                  <td><strong>${b.code}</strong></td>
                  <td>${b.title}</td>
                  <td>${b.author}</td>
                  <td>${b.category}</td>
                  <td>${b.publisher}</td>
                  <td>${b.year}</td>
                  <td>${b.isbn}</td>
                  <td>${b.stock}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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
      
      {/* Header Title */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Gestión de Libros</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Registra, edita, filtra y administra el catálogo de libros de la biblioteca.
          </p>
        </div>
        <Link to="/books/add" className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus size={16} />
          Registrar Libro
        </Link>
      </div>

      {/* Admin Actions Bar */}
      <div className="admin-header-actions">
        
        {/* Search and Filters */}
        <div className="search-filters-bar">
          
          {/* Search Input */}
          <div className="input-container" style={{ minWidth: '260px', flex: 1 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por título, autor, código o ISBN..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }} 
            />
            <Search className="input-icon" size={18} />
          </div>

          {/* Category Filter */}
          <select 
            className="filter-select"
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select 
            className="filter-select"
            value={availabilityFilter} 
            onChange={(e) => setAvailabilityFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">Agotados</option>
          </select>
        </div>

        {/* Action buttons (Export) */}
        <div>
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={handleExportPDF} disabled={filteredBooks.length === 0}>
            <FileText size={16} />
            Exportar PDF
          </button>
        </div>

      </div>

      {/* Books Table */}
      {filteredBooks.length === 0 ? (
        <div className="glass-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '4rem 2rem' }}>
          <Search size={40} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>No se encontraron libros</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Intenta ajustar tus criterios de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Portada</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>ISBN</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentBooks.map((b) => (
                <tr key={b._id}>
                  <td><strong>{b.code}</strong></td>
                  <td>
                    {b.image ? (
                      <img src={b.image} alt={b.title} className="book-cover-img" onError={(e) => { e.target.src = ''; e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="book-cover-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No img</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.publisher} ({b.year})</div>
                  </td>
                  <td>{b.author}</td>
                  <td>{b.category}</td>
                  <td>{b.isbn}</td>
                  <td>{b.stock}</td>
                  <td>
                    <span className={`badge ${b.stock > 0 ? 'badge-success' : 'badge-warning'}`}>
                      {b.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons-cell" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon" title="Ver Detalles" onClick={() => setSelectedBook(b)}>
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon edit" title="Editar" onClick={() => navigate(`/books/edit/${b._id}`)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon delete" title="Eliminar" onClick={() => setDeleteConfirmId(b._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredBooks.length)} de {filteredBooks.length} libros
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

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.25rem' }}>Detalles del Libro</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBook(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                {selectedBook.image ? (
                  <img src={selectedBook.image} alt={selectedBook.title} className="book-cover-large" />
                ) : (
                  <div className="book-cover-large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Sin Imagen
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{selectedBook.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '1rem' }}>por {selectedBook.author}</p>

                <div className="detail-grid">
                  <span className="detail-label">Código:</span>
                  <span>{selectedBook.code}</span>

                  <span className="detail-label">Categoría:</span>
                  <span>{selectedBook.category}</span>

                  <span className="detail-label">Editorial:</span>
                  <span>{selectedBook.publisher}</span>

                  <span className="detail-label">Año:</span>
                  <span>{selectedBook.year}</span>

                  <span className="detail-label">ISBN:</span>
                  <span>{selectedBook.isbn}</span>

                  <span className="detail-label">Cantidad:</span>
                  <span>{selectedBook.stock} ejemplares</span>

                  <span className="detail-label">Estado:</span>
                  <span>
                    <span className={`badge ${selectedBook.stock > 0 ? 'badge-success' : 'badge-warning'}`}>
                      {selectedBook.stock > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {selectedBook.description && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Descripción:</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedBook.description}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setSelectedBook(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>¿Confirmar eliminación?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Esta acción no se puede deshacer. El libro se eliminará permanentemente del catálogo.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--error)' }} onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
