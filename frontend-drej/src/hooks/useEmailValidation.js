import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/Api';

/**
 * Hook para validar email en tiempo real
 * Verifica formato y disponibilidad en la base de datos
 * 
 * @param {string} email - Email a validar
 * @param {boolean} shouldValidate - Si debe validar o no
 * @returns {Object} { valid, checking, message }
 */
export const useEmailValidation = (email, shouldValidate = true) => {
    const [validation, setValidation] = useState({
        valid: null,
        checking: false,
        message: ''
    });

    const validateEmail = useCallback(async () => {
        if (!shouldValidate || !email) {
            setValidation({ valid: null, checking: false, message: '' });
            return;
        }

        // Validar formato
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidation({
                valid: false,
                checking: false,
                message: 'Formato de email inválido'
            });
            return;
        }

        // Verificar disponibilidad en BD
        setValidation({ valid: null, checking: true, message: 'Verificando...' });

        try {
            const response = await authAPI.checkEmail(email);
            
            if (response.exists) {
                setValidation({
                    valid: false,
                    checking: false,
                    message: 'Este email ya está registrado'
                });
            } else {
                setValidation({
                    valid: true,
                    checking: false,
                    message: 'Email disponible'
                });
            }
        } catch (error) {
            console.error('Error al validar email:', error);
            setValidation({
                valid: null,
                checking: false,
                message: 'Error al verificar email'
            });
        }
    }, [email, shouldValidate]);

    useEffect(() => {
        // Debounce: espera 500ms después de que el usuario deje de escribir
        const timer = setTimeout(() => {
            validateEmail();
        }, 500);

        return () => clearTimeout(timer);
    }, [validateEmail]);

    return validation;
};
