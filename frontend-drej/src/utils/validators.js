import { REGEX, VALIDATION_MESSAGES } from '../config/constants';

export const validateEmail = (email) => {
    if (!email) return VALIDATION_MESSAGES.EMAIL_REQUIRED;
    if (!REGEX.EMAIL.test(email)) return VALIDATION_MESSAGES.EMAIL_INVALID;
    return null;
};

export const validateDNI = (dni) => {
    if (!dni) return VALIDATION_MESSAGES.DNI_REQUIRED;
    if (!REGEX.DNI.test(dni)) return VALIDATION_MESSAGES.DNI_INVALID;
    return null;
};

export const validateTextQuality = (text, fieldName) => {
        if (!text || text.trim().length < 2) {
            return `${fieldName} es muy corto`;
        }
        
        const cleaned = text.trim().toLowerCase();
        
        // 1. Detectar caracteres repetidos (ej: "aaaa", "1111")
        if (/(.)\1{3,}/.test(cleaned)) {
            return `${fieldName} contiene demasiados caracteres repetidos`;
        }
        
        // 2. Debe tener al menos una vocal
        const hasVowels = /[aeiouáéíóú]/.test(cleaned);
        if (!hasVowels && cleaned.length > 2) {
            return `${fieldName} debe contener vocales`;
        }
        
        // 3. Debe tener al menos una consonante
        const hasConsonants = /[bcdfghjklmnpqrstvwxyzñ]/.test(cleaned);
        if (!hasConsonants && cleaned.length > 2) {
            return `${fieldName} debe contener consonantes`;
        }
        
        // 4. No puede tener más del 60% de consonantes seguidas
        const consonantRuns = cleaned.match(/[bcdfghjklmnpqrstvwxyzñ]{4,}/g);
        if (consonantRuns && consonantRuns.length > 0) {
            return `${fieldName} tiene demasiadas consonantes seguidas`;
        }
        
        // 5. Detectar patrones repetitivos como "ABAB" o "ABCABC"
        // Ejemplo: "safas" = "saf" + "as" (patrón repetitivo)
        for (let len = 2; len <= Math.floor(cleaned.length / 2); len++) {
            const pattern = cleaned.substring(0, len);
            const rest = cleaned.substring(len);
            
            // Si el resto comienza con parte del patrón, es sospechoso
            if (rest.startsWith(pattern.substring(0, Math.min(2, pattern.length)))) {
                return `${fieldName} parece contener un patrón repetitivo`;
            }
        }
        
        // 6. Detectar sílabas repetidas (ej: "safas" tiene "saf" y "fas" muy similares)
        const syllables = cleaned.match(/.{2,3}/g) || [];
        const uniqueSyllables = new Set(syllables);
        if (syllables.length > 1 && uniqueSyllables.size < syllables.length * 0.6) {
            return `${fieldName} contiene sílabas muy similares`;
        }
        
        // 7. Verificar alternancia mínima entre vocales y consonantes
        let changes = 0;
        let isVowel = /[aeiouáéíóú]/.test(cleaned[0]);
        
        for (let i = 1; i < cleaned.length; i++) {
            const currentIsVowel = /[aeiouáéíóú]/.test(cleaned[i]);
            if (currentIsVowel !== isVowel) {
                changes++;
                isVowel = currentIsVowel;
            }
        }
        
        // Al menos debe haber cambios proporcionales a la longitud
        if (changes < cleaned.length * 0.3) {
            return `${fieldName} no tiene una estructura de nombre válida`;
        }
        
        // 8. No permitir solo espacios
        if (text.trim().length === 0) {
            return `${fieldName} no puede estar vacío`;
        }
        
        return null; // ✅ Válido
    };