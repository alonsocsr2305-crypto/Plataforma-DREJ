import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Search, FileText } from 'lucide-react';
import './CuestionariosModule.css';

const CuestionariosModule = ({ cuestionarios, onCrear, onReload }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos', 'activos', 'inactivos'

    const cuestionariosFiltrados = cuestionarios.filter(cuest => {
        const matchSearch = cuest.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cuest.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchFiltro = filtroActivo === 'todos' ? true :
                           filtroActivo === 'activos' ? cuest.activo :
                           !cuest.activo;
        
        return matchSearch && matchFiltro;
    });

    const handleToggleActivo = async (cuestionarioId, estadoActual) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:8000/api/orientador/cuestionarios/${cuestionarioId}/actualizar/`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ activo: !estadoActual })
                }
            );

            if (response.ok) {
                onReload();
            }
        } catch (error) {
            console.error('Error al actualizar cuestionario:', error);
        }
    };

    const handleEliminar = async (cuestionarioId) => {
        if (!window.confirm('¿Estás seguro de eliminar este cuestionario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:8000/api/orientador/cuestionarios/${cuestionarioId}/eliminar/`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                }
            );

            if (response.ok) {
                onReload();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al eliminar el cuestionario');
            }
        } catch (error) {
            console.error('Error al eliminar cuestionario:', error);
            alert('Error al eliminar el cuestionario');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="cuestionarios-module">
            {/* Header con búsqueda y filtros */}
            <div className="module-header">
                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cuestionarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filtroActivo === 'todos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('todos')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-btn ${filtroActivo === 'activos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('activos')}
                    >
                        Activos
                    </button>
                    <button
                        className={`filter-btn ${filtroActivo === 'inactivos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('inactivos')}
                    >
                        Inactivos
                    </button>
                </div>

                <button className="btn-crear" onClick={onCrear}>
                    <Plus size={20} />
                    Nuevo Cuestionario
                </button>
            </div>

            {/* Lista de cuestionarios */}
            <div className="cuestionarios-grid">
                {cuestionariosFiltrados.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>No se encontraron cuestionarios</h3>
                        <p>
                            {searchTerm || filtroActivo !== 'todos'
                                ? 'Intenta ajustar tus filtros de búsqueda'
                                : 'Crea tu primer cuestionario para comenzar'}
                        </p>
                        {!searchTerm && filtroActivo === 'todos' && (
                            <button className="btn-primary" onClick={onCrear}>
                                <Plus size={18} />
                                Crear Cuestionario
                            </button>
                        )}
                    </div>
                ) : (
                    cuestionariosFiltrados.map((cuest) => (
                        <div key={cuest.id} className="cuestionario-card">
                            <div className="card-header">
                                <div className="card-title-section">
                                    <h3>{cuest.titulo}</h3>
                                    <span className={`status-badge ${cuest.activo ? 'active' : 'inactive'}`}>
                                        {cuest.activo ? '● Activo' : '○ Inactivo'}
                                    </span>
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="action-btn toggle"
                                        onClick={() => handleToggleActivo(cuest.id, cuest.activo)}
                                        title={cuest.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {cuest.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                    </button>
                                    <button
                                        className="action-btn view"
                                        title="Ver detalles"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        className="action-btn edit"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleEliminar(cuest.id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <p className="card-description">{cuest.descripcion}</p>

                            <div className="card-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Preguntas</span>
                                    <span className="stat-value">{cuest.num_preguntas}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Respuestas</span>
                                    <span className="stat-value">{cuest.respuestas_totales || 0}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Creado</span>
                                    <span className="stat-value">{formatDate(cuest.fecha_creacion)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CuestionariosModule;
