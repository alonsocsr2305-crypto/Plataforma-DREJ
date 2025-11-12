// constants.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const ENDPOINTS = {
    INSTITUCIONES: `${API_BASE_URL}/api/instituciones/`,
    RENIEC_MOCK: `${API_BASE_URL}/api/reniec/mock/`,
    CHECK_DNI: `${API_BASE_URL}/api/check-dni/`,
    CHECK_EMAIL: `${API_BASE_URL}/api/check-email/`,
    VALIDATE_DOMAIN: `${API_BASE_URL}/api/validate-domain/`,
};

export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    DNI: /^\d{8}$/,
    TELEFONO: /^9\d{8}$/,
};

export const VALIDATION_MESSAGES = {
    EMAIL_REQUIRED: 'El email es obligatorio',
    EMAIL_INVALID: 'Email inválido',
    DNI_REQUIRED: 'El DNI es obligatorio',
    DNI_INVALID: 'DNI debe tener 8 dígitos',
    PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 8 caracteres',
};