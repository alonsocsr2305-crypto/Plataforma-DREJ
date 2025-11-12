import { useState, useEffect } from 'react';
import { ENDPOINTS } from '../config/constants';
import { logger } from '../utils/logger';

export const useInstituciones = (provincia = null) => {
    const [instituciones, setInstituciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarInstituciones();
    }, [provincia]);

    const cargarInstituciones = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let url = ENDPOINTS.INSTITUCIONES;
            if (provincia) url += `?provincia=${provincia}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            logger.log('[useInstituciones] Cargadas:', data.length);
            setInstituciones(data);
        } catch (err) {
            const errorMsg = 'Error al cargar instituciones';
            logger.error('[useInstituciones]', err);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return { instituciones, loading, error, reload: cargarInstituciones };
};