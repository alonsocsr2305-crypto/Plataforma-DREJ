// ====================================================
// COMPONENTE MEJORADO: RESULTADOS CON MANEJO DE ESTADO VACÍO
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
    Star,
    Sparkles,
    Target,
    Zap,
    AlertCircle,
    RefreshCw,
    HelpCircle
} from 'lucide-react';
import { cuestionariosAPI } from '../services/cuestionarios';
import '../Css/resultado-cuestionario.css';
import RetakeQuestionnaireModal from '../components/RetakeQuestionnaireModal';


const ResultadoCuestionario = () => {
    const navigate = useNavigate();
    const { intentoId } = useParams();
    const location = useLocation();
    
    const [loading, setLoading] = useState(true);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [regenerando, setRegenerando] = useState(false);

    const [showRetakeModal, setShowRetakeModal] = useState(false);
    const [selectedCuestionario, setSelectedCuestionario] = useState(null);
    const [resultadoAnterior, setResultadoAnterior] = useState(null);
    
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

    const handleRegenerar = async () => {
        // Función para regenerar recomendaciones
        // Necesitarías crear un endpoint en el backend
        setRegenerando(true);
        try {
            // await cuestionariosAPI.regenerarRecomendaciones(intentoId);
            // await cargarResultado(intentoId);
            alert('Funcionalidad de regeneración en desarrollo');
        } catch (err) {
            console.error('Error al regenerar:', err);
        } finally {
            setRegenerando(false);
        }
    };

    const handleRetakeClick = async (cuestionarioId) => {
        // Verificar si puede retomar
        const response = await fetch(
            `http://localhost:8000/api/estudiante/cuestionarios/${cuestionarioId}/verificar-retomar/`,
            {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`
                }
            }
        );
        const data = await response.json();
        
        if (data.puede_retomar) {
            setSelectedCuestionario(cuestionarioId);
            setResultadoAnterior(data.resultado_anterior);
            setShowRetakeModal(true);
        }
    };

    const handleConfirmRetake = async (razon) => {
        const response = await fetch(
            `http://localhost:8000/api/estudiante/cuestionarios/${selectedCuestionario}/reiniciar/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ razon })
            }
        );

        if (response.ok) {
            setShowRetakeModal(false);
            // Redirigir al cuestionario
            window.location.href = `/cuestionario/${selectedCuestionario}`;
        }
    };

    return (
        <div>
            {/* Tu contenido de resultados */}
            <button onClick={() => handleRetakeClick(cuestionarioId)}>
                Volver a Dar
            </button>

            <RetakeQuestionnaireModal
                isOpen={showRetakeModal}
                onClose={() => setShowRetakeModal(false)}
                cuestionario={selectedCuestionario}
                resultadoAnterior={resultadoAnterior}
                onConfirm={handleConfirmRetake}
            />
        </div>
    );

    if (loading) {
        return (
            <div className="resultado-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando resultados...</p>
                </div>
            </div>
        );
    }

    if (error || !resultado) {
        return (
            <div className="resultado-container">
                <div className="error-state">
                    <AlertCircle size={64} color="#ef4444" />
                    <h2>Error al cargar</h2>
                    <p>{error || 'No se encontró el resultado'}</p>
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/estudiante/dashboard')}
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="resultado-container">
            {/* Header con navegación */}
            <div className="resultado-nav">
                <button 
                    className="btn-back"
                    onClick={() => navigate('/estudiante/dashboard')}
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
            </div>

            {/* Título y Celebración */}
            <div className="resultado-hero">
                <div className="hero-content">
                    <h1>¡Felicitaciones!</h1>
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

            {/* Resumen - SIEMPRE VISIBLE */}
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
                <div className="stat-box">
                    <Sparkles size={32} />
                    <div>
                        <h3>IA</h3>
                        <p>Análisis con IA</p>
                    </div>
                </div>
            </div>

            {/* Recomendaciones o Estado Vacío */}
            <div className="recomendaciones-section">
                <div className="section-header">
                    <h2>
                        <TrendingUp size={24} />
                        Tus Carreras Recomendadas
                    </h2>
                    <p>Generadas con Inteligencia Artificial basadas en tu perfil vocacional</p>
                </div>

                {resultado.recomendaciones && resultado.recomendaciones.length > 0 ? (
                    <div className="recomendaciones-lista">
                        {resultado.recomendaciones.map((rec, index) => (
                            <div 
                                key={rec.id} 
                                className="recomendacion-card-mejorada"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Header */}
                                <div className="recomendacion-header">
                                    <div className="recomendacion-ranking">
                                        <div className="ranking-numero">
                                            {index + 1}
                                        </div>
                                    </div>

                                    <div className="recomendacion-titulo">
                                        <h3>{rec.carrera}</h3>
                                        <div className="recomendacion-meta">
                                            <span className="nivel-badge">
                                                <Target size={16} />
                                                {rec.nivel}
                                            </span>
                                            <span className="score-badge">
                                                <Star size={16} />
                                                {rec.score}% Match
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Progreso */}
                                <div className="score-bar-container">
                                    <div 
                                        className="score-bar" 
                                        style={{ width: `${rec.score}%` }}
                                    >
                                        <span className="score-text">{rec.score}%</span>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="recomendacion-descripcion">
                                    <div className="ia-indicator">
                                        <Sparkles size={14} />
                                        Generado con IA
                                    </div>
                                    <p>{rec.descripcion}</p>
                                </div>

                                {/* Acciones */}
                                <div className="recomendacion-acciones">
                                    <button className="btn-detalle">
                                        Ver Detalles
                                    </button>
                                    <button className="btn-comparar">
                                        Comparar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-recomendaciones">
                        <div className="empty-icon-wrapper">
                            <AlertCircle size={72} />
                        </div>
                        <h3>No se generaron recomendaciones</h3>
                        <p className="empty-subtitle">
                            Hubo un problema al procesar tus resultados con la Inteligencia Artificial
                        </p>
                        
                        <div className="empty-details">
                            <div className="empty-detail-item">
                                <HelpCircle size={20} />
                                <div>
                                    <strong>¿Por qué pasó esto?</strong>
                                    <p>El sistema de IA puede estar temporalmente no disponible o experimentando problemas técnicos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="empty-actions">
                            <button 
                                className="btn-regenerar"
                                onClick={handleRegenerar}
                                disabled={regenerando}
                            >
                                <RefreshCw size={20} className={regenerando ? 'spinning' : ''} />
                                {regenerando ? 'Regenerando...' : 'Intentar Nuevamente'}
                            </button>
                            <button 
                                className="btn-contactar"
                                onClick={() => window.location.href = 'mailto:soporte@vocared.com'}
                            >
                                Contactar Soporte
                            </button>
                        </div>

                        <div className="empty-note">
                            <p>
                                <strong>Nota:</strong> Tus respuestas fueron guardadas correctamente. 
                                Puedes volver al dashboard e intentar más tarde, o contactar con soporte para ayuda.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
            <div className="resultado-footer">
                <button 
                    className="btn-secondary"
                    onClick={() => navigate('/estudiante/dashboard')}
                >
                    <ArrowLeft size={20} />
                    Volver al Dashboard
                </button>
                {resultado.recomendaciones && resultado.recomendaciones.length > 0 && (
                    <button 
                        className="btn-primary"
                        onClick={() => {/* Implementar compartir */}}
                    >
                        <Share2 size={20} />
                        Compartir Resultados
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResultadoCuestionario;