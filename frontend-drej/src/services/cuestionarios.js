import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Función para obtener el header de autenticación
const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// ====================================================
// API DE CUESTIONARIOS
// ====================================================

export const cuestionariosAPI = {
    /**
     * Obtener datos del dashboard del estudiante
     * @returns {Promise} Dashboard data
     */
    obtenerDashboard: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/estudiante/dashboard/`, 
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener dashboard:', error);
            throw error;
        }
    },

    /**
     * Listar todos los cuestionarios disponibles
     * @returns {Promise} Array de cuestionarios
     */
    listarCuestionarios: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/estudiante/cuestionarios/`, 
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al listar cuestionarios:', error);
            throw error;
        }
    },

    /**
     * Obtener un cuestionario completo con preguntas y opciones
     * @param {number} cuestionarioId - ID del cuestionario
     * @returns {Promise} Cuestionario completo
     */
    obtenerCuestionario: async (cuestionarioId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/estudiante/cuestionarios/${cuestionarioId}/`, 
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener cuestionario:', error);
            throw error;
        }
    },

    /**
     * Iniciar un nuevo intento de cuestionario
     * @param {number} cuestionarioId - ID del cuestionario
     * @returns {Promise} Datos del intento creado
     */
    iniciarCuestionario: async (cuestionarioId) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/estudiante/cuestionarios/iniciar/`,
                { cuestionario_id: cuestionarioId },
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al iniciar cuestionario:', error);
            throw error;
        }
    },

    /**
     * Guardar respuestas del cuestionario
     * @param {number} intentoId - ID del intento
     * @param {Array} respuestas - Array de respuestas [{pregunta_id, opcion_id}]
     * @param {boolean} confirmar - Si es true, finaliza el cuestionario
     * @returns {Promise} Respuesta del servidor
     */
    guardarRespuestas: async (intentoId, respuestas, confirmar = false) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/estudiante/cuestionarios/guardar/`,
                {
                    intento_id: intentoId,
                    respuestas: respuestas,
                    confirmar: confirmar
                },
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al guardar respuestas:', error);
            throw error;
        }
    },

    /**
     * Obtener todos los resultados de cuestionarios completados
     * @returns {Promise} Array de resultados
     */
    obtenerResultados: async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/estudiante/resultados/`, 
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener resultados:', error);
            throw error;
        }
    },

    /**
     * Obtener detalle de un resultado específico
     * @param {number} intentoId - ID del intento
     * @returns {Promise} Detalle del resultado
     */
    obtenerResultadoDetalle: async (intentoId) => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/estudiante/resultados/${intentoId}/`, 
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error al obtener detalle del resultado:', error);
            throw error;
        }
    }
};

// ====================================================
// HELPER FUNCTIONS
// ====================================================

/**
 * Validar que todas las preguntas tienen respuesta
 * @param {Array} respuestas - Array de respuestas
 * @param {number} totalPreguntas - Total de preguntas del cuestionario
 * @returns {boolean} true si todas están respondidas
 */
export const validarCuestionarioCompleto = (respuestas, totalPreguntas) => {
    return respuestas.length === totalPreguntas && 
           respuestas.every(r => r.pregunta_id && r.opcion_id);
};

/**
 * Formatear progreso del cuestionario
 * @param {Array} respuestas - Array de respuestas actuales
 * @param {number} totalPreguntas - Total de preguntas
 * @returns {object} {porcentaje, respondidas, faltantes}
 */
export const calcularProgreso = (respuestas, totalPreguntas) => {
    const respondidas = respuestas.length;
    const faltantes = totalPreguntas - respondidas;
    const porcentaje = Math.round((respondidas / totalPreguntas) * 100);
    
    return {
        porcentaje,
        respondidas,
        faltantes
    };
};

/**
 * Guardar progreso en localStorage (backup)
 * @param {number} intentoId - ID del intento
 * @param {Array} respuestas - Respuestas actuales
 */
export const guardarProgresoLocal = (intentoId, respuestas) => {
    try {
        const key = `intento_${intentoId}`;
        const data = {
            respuestas,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar progreso local:', error);
    }
};

/**
 * Recuperar progreso de localStorage
 * @param {number} intentoId - ID del intento
 * @returns {Array|null} Respuestas guardadas o null
 */
export const recuperarProgresoLocal = (intentoId) => {
    try {
        const key = `intento_${intentoId}`;
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.respuestas;
        }
    } catch (error) {
        console.error('Error al recuperar progreso local:', error);
    }
    return null;
};

/**
 * Limpiar progreso local de un intento
 * @param {number} intentoId - ID del intento
 */
export const limpiarProgresoLocal = (intentoId) => {
    try {
        const key = `intento_${intentoId}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error al limpiar progreso local:', error);
    }
};

export default cuestionariosAPI;
