import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    ArrowRight, 
    Save, 
    CheckCircle,
    AlertCircle,
    Clock
} from 'lucide-react';
import { 
    cuestionariosAPI, 
    validarCuestionarioCompleto,
    calcularProgreso,
    guardarProgresoLocal,
    recuperarProgresoLocal,
    limpiarProgresoLocal
} from '../services/cuestionarios';
import '../Css/cuestionario.css';

const Cuestionario = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cuestionario, setCuestionario] = useState(null);
    const [intentoId, setIntentoId] = useState(null);
    const [respuestas, setRespuestas] = useState({});
    const [preguntaActual, setPreguntaActual] = useState(0);
    const [error, setError] = useState('');
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    useEffect(() => {
        cargarCuestionario();
    }, [id]);

    // Autosave cada 30 segundos
    useEffect(() => {
        if (intentoId && Object.keys(respuestas).length > 0) {
            const timer = setInterval(() => {
                autoGuardar();
            }, 30000); // 30 segundos
            
            return () => clearInterval(timer);
        }
    }, [intentoId, respuestas]);

    const cargarCuestionario = async () => {
        try {
            setLoading(true);
            
            // Iniciar intento
            const intentoData = await cuestionariosAPI.iniciarCuestionario(parseInt(id));
            setIntentoId(intentoData.intento_id);
            
            // Obtener cuestionario completo
            const cuest = await cuestionariosAPI.obtenerCuestionario(parseInt(id));
            setCuestionario(cuest);
            
            // Intentar recuperar progreso guardado
            const progresoLocal = recuperarProgresoLocal(intentoData.intento_id);
            if (progresoLocal && progresoLocal.length > 0) {
                const respuestasObj = {};
                progresoLocal.forEach(r => {
                    respuestasObj[r.pregunta_id] = r.opcion_id;
                });
                setRespuestas(respuestasObj);
            }
            
        } catch (err) {
            console.error('Error al cargar cuestionario:', err);
            setError('Error al cargar el cuestionario. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const autoGuardar = async () => {
        if (!intentoId || Object.keys(respuestas).length === 0) return;
        
        try {
            const respuestasArray = Object.entries(respuestas).map(([pregId, opcId]) => ({
                pregunta_id: parseInt(pregId),
                opcion_id: parseInt(opcId)
            }));
            
            await cuestionariosAPI.guardarRespuestas(intentoId, respuestasArray, false);
            guardarProgresoLocal(intentoId, respuestasArray);
            console.log('✅ Progreso guardado automáticamente');
        } catch (err) {
            console.error('Error en autosave:', err);
        }
    };

    const handleRespuesta = (preguntaId, opcionId) => {
        setRespuestas(prev => ({
            ...prev,
            [preguntaId]: opcionId
        }));
    };

    const irAPreguntaAnterior = () => {
        if (preguntaActual > 0) {
            setPreguntaActual(preguntaActual - 1);
        }
    };

    const irAPreguntaSiguiente = () => {
        if (preguntaActual < cuestionario.preguntas.length - 1) {
            setPreguntaActual(preguntaActual + 1);
        }
    };

    const confirmarEnvio = () => {
        const totalPreguntas = cuestionario.preguntas.length;
        const totalRespondidas = Object.keys(respuestas).length;
        
        if (totalRespondidas < totalPreguntas) {
            setError(`Faltan ${totalPreguntas - totalRespondidas} preguntas por responder`);
            return;
        }
        
        setMostrarConfirmacion(true);
    };

    const enviarCuestionario = async () => {
        try {
            setSaving(true);
            
            const respuestasArray = Object.entries(respuestas).map(([pregId, opcId]) => ({
                pregunta_id: parseInt(pregId),
                opcion_id: parseInt(opcId)
            }));
            
            await cuestionariosAPI.guardarRespuestas(intentoId, respuestasArray, true);
            
            // Limpiar progreso local
            limpiarProgresoLocal(intentoId);
            
            // Redirigir a resultados
            navigate(`/estudiante/resultado/${intentoId}`);
            
        } catch (err) {
            console.error('Error al enviar cuestionario:', err);
            setError('Error al enviar el cuestionario. Intenta nuevamente.');
        } finally {
            setSaving(false);
            setMostrarConfirmacion(false);
        }
    };

    if (loading) {
        return (
            <div className="cuestionario-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Cargando cuestionario...</p>
                </div>
            </div>
        );
    }

    if (error && !cuestionario) {
        return (
            <div className="cuestionario-container">
                <div className="error-state">
                    <AlertCircle size={64} color="#e74c3c" />
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    if (!cuestionario) return null;

    const pregunta = cuestionario.preguntas[preguntaActual];
    const progreso = calcularProgreso(
        Object.keys(respuestas), 
        cuestionario.preguntas.length
    );

    return (
        <div className="cuestionario-container">
            {/* Header */}
            <div className="cuestionario-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <div className="header-info">
                    <h1>{cuestionario.nombre}</h1>
                    <div className="header-stats">
                        <span>
                            <Clock size={16} />
                            Pregunta {preguntaActual + 1} de {cuestionario.preguntas.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="progreso-bar">
                <div className="progreso-info">
                    <span>{progreso.respondidas} de {cuestionario.preguntas.length} respondidas</span>
                    <span>{progreso.porcentaje}%</span>
                </div>
                <div className="progreso-fill-container">
                    <div 
                        className="progreso-fill" 
                        style={{ width: `${progreso.porcentaje}%` }}
                    ></div>
                </div>
            </div>

            {/* Alerta de error */}
            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Contenido de la pregunta */}
            <div className="pregunta-card">
                <div className="pregunta-header">
                    <span className="pregunta-categoria">{pregunta.categoria}</span>
                    <span className="pregunta-numero">Pregunta {pregunta.orden}</span>
                </div>

                <h2 className="pregunta-texto">{pregunta.texto}</h2>

                <div className="opciones-container">
                    {pregunta.opciones.map((opcion) => (
                        <button
                            key={opcion.id}
                            className={`opcion-button ${
                                respuestas[pregunta.id] === opcion.id ? 'selected' : ''
                            }`}
                            onClick={() => handleRespuesta(pregunta.id, opcion.id)}
                        >
                            <div className="opcion-radio">
                                {respuestas[pregunta.id] === opcion.id && (
                                    <CheckCircle size={20} />
                                )}
                            </div>
                            <span className="opcion-texto">{opcion.texto}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Navegación */}
            <div className="cuestionario-footer">
                <button
                    onClick={irAPreguntaAnterior}
                    disabled={preguntaActual === 0}
                    className="btn-nav"
                >
                    <ArrowLeft size={20} />
                    Anterior
                </button>

                <button
                    onClick={autoGuardar}
                    className="btn-guardar"
                    disabled={saving}
                >
                    <Save size={20} />
                    {saving ? 'Guardando...' : 'Guardar Progreso'}
                </button>

                {preguntaActual < cuestionario.preguntas.length - 1 ? (
                    <button
                        onClick={irAPreguntaSiguiente}
                        className="btn-nav primary"
                    >
                        Siguiente
                        <ArrowRight size={20} />
                    </button>
                ) : (
                    <button
                        onClick={confirmarEnvio}
                        className="btn-finalizar"
                        disabled={Object.keys(respuestas).length < cuestionario.preguntas.length}
                    >
                        Finalizar
                        <CheckCircle size={20} />
                    </button>
                )}
            </div>

            {/* Modal de confirmación */}
            {mostrarConfirmacion && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>¿Finalizar cuestionario?</h3>
                        <p>
                            Has respondido {Object.keys(respuestas).length} de {cuestionario.preguntas.length} preguntas.
                            Una vez finalizado, no podrás modificar tus respuestas.
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setMostrarConfirmacion(false)}
                                className="btn-secondary"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarCuestionario}
                                className="btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Enviando...' : 'Sí, finalizar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cuestionario;
