import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/Api';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, GraduationCap } from "lucide-react";
import { institucionesAPI } from '../services/Api';
import SelectSearchable from './SelectSearchable';

import '../Css/styles.css';
import '../Css/modal.css';
import '../Css/dni-register.css';

/**
 * Componente unificado que maneja TANTO login como registro con DNI
 * 
 * Flujo:
 * 1. Usuario ingresa DNI
 * 2. Sistema verifica si existe:
 *    - Si EXISTE → Pide contraseña y hace login
 *    - Si NO EXISTE → Continúa con registro (RENIEC → Rol → Formulario)
 */
const DNIAuth = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    
    // ============================================
    // ESTADOS
    // ============================================
    const [mode, setMode] = useState('input'); // input | login | register
    const [step, setStep] = useState(1); // Para registro: 1: RENIEC, 2: Rol, 3: Formulario
    const [dni, setDni] = useState('');
    const [dniData, setDniData] = useState(null); // Datos de RENIEC
    const [selectedRol, setSelectedRol] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Estado para login
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    
    // Estado para registro
    const [formData, setFormData] = useState({
        telefono: '',
        fechaNacimiento: '',
        correo: '',
        password: '',
        passwordConfirm: '',
        institucion: '',
        cargo: '',
        areaEspecializacion: '',
        perfilProfesional: ''
    });
    
    const [instituciones, setInstituciones] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    // ============================================
    // EFECTOS
    // ============================================
    useEffect(() => {
        if (isOpen) {
            cargarInstituciones();
            resetForm();
        }
    }, [isOpen]);

    const cargarInstituciones = async () => {
        try {
            const data = await institucionesAPI.listar();
            setInstituciones(data);
        } catch (error) {
            console.error('Error al cargar instituciones:', error);
        }
    };

    const resetForm = () => {
        setMode('input');
        setStep(1);
        setDni('');
        setDniData(null);
        setSelectedRol(null);
        setLoginPassword('');
        setFormData({
            telefono: '',
            fechaNacimiento: '',
            correo: '',
            password: '',
            passwordConfirm: '',
            institucion: '',
            cargo: '',
            areaEspecializacion: '',
            perfilProfesional: ''
        });
        setErrors({});
        setAcceptTerms(false);
    };

    // ============================================
    // PASO 1: VERIFICAR DNI (REGISTRADO O NUEVO)
    // ============================================
    const handleVerifyDNI = async () => {
        if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
            setErrors({ dni: 'DNI debe tener 8 dígitos' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            // 1. Verificar si el DNI ya está registrado
            const dniCheck = await authAPI.checkDNI(dni);
            
            if (dniCheck.exists) {
                // ✅ DNI YA REGISTRADO → Modo LOGIN
                console.log('[DNI Auth] DNI ya registrado, cambiando a modo login');
                setMode('login');
                setLoading(false);
                return;
            }

            // ❌ DNI NO REGISTRADO → Modo REGISTRO
            console.log('[DNI Auth] DNI no registrado, consultando RENIEC');
            
            // 2. Consultar RENIEC
            /* 
            const reniecData = await fetch(`http://127.0.0.1:8000/api/reniec/consultar/${dni}/`)
                .then(res => res.json()); 
            */

            // PRUEBAS (usa mock local):
            const reniecData = await fetch(`http://127.0.0.1:8000/api/reniec/mock/${dni}/`)
                .then(res => res.json());

            if (reniecData.success) {
                setDniData({
                    dni: dni,
                    nombres: reniecData.nombres,
                    apellidoPaterno: reniecData.apellidoPaterno,
                    apellidoMaterno: reniecData.apellidoMaterno,
                    fechaNacimiento: reniecData.fechaNacimiento || ''
                });
                setMode('register');
                setStep(2); // Ir a selección de rol
            } else {
                setErrors({ dni: 'No se pudo verificar el DNI con RENIEC.' });
            }
        } catch (error) {
            console.error('[DNI Auth] Error:', error);
            setErrors({ dni: 'Error al verificar el DNI. Intenta de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // MODO LOGIN: HACER LOGIN CON DNI + PASSWORD
    // ============================================
    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!loginPassword) {
            setErrors({ password: 'Ingresa tu contraseña' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            console.log('[DNI Auth] Intentando login con DNI:', dni);
            
            // Login con DNI como username
            const loginResponse = await authAPI.login({ 
                username: dni,
                password: loginPassword 
            });
            
            console.log('[DNI Auth] Login exitoso:', loginResponse);
            
            // Obtener datos del usuario
            const userData = await authAPI.me();
            console.log('[DNI Auth] Datos del usuario:', userData);
            
            // Cerrar modal y redirigir
            onClose();
            navigate('/dashboard');
            
        } catch (error) {
            console.error('[DNI Auth] Error en login:', error);
            const errorMsg = error.response?.data?.detail || 
                           error.response?.data?.error ||
                           'Contraseña incorrecta';
            setErrors({ password: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // MODO REGISTRO: SELECCIONAR ROL
    // ============================================
    const handleSelectRol = (rol) => {
        setSelectedRol(rol);
        setStep(3); // Pasar al formulario completo
    };

    // ============================================
    // MODO REGISTRO: COMPLETAR FORMULARIO Y REGISTRAR
    // ============================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.telefono || !/^9\d{8}$/.test(formData.telefono)) {
            newErrors.telefono = 'Teléfono debe empezar con 9 y tener 9 dígitos';
        }

        if (!formData.fechaNacimiento) {
            newErrors.fechaNacimiento = 'Fecha de nacimiento es obligatoria';
        }

        if (!formData.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            newErrors.correo = 'Email inválido';
        }

        if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }

        if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = 'Las contraseñas no coinciden';
        }

        if (!formData.institucion) {
            newErrors.institucion = 'Selecciona una institución';
        }

        if (selectedRol === 'Orientador') {
            if (!formData.cargo) newErrors.cargo = 'Campo obligatorio';
            if (!formData.areaEspecializacion) newErrors.areaEspecializacion = 'Campo obligatorio';
        }

        if (!acceptTerms) {
            newErrors.terms = 'Debes aceptar los términos y condiciones';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {
            const institucionObj = instituciones.find(
                inst => inst.InstiNombre === formData.institucion
            );

            if (!institucionObj) {
                setErrors({ institucion: 'Por favor selecciona una institución válida' });
                setLoading(false);
                return;
            }

            console.log('[DNI Auth] Institución seleccionada:', institucionObj);

            const payload = {
                dni: dniData.dni,
                first_name: dniData.nombres,
                last_name: `${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`.trim(),
                password: formData.password,
                passwordConfirm: formData.passwordConfirm,
                
                nombres: dniData.nombres,
                apellidoPaterno: dniData.apellidoPaterno,
                apellidoMaterno: dniData.apellidoMaterno,
                telefono: formData.telefono,
                fechaNacimiento: formData.fechaNacimiento,
                email: formData.correo,
                rol: selectedRol,
                insti_id: institucionObj.InstiID,

                ...(selectedRol === "Orientador" && {
                    institucion: institucionObj.InstiNombre || '',
                    cargo: formData.cargo,
                    areaEspecializacion: formData.areaEspecializacion || '',
                    perfilProfesional: formData.perfilProfesional || null
                })
            };

            console.log('[DNI Auth] Registrando usuario:', payload);
            const res = await authAPI.register(payload);
            console.log('[DNI Auth] Registro exitoso:', res);

            // Mostrar mensaje y cerrar
            alert(selectedRol === 'Orientador' 
                ? 'Registro exitoso. Tu cuenta está pendiente de verificación.' 
                : 'Registro exitoso. Ya puedes iniciar sesión.');
            
            onClose();
        } catch (error) {
            console.error('[DNI Auth] Error en registro:', error);
            const errorMsg = error.response?.data?.detail || 
                           error.response?.data?.message ||
                           'Error al registrarse';
            setErrors({ general: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // ============================================
    // RENDERIZADO
    // ============================================
    return createPortal(
        <div className="modal active" onClick={onClose}>
            <div className="modal-content dni-auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>×</button>
                
                {/* ========== PASO 1: INGRESAR DNI ========== */}
                {mode === 'input' && (
                    <>
                        <div className="modal-header">
                            <h2>Continuar con DNI</h2>
                            <p className="modal-subtitle">Ingresa tu DNI para continuar</p>
                        </div>

                        <div className="dni-input-step">
                            <div className="form-group">
                                <label>Número de DNI</label>
                                <input
                                    type="text"
                                    value={dni}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 8) setDni(value);
                                    }}
                                    placeholder="12345678"
                                    maxLength="8"
                                    className={errors.dni ? 'input-error' : ''}
                                    autoFocus
                                />
                                {errors.dni && <span className="error-text">{errors.dni}</span>}
                            </div>

                            <button
                                type="button"
                                onClick={handleVerifyDNI}
                                disabled={loading || dni.length !== 8}
                                className="btn-primary btn-block"
                            >
                                {loading ? 'Verificando...' : 'Continuar'}
                            </button>

                            <div className="info-box">
                                <AlertCircle size={16} />
                                <span>Si ya tienes cuenta, te pediremos tu contraseña. Si no, te ayudaremos a registrarte.</span>
                            </div>
                        </div>
                    </>
                )}

                {/* ========== MODO LOGIN: PEDIR CONTRASEÑA ========== */}
                {mode === 'login' && (
                    <>
                        <div className="modal-header">
                            <h2>Iniciar Sesión</h2>
                            <p className="modal-subtitle">DNI encontrado, ingresa tu contraseña</p>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="dni-display">
                                <CheckCircle size={20} color="green" />
                                <span>¡¡Bienvenido <strong></strong>!!</span>
                            </div>

                            <div className="form-group password-wrapper">
                                <input
                                    type={showLoginPassword ? "text" : "password"}
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className={errors.password ? 'input-error' : ''}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                >
                                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setMode('input')}
                                    className="btn-secondary"
                                    disabled={loading}
                                >
                                    ← Cambiar DNI
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading || !loginPassword}
                                >
                                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                                </button>
                            </div>

                            <div className="forgot-password">
                                <span>¿Olvidaste tu contraseña?</span>
                            </div>
                        </form>
                    </>
                )}

                {/* ========== MODO REGISTRO: PASO 2 - SELECCIÓN DE ROL ========== */}
                {mode === 'register' && step === 2 && dniData && (
                    <>
                        <div className="modal-header">
                            <h2>Crear Cuenta</h2>
                            <p className="modal-subtitle">Selecciona tu tipo de cuenta</p>
                        </div>

                        <div className="rol-selection-step">
                            <div className="dni-verified-info">
                                <CheckCircle size={24} color="green" />
                                <div>
                                    <strong>DNI Verificado: {dniData.dni}</strong>
                                    <p>{dniData.nombres} {dniData.apellidoPaterno} {dniData.apellidoMaterno}</p>
                                </div>
                            </div>

                            <div className="rol-selection">
                                <h3>¿Cómo te vas a registrar?</h3>
                                
                                <div className="rol-cards">
                                    <div 
                                        className="rol-card"
                                        onClick={() => handleSelectRol('Estudiante')}
                                    >
                                        <User size={40} />
                                        <h4>Estudiante</h4>
                                        <p>Busco orientación vocacional</p>
                                    </div>

                                    <div 
                                        className="rol-card"
                                        onClick={() => handleSelectRol('Orientador')}
                                    >
                                        <GraduationCap size={40} />
                                        <h4>Orientador/Docente</h4>
                                        <p>Soy profesional de la educación</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMode('input')}
                                className="btn-secondary btn-block"
                            >
                                Cambiar DNI
                            </button>
                        </div>
                    </>
                )}

                {/* ========== MODO REGISTRO: PASO 3 - FORMULARIO COMPLETO ========== */}
                {mode === 'register' && step === 3 && (
                    <>
                        <div className="modal-header">
                            <h2>Completar Registro</h2>
                            <p className="modal-subtitle">Completa tu perfil como {selectedRol}</p>
                        </div>

                        <form onSubmit={handleRegister} className="register-form">
                            <div className="dni-info-compact">
                                <strong>{dniData.nombres} {dniData.apellidoPaterno}</strong>
                                <span className="badge">{selectedRol}</span>
                            </div>

                            {/* Campos Comunes */}
                            <div className="form-group">
                                <input
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    placeholder="Teléfono (9 dígitos) *"
                                    maxLength="9"
                                />
                                {errors.telefono && <span className="error-text">{errors.telefono}</span>}
                            </div>

                            <div className="form-group">
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    value={formData.fechaNacimiento}
                                    onChange={handleInputChange}
                                />
                                {errors.fechaNacimiento && <span className="error-text">{errors.fechaNacimiento}</span>}
                            </div>

                            <div className="form-group">
                                <SelectSearchable
                                    options={instituciones.map(inst => inst.InstiNombre)}
                                    value={formData.institucion}
                                    onChange={(value) => setFormData(prev => ({ ...prev, institucion: value }))}
                                    placeholder="Selecciona tu institución *"
                                />
                                {errors.institucion && <span className="error-text">{errors.institucion}</span>}
                            </div>

                            <div className="form-group">
                                <input
                                    type="email"
                                    name="correo"
                                    value={formData.correo}
                                    onChange={handleInputChange}
                                    placeholder={selectedRol === 'Orientador' ? 'Email institucional *' : 'Email *'}
                                />
                                {errors.correo && <span className="error-text">{errors.correo}</span>}
                            </div>

                            {/* Campos específicos para Orientador */}
                            {selectedRol === 'Orientador' && (
                                <>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="cargo"
                                            value={formData.cargo}
                                            onChange={handleInputChange}
                                            placeholder="Cargo *"
                                        />
                                        {errors.cargo && <span className="error-text">{errors.cargo}</span>}
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="areaEspecializacion"
                                            value={formData.areaEspecializacion}
                                            onChange={handleInputChange}
                                            placeholder="Área de Especialización *"
                                        />
                                        {errors.areaEspecializacion && <span className="error-text">{errors.areaEspecializacion}</span>}
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="perfilProfesional"
                                            value={formData.perfilProfesional}
                                            onChange={handleInputChange}
                                            placeholder="Perfil Profesional (LinkedIn, etc.)"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Contraseñas */}
                            <div className="form-group password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Contraseña *"
                                    minLength="8"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>

                            <div className="form-group password-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="passwordConfirm"
                                    value={formData.passwordConfirm}
                                    onChange={handleInputChange}
                                    placeholder="Confirmar Contraseña *"
                                    minLength="8"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                    />
                                    Acepto los términos y condiciones
                                </label>
                                {errors.terms && <span className="error-text">{errors.terms}</span>}
                            </div>

                            {errors.general && (
                                <div className="error-box">
                                    <AlertCircle size={16} />
                                    <span>{errors.general}</span>
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="btn-secondary"
                                    disabled={loading}
                                >
                                    ← Volver
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading || !acceptTerms}
                                >
                                    {loading ? 'Registrando...' : 'Completar Registro'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default DNIAuth;