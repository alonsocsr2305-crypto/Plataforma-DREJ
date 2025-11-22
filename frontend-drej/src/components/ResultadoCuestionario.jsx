// ====================================================
// COMPONENTE: RESULTADOS DEL CUESTIONARIO
// Archivo: frontend-drej/src/components/ResultadoCuestionario.jsx
// ====================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    Award, 
    TrendingUp,
    CheckCircle,
    Download,
    Share2,
    Star
} from 'lucide-react';
import { cuestionariosAPI } from '../services/cuestionarios';
import '../Css/resultado-cuestionario.css';

const ResultadoCuestionario = () => {
    const navigate = useNavigate();
    const { intentoId } = useParams();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (intentoId) {
            cargarResultado(intentoId);
        } else if (location.state?.intentoId) {
            cargarResultado(location.state.intentoId);
        } else {
            setError('No se especificó un intento');
            setLoading(false);
        }
    }, [intentoId, location]);

    const cargarResultado = async (id) => {
        try {
            setLoading(true);
            console.log('📊 [RESULTADO] Cargando resultado del intento:', id);
            
            const data = await cuestionariosAPI.obtenerResultadoDetalle(id);
            console.log('✅ [RESULTADO] Datos recibidos:', data);
            
            setResultado(data);
        } catch (err) {
            console.error('❌ [RESULTADO] Error:', err);
            setError('Error al cargar el resultado. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const obtenerColorNivel = (nivel) => {
        switch(nivel?.toLowerCase()) {
            case 'muy alto':
                return '#10b981'; // Verde
            case 'alto':
                return '#3b82f6'; // Azul
            case 'medio-alto':
                return '#8b5cf6'; // Púrpura
            case 'medio':
                return '#f59e0b'; // Amarillo
            default:
                return '#6b7280'; // Gris
        }
    };

    const obtenerIconoNivel = (nivel) => {
        switch(nivel?.toLowerCase()) {
            case 'muy alto':
            case 'alto':
                return '🌟';
            case 'medio-alto':
                return '⭐';
            case 'medio':
                return '✨';
            default:
                return '💫';
        }
    };

    if (loading) {
        return (
            <div className="resultado-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Cargando tus resultados...</p>
                </div>
            </div>
        );
    }

    if (error || !resultado) {
        return (
            <div className="resultado-container">
                <div className="error-state">
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => navigate('/estudiante/dashboard')}
                        className="btn-primary"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="resultado-container">
            {/* Header */}
            <div className="resultado-header">
                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="btn-back"
                >
                    <ArrowLeft size={20} />
                    Volver al Dashboard
                </button>
                
                <div className="header-actions">
                    <button className="btn-action">
                        <Share2 size={18} />
                        Compartir
                    </button>
                    <button className="btn-action">
                        <Download size={18} />
                        Descargar PDF
                    </button>
                </div>
            </div>

            {/* Banner de Éxito */}
            <div className="success-banner">
                <div className="success-icon">
                    <CheckCircle size={48} />
                </div>
                <div className="success-content">
                    <h1>¡Cuestionario Completado! 🎉</h1>
                    <p>Has completado exitosamente: <strong>{resultado.cuestionario}</strong></p>
                    <p className="fecha">Fecha: {new Date(resultado.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
            </div>

            {/* Resumen */}
            <div className="resultado-resumen">
                <div className="stat-box">
                    <Award size={32} />
                    <div>
                        <h3>{resultado.recomendaciones?.length || 0}</h3>
                        <p>Carreras Recomendadas</p>
                    </div>
                </div>
                <div className="stat-box">
                    <CheckCircle size={32} />
                    <div>
                        <h3>{resultado.total_respuestas}</h3>
                        <p>Preguntas Respondidas</p>
                    </div>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="recomendaciones-section">
                <div className="section-header">
                    <h2>
                        <TrendingUp size={24} />
                        Tus Carreras Recomendadas
                    </h2>
                    <p>Basadas en tus respuestas y perfil vocacional</p>
                </div>

                {resultado.recomendaciones && resultado.recomendaciones.length > 0 ? (
                    <div className="recomendaciones-list">
                        {resultado.recomendaciones.map((rec, index) => (
                            <div key={rec.id} className="recomendacion-card">
                                <div className="card-header">
                                    <div className="ranking-badge">#{index + 1}</div>
                                    <div className="nivel-badge" style={{ 
                                        backgroundColor: obtenerColorNivel(rec.nivel),
                                        color: 'white'
                                    }}>
                                        {obtenerIconoNivel(rec.nivel)} {rec.nivel}
                                    </div>
                                </div>

                                <h3 className="carrera-nombre">{rec.carrera}</h3>
                                <p className="carrera-descripcion">{rec.descripcion}</p>

                                {/* Barra de Score */}
                                <div className="score-section">
                                    <div className="score-header">
                                        <span>Afinidad</span>
                                        <span className="score-value">{rec.score?.toFixed(1)}%</span>
                                    </div>
                                    <div className="score-bar">
                                        <div 
                                            className="score-fill"
                                            style={{ 
                                                width: `${rec.score}%`,
                                                backgroundColor: obtenerColorNivel(rec.nivel)
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Estrellas */}
                                <div className="rating-stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={20}
                                            fill={star <= (rec.score / 20) ? obtenerColorNivel(rec.nivel) : 'none'}
                                            color={star <= (rec.score / 20) ? obtenerColorNivel(rec.nivel) : '#cbd5e0'}
                                        />
                                    ))}
                                </div>

                                <button className="btn-info-carrera">
                                    Más información sobre esta carrera →
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-recomendaciones">
                        <p>No se generaron recomendaciones. Por favor, contacta al orientador.</p>
                    </div>
                )}
            </div>

            {/* Próximos Pasos */}
            <div className="next-steps">
                <h3>📋 Próximos Pasos</h3>
                <ul>
                    <li>
                        <CheckCircle size={20} />
                        <span>Investiga más sobre las carreras recomendadas</span>
                    </li>
                    <li>
                        <CheckCircle size={20} />
                        <span>Consulta con un orientador vocacional</span>
                    </li>
                    <li>
                        <CheckCircle size={20} />
                        <span>Explora las universidades que ofrecen estas carreras</span>
                    </li>
                    <li>
                        <CheckCircle size={20} />
                        <span>Completa otros cuestionarios para una orientación más precisa</span>
                    </li>
                </ul>
            </div>

            {/* CTA */}
            <div className="resultado-footer">
                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="btn-primary-large"
                >
                    Completar Más Cuestionarios
                </button>
                <button 
                    onClick={() => navigate('/estudiante/dashboard')}
                    className="btn-secondary-large"
                >
                    Ver Todos Mis Resultados
                </button>
            </div>
        </div>
    );
};

export default ResultadoCuestionario;
