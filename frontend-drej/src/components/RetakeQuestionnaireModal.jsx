import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import './RetakeQuestionnaireModal.css';

const RetakeQuestionnaireModal = ({ 
    isOpen, 
    onClose, 
    cuestionario, 
    resultadoAnterior,
    onConfirm 
}) => {
    const [loading, setLoading] = useState(false);
    const [razon, setRazon] = useState('');

    if (!isOpen) return null;

    const handleRetake = async () => {
        setLoading(true);
        try {
            await onConfirm(razon);
            setRazon('');
        } catch (error) {
            console.error('Error al reiniciar cuestionario:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // ✅ PREVENIR CIERRE AL HACER CLIC EN EL CONTENIDO
    const handleOverlayClick = (e) => {
        // Solo cerrar si el clic es en el overlay, no en el contenido
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // ✅ CLASES ESPECÍFICAS PARA EVITAR CONFLICTOS
        <div className="retake-modal-overlay" onClick={handleOverlayClick}>
            <div className="retake-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="retake-modal-close" onClick={onClose}>×</button>

                <div className="retake-modal-header">
                    <div className="retake-modal-icon">
                        <RefreshCw size={28} />
                    </div>
                    <h2>Volver a dar el cuestionario</h2>
                    <p className="retake-modal-subtitle">
                        {cuestionario?.titulo || 'Cuestionario Vocacional'}
                    </p>
                </div>

                <div className="retake-modal-body">
                    {/* Información del resultado anterior */}
                    {resultadoAnterior && (
                        <div className="retake-info-card">
                            <div className="retake-info-header">
                                <Calendar size={20} color="#4a90e2" />
                                <h3>Tu resultado anterior</h3>
                            </div>
                            <div className="retake-info-content">
                                <div className="retake-info-row">
                                    <span className="retake-info-label">
                                        <Calendar size={16} />
                                        Fecha
                                    </span>
                                    <span className="retake-info-value">
                                        {formatDate(resultadoAnterior.fecha)}
                                    </span>
                                </div>
                                {resultadoAnterior.recomendaciones && (
                                    <div className="retake-info-row">
                                        <span className="retake-info-label">
                                            <TrendingUp size={16} />
                                            Recomendaciones
                                        </span>
                                        <span className="retake-info-value">
                                            {resultadoAnterior.recomendaciones} carreras
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Advertencia */}
                    <div className="retake-info-card retake-alert-card">
                        <div className="retake-info-header">
                            <AlertCircle size={20} color="#e74c3c" />
                            <h3>⚠️ Importante</h3>
                        </div>
                        <ul className="retake-alert-list">
                            <li>
                                Tu resultado anterior <strong>se mantendrá en el historial</strong>
                            </li>
                            <li>
                                El nuevo resultado <strong>reemplazará</strong> al actual como resultado activo
                            </li>
                            <li>
                                Podrás comparar ambos resultados más adelante
                            </li>
                        </ul>
                    </div>

                    {/* Razón (opcional) */}
                    <div className="retake-form-group">
                        <label htmlFor="razon">
                            ¿Por qué quieres volver a dar este cuestionario? (Opcional)
                        </label>
                        <textarea
                            id="razon"
                            value={razon}
                            onChange={(e) => setRazon(e.target.value)}
                            placeholder="Ej: Mis intereses han cambiado, quiero confirmar mi vocación, etc..."
                            rows={3}
                            maxLength={500}
                        />
                        <small className="retake-form-hint">
                            {razon.length}/500 caracteres
                        </small>
                    </div>

                    {/* Ventajas de volver a tomar */}
                    <div className="retake-benefits-section">
                        <h3>✨ Beneficios</h3>
                        <div className="retake-benefits-grid">
                            <div className="retake-benefit-item">
                                <span className="retake-benefit-icon">📊</span>
                                <span>Seguimiento de tu evolución</span>
                            </div>
                            <div className="retake-benefit-item">
                                <span className="retake-benefit-icon">🎯</span>
                                <span>Confirmación de intereses</span>
                            </div>
                            <div className="retake-benefit-item">
                                <span className="retake-benefit-icon">🤖</span>
                                <span>Nuevas recomendaciones de IA</span>
                            </div>
                            <div className="retake-benefit-item">
                                <span className="retake-benefit-icon">📈</span>
                                <span>Comparativa de resultados</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="retake-modal-footer">
                    <button 
                        className="retake-btn-secondary" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="retake-btn-primary" 
                        onClick={handleRetake}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="retake-spinner-small"></div>
                                Reiniciando...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                Comenzar de Nuevo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RetakeQuestionnaireModal;