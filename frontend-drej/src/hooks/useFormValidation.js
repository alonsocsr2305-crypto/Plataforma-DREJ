// useFormValidation.js
import { useState } from 'react';

export const useFormValidation = (initialState, validationRules) => {
    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Limpiar error al escribir
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors = {};
        
        Object.keys(validationRules).forEach(field => {
            const error = validationRules[field](formData[field]);
            if (error) newErrors[field] = error;
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        handleChange,
        validate,
    };
};