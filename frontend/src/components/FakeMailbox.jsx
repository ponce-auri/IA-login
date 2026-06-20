import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, Trash2, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function FakeMailbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCount, setLastCount] = useState(0);

  const navigate = useNavigate();

  // Fetch emails from API
  const fetchEmails = async (silent = false) => {
    try {
      const response = await api.get('/emails');
      setEmails(response.data);
      
      // If the email count increased, set the unread count accordingly
      if (response.data.length > lastCount) {
        const diff = response.data.length - lastCount;
        setUnreadCount((prev) => prev + diff);
      }
      setLastCount(response.data.length);
    } catch (err) {
      console.error('Error fetching simulated emails:', err);
    }
  };

  // Poll for new emails every 3 seconds
  useEffect(() => {
    fetchEmails();
    const interval = setInterval(() => {
      fetchEmails(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [lastCount]);

  // Handle opening mailbox
  const toggleMailbox = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Reset unread badge on open
    }
  };

  // Clear all emails
  const handleClearAll = async () => {
    try {
      await api.delete('/emails');
      setEmails([]);
      setSelectedEmail(null);
      setUnreadCount(0);
      setLastCount(0);
    } catch (err) {
      console.error('Error clearing emails:', err);
    }
  };

  // Handle clicking email CTA
  const handleCtaClick = (actionUrl) => {
    if (actionUrl) {
      // Close mailbox panel and navigate
      setIsOpen(false);
      setSelectedEmail(null);
      navigate(actionUrl);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Bubble Icon */}
      <div className="fake-mailbox-bubble" onClick={toggleMailbox} title="Bandeja de Correos Simulada">
        <Mail size={24} color="#fff" />
        {unreadCount > 0 && <span className="mailbox-counter">{unreadCount}</span>}
      </div>

      {/* Expanded Inbox Panel */}
      {isOpen && (
        <div className="mailbox-panel">
          <div className="mailbox-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} className="gradient-text" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Bandeja Simulada</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {emails.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                  }}
                  title="Vaciar Bandeja"
                >
                  <Trash2 size={14} />
                  Vaciar
                </button>
              )}
              <button
                onClick={() => fetchEmails()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
                title="Actualizar"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {selectedEmail ? (
            /* Individual Email View */
            <div className="email-view">
              <button className="email-back-btn" onClick={() => setSelectedEmail(null)}>
                <ArrowLeft size={14} />
                Volver a la bandeja
              </button>

              <div className="email-header-details">
                <div className="email-item-subject" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {selectedEmail.subject}
                </div>
                <div className="email-detail-label">
                  <strong>Para:</strong> {selectedEmail.to}
                </div>
                <div className="email-detail-label">
                  <strong>Enviado:</strong> {new Date(selectedEmail.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="email-body-content">{selectedEmail.body}</div>

              {selectedEmail.actionUrl && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleCtaClick(selectedEmail.actionUrl)}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  {selectedEmail.actionText || 'Hacer clic aquí'}
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          ) : (
            /* Email List View */
            <div className="mailbox-list">
              {emails.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem', fontSize: '0.9rem' }}>
                  <Mail size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>No hay correos en la bandeja simulada.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Registra una cuenta o solicita recuperación para recibir correos.</p>
                </div>
              ) : (
                emails.map((email) => (
                  <div key={email._id} className="mailbox-item" onClick={() => setSelectedEmail(email)}>
                    <span className="mailbox-item-date">{formatTime(email.createdAt)}</span>
                    <div className="mailbox-item-subject">{email.subject}</div>
                    <div className="mailbox-item-to">Para: {email.to}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
