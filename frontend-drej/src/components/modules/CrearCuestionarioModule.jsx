import React, { useState } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle, X } from 'lucide-react';
import './CrearCuestionarioModule.css';

const CrearCuestionarioModule = ({ onSuccess }) => {
    const [cuestionario, setCuestionario] = useState({
        titulo: '',
        descripcion: '',
        activo: true
    });

    const [preguntas, setPreguntas] = useState([
        {
            id: Date.now(),
            texto: '',
            categoria: 'Tecnología'
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    const categorias = [
        'Tecnología',
        'Ciencias Sociales',
        'Artes',
        'Negocios',
        'Salud',
        'Ingeniería',
        'Educación',
        'Comunicación',
        'Ciencias Naturales',
        'Deportes'
    ];

    const handleCuestionarioChange = (field, value) => {
        setCuestionario(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreguntaChange = (id, field, value) => {
        setPreguntas(prev => prev.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const agregarPregunta = () => {
        const nuevaPregunta = {
            id: Date.now(),
            texto: '',
            categoria: 'Tecnología'
        };
        setPreguntas(prev => [...prev, nuevaPregunta]);
    };

    const eliminarPregunta = (id) => {
        if (preguntas.length > 1) {
            setPreguntas(prev => prev.filter(p => p.id !== id));
        } else {
            setMensaje({
                tipo: 'error',
                texto: 'Debe haber al menos una pregunta'
            });
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        }
    };

    const validarFormulario = () => {
        if (!cuestionario.titulo.trim()) {
            return 'El título es obligatorio';
        }

        if (!cuestionario.descripcion.trim()) {
            return 'La descripción es obligatoria';
        }

        if (preguntas.length === 0) {
            return 'Debe haber al menos una pregunta';
        }

        for (let i = 0; i < preguntas.length; i++) {
            if (!preguntas[i].texto.trim()) {
                return `La pregunta ${i + 1} está vacía`;
            }
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const error = validarFormulario();
        if (error) {
            setMensaje({ tipo: 'error', texto: error });
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            
            const payload = {
                ...cuestionario,
                num_preguntas: preguntas.length,
                preguntas: preguntas.map((p, index) => ({
                    orden: index + 1,
                    texto: p.texto,
                    categoria: p.categoria
                }))
            };

            // Aquí harías la llamada a tu API
            const response = await fetch('http://localhost:8000/api/api/orientador/cuestionarios/crear/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Error al crear el cuestionario');
            }

            setMensaje({
                tipo: 'success',
                texto: `¡Cuestionario creado exitosamente con ${preguntas.length} preguntas!`
            });

            // Limpiar formulario
            setTimeout(() => {
                setCuestionario({
                    titulo: '',
                    descripcion: '',
                    activo: true
                });
                setPreguntas([{
                    id: Date.now(),
                    texto: '',
                    categoria: 'Tecnología'
                }]);
                setMensaje({ tipo: '', texto: '' });
                
                if (onSuccess) {
                    onSuccess();
                }
            }, 2000);

        } catch (error) {
            console.error('Error:', error);
            setMensaje({
                tipo: 'error',
                texto: 'Error al crear el cuestionario. Intenta de nuevo.'
            });
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        setCuestionario({
            titulo: '',
            descripcion: '',
            activo: true
        });
        setPreguntas([{
            id: Date.now(),
            texto: '',
            categoria: 'Tecnología'
        }]);
        setMensaje({ tipo: '', texto: '' });
    };

    return (
        <div className="crear-cuestionario-module">
            {mensaje.texto && (
                <div className={`mensaje-alert ${mensaje.tipo}`}>
                    {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{mensaje.texto}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="cuestionario-form">
                {/* Información básica */}
                <div className="form-section">
                    <h2 className="section-title">📋 Información del Cuestionario</h2>
                    
                    <div className="form-group">
                        <label htmlFor="titulo">Título del Cuestionario *</label>
                        <input
                            id="titulo"
                            type="text"
                            value={cuestionario.titulo}
                            onChange={(e) => handleCuestionarioChange('titulo', e.target.value)}
                            placeholder="Ej: Test de Intereses Vocacionales 2024"
                            maxLength={200}
                            required
                        />
                        <small className="form-hint">Máximo 200 caracteres</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="descripcion">Descripción *</label>
                        <textarea
                            id="descripcion"
                            value={cuestionario.descripcion}
                            onChange={(e) => handleCuestionarioChange('descripcion', e.target.value)}
                            placeholder="Describe el propósito y contenido del cuestionario..."
                            rows={4}
                            maxLength={500}
                            required
                        />
                        <small className="form-hint">Máximo 500 caracteres</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={cuestionario.activo}
                                onChange={(e) => handleCuestionarioChange('activo', e.target.checked)}
                            />
                            <span>Activar inmediatamente después de crear</span>
                        </label>
                    </div>
                </div>

                {/* Preguntas */}
                <div className="form-section">
                    <div className="section-header">
                        <h2 className="section-title">❓ Preguntas ({preguntas.length})</h2>
                        <button
                            type="button"
                            onClick={agregarPregunta}
                            className="btn-add-pregunta"
                        >
                            <Plus size={18} />
                            Agregar Pregunta
                        </button>
                    </div>

                    <div className="preguntas-list">
                        {preguntas.map((pregunta, index) => (
                            <div key={pregunta.id} className="pregunta-card">
                                <div className="pregunta-header">
                                    <span className="pregunta-numero">Pregunta {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => eliminarPregunta(pregunta.id)}
                                        className="btn-eliminar"
                                        disabled={preguntas.length === 1}
                                        title={preguntas.length === 1 ? 'Debe haber al menos una pregunta' : 'Eliminar pregunta'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label>Texto de la pregunta *</label>
                                    <textarea
                                        value={pregunta.texto}
                                        onChange={(e) => handlePreguntaChange(pregunta.id, 'texto', e.target.value)}
                                        placeholder="Escribe aquí la pregunta..."
                                        rows={3}
                                        maxLength={500}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select
                                        value={pregunta.categoria}
                                        onChange={(e) => handlePreguntaChange(pregunta.id, 'categoria', e.target.value)}
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={limpiarFormulario}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        <X size={18} />
                        Limpiar Formulario
                    </button>
                    
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
                                Creando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Crear Cuestionario
                            </>
                        )}
                    </button>
                </div>

                {/* Resumen */}
                <div className="form-summary">
                    <h3>📊 Resumen</h3>
                    <ul>
                        <li><strong>Total de preguntas:</strong> {preguntas.length}</li>
                        <li><strong>Estado:</strong> {cuestionario.activo ? 'Se activará inmediatamente' : 'Se guardará como inactivo'}</li>
                        <li><strong>Categorías usadas:</strong> {[...new Set(preguntas.map(p => p.categoria))].join(', ')}</li>
                    </ul>
                </div>
            </form>
        </div>
    );
};

export default CrearCuestionarioModule;
