import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authAPI.login({ username: loginEmail, password: loginPassword });
            // opcional: verifica usuario
            // const me = await authAPI.me();
            // console.log(me);
            alert('¡Bienvenido!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error en login:', err);
            if (err.response) {
            setError(err.response.data.detail || 'Credenciales incorrectas');
            } else {
            setError('Error de conexión. Verifica que el backend esté corriendo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loginRENIEC = () => {
        alert('Función Proximamente');
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

                    <button type="submit" className="btn-primary">
                        Iniciar Sesión
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
        </>
       
    );
};

export default Login;