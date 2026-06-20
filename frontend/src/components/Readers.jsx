import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, User, Mail, Phone, MapPin } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function Readers() {
  const { addToast } = useToast();

  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals / Editor States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReader, setEditingReader] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchReaders = async () => {
    try {
      const response = await api.get('/readers');
      setReaders(response.data);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar la lista de lectores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, []);

  // Filter readers in memory
  const filteredReaders = readers.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.phone && r.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.address && r.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginated readers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReaders = filteredReaders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReaders.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openAddModal = () => {
    setEditingReader(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (reader) => {
    setEditingReader(reader);
    setForm({
      name: reader.name,
      email: reader.email,
      phone: reader.phone || '',
      address: reader.address || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      addToast('El nombre y el correo electrónico son obligatorios', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (editingReader) {
        // Edit Mode
        await api.put(`/readers/${editingReader._id}`, form);
        addToast('Lector actualizado correctamente', 'success');
      } else {
        // Create Mode
        await api.post('/readers', form);
        addToast('Lector registrado correctamente', 'success');
      }
      setIsFormOpen(false);
      fetchReaders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al procesar la solicitud', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/readers/${deleteConfirmId}`);
      addToast('Lector eliminado correctamente', 'success');
      setDeleteConfirmId(null);
      fetchReaders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar el lector', 'error');
      setDeleteConfirmId(null);
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
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Gestión de Lectores</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Registra y administra los datos de contacto de los lectores del sistema de biblioteca.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={openAddModal}>
          <Plus size={16} />
          Registrar Lector
        </button>
      </div>

      {/* Admin actions bar */}
      <div className="admin-header-actions" style={{ justifyContent: 'flex-start' }}>
        <div className="input-container" style={{ minWidth: '280px', maxWidth: '400px', flex: 1 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Buscar por nombre, correo, teléfono..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }} 
          />
          <Search className="input-icon" size={18} />
        </div>
      </div>

      {/* Readers Table */}
      {filteredReaders.length === 0 ? (
        <div className="glass-card" style={{ maxWidth: 'none', textAlign: 'center', padding: '4rem 2rem' }}>
          <Search size={40} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>No se encontraron lectores</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Intenta ajustar tu búsqueda.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Lector</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Fecha de Registro</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentReaders.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="profile-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem', margin: 0 }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                    </div>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.phone || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td>{r.address || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons-cell" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon edit" title="Editar" onClick={() => openEditModal(r)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon delete" title="Eliminar" onClick={() => setDeleteConfirmId(r._id)}>
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
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredReaders.length)} de {filteredReaders.length} lectores
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

      {/* Register / Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-title">
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingReader ? 'Editar Lector' : 'Registrar Nuevo Lector'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="reader-name">Nombre Completo *</label>
                <div className="input-container">
                  <input 
                    type="text" 
                    id="reader-name"
                    className="form-input" 
                    placeholder="Ej: Juan Pérez"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required 
                  />
                  <User className="input-icon" size={18} />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="reader-email">Correo Electrónico *</label>
                <div className="input-container">
                  <input 
                    type="email" 
                    id="reader-email"
                    className="form-input" 
                    placeholder="Ej: juan.perez@correo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required 
                  />
                  <Mail className="input-icon" size={18} />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="reader-phone">Teléfono (Opcional)</label>
                <div className="input-container">
                  <input 
                    type="tel" 
                    id="reader-phone"
                    className="form-input" 
                    placeholder="Ej: 555-123-4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Phone className="input-icon" size={18} />
                </div>
              </div>

              {/* Address */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="reader-address">Dirección (Opcional)</label>
                <div className="input-container">
                  <input 
                    type="text" 
                    id="reader-address"
                    className="form-input" 
                    placeholder="Ej: Av. de la Reforma 123"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <MapPin className="input-icon" size={18} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={formLoading}>
                  {formLoading ? <span className="spinner"></span> : (editingReader ? 'Guardar Cambios' : 'Registrar Lector')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>¿Confirmar eliminación?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              El lector se eliminará permanentemente. No se puede eliminar a un lector con préstamos activos de libros.
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
