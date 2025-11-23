// ====================================================
// COMPONENTE MEJORADO: RESULTADOS CON RECOMENDACIONES IA
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
    Zap
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

    // Función auxiliar para obtener el color según el nivel
    const getNivelColor = (nivel) => {
        const colores = {
            'Excelente': '#10b981',
            'Muy Bueno': '#3b82f6',
            'Bueno': '#6366f1',
            'Regular': '#f59e0b'
        };
        return colores[nivel] || '#6b7280';
    };

    // Función auxiliar para obtener el icono según el nivel
    const getNivelIcon = (nivel) => {
        const iconos = {
            'Excelente': <Zap size={20} />,
            'Muy Bueno': <Star size={20} />,
            'Bueno': <Target size={20} />,
            'Regular': <Award size={20} />
        };
        return iconos[nivel] || <Award size={20} />;
    };

    if (loading) {
        return (
            <div className="resultado-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando tu resultado...</p>
                </div>
            </div>
        );
    }

    if (error || !resultado) {
        return (
            <div className="resultado-container">
                <div className="error-container">
                    <h3>{error || 'No se encontró el resultado'}</h3>
                    <button onClick={() => navigate('/estudiante')} className="btn-primary">
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
                <button onClick={() => navigate('/estudiante')} className="btn-back">
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div className="resultado-actions">
                    <button className="btn-icon">
                        <Download size={20} />
                    </button>
                    <button className="btn-icon">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="resultado-hero">
                <div className="hero-content">
                    <h1>¡Resultados Completados! 🎉</h1>
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
                <div className="stat-box">
                    <Sparkles size={32} />
                    <div>
                        <h3>IA</h3>
                        <p>Análisis con IA</p>
                    </div>
                </div>
            </div>

            {/* Recomendaciones Mejoradas */}
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
                                style={{
                                    borderLeft: `4px solid ${getNivelColor(rec.nivel)}`,
                                    animationDelay: `${index * 0.1}s`
                                }}
                            >
                                {/* Header de la Tarjeta */}
                                <div className="recomendacion-header">
                                    <div className="recomendacion-ranking">
                                        <span className="ranking-numero">#{index + 1}</span>
                                    </div>
                                    <div className="recomendacion-titulo">
                                        <h3>{rec.carrera}</h3>
                                        <div className="recomendacion-meta">
                                            <span 
                                                className="nivel-badge"
                                                style={{ backgroundColor: getNivelColor(rec.nivel) }}
                                            >
                                                {getNivelIcon(rec.nivel)}
                                                {rec.nivel}
                                            </span>
                                            <span className="score-badge">
                                                <Star size={16} fill="currentColor" />
                                                {rec.score}% Afinidad
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Progreso */}
                                <div className="score-bar-container">
                                    <div 
                                        className="score-bar"
                                        style={{ 
                                            width: `${rec.score}%`,
                                            backgroundColor: getNivelColor(rec.nivel)
                                        }}
                                    >
                                        <span className="score-text">{rec.score}%</span>
                                    </div>
                                </div>

                                {/* Descripción con IA */}
                                <div className="recomendacion-descripcion">
                                    <div className="ia-indicator">
                                        <Sparkles size={16} />
                                        <span>Análisis personalizado con IA</span>
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
                        <TrendingUp size={64} color="#cbd5e0" />
                        <h3>No se generaron recomendaciones</h3>
                        <p>Intenta completar el cuestionario nuevamente</p>
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
            <div className="resultado-footer">
                <button 
                    className="btn-secondary"
                    onClick={() => navigate('/estudiante')}
                >
                    Volver al Dashboard
                </button>
                <button 
                    className="btn-primary"
                    onClick={() => {/* Implementar compartir */}}
                >
                    <Share2 size={20} />
                    Compartir Resultados
                </button>
            </div>
        </div>
    );
};

export default ResultadoCuestionario;