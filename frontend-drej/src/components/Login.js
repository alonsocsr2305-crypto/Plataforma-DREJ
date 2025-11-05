import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import DNIAuth from './DNIAuth';
import GoogleLoginButton from './GoogleLogin';
import { authAPI } from '../services/Api';

import '../Css/styles.css';
import '../Css/login.css';
import '../Css/modal.css';

// Importa las imágenes
import LogoImage from '../assets/Imagenes/Logo.png';
import VocaRedText from '../assets/Imagenes/VocaRed.png';
import LogoDNI from '../assets/Imagenes/LogoDNI.png';
import LogoTelef from '../assets/Imagenes/LogoTelef.png';

const Login = () => {
    // Estados para el formulario
    const navigate = useNavigate();
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isDNIAuthOpen, setIsDNIAuthOpen] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        console.log('🔐 [LOGIN] Iniciando proceso de login...');
        console.log('📧 Email/Username:', loginEmail);

        try {
            // 1. Intentar login
            console.log('⏳ [LOGIN] Enviando credenciales al backend...');
            const loginResponse = await authAPI.login({ 
                username: loginEmail, 
                password: loginPassword 
            });
            console.log('✅ [LOGIN] Login exitoso:', loginResponse);
            
            // 2. Verificar usuario autenticado
            console.log('👤 [LOGIN] Obteniendo datos del usuario...');
            const userData = await authAPI.me();
            console.log('✅ [LOGIN] Datos del usuario:', userData);
            
            // 3. Mostrar info en consola
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 LOGIN EXITOSO');
            console.log('Usuario:', userData.user);
            console.log('Email:', userData.email);
            console.log('Rol:', userData.rol?.rol_nombre || 'N/A');
            console.log('Tipo:', userData.rol?.tipo_usuario || 'N/A');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            alert(`¡Bienvenido ${userData.first_name || userData.user}!\n\nRol: ${userData.rol?.rol_nombre}\nTipo: ${userData.rol?.tipo_usuario}`);
            navigate('/dashboard');
            
        } catch (err) {
            console.error('❌ [LOGIN] Error:', err);
            console.error('📄 [LOGIN] Error completo:', err.response || err);
            
            if (err.response) {
                const errorMsg = err.response.data.detail || 
                                err.response.data.error || 
                                'Credenciales incorrectas';
                console.error('⚠️ [LOGIN] Mensaje de error:', errorMsg);
                setError(errorMsg);
            } else if (err.request) {
                console.error('⚠️ [LOGIN] No se recibió respuesta del servidor');
                setError('Error de conexión. Verifica que el backend esté corriendo en http://127.0.0.1:8000');
            } else {
                console.error('⚠️ [LOGIN] Error desconocido:', err.message);
                setError('Error inesperado: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const loginRENIEC = () => {
        setIsDNIAuthOpen(true);  // ← Abrir modal de DNIAuth
    };

    const loginPhone = () => {
        alert('Función Proximamente');
    };

    const forgotPassword = (e) => {
        e.preventDefault();
        const email = prompt('Ingresa tu correo:');
        if (email) {
            alert(`Enlace enviado a: ${email}`);
        }
    };

    const openRegisterModal = () => {
        setIsRegisterOpen(true);
    };

    const closeRegisterModal = () => {
        setIsRegisterOpen(false);
    };
    
    return (
        <>
        <div className="main-container">

            {/* Sección de imagen de fondo */}
            
            <div className="image-section">
                <div className="image-overlay"></div>
            </div>

            {/* Sección del formulario de login */}
            
            <div className="login-section">
                {/* Logo */}
                <div className="logo-section">
                    <div className="logo-container">
                        <div className="logo">
                            <img 
                                src={LogoImage} 
                                alt="Logo VocaRed" 
                                className="logo-image"
                            />
                        </div>
                        <div className="logo-text">
                            <img 
                                src={VocaRedText} 
                                alt="Text VocaRed" 
                                className="text-image"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '16px',
                        backgroundColor: '#ffebee',
                        border: '1px solid #ef5350',
                        borderRadius: '8px',
                        color: '#c62828',
                        fontSize: '14px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Formulario de Login */}
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <input 
                            type="text" 
                            id="loginEmail"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="Correo electrónico o usuario" 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input 
                            type="password" 
                            id="loginPassword"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Contraseña" 
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Iniciando sesión...': 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Divider */}
                <div className="divider">
                    <span>O</span>
                </div>

                {/* Métodos de Autenticación Alternativos */}
                <div className="auth-alternatives">
                    <button 
                        className="auth-button DNI-btn" 
                        onClick={loginRENIEC}
                        type="button"
                    >
                        <img 
                            src={LogoDNI} 
                            className="DNI-log" 
                            alt="DNI"
                        />
                        <span>Continuar con DNI</span>
                    </button>

                    <GoogleLoginButton />

                    <button 
                        className="auth-button telef-btn" 
                        onClick={loginPhone}
                        type="button"
                    >
                        <img 
                            src={LogoTelef} 
                            className="telef-log" 
                            alt="Teléfono"
                        />
                        <span>Continuar con teléfono</span>
                    </button>
                </div>

                {/* Olvidaste tu contraseña */}
                <div className="forgot-password">
                    <a href="#" onClick={forgotPassword}>
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>

                {/* Botón de Registro */}
                <button 
                    className="btn-register" 
                    onClick={openRegisterModal}
                    type="button"
                >
                    Registrarse
                </button>
            </div>
        </div>

        <Register 
            isOpen={isRegisterOpen} 
            onClose={closeRegisterModal} 
            />

        <DNIAuth 
            isOpen={isDNIAuthOpen} 
            onClose={() => setIsDNIAuthOpen(false)} 
        />

        
        </>
       
    );
};

export default Login;