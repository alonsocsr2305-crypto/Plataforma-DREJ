import { useState, useEffect } from 'react';
import { institucionesAPI } from '../services/Api';

/**
 * Hook para manejar la carga de instituciones educativas
 * 
 * @returns {Object} { instituciones, loading, error, reload }
 * - instituciones: Array de instituciones
 * - loading: Boolean indicando si está cargando
 * - error: String con mensaje de error (null si no hay error)
 * - reload: Función para recargar las instituciones manualmente
 */
export const useInstituciones = () => {
    const [instituciones, setInstituciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cargarInstituciones = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await institucionesAPI.listar();
            setInstituciones(data);
        } catch (err) {
            console.error('Error al cargar instituciones:', err);
            setError('Error al cargar instituciones');
            
            // Fallback con datos mock si falla la API
            setInstituciones([
                { InstitucionID: 1, InstiNombre: 'I.E. Santa Isabel' },
                { InstitucionID: 2, InstiNombre: 'Colegio Salesiano Santa Rosa' },
                { InstitucionID: 3, InstiNombre: 'I.E. Politécnico Regional del Centro' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarInstituciones();
    }, []);

    return { 
        instituciones, 
        loading, 
        error,
        reload: cargarInstituciones // Por si necesitas recargar manualmente
    };
};
