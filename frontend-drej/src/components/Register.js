import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/Api';
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import SelectSearchable from './SelectSearchable';
import '../Css/modal.css';

const Register = ({ isOpen, onClose }) => {
    const [step, setStep] = useState('initial');
    const [formData, setFormData] = useState({
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        dni: '',
        telefono: '',
        fechaNacimiento: '',
        correo: '',
        password: '',
        passwordConfirm: '',
        rol: 'Estudiante',
        institucion: '',
        // Campos para Orientador
        cargo: '',
        areaEspecializacion: '',
        perfilProfesional: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [strength, setStrength] = useState({ level: 0, label: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [emailValidation, setEmailValidation] = useState({ valid: null, message: '' });
    const [dniValidation, setDniValidation] = useState({ checking: false, available: null });
    const [emailChecking, setEmailChecking] = useState(false);
    const [instituciones, setInstituciones] = useState([]);

    useEffect(() => {
        if (isOpen) {
            cargarInstituciones();
        }
    }, [isOpen]);

    const cargarInstituciones = async () => {
        try {
            // Llamar al endpoint que creaste en el backend
            const response = await fetch('http://127.0.0.1:8000/api/instituciones/');
            const data = await response.json();
            console.log('Instituciones recibidas:', data); // ← DEBUG
            
            // ← IMPORTANTE: Asegurarse de que sea un array de strings
            const nombresInstituciones = data.map(inst => inst.InstiNombre);
            
            console.log('Nombres procesados:', nombresInstituciones);
            
            setInstituciones(data);
            
        } catch (error) {
            console.error('Error al cargar instituciones:', error);
            // Instituciones de respaldo si falla la API
            setInstituciones([
                { InstitucionID: 1, InstitucionNombre: 'I.E. Santa Isabel' },
                { InstitucionID: 2, InstitucionNombre: 'Colegio Salesiano Santa Rosa' },
                { InstitucionID: 3, InstitucionNombre: 'I.E. María Inmaculada' },
            ]);
        }
    };

    const dominiosPermitidos = [
        'continental.edu.pe',
        'uncp.edu.pe',
        'upla.edu.pe',
        'utp.edu.pe',
        'roosvelt.edu.pe',
        '.edu.pe',
        '.edu',
        '.ac.pe'
    ];

    /**
     * Verificar DNI cuando el usuario sale del campo
     */
    const handleDNIBlur = async () => {
        const dni = formData.dni.trim();
        
        // Solo validar si tiene 8 dígitos
        if (dni.length !== 8) {
            setDniValidation({ checking: false, available: null });
            return;
        }

        setDniValidation({ checking: true, available: null });
        
        try {
            const result = await authAPI.checkDNI(dni);
            
            if (result.exists) {
                setErrors(prev => ({ ...prev, dni: 'Este DNI ya está registrado' }));
                setDniValidation({ checking: false, available: false });
            } else {
                // Limpiar error si existía
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.dni;
                    return newErrors;
                });
                setDniValidation({ checking: false, available: true });
            }
        } catch (error) {
            console.error('[DNI Check] Error:', error);
            setDniValidation({ checking: false, available: null });
        }
    };

    /**
     * Verificar email cuando el usuario sale del campo
     */
    const handleEmailBlur = async () => {
        const email = formData.correo.trim();
        
        // Validación básica de formato
        if (!email || !email.includes('@')) {
            return;
        }

        setEmailChecking(true);
        
        try {
            // 1. Verificar si el email ya existe
            const emailExists = await authAPI.checkEmail(email);
            
            if (emailExists.exists) {
                setErrors(prev => ({ ...prev, correo: 'Este email ya está registrado' }));
                setEmailValidation({ valid: false, message: '✗ Email ya registrado' });
                setEmailChecking(false);
                return;
            }

            // 2. Si es orientador, validar dominio institucional
            if (formData.rol === 'Orientador') {
                const domainResult = await authAPI.validateDomain(email);
                
                if (domainResult.valid) {
                    setEmailValidation({
                        valid: true,
                        message: `✓ Email institucional válido${domainResult.institucion ? ` (${domainResult.institucion})` : ''}`
                    });
                    // Limpiar error si existía
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.correo;
                        return newErrors;
                    });
                } else {
                    setEmailValidation({
                        valid: false,
                        message: '✗ Debe usar un email institucional (.edu, .edu.pe, .ac.pe, etc.)'
                    });
                    setErrors(prev => ({ 
                        ...prev, 
                        correo: 'Debe usar un email institucional válido' 
                    }));
                }
            } else {
                // Estudiante - email disponible
                setEmailValidation({ valid: true, message: '✓ Email disponible' });
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.correo;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('[Email Check] Error:', error);
            setEmailValidation({ valid: null, message: '' });
        } finally {
            setEmailChecking(false);
        }
    };

    /**
     * Limpiar validaciones cuando el usuario cambia de rol
     */
    const handleRolChange = (e) => {
        const newRol = e.target.value;
        
        handleInputChange(e);
        
        // Si cambia a estudiante, limpiar validación de email institucional
        if (newRol === 'Estudiante') {
            setEmailValidation({ valid: null, message: '' });
            // Limpiar error de email si era de dominio institucional
            if (errors.correo?.includes('institucional')) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.correo;
                    return newErrors;
                });
            }
        }
        
        // Si cambia a orientador, re-validar email si ya tiene uno
        if (newRol === 'Orientador' && formData.correo.includes('@')) {
            handleEmailBlur();
        }
    };

    const evaluatePasswordStrength = (password) => {
        let score = 0;
        if (!password) return { level: 0, label: '' };
        
        // Puntuación por longitud (más granular)
        if (password.length >= 8) score += 1;
        if (password.length >= 10) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 14) score += 1;
        
        // Puntuación por complejidad
        if (/[a-z]/.test(password)) score += 1;        // minúsculas
        if (/[A-Z]/.test(password)) score += 1;        // mayúsculas
        if (/\d/.test(password)) score += 1;           // números
        if (/[^A-Za-z0-9]/.test(password)) score += 2; // caracteres especiales (vale doble)

        // Score máximo = 10
        if (score <= 3) return { level: 1, label: 'Débil' };
        if (score <= 5) return { level: 2, label: 'Media' };
        if (score <= 7) return { level: 3, label: 'Buena' };
        return { level: 4, label: 'Fuerte' };
    };

    const validarDominioEmail = (email) => {
        if (!email || !email.includes('@')) return false;
        const dominio = email.substring(email.indexOf('@') + 1).toLowerCase();
        
        return dominiosPermitidos.some(dominioPermitido => {
            if (dominioPermitido.startsWith('.')) {
                return dominio.endsWith(dominioPermitido);
            }
            return dominio === dominioPermitido;
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));

        if (name === "password") setStrength(evaluatePasswordStrength(val));

        // Validar email en tiempo real para orientadores
        if (name === "correo" && formData.rol === "Orientador") {
            if (value && value.includes('@')) {
                const esValido = validarDominioEmail(value);
                setEmailValidation({
                    valid: esValido,
                    message: esValido 
                        ? '✓ Email institucional válido' 
                        : '✗ Debe usar un email institucional (.edu, .edu.pe, .ac.pe, etc.)'
                });
            } else {
                setEmailValidation({ valid: null, message: '' });
            }
        }

        // Limpiar campos de orientador si cambia a estudiante
        if (name === "rol" && value === "Estudiante") {
            setFormData(prev => ({
                ...prev,
                institucion: '',
                cargo: '',
                areaEspecializacion: '',
                perfilProfesional: ''
            }));
            setEmailValidation({ valid: null, message: '' });
        }
    };

    const validateDNI = (dni) => /^\d{8}$/.test(dni.trim());

    const validateAge = (birthdate) => {
        if (!birthdate) return false;
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 13;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombres.trim()) newErrors.nombres = 'Obligatorio';
        if (!formData.apellidoPaterno.trim()) newErrors.apellidoPaterno = 'Obligatorio';
        if (!formData.apellidoMaterno.trim()) newErrors.apellidoMaterno = 'Obligatorio';
        if (!validateDNI(formData.dni)) newErrors.dni = 'DNI inválido (8 dígitos)';
        
        // Validación de teléfono (opcional pero debe ser válido)
        if (formData.telefono && !/^9\d{8}$/.test(formData.telefono.trim())) {
            newErrors.telefono = 'Teléfono inválido (debe empezar con 9 y tener 9 dígitos)';
        }
        
        if (!validateAge(formData.fechaNacimiento)) newErrors.fechaNacimiento = 'Debes tener al menos 13 años';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim())) newErrors.correo = 'Correo inválido';
        if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
        if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = 'Las contraseñas no coinciden';
        if (!acceptTerms) newErrors.terms = 'Debes aceptar los términos';

        // Validaciones adicionales para Orientador
        if (formData.rol === "Orientador") {
            if (!validarDominioEmail(formData.correo)) {
                newErrors.correo = 'Debe usar un email institucional válido (.edu, .edu.pe, .ac.pe, etc.)';
            }
            if (!formData.institucion.trim()) {
                newErrors.institucion = 'La institución es obligatoria para orientadores';
            }
            if (!formData.cargo.trim()) {
                newErrors.cargo = 'El cargo es obligatorio para orientadores';
            }
            if (!formData.areaEspecializacion.trim()) {
                newErrors.areaEspecializacion = 'El área de especialización es obligatoria';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!validateForm()) return;

        setLoading(true);
        try {

            const institucionObj = instituciones.find(
            inst => inst.InstiNombre === formData.institucion
            );
            
            if (!institucionObj) {
                setErrors({ institucion: 'Selecciona una institución válida' });
                setLoading(false);
                return;
            }

            const payload = {
                dni: formData.dni,
                nombres: formData.nombres,
                ApellodoP: formData.apellidoPaterno,
                ApellidoM: formData.apellidoMaterno,
                telefono: formData.telefono,
                fecha_nacimiento: formData.fechaNacimiento,
                correo: formData.correo,
                password: formData.password,
                password_confirm: formData.passwordConfirm,
                rol: formData.rol,
                insti_id: institucionObj.InstiID,
                // Campos adicionales si es orientador
                ...(formData.rol === "Orientador" && {
                    institucion: formData.institucion,
                    cargo: formData.cargo,
                    area_especializacion: formData.areaEspecializacion,
                    perfil_profesional: formData.perfilProfesional || null
                })
            };

            console.log("[REGISTER] Enviando payload:", payload);
            const res = await authAPI.register(payload);
            console.log("[REGISTER] Respuesta exitosa:", res);

            setShowSuccessModal(true);
            
            // Limpiar formulario
            setFormData({
                nombres:'', apellidoPaterno:'', 
                apellidoMaterno:'', dni:'', telefono:'', fechaNacimiento:'', 
                correo:'', password:'', passwordConfirm:'',
                rol: 'Estudiante',
                institucion: '', cargo: '', 
                areaEspecializacion: '', perfilProfesional: ''
            });
            setAcceptTerms(false);
            setStrength({ level: 0, label: '' });
            setEmailValidation({ valid: null, message: '' });

            setTimeout(() => {
                setShowSuccessModal(false);
                onClose && onClose();
            }, 3000);

        } catch (err) {
            console.error('[REGISTER] Error completo:', err);
            console.error('[REGISTER] Error response:', err.response);
            
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                console.log('[REGISTER] Error data:', errorData);
                
                // Manejar diferentes formatos de error del backend
                let errorMessage = '';
                
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    // Convertir objeto de errores en mensaje legible
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return `${key}: ${value.join(', ')}`;
                            }
                            return `${key}: ${value}`;
                        })
                        .join(' | ');
                }
                
                setErrors({ api: errorMessage });
            } else {
                setErrors({ api: 'Error al registrar. Verifica tu conexión e intenta nuevamente.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isOrientador = formData.rol === "Orientador";

    return (
        <>
            {showSuccessModal && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <div style={{ textAlign: 'center' }}>
                            <CheckCircle size={48} color="#4CAF50" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#4CAF50', marginBottom: '0.5rem' }}>✓ Registro exitoso</h3>
                            <p style={{ color: '#666' }}>
                                {isOrientador 
                                    ? 'Tu solicitud está en revisión. Te notificaremos cuando sea aprobada.'
                                    : 'Tu cuenta ha sido creada correctamente.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="modal active" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header">
                        <button className="close-modal" onClick={onClose}>×</button>
                        <h2>REGISTRARSE</h2>
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                        {/* Info Box Legal */}
                        <div className="info-box-legal">
                            <span style={{ fontSize: '20px' }}>🔒</span>
                            <span>
                                Tu información está protegida según la <strong>Ley N° 29733</strong> de 
                                Protección de Datos Personales del Perú
                            </span>
                        </div>

                        {/* Banner de error global */}
                        {errors.api && (
                            <div className="error-banner" style={{ 
                                marginBottom: 12, 
                                color: '#b00020',
                                backgroundColor: '#ffebee',
                                padding: '12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={20} />
                                <span>{errors.api}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Selector de Rol */}
                            <div className="selector-rol-compact">
                                <span className="selector-rol-label">¿Quién eres? *</span>
                                <div className="rol-options">
                                    <label className={formData.rol === 'Estudiante' ? 'selected' : ''}>
                                        <input
                                            type="radio"
                                            name="rol"
                                            value="Estudiante"
                                            checked={formData.rol === 'Estudiante'}
                                            onChange={handleRolChange}
                                        />
                                        <strong>Estudiante</strong>
                                        <span className="rol-descripcion">Busco orientación</span>
                                    </label>
                                    <label className={formData.rol === 'Orientador' ? 'selected' : ''}>
                                        <input
                                            type="radio"
                                            name="rol"
                                            value="Orientador"
                                            checked={formData.rol === 'Orientador'}
                                            onChange={handleRolChange}
                                        />
                                        <strong>Orientador</strong>
                                        <span className="rol-descripcion">Profesional/Docente</span>
                                    </label>
                                </div>
                            </div>


                            {/* Campos comunes */}
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleInputChange}
                                    placeholder="Nombres *" 
                                    required
                                />
                                {errors.nombres && <span className="error-text">{errors.nombres}</span>}
                            </div>

                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="apellidoPaterno"
                                    value={formData.apellidoPaterno}
                                    onChange={handleInputChange}
                                    placeholder="Apellido Paterno *" 
                                    required
                                />
                                {errors.apellidoPaterno && <span className="error-text">{errors.apellidoPaterno}</span>}
                            </div>

                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="apellidoMaterno"
                                    value={formData.apellidoMaterno}
                                    onChange={handleInputChange}
                                    placeholder="Apellido Materno *" 
                                    required
                                />
                                {errors.apellidoMaterno && <span className="error-text">{errors.apellidoMaterno}</span>}
                            </div>

                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleInputChange}
                                    onBlur={handleDNIBlur}
                                    placeholder="DNI (8 dígitos) *" 
                                    maxLength="8"
                                    required
                                />
                                {errors.dni && <span className="error-text">{errors.dni}</span>}
                            </div>

                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleInputChange}
                                    placeholder="Teléfono (9XXXXXXXX)*" 
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
                                    placeholder="Fecha de Nacimiento *"
                                    max="2010-12-31" 
                                    required
                                />
                                {errors.fechaNacimiento && <span className="error-text">{errors.fechaNacimiento}</span>}
                            </div>

                            {/* Email con validación especial */}
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="correo"
                                    value={formData.correo}
                                    onChange={handleInputChange}
                                    onBlur={handleEmailBlur}
                                    placeholder={isOrientador ? "Correo Institucional *" : "Correo Electrónico *"} 
                                    required
                                    style={{
                                        borderColor: emailValidation.valid === false ? '#d32f2f' : 
                                                    emailValidation.valid === true ? '#4CAF50' : undefined
                                    }}
                                />
                                {emailValidation.message && (
                                    <div style={{
                                        marginTop: '0.25rem',
                                        fontSize: '0.875rem',
                                        color: emailValidation.valid ? '#4CAF50' : '#d32f2f'
                                    }}>
                                        {emailValidation.message}
                                    </div>
                                )}
                                {errors.correo && <span className="error-text">{errors.correo}</span>}
                            </div>

                            <div className="form-group">
                                <SelectSearchable
                                    name="institucion"
                                    placeholder="Buscar institución..."
                                    value={formData.institucion}
                                    onChange={handleInputChange}
                                    options={instituciones.map(inst => inst.InstiNombre)}
                                />
                            </div>

                            {/* Campos adicionales para Orientadores */}
                            {isOrientador && (
                                <>

                                    <div className="form-group">
                                        <input 
                                            type="text" 
                                            name="cargo"
                                            value={formData.cargo}
                                            onChange={handleInputChange}
                                            placeholder="Cargo/Posición *" 
                                            required
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
                                            required
                                        />
                                        {errors.areaEspecializacion && <span className="error-text">{errors.areaEspecializacion}</span>}
                                    </div>

                                    <div className="form-group">
                                        <input 
                                            type="text" 
                                            name="perfilProfesional"
                                            value={formData.perfilProfesional}
                                            onChange={handleInputChange}
                                            placeholder="Perfil Profesional (LinkedIn, etc. - Opcional)" 
                                        />
                                    </div>
                                </>
                            )}

                            {/* Password */}
                            <div className="form-group password-wrapper">
                                <div className="password-container">    
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Contraseña *"
                                        minLength="8"
                                        required
                                        className={`input-password`}
                                    /> 
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && <span className="error-text">{errors.password}</span>}

                                {formData.password && (
                                    <>
                                        <div className="password-strength-bar">
                                            <div className={`strength-level strength-${strength.level}`}></div>
                                        </div>
                                        <span className={`strength-label strength-${strength.level}`}>
                                            {strength.label}
                                        </span>
                                    </>
                                )}
                            </div>
                            
                            <div className="form-group password-wrapper">
                                <div className="password-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="passwordConfirm"
                                        value={formData.passwordConfirm}
                                        onChange={handleInputChange}
                                        placeholder="Repetir Contraseña *" 
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
                            </div>

                            <div className="form-group terms-group">
                                <label>
                                    <input 
                                        className='form-check'
                                        type="checkbox" 
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                    /> 
                                    Acepto los <a href="#">términos y condiciones</a>
                                </label>
                                {errors.terms && <span className="error-text">{errors.terms}</span>}
                            </div>

                            <button
                                type="submit"
                                className="btn-register-submit"
                                disabled={loading}
                            >
                                {loading ? "Registrando..." : "Registrarse"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;