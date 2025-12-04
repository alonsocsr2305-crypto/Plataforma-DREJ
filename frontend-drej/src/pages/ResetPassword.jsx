// frontend-drej/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import '../Css/password-recovery-unified.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const navigate = useNavigate();
  const { token } = useParams();

  // Validar token al cargar
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/auth/password-reset/validate-token/?token=${token}`
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setMessage({
          type: 'error',
          text: data.message || 'El enlace de recuperación ha expirado o no es válido',
        });
      }
    } catch (error) {
      setTokenValid(false);
      setMessage({
        type: 'error',
        text: 'Error al validar el enlace. Por favor, solicita uno nuevo.',
      });
    } finally {
      setValidatingToken(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return { level: '', width: 0, text: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', width: 33, text: 'Débil' };
    if (strength <= 4) return { level: 'medium', width: 66, text: 'Media' };
    return { level: 'strong', width: 100, text: 'Fuerte' };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Por favor, completa todos los campos',
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'La contraseña debe tener al menos 8 caracteres',
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Las contraseñas no coinciden',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/password-reset/confirm/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '✅ Contraseña actualizada exitosamente. Redirigiendo al login...',
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Error al actualizar la contraseña',
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

  // Loading state
  if (validatingToken) {
    return (
      <div className="password-recovery-container">
        <div className="recovery-card">
          <div className="validating-container">
            <div className="validating-spinner"></div>
            <p className="validating-text">Validando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="password-recovery-container">
        <div className="recovery-card">
          <div className="invalid-token-container">
            <div className="error-icon">
              <AlertCircle size={40} />
            </div>
            <h2>Enlace no válido</h2>
            <p>{message.text}</p>
            <button
              className="btn-submit"
              onClick={() => navigate('/forgot-password')}
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="password-recovery-container">
      <div className="recovery-card">
        {/* Header */}
        <div className="recovery-header">
          <div className="recovery-icon">
            <Lock size={36} />
          </div>
          <h2>Restablecer contraseña</h2>
          <p>Ingresa tu nueva contraseña</p>
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

          {/* Nueva contraseña */}
          <div className="form-group">
            <label htmlFor="newPassword">Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Indicador de fuerza */}
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill ${passwordStrength.level}`}
                    style={{ width: `${passwordStrength.width}%` }}
                  ></div>
                </div>
                <span className={`strength-text ${passwordStrength.level}`}>
                  Seguridad: {passwordStrength.text}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Validación de coincidencia */}
            {confirmPassword && (
              <div>
                {newPassword === confirmPassword ? (
                  <span className="input-success-message">
                    <CheckCircle size={14} />
                    Las contraseñas coinciden
                  </span>
                ) : (
                  <span className="input-error-message">
                    <AlertCircle size={14} />
                    Las contraseñas no coinciden
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Requisitos de contraseña */}
          <div className="password-requirements">
            <h4>Requisitos de contraseña:</h4>
            <div className="requirement">
              <span className="requirement-icon">
                {newPassword.length >= 8 ? '✓' : '○'}
              </span>
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className="requirement">
              <span className="requirement-icon">
                {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '✓' : '○'}
              </span>
              <span>Mayúsculas y minúsculas</span>
            </div>
            <div className="requirement">
              <span className="requirement-icon">
                {/\d/.test(newPassword) ? '✓' : '○'}
              </span>
              <span>Al menos un número</span>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Actualizando...
              </>
            ) : (
              <>
                <Lock size={20} />
                Actualizar contraseña
              </>
            )}
          </button>

          {/* Link para volver */}
          <div className="recovery-link">
            <button
              type="button"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;