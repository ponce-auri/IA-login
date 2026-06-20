import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Key, Hash, FileText, Bookmark, Calendar } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../App';

export default function AddBook() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    code: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    year: new Date().getFullYear(),
    isbn: '',
    stock: 1,
    description: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom validations
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
      await api.post('/books', {
        ...form,
        year: Number(form.year),
        stock: Number(form.stock),
      });
      addToast('Libro registrado exitosamente', 'success');
      navigate('/books');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al registrar el libro', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Back Button & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="email-back-btn" onClick={() => navigate('/books')} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} />
          Volver al catálogo
        </button>
        <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Registrar Nuevo Libro</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Ingresa la información bibliográfica del ejemplar para añadirlo al inventario.
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
                  placeholder="Ej: LIB-001"
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
                  placeholder="Ej: El Quijote de la Mancha"
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
                  placeholder="Ej: Miguel de Cervantes"
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
                  placeholder="Ej: Novela, Ciencia, Historia"
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
                  placeholder="Ej: Santillana, Alfaguara"
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
                  placeholder="Ej: 2026"
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
                  placeholder="Ej: 978-3-16-148410-0"
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
                  placeholder="Ej: 5"
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
                  placeholder="Ej: https://imagenes.com/libro-portada.jpg"
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
                placeholder="Escribe una breve sinopsis del libro..."
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
              {loading ? <span className="spinner"></span> : 'Registrar Libro'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
