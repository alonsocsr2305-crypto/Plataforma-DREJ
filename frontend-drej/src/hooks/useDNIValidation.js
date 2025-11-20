import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/Api';

/**
 * Hook para validar DNI en tiempo real
 * Verifica formato (8 dígitos) y disponibilidad en la base de datos
 * 
 * @param {string} dni - DNI a validar
 * @param {boolean} shouldValidate - Si debe validar o no
 * @returns {Object} { available, checking, message }
 */
export const useDNIValidation = (dni, shouldValidate = true) => {
    const [validation, setValidation] = useState({
        available: null,
        checking: false,
        message: ''
    });

    const validateDNI = useCallback(async () => {
        if (!shouldValidate || !dni) {
            setValidation({ available: null, checking: false, message: '' });
            return;
        }

        // Validar formato (8 dígitos)
        if (!/^\d{8}$/.test(dni)) {
            setValidation({
                available: false,
                checking: false,
                message: 'DNI debe tener exactamente 8 dígitos'
            });
            return;
        }

        // Verificar disponibilidad en BD
        setValidation({ available: null, checking: true, message: 'Verificando DNI...' });

        try {
            const response = await authAPI.checkDNI(dni);
            
            if (response.exists) {
                setValidation({
                    available: false,
                    checking: false,
                    message: 'Este DNI ya está registrado'
                });
            } else {
                setValidation({
                    available: true,
                    checking: false,
                    message: 'DNI disponible'
                });
            }
        } catch (error) {
            console.error('Error al validar DNI:', error);
            setValidation({
                available: null,
                checking: false,
                message: 'Error al verificar DNI'
            });
        }
    }, [dni, shouldValidate]);

    useEffect(() => {
        // Debounce: espera 500ms después de que el usuario deje de escribir
        const timer = setTimeout(() => {
            validateDNI();
        }, 500);

        return () => clearTimeout(timer);
    }, [validateDNI]);

    return validation;
};
