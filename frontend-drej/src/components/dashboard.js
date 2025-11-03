import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/Api';

import '../Css/dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        console.log('📊 [DASHBOARD] Cargando datos del usuario...');
        try {
            const data = await authAPI.me();
            console.log('✅ [DASHBOARD] Datos cargados:', data);
            setUserData(data);
        } catch (err) {
            console.error('❌ [DASHBOARD] Error al cargar datos:', err);
            setError('Error al cargar datos del usuario');
            
            // Si hay error 401, redirigir al login
            if (err.response?.status === 401) {
                console.log('🔄 [DASHBOARD] Token inválido, redirigiendo al login...');
                authAPI.logout();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        console.log('👋 [DASHBOARD] Cerrando sesión...');
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
                    <h2 style={{ textAlign: 'center', marginTop: '20px' }}>Cargando...</h2>
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
        <div className="dashboard-container">
            <div className="dashboard-card">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">🎉 Dashboard - Testing</h1>
                    <button onClick={handleLogout} className="logout-button">
                        Cerrar Sesión
                    </button>
                </div>

                {/* Success Banner */}
                <div className="success-banner">
                    ✅ Conexión exitosa con el backend
                </div>

                {/* Información del Usuario */}
                <div className="dashboard-section">
                    <h2 className="section-title">👤 Información del Usuario</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Usuario:</span>
                            <span className="info-value">{userData?.user || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{userData?.email || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Nombre:</span>
                            <span className="info-value">{userData?.first_name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Apellido:</span>
                            <span className="info-value">{userData?.last_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Información de Rol */}
                {userData?.rol && (
                    <div className="dashboard-section">
                        <h2 className="section-title">🎭 Información de Rol</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Rol ID:</span>
                                <span className="info-value">{userData.rol.rol_id}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Rol Nombre:</span>
                                <span className="info-value">{userData.rol.rol_nombre}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Tipo Usuario:</span>
                                <span className="info-value">{userData.rol.tipo_usuario}</span>
                            </div>
                            {userData.rol.estado_verificacion && (
                                <div className="info-item">
                                    <span className="info-label">Estado Verificación:</span>
                                    <span className="info-value">{userData.rol.estado_verificacion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Debugging Info */}
                <div className="dashboard-section">
                    <h2 className="section-title">🔍 Debugging Info</h2>
                    <div className="debug-box">
                        <pre>{JSON.stringify(userData, null, 2)}</pre>
                    </div>
                </div>

                {/* Footer */}
                <div className="dashboard-footer">
                    <p className="footer-text">
                        ✅ Sistema funcionando correctamente
                    </p>
                    <p className="footer-text">
                        🔐 Autenticación JWT activa
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;