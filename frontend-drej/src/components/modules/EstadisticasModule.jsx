import React from 'react';
import { TrendingUp, Users, FileText, Activity } from 'lucide-react';
import './EstadisticasModule.css';

const EstadisticasModule = ({ data }) => {
    const estadisticas = data || {
        total_estudiantes: 0,
        cuestionarios_activos: 0,
        respuestas_hoy: 0,
        promedio_completitud: 0
    };

    const cards = [
        {
            title: 'Total Estudiantes',
            value: estadisticas.total_estudiantes,
            icon: <Users size={28} />,
            color: '#4a90e2',
            bgColor: 'rgba(74, 144, 226, 0.1)'
        },
        {
            title: 'Cuestionarios Activos',
            value: estadisticas.cuestionarios_activos,
            icon: <FileText size={28} />,
            color: '#28a745',
            bgColor: 'rgba(40, 167, 69, 0.1)'
        },
        {
            title: 'Respuestas Hoy',
            value: estadisticas.respuestas_hoy,
            icon: <Activity size={28} />,
            color: '#ffc107',
            bgColor: 'rgba(255, 193, 7, 0.1)'
        },
        {
            title: 'Completitud Promedio',
            value: `${estadisticas.promedio_completitud}%`,
            icon: <TrendingUp size={28} />,
            color: '#e74c3c',
            bgColor: 'rgba(231, 76, 60, 0.1)'
        }
    ];

    return (
        <div className="estadisticas-module">
            <div className="stats-grid">
                {cards.map((card, index) => (
                    <div key={index} className="stat-card">
                        <div 
                            className="stat-icon" 
                            style={{ 
                                color: card.color,
                                backgroundColor: card.bgColor 
                            }}
                        >
                            {card.icon}
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-title">{card.title}</h3>
                            <p className="stat-value">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="info-section">
                <div className="info-card">
                    <h3>📊 Resumen de Actividad</h3>
                    <p>
                        Actualmente tienes <strong>{estadisticas.total_estudiantes}</strong> estudiantes 
                        registrados en tu institución. 
                        El {estadisticas.promedio_completitud}% han completado al menos un cuestionario.
                    </p>
                    {estadisticas.respuestas_hoy > 0 ? (
                        <p className="highlight">
                            ¡Excelente! Se han registrado {estadisticas.respuestas_hoy} respuestas hoy.
                        </p>
                    ) : (
                        <p className="muted">
                            No se han registrado respuestas hoy. Motiva a tus estudiantes a participar.
                        </p>
                    )}
                </div>

                <div className="info-card">
                    <h3>💡 Recomendaciones</h3>
                    <ul className="recommendations-list">
                        {estadisticas.promedio_completitud < 50 && (
                            <li>Considera enviar recordatorios a los estudiantes que no han completado sus cuestionarios</li>
                        )}
                        {estadisticas.cuestionarios_activos === 0 && (
                            <li>Crea al menos un cuestionario activo para que los estudiantes puedan responder</li>
                        )}
                        {estadisticas.total_estudiantes === 0 && (
                            <li>Agrega estudiantes a tu institución para comenzar a usar el sistema</li>
                        )}
                        {estadisticas.promedio_completitud >= 50 && estadisticas.respuestas_hoy > 0 && (
                            <li>¡Gran trabajo! Tu participación estudiantil es excelente</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EstadisticasModule;
