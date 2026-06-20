import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Key, Hash, FileText, Bookmark, Calendar, User } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function EditBook() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Bulletproof ID extraction from location path: /books/edit/:id
  const getBookId = () => {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
  };

  const [form, setForm] = useState({
    code: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    year: '',
    isbn: '',
    stock: 0,
    description: '',
    image: '',
  });

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      const id = getBookId();
      try {
        const response = await api.get(`/books/${id}`);
        setForm(response.data);
      } catch (err) {
        console.error(err);
        addToast('Error al cargar la información del libro', 'error');
        navigate('/books');
      } finally {
        setFetching(false);
      }
    };
    fetchBookDetails();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = getBookId();

    // Validations
    if (!form.code.trim() || !form.title.trim() || !form.author.trim() || !form.category.trim() || !form.publisher.trim() || !form.isbn.trim()) {
      addToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (isNaN(form.year) || form.year < 0 || form.year > new Date().getFullYear() + 5) {
      addToast('Por favor ingresa un año de publicación válido', 'error');
      return;
    }

    if (isNaN(form.stock) || form.stock < 0) {
      addToast('La cantidad disponible no puede ser negativa', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/books/${id}`, {
        ...form,
        year: Number(form.year),
        stock: Number(form.stock),
      });
      addToast('Libro actualizado exitosamente', 'success');
      navigate('/books');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al actualizar el libro', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Back Button & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="email-back-btn" onClick={() => navigate('/books')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          Volver al catálogo
        </button>
        <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Editar Libro</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Modifica los campos del libro y guarda los cambios para actualizar el catálogo.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ maxWidth: 'none' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Code */}
            <div className="form-group">
              <label className="form-label" htmlFor="code">Código del Libro (Único) *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="code" 
                  className="form-input" 
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required 
                />
                <Hash className="input-icon" size={18} />
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">Título del Libro *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="title" 
                  className="form-input" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required 
                />
                <BookOpen className="input-icon" size={18} />
              </div>
            </div>

            {/* Author */}
            <div className="form-group">
              <label className="form-label" htmlFor="author">Autor *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="author" 
                  className="form-input" 
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  required 
                />
                <User className="input-icon" size={18} />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">Categoría *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="category" 
                  className="form-input" 
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required 
                />
                <Bookmark className="input-icon" size={18} />
              </div>
            </div>

            {/* Publisher */}
            <div className="form-group">
              <label className="form-label" htmlFor="publisher">Editorial *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="publisher" 
                  className="form-input" 
                  value={form.publisher}
                  onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                  required 
                />
                <FileText className="input-icon" size={18} />
              </div>
            </div>

            {/* Year */}
            <div className="form-group">
              <label className="form-label" htmlFor="year">Año de Publicación *</label>
              <div className="input-container">
                <input 
                  type="number" 
                  id="year" 
                  className="form-input" 
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required 
                />
                <Calendar className="input-icon" size={18} />
              </div>
            </div>

            {/* ISBN */}
            <div className="form-group">
              <label className="form-label" htmlFor="isbn">ISBN (Único) *</label>
              <div className="input-container">
                <input 
                  type="text" 
                  id="isbn" 
                  className="form-input" 
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  required 
                />
                <Hash className="input-icon" size={18} />
              </div>
            </div>

            {/* Stock */}
            <div className="form-group">
              <label className="form-label" htmlFor="stock">Cantidad Disponible (Stock) *</label>
              <div className="input-container">
                <input 
                  type="number" 
                  id="stock" 
                  className="form-input" 
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required 
                />
                <Hash className="input-icon" size={18} />
              </div>
            </div>

            {/* Image (Optional) */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="image">Imagen de Portada (Opcional - URL)</label>
              <div className="input-container">
                <input 
                  type="url" 
                  id="image" 
                  className="form-input" 
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <FileText className="input-icon" size={18} />
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: '2rem' }}>
              <label className="form-label" htmlFor="description">Descripción / Sinopsis (Opcional)</label>
              <textarea 
                id="description" 
                className="form-input" 
                rows="4" 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ paddingLeft: '1rem', minHeight: '100px', resize: 'vertical' }}
              />
            </div>

          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => navigate('/books')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
