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
            setError(null);
            
            // ⭐ OBTENER TOKEN DE AUTENTICACIÓN
            const token = localStorage.getItem('access_token'); // Cambiar de 'token' a 'access_token'
            
            if (!token) {
                console.error('❌ No hay token de autenticación');
                navigate('/');
                return;
            }

            console.log('🔐 Token encontrado, llamando a API...');

            // ⭐ LLAMADA REAL A LA API DEL BACKEND
            const response = await fetch('http://localhost:8000/api/api/orientador/dashboard/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Respuesta de API:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('❌ Token inválido o expirado');
                    localStorage.clear();
                    navigate('/');
                    return;
                }
                if (response.status === 403) {
                    console.error('❌ No tienes permisos de orientador');
                    setError('No tienes permisos de orientador. Por favor, contacta al administrador.');
                    setLoading(false);
                    return;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Datos del orientador cargados:', data);

            setOrientadorData(data);
            
            // Cargar cuestionarios
            await loadCuestionarios();
            
            setLoading(false);
        } catch (err) {
            console.error('❌ Error al cargar datos del orientador:', err);
            setError('Error al cargar el dashboard. Por favor, intenta de nuevo.');
            setLoading(false);
        }
    };

    const loadCuestionarios = async () => {
        try {
            const token = localStorage.getItem('access_token');
            
            const response = await fetch('http://localhost:8000/api/api/orientador/cuestionarios/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Cuestionarios cargados:', data);
            setCuestionarios(data);
        } catch (err) {
            console.error('❌ Error al cargar cuestionarios:', err);
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
                    <button 
                        onClick={() => {
                            setError(null);
                            loadOrientadorData();
                        }}
                        style={{ marginLeft: '10px' }}
                    >
                        Reintentar
                    </button>
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

                    <button 
                        className="nav-item logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </nav>

                {orientadorData && (
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar">
                                {orientadorData.nombre?.charAt(0) || 'O'}
                            </div>
                            <div className="user-details">
                                <p className="user-name">{orientadorData.nombre}</p>
                                <p className="user-role">{orientadorData.institucion}</p>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-content">
                        <h1>
                            {activeModule === 'estadisticas' && 'Panel de Estadísticas'}
                            {activeModule === 'cuestionarios' && 'Gestión de Cuestionarios'}
                            {activeModule === 'estudiantes' && 'Gestión de Estudiantes'}
                            {activeModule === 'crear-cuestionario' && 'Crear Nuevo Cuestionario'}
                        </h1>
                        <p className="header-subtitle">
                            {orientadorData?.nombre && `Bienvenido, ${orientadorData.nombre}`}
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