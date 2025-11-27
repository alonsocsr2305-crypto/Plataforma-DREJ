import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    TrendingUp, 
    Users, 
    FileText, 
    Plus,
    Edit,
    Trash2,
    Eye,
    LogOut,
    Save,
    X,
    Settings
} from 'lucide-react';
import './OrientadorDashboard.css';

// Módulos del Dashboard
import EstadisticasModule from '../components/modules/EstadisticasModule';
import CuestionariosModule from '../components/modules/CuestionariosModule';
import EstudiantesModule from '../components/modules/EstudiantesModule';
import CrearCuestionarioModule from '../components/modules/CrearCuestionarioModule';

const OrientadorDashboard = () => {
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState('estadisticas');
    const [orientadorData, setOrientadorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para cuestionarios
    const [cuestionarios, setCuestionarios] = useState([]);
    const [showCrearModal, setShowCrearModal] = useState(false);

    useEffect(() => {
        loadOrientadorData();
    }, []);

    const loadOrientadorData = async () => {
        try {
            setLoading(true);
            // Aquí llamarías a tu API para obtener datos del orientador
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/');
                return;
            }

            // Simular carga de datos (reemplazar con tu API real)
            const data = {
                nombre: localStorage.getItem('nombre') || 'Orientador',
                rol: 'Orientador',
                institucion: localStorage.getItem('institucion') || 'Institución',
                estadisticas: {
                    totalEstudiantes: 0,
                    cuestionariosActivos: 0,
                    respuestasHoy: 0,
                    promedioCompletitud: 0
                }
            };

            setOrientadorData(data);
            await loadCuestionarios();
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar datos del orientador:', err);
            setError('Error al cargar el dashboard. Por favor, intenta de nuevo.');
            setLoading(false);
        }
    };

    const loadCuestionarios = async () => {
        try {
            // Aquí llamarías a tu API para obtener cuestionarios
            // const response = await fetch('API_URL/cuestionarios/', {
            //     headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            // });
            // const data = await response.json();
            
            // Datos de ejemplo
            const data = [
                {
                    id: 1,
                    titulo: 'Test de Intereses Vocacionales',
                    descripcion: 'Cuestionario para identificar áreas de interés',
                    num_preguntas: 20,
                    activo: true,
                    fecha_creacion: '2024-11-01',
                    respuestas_totales: 45
                }
            ];
            
            setCuestionarios(data);
        } catch (err) {
            console.error('Error al cargar cuestionarios:', err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const renderModule = () => {
        switch (activeModule) {
            case 'estadisticas':
                return <EstadisticasModule data={orientadorData?.estadisticas} />;
            case 'cuestionarios':
                return (
                    <CuestionariosModule 
                        cuestionarios={cuestionarios}
                        onCrear={() => setShowCrearModal(true)}
                        onReload={loadCuestionarios}
                    />
                );
            case 'estudiantes':
                return <EstudiantesModule />;
            case 'crear-cuestionario':
                return <CrearCuestionarioModule onSuccess={loadCuestionarios} />;
            default:
                return <EstadisticasModule data={orientadorData?.estadisticas} />;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Cargando dashboard...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-container">
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Volver al Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="orientador-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <BookOpen size={32} />
                        <span>VocaRed</span>
                        <span className="role-badge">Orientador</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeModule === 'estadisticas' ? 'active' : ''}`}
                        onClick={() => setActiveModule('estadisticas')}
                    >
                        <TrendingUp size={20} />
                        <span>Estadísticas</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'cuestionarios' ? 'active' : ''}`}
                        onClick={() => setActiveModule('cuestionarios')}
                    >
                        <FileText size={20} />
                        <span>Cuestionarios</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'estudiantes' ? 'active' : ''}`}
                        onClick={() => setActiveModule('estudiantes')}
                    >
                        <Users size={20} />
                        <span>Estudiantes</span>
                    </button>

                    <button 
                        className={`nav-item ${activeModule === 'crear-cuestionario' ? 'active' : ''}`}
                        onClick={() => setActiveModule('crear-cuestionario')}
                    >
                        <Plus size={20} />
                        <span>Crear Cuestionario</span>
                    </button>

                    <div className="sidebar-divider"></div>

                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {orientadorData?.nombre?.charAt(0) || 'O'}
                        </div>
                        <div className="user-details">
                            <p className="user-name">{orientadorData?.nombre}</p>
                            <p className="user-role">{orientadorData?.institucion}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-content">
                        <h1>
                            {activeModule === 'estadisticas' && '📊 Panel de Estadísticas'}
                            {activeModule === 'cuestionarios' && '📝 Gestión de Cuestionarios'}
                            {activeModule === 'estudiantes' && '👥 Gestión de Estudiantes'}
                            {activeModule === 'crear-cuestionario' && '✨ Crear Nuevo Cuestionario'}
                        </h1>
                        <p className="header-subtitle">
                            {activeModule === 'estadisticas' && 'Visualiza el progreso y rendimiento de tus estudiantes'}
                            {activeModule === 'cuestionarios' && 'Administra y monitorea tus cuestionarios vocacionales'}
                            {activeModule === 'estudiantes' && 'Revisa el progreso individual de cada estudiante'}
                            {activeModule === 'crear-cuestionario' && 'Diseña cuestionarios personalizados para tus estudiantes'}
                        </p>
                    </div>
                </header>

                <div className="dashboard-content">
                    {renderModule()}
                </div>
            </main>
        </div>
    );
};

export default OrientadorDashboard;
