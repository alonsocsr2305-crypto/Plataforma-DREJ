// frontend-drej/src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import '../Css/password-recovery.css';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '✅ Revisa tu correo electrónico. Te hemos enviado instrucciones para recuperar tu contraseña.',
        });
        setIdentifier('');
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Error al procesar la solicitud',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión. Por favor, intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-recovery-container">
      <div className="recovery-card">
        {/* Header */}
        <div className="recovery-header">
          <div className="recovery-icon">
            <Lock size={36} />
          </div>
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>
            Ingresa tu email o DNI y te enviaremos instrucciones para recuperarla
          </p>
        </div>

        {/* Formulario */}
        <form className="recovery-form" onSubmit={handleSubmit}>
          {/* Mensaje de alerta */}
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              <span className="alert-icon">
                {message.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Campo de entrada */}
          <div className="form-group">
            <label htmlFor="identifier">Email o DNI</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ejemplo@correo.com o 12345678"
              disabled={loading}
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Enviando...
              </>
            ) : (
              <>
                <Mail size={20} />
                Enviar instrucciones
              </>
            )}
          </button>

          {/* Link para volver al login */}
          <div className="recovery-link">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-link"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </button>
          </div>
        </form>

        {/* Información adicional */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '10px',
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: '#374151', display: 'block', marginBottom: '8px' }}>
            💡 Consejo de seguridad:
          </strong>
          Si no recibes el correo en unos minutos, revisa tu carpeta de spam o correo no deseado.
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;