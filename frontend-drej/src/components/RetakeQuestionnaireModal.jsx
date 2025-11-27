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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content retake-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <div className="modal-icon retake-icon">
                        <RefreshCw size={28} />
                    </div>
                    <h2>Volver a dar el cuestionario</h2>
                    <p className="modal-subtitle">
                        {cuestionario?.titulo || 'Cuestionario Vocacional'}
                    </p>
                </div>

                <div className="modal-body">
                    {/* Información del resultado anterior */}
                    {resultadoAnterior && (
                        <div className="info-card warning-card">
                            <div className="info-header">
                                <AlertCircle size={20} />
                                <h3>Resultado Anterior</h3>
                            </div>
                            <div className="info-content">
                                <div className="info-row">
                                    <span className="info-label">
                                        <Calendar size={16} />
                                        Fecha completado:
                                    </span>
                                    <span className="info-value">
                                        {formatDate(resultadoAnterior.fecha_completado)}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        <TrendingUp size={16} />
                                        Puntaje obtenido:
                                    </span>
                                    <span className="info-value">
                                        {resultadoAnterior.puntaje_total || 'N/A'}
                                    </span>
                                </div>
                                {resultadoAnterior.recomendaciones_count > 0 && (
                                    <div className="info-row">
                                        <span className="info-label">
                                            Recomendaciones recibidas:
                                        </span>
                                        <span className="info-value">
                                            {resultadoAnterior.recomendaciones_count}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Advertencia */}
                    <div className="info-card alert-card">
                        <h3>⚠️ Importante</h3>
                        <ul className="alert-list">
                            <li>
                                Tu resultado anterior será <strong>archivado</strong> pero permanecerá 
                                disponible en tu historial
                            </li>
                            <li>
                                Podrás ver una comparación entre tus resultados anteriores y nuevos
                            </li>
                            <li>
                                Deberás completar todas las preguntas nuevamente
                            </li>
                            <li>
                                Las recomendaciones de IA se generarán basadas en tus nuevas respuestas
                            </li>
                        </ul>
                    </div>

                    {/* Razón opcional */}
                    <div className="form-group">
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
                        <small className="form-hint">
                            {razon.length}/500 caracteres
                        </small>
                    </div>

                    {/* Ventajas de volver a tomar */}
                    <div className="benefits-section">
                        <h3>✨ Beneficios</h3>
                        <div className="benefits-grid">
                            <div className="benefit-item">
                                <span className="benefit-icon">📊</span>
                                <span>Seguimiento de tu evolución</span>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">🎯</span>
                                <span>Confirmación de intereses</span>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">🤖</span>
                                <span>Nuevas recomendaciones de IA</span>
                            </div>
                            <div className="benefit-item">
                                <span className="benefit-icon">📈</span>
                                <span>Comparativa de resultados</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="btn-primary retake-btn" 
                        onClick={handleRetake}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
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
