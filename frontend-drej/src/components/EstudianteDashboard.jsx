import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    Award, 
    TrendingUp, 
    User, 
    Settings,
    LogOut,
    ChevronRight,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Eye
} from 'lucide-react';
import { authAPI } from '../services/Api';
import { cuestionariosAPI } from '../services/cuestionarios';
import RetakeQuestionnaireModal from './RetakeQuestionnaireModal';

import '../Css/estudiante-dashboard.css';

const EstudianteDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModule, setActiveModule] = useState('inicio');
    const handleVerResultados = (intentoId) => {
        console.log('📊 [CUESTIONARIOS] Ver resultados del intento:', intentoId);
        navigate(`/estudiante/resultado/${intentoId}`);
    };

    const [showRetakeModal, setShowRetakeModal] = useState(false);
    const [selectedCuestionario, setSelectedCuestionario] = useState(null);
    const [resultadoAnterior, setResultadoAnterior] = useState(null);

    const handleRetakeClick = async (cuestionarioId) => {
        // Verificar si puede retomar
        const token = localStorage.getItem('access_token'); 

        const response = await fetch(
            `http://localhost:8000/api/estudiante/cuestionarios/${cuestionarioId}/verificar-retomar/`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ razon })
            }
        );

        if (response.ok) {
            setShowRetakeModal(false);
            // Redirigir al cuestionario
            window.location.href = `/estudiante/cuestionario/${selectedCuestionario}`;
        }
    };

    // Datos de ejemplo - en producción vendrían del backend
    const [dashboardData, setDashboardData] = useState({
        cuestionariosDisponibles: 0,
        cuestionariosCompletados: 0,
        ultimaEvaluacion: null,
        fechaUltimaEvaluacion: null,
        recomendacionesActivas: 0,
        progreso: 0
    });

    const [cuestionarios, setCuestionarios] = useState([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    useEffect(() => {
        loadUserData();
        loadDashboardData();  // Nueva función
    }, []);

    const loadUserData = async () => {
        try {
            const data = await authAPI.me();
            
            // Verificar que sea estudiante
            if (data.rol.tipo_usuario !== 'Estudiante') {
                navigate('/dashboard'); // Redirigir a dashboard genérico si no es estudiante
                return;
            }
            
            setUserData(data);
        } catch (err) {
            console.error('❌ [DASHBOARD] Error al cargar datos:', err);
            setError('Error al cargar datos del usuario');
            
            if (err.response?.status === 401) {
                authAPI.logout();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoadingDashboard(true);
            console.log('📊 [DASHBOARD] Cargando datos...');
            
            const data = await cuestionariosAPI.obtenerDashboard();
            console.log('✅ [DASHBOARD] Datos recibidos:', data);
            
            setDashboardData({
                cuestionariosDisponibles: data.cuestionariosDisponibles || 0,
                cuestionariosCompletados: data.cuestionariosCompletados || 0,
                ultimaEvaluacion: data.ultimaEvaluacion || null,
                fechaUltimaEvaluacion: data.fechaUltimaEvaluacion || null,
                recomendacionesActivas: data.recomendacionesActivas || 0,
                progreso: data.progreso || 0
            });
            
        } catch (err) {
            console.error('❌ [DASHBOARD] Error al cargar datos del dashboard:', err);
            // Mantener valores por defecto en caso de error
            setDashboardData({
                cuestionariosDisponibles: 0,
                cuestionariosCompletados: 0,
                ultimaEvaluacion: null,
                fechaUltimaEvaluacion: null,
                recomendacionesActivas: 0,
                progreso: 0
            });
        } finally {
            setLoadingDashboard(false);
        }
    };

    const loadCuestionarios = async () => {
        try {
            console.log('📝 [DASHBOARD] Cargando cuestionarios...');
            const data = await cuestionariosAPI.listarCuestionarios();
            console.log('✅ [DASHBOARD] Cuestionarios recibidos:', data);
            setCuestionarios(data);
        } catch (err) {
            console.error('❌ [DASHBOARD] Error al cargar cuestionarios:', err);
        }
    };
    
    const handleLogout = () => {
        authAPI.logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-card">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                    <h2 style={{ textAlign: 'center', marginTop: '20px' }}>Cargando tu dashboard...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-card error-container">
                    <h2 className="error-title">⚠️ Error</h2>
                    <p className="error-message">{error}</p>
                    <button onClick={() => navigate('/')} className="dashboard-button">
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="estudiante-dashboard">
            {/* Sidebar de navegación */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <BookOpen size={32} />
                        <span>VocaRed</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeModule === 'inicio' ? 'active' : ''}`}
                        onClick={() => setActiveModule('inicio')}
                    >
                        <TrendingUp size={20} />
                        <span>Inicio</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'cuestionarios' ? 'active' : ''}`}
                        onClick={() => setActiveModule('cuestionarios')}
                    >
                        <BookOpen size={20} />
                        <span>Cuestionarios</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'resultados' ? 'active' : ''}`}
                        onClick={() => setActiveModule('resultados')}
                    >
                        <Award size={20} />
                        <span>Mis Resultados</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'perfil' ? 'active' : ''}`}
                        onClick={() => setActiveModule('perfil')}
                    >
                        <User size={20} />
                        <span>Mi Perfil</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'configuracion' ? 'active' : ''}`}
                        onClick={() => setActiveModule('configuracion')}
                    >
                        <Settings size={20} />
                        <span>Configuración</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-welcome">
                        <h1>¡Hola, {userData?.first_name}! 👋</h1>
                        <p>Bienvenido a tu panel de orientación vocacional</p>
                    </div>
                    <div className="header-actions">
                        <div className="user-avatar">
                            {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Contenido dinámico según módulo activo */}
                <div className="dashboard-content">
                    {activeModule === 'inicio' && <InicioModule data={dashboardData} />}
                    {activeModule === 'cuestionarios' && (
                        <CuestionariosModule 
                            handleRetakeClick={handleRetakeClick}
                            showRetakeModal={showRetakeModal}
                            setShowRetakeModal={setShowRetakeModal}
                            selectedCuestionario={selectedCuestionario}
                            resultadoAnterior={resultadoAnterior}
                            handleConfirmRetake={handleConfirmRetake}
                        />
                    )}
                    {activeModule === 'resultados' && <ResultadosModule />}
                    {activeModule === 'perfil' && <PerfilModule userData={userData} />}
                    {activeModule === 'configuracion' && <ConfiguracionModule userData={userData} />}
                </div>
            </main>
        </div>
    );
};

// ============================================
// MÓDULO: INICIO
// ============================================
const InicioModule = ({ data }) => {
    return (
        <div className="module-inicio">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{data.cuestionariosDisponibles}</h3>
                        <p>Cuestionarios Disponibles</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{data.cuestionariosCompletados}</h3>
                        <p>Completados</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{data.recomendacionesActivas}</h3>
                        <p>Recomendaciones</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{data.progreso}%</h3>
                        <p>Progreso Total</p>
                    </div>
                </div>
            </div>

            {/* Progreso general */}
            <div className="progress-section">
                <h2>Tu Progreso</h2>
                <div className="progress-card">
                    <div className="progress-header">
                        <span>Completado</span>
                        <span className="progress-percentage">{data.progreso}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${data.progreso}%` }}></div>
                    </div>
                    <p className="progress-description">
                        Has completado {data.cuestionariosCompletados} de {data.cuestionariosDisponibles + data.cuestionariosCompletados} cuestionarios disponibles
                    </p>
                </div>
            </div>

            {/* Actividad reciente */}
            <div className="recent-activity">
                <h2>Actividad Reciente</h2>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-icon completed">
                            <CheckCircle size={20} />
                        </div>
                        <div className="activity-details">
                            <h4>{data.ultimaEvaluacion}</h4>
                            <p>
                                <Calendar size={14} />
                                {new Date(data.fechaUltimaEvaluacion).toLocaleDateString('es-ES', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                        <button className="activity-action">
                            Ver Resultado <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Llamado a la acción */}
            <div className="cta-section">
                <div className="cta-card">
                    <h3>¿Listo para descubrir tu vocación?</h3>
                    <p>Completa los cuestionarios disponibles y recibe recomendaciones personalizadas</p>
                    <button className="btn-primary">
                        Comenzar Evaluación <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MÓDULO: CUESTIONARIOS
// ============================================
const CuestionariosModule = ({ 
    handleRetakeClick,
    showRetakeModal,
    setShowRetakeModal,
    selectedCuestionario,
    resultadoAnterior,
    handleConfirmRetake
}) => {
    const navigate = useNavigate(); 
    const [cuestionarios, setCuestionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarCuestionarios();
    }, []);

    const cargarCuestionarios = async () => {
        try {
            setLoading(true);
            console.log('📝 [CUESTIONARIOS] Cargando cuestionarios...');
            
            const data = await cuestionariosAPI.listarCuestionarios();
            console.log('✅ [CUESTIONARIOS] Recibidos:', data);
            
            setCuestionarios(data);
        } catch (err) {
            console.error('❌ [CUESTIONARIOS] Error:', err);
            setError('Error al cargar los cuestionarios');
        } finally {
            setLoading(false);
        }
    };

    const handleIniciarCuestionario = (cuestionarioId) => {
        console.log('🚀 [CUESTIONARIOS] Iniciando cuestionario:', cuestionarioId);
        navigate(`/estudiante/cuestionario/${cuestionarioId}`);
    };

    const handleVerResultados = (intentoId) => {
        console.log('📊 [CUESTIONARIOS] Ver resultados del intento:', intentoId);
        navigate(`/estudiante/resultado/${intentoId}`);
    };

    if (loading) {
        return (
            <div className="module-cuestionarios">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando cuestionarios...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="module-cuestionarios">
                <div className="error-container">
                    <AlertCircle size={48} color="#e74c3c" />
                    <h3>{error}</h3>
                    <button onClick={cargarCuestionarios} className="btn-primary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="module-cuestionarios">
            <div className="module-header">
                <h2>Cuestionarios de Orientación</h2>
                <p>Completa las evaluaciones para recibir recomendaciones personalizadas</p>
            </div>

            {cuestionarios.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={64} color="#cbd5e0" />
                    <h3>No hay cuestionarios disponibles</h3>
                    <p>Pronto habrá nuevos cuestionarios disponibles</p>
                </div>
            ) : (
                <div className="cuestionarios-grid">
                    {cuestionarios.map(cuestionario => (
                        <div key={cuestionario.id} className={`cuestionario-card ${cuestionario.completado ? 'completed' : ''}`}>
                            <div className="cuestionario-header">
                                {cuestionario.completado ? (
                                    <div className="status-badge completed">
                                        <CheckCircle size={16} />
                                        Completado
                                    </div>
                                ) : (
                                    <div className="status-badge available">
                                        <AlertCircle size={16} />
                                        Disponible
                                    </div>
                                )}
                            </div>
                            
                            <h3>{cuestionario.titulo}</h3>
                            <p className="cuestionario-descripcion">{cuestionario.descripcion}</p>
                            
                            <div className="cuestionario-meta">
                                <div className="meta-item">
                                    <Clock size={16} />
                                    <span>{cuestionario.duracion}</span>
                                </div>
                                <div className="meta-item">
                                    <BookOpen size={16} />
                                    <span>{cuestionario.preguntas} preguntas</span>
                                </div>
                            </div>

                            <div className="cuestionario-actions">
                                {cuestionario.completado && (
                                    <>
                                        <button 
                                            className="btn-primary"
                                            onClick={handleVerResultados}
                                        >
                                            <Eye size={18} />
                                            Ver Resultados
                                        </button>
                                        
                                        <button 
                                            className="btn-primary"
                                            onClick={() => handleRetakeClick(cuestionario.id, cuestionario)}
                                        >
                                            <RefreshCw size={18} />
                                            Volver a Dar </button>
                                            <RetakeQuestionnaireModal
                                                isOpen={showRetakeModal}
                                                onClose={() => setShowRetakeModal(false)}
                                                cuestionario={selectedCuestionario}
                                                resultadoAnterior={resultadoAnterior}
                                                onConfirm={handleConfirmRetake}
                                            />
                                    </>
                                )}
                                
                                {!cuestionario.completado && (
                                    <button 
                                        className="btn-comenzar"
                                        onClick={() => navigate(`/estudiante/cuestionario/${cuestionario.id}`)}
                                    >
                                        Comenzar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="info-box">
                <AlertCircle size={20} />
                <div>
                    <strong>Importante:</strong>
                    <p>Completa todos los cuestionarios para obtener una orientación vocacional más precisa y personalizada.</p>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MÓDULO: RESULTADOS
// ============================================
const ResultadosModule = () => {
    const resultados = [
        {
            id: 1,
            test: 'Test de Intereses Vocacionales',
            fecha: '2024-11-15',
            score: 85,
            recomendaciones: [
                'Ingeniería de Software',
                'Ciencias de la Computación',
                'Ingeniería de Sistemas'
            ]
        }
    ];

    return (
        <div className="module-resultados">
            <div className="module-header">
                <h2>Mis Resultados</h2>
                <p>Revisa los resultados de tus evaluaciones completadas</p>
            </div>

            {resultados.length > 0 ? (
                <div className="resultados-list">
                    {resultados.map(resultado => (
                        <div key={resultado.id} className="resultado-card">
                            <div className="resultado-header">
                                <div>
                                    <h3>{resultado.test}</h3>
                                    <p className="resultado-fecha">
                                        <Calendar size={14} />
                                        {new Date(resultado.fecha).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="resultado-score">
                                    <div className="score-circle">
                                        {resultado.score}
                                    </div>
                                    <span>Score</span>
                                </div>
                            </div>

                            <div className="resultado-recomendaciones">
                                <h4>Carreras Recomendadas:</h4>
                                <div className="recomendaciones-tags">
                                    {resultado.recomendaciones.map((carrera, idx) => (
                                        <span key={idx} className="recomendacion-tag">
                                            {carrera}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-secondary">
                                Ver Detalle Completo <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Award size={64} color="#cbd5e0" />
                    <h3>Aún no tienes resultados</h3>
                    <p>Completa tus primeros cuestionarios para ver tus resultados aquí</p>
                    <button className="btn-primary">
                        Ir a Cuestionarios <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ============================================
// MÓDULO: PERFIL
// ============================================
const PerfilModule = ({ userData }) => {
    return (
        <div className="module-perfil">
            <div className="module-header">
                <h2>Mi Perfil</h2>
                <p>Información personal y académica</p>
            </div>

            <div className="perfil-content">
                <div className="perfil-card">
                    <div className="perfil-avatar-section">
                        <div className="perfil-avatar-large">
                            {userData?.first_name?.charAt(0)}{userData?.last_name?.charAt(0)}
                        </div>
                        <h3>{userData?.first_name} {userData?.last_name}</h3>
                        <p className="perfil-rol">Estudiante</p>
                    </div>

                    <div className="perfil-info-grid">
                        <div className="info-row">
                            <label>Email</label>
                            <span>{userData?.email}</span>
                        </div>
                        <div className="info-row">
                            <label>Usuario</label>
                            <span>{userData?.user}</span>
                        </div>
                        <div className="info-row">
                            <label>Tipo de Usuario</label>
                            <span>{userData?.rol?.tipo_usuario}</span>
                        </div>
                    </div>

                    <button className="btn-secondary" style={{ marginTop: '20px' }}>
                        Editar Perfil
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MÓDULO: CONFIGURACIÓN
// ============================================
const ConfiguracionModule = ({ userData }) => {
    return (
        <div className="module-configuracion">
            <div className="module-header">
                <h2>Configuración</h2>
                <p>Administra las preferencias de tu cuenta</p>
            </div>

            <div className="configuracion-sections">
                <div className="config-section">
                    <h3>Notificaciones</h3>
                    <div className="config-options">
                        <div className="config-option">
                            <div>
                                <h4>Notificaciones por email</h4>
                                <p>Recibe actualizaciones sobre nuevos cuestionarios</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="config-option">
                            <div>
                                <h4>Recordatorios de cuestionarios</h4>
                                <p>Te avisaremos cuando tengas evaluaciones pendientes</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="config-section">
                    <h3>Seguridad</h3>
                    <div className="config-options">
                        <button className="config-button">
                            Cambiar Contraseña
                        </button>
                    </div>
                </div>

                <div className="config-section danger">
                    <h3>Zona de Peligro</h3>
                    <div className="config-options">
                        <button className="config-button danger">
                            Eliminar Cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EstudianteDashboard;
