import { useState, useEffect } from 'react';

/**
 * Hook para calcular la fortaleza de una contraseña
 * 
 * @param {string} password - Contraseña a evaluar
 * @returns {Object} { strength, label }
 * - strength: Número del 0-4 indicando fortaleza
 * - label: String descriptivo ('Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte')
 */
export const usePasswordStrength = (password) => {
    const [strength, setStrength] = useState({ level: 0, label: '' });

    useEffect(() => {
        if (!password) {
            setStrength({ level: 0, label: '' });
            return;
        }

        let level = 0;
        
        // Longitud mínima
        if (password.length >= 8) level++;
        if (password.length >= 12) level++;
        
        // Contiene minúsculas
        if (/[a-z]/.test(password)) level++;
        
        // Contiene mayúsculas
        if (/[A-Z]/.test(password)) level++;
        
        // Contiene números
        if (/[0-9]/.test(password)) level++;
        
        // Contiene caracteres especiales
        if (/[^A-Za-z0-9]/.test(password)) level++;

        // Calcular nivel final (0-4)
        let finalLevel = 0;
        let label = '';

        if (level <= 1) {
            finalLevel = 0;
            label = 'Muy débil';
        } else if (level === 2) {
            finalLevel = 1;
            label = 'Débil';
        } else if (level === 3 || level === 4) {
            finalLevel = 2;
            label = 'Media';
        } else if (level === 5) {
            finalLevel = 3;
            label = 'Fuerte';
        } else {
            finalLevel = 4;
            label = 'Muy fuerte';
        }

        setStrength({ level: finalLevel, label });
    }, [password]);

    return strength;
};
