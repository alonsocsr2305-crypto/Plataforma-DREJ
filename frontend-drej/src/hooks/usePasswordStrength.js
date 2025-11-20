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
    const [strength, setStrength] = useState({ score: 0, label: '' });

    useEffect(() => {
        if (!password) {
            setStrength({ score: 0, label: '' });
            return;
        }

        let score = 0;
        
        // Longitud mínima
        if (password.length >= 8) score += 1;
        if (password.length >= 10) score += 1;
        if (password.length >= 13) score += 1;
        if (password.length >= 15) score += 1;
        
        // Contiene minúsculas
        if (/[a-z]/.test(password)) score += 1;        // minúsculas
        if (/[A-Z]/.test(password)) score += 1;        // mayúsculas
        if (/\d/.test(password)) score += 1;           // números
        if (/[^A-Za-z0-9]/.test(password)) score += 2;

        // Calcular nivel final (0-4)
        let finalScore = 0;
        let label = '';

        if (score <= 3) {
            finalScore = 1;
            label = 'Débil';
        } else if (score <= 5) {
            finalScore = 2;
            label = 'Media';
        } else if (score <= 7) {
            finalScore = 3;
            label = 'Buena';
        } else {
            finalScore = 4;
            label = 'Fuerte';
        }

        setStrength({ score: finalScore, label });
    }, [password]);

    return strength;
};
