import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import Register from './Register.jsx';
import DNIAuth from './DNIAuth.jsx';
import GoogleLoginButton from './GoogleLogin.jsx';
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
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        general: ''
    });
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isDNIAuthOpen, setIsDNIAuthOpen] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setLoginEmail(value);
        
        // Limpiar error al empezar a escribir
        if (errors.email) {
            setErrors({ ...errors, email: '' });
        }
    };

    const handleEmailBlur = () => {
        if (!loginEmail.trim()) {
            setErrors({ ...errors, email: 'El email o DNI es obligatorio' });
        } else {
            // Validar formato (puede ser email o DNI)
            const isDNI = /^\d{8}$/.test(loginEmail.trim());
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim());
            
            if (!isDNI && !isEmail) {
                setErrors({ 
                    ...errors, 
                    email: 'Ingresa un email válido o DNI de 8 dígitos' 
                });
            } else {
                // Limpiar error si es válido
                const newErrors = { ...errors };
                delete newErrors.email;
                setErrors(newErrors);
            }
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setLoginPassword(value);
        
        // Limpiar error al empezar a escribir
        if (errors.password) {
            setErrors({ ...errors, password: '' });
        }
    };

    const handlePasswordBlur = () => {
        if (!loginPassword) {
            setErrors({ ...errors, password: 'La contraseña es obligatoria' });
        } else if (loginPassword.length < 8) {
            setErrors({ ...errors, password: 'La contraseña debe tener al menos 8 caracteres' });
        } else {
            // Limpiar error si es válido
            const newErrors = { ...errors };
            delete newErrors.password;
            setErrors(newErrors);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validar email/DNI
        if (!loginEmail.trim()) {
            newErrors.email = 'El email o DNI es obligatorio';
        } else {
            const isDNI = /^\d{8}$/.test(loginEmail.trim());
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim());
            
            if (!isDNI && !isEmail) {
                newErrors.email = 'Ingresa un email válido o DNI de 8 dígitos';
            }
        }
        
        // Validar contraseña
        if (!loginPassword) {
            newErrors.password = 'La contraseña es obligatoria';
        } else if (loginPassword.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrors({ email: '', password: '', general: '' });

        // Validaciones básicas
        if (!loginEmail.trim()) {
            setErrors(prev => ({ ...prev, email: 'El email o DNI es obligatorio' }));
            return;
        }

        if (!loginPassword) {
            setErrors(prev => ({ ...prev, password: 'La contraseña es obligatoria' }));
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 [LOGIN] Iniciando proceso de login...');
            
            // 1. Intentar login
            const loginResponse = await authAPI.login({ 
                username: loginEmail.trim(), 
                password: loginPassword
            });
            
            // 2. Verificar usuario autenticado
            console.log('👤 [LOGIN] Obteniendo datos del usuario...');
            const userData = await authAPI.me();
            console.log('✅ [LOGIN] Datos del usuario:', userData);

            // 3. ⭐ REDIRECCIÓN SEGÚN TIPO DE USUARIO
            console.log('🎯 [LOGIN] Tipo de usuario:', userData.rol.tipo_usuario);
            
            if (userData.rol.tipo_usuario === 'Estudiante') {
                console.log('🎓 [LOGIN] Redireccionando a dashboard de estudiante...');
                navigate('/estudiante/dashboard');
            } else if (userData.rol.tipo_usuario === 'Orientador') {
                console.log('👨‍🏫 [LOGIN] Redireccionando a dashboard de orientador...');
                navigate('/orientador/dashboard');
            }

        } catch (err) {
            console.error('❌ [LOGIN] Error:', err);
            if (err.response) {
                // El servidor respondió con un código de error
                const status = err.response.status;
                const errorData = err.response.data;
                
                console.error('[LOGIN] Error del servidor:', errorData);
                console.error('[LOGIN] Status:', status);
                
                if (status === 401) {
                    // Credenciales incorrectas
                    const errorMsg = errorData?.detail || 
                                errorData?.error || 
                                errorData?.message ||
                                'Credenciales incorrectas';
                    
                    // Determinar si el error es del email/DNI o de la contraseña
                    if (errorMsg.toLowerCase().includes('usuario') || 
                        errorMsg.toLowerCase().includes('email') || 
                        errorMsg.toLowerCase().includes('dni')) {
                        setErrors({ 
                            email: 'Usuario no encontrado. Verifica tu email o DNI.',
                            password: '',
                            general: '' 
                        });
                    } else if (errorMsg.toLowerCase().includes('contraseña') || 
                            errorMsg.toLowerCase().includes('password')) {
                        setErrors({ 
                            email: '',
                            password: 'Contraseña incorrecta. Intenta nuevamente.',
                            general: '' 
                        });
                    } else {
                        setErrors({ 
                            email: '',
                            password: '',
                            general: errorMsg 
                        });
                    }
                } else if (status === 500) {
                    setErrors({ 
                        email: '',
                        password: '',
                        general: 'Error del servidor. Intenta más tarde.' 
                    });
                } else {
                    setErrors({ 
                        email: '',
                        password: '',
                        general: errorData?.detail || errorData?.error || 'Error al iniciar sesión' 
                    });
                }
            } else if (err.request) {
                // La petición se hizo pero no hubo respuesta
                console.error('[LOGIN] No hay respuesta del servidor');
                setErrors({ 
                    email: '',
                    password: '',
                    general: 'No se pudo conectar con el servidor. Verifica tu conexión.' 
                });
            } else {
                // Error al configurar la petición
                console.error('[LOGIN] Error al configurar la petición:', err.message);
                setErrors({ 
                    email: '',
                    password: '',
                    general: 'Error inesperado. Intenta nuevamente.' 
                });
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

    const openRegisterModal = () => {
        setIsRegisterOpen(true);
    };

    const closeRegisterModal = () => {
        setIsRegisterOpen(false);
    };

    const openDNIAuthModal = () => {
        setIsDNIAuthOpen(true);
    }

    const closeDNIAuthModal = () => {
        setIsDNIAuthOpen(false);
    }
    
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

                
                {/* Formulario de Login */}
                <form className="login-form" onSubmit={handleLogin}>
                    {errors.general && (
                    <div className="alert alert-error">
                        <AlertCircle size={20} />
                        <span>{errors.general}</span>
                    </div>
                )}

                {/* Input de Email/DNI */}
                <div className="form-group">
                    <input
                        type="text"
                        id="loginEmail"
                        name="loginEmail"
                        placeholder="Correo Electrónico o DNI"
                        value={loginEmail}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        className={errors.email ? 'input-error' : ''}
                        disabled={loading}
                        autoComplete="username"
                    />
                    {errors.email && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{errors.email}</span>
                        </div>
                    )}
                </div>

                {/* Input de Contraseña */}
                <div className="form-group">
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="loginPassword"
                            name="loginPassword"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={handlePasswordChange}
                            onBlur={handlePasswordBlur}
                            className={errors.password ? 'input-error' : ''}
                            disabled={loading}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{errors.password}</span>
                        </div>
                    )}
                </div>

                {/* Botón de Login */}
                <button 
                    type="submit" 
                    className="btn btn-primary btn-block"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Iniciando sesión...
                        </>
                    ) : (
                        'Iniciar Sesión'
                    )}
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
                        onClick={openDNIAuthModal}
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
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                        ¿Olvidaste tu contraseña?
                    </Link>
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
            onClose= {closeDNIAuthModal} 
        />
        
        </>
       
    );
};

export default Login;