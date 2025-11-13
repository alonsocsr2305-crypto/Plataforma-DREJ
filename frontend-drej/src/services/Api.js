// src/services/Api.js
import axios from "axios";

// ====== BASE URL (usa env y fallback) ======
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000";

// ====== KEYS PARA LOCALSTORAGE ======
const STORAGE = {
  access: "access_token",
  refresh: "refresh_token",
};

// ====== AXIOS INSTANCE ======
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ------ Interceptor de request: añade Bearer ------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE.access);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ------ Interceptor de response: refresh automático 401 ------
let isRefreshing = false;
let pendingRequests = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Si no es 401 o la request ya fue reintentada, rechaza normalmente
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Si no hay refresh token, logout directo
    const refresh = localStorage.getItem(STORAGE.refresh);
    if (!refresh) return Promise.reject(error);

    // Marca para evitar bucles
    original._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        // Pide nuevo access
        const { data } = await axios.post(`${API_BASE}/api/auth/token/refresh/`, {
          refresh,
        });
        localStorage.setItem(STORAGE.access, data.access);
        isRefreshing = false;

        // Reintenta las pendientes
        pendingRequests.forEach((cb) => cb(null, data.access));
        pendingRequests = [];
      } else {
        // Espera a que termine el refresh en curso
        await new Promise((resolve, reject) => {
          pendingRequests.push((err) => (err ? reject(err) : resolve()));
        });
      }

      // Reintentar la request original con el nuevo token
      original.headers.Authorization = `Bearer ${localStorage.getItem(STORAGE.access)}`;
      return api(original);
    } catch (err) {
      isRefreshing = false;
      pendingRequests = [];
      // Limpia y rechaza
      localStorage.removeItem(STORAGE.access);
      localStorage.removeItem(STORAGE.refresh);
      return Promise.reject(err);
    }
  }
);

// ============================================
//               ENDPOINTS DE AUTENTICACIÓN
// ============================================

export const authAPI = {
  /**
   * Registrar nuevo usuario (Estudiante u Orientador)
   * @param {Object} payload - Datos del registro
   * @param {string} payload.dni - DNI de 8 dígitos
   * @param {string} payload.first_name - Nombres
   * @param {string} payload.last_name - Apellidos completos
   * @param {string} payload.apellido_paterno - Apellido paterno
   * @param {string} payload.apellido_materno - Apellido materno
   * @param {string} payload.telefono - Teléfono
   * @param {string} payload.fecha_nacimiento - Fecha en formato YYYY-MM-DD
   * @param {string} payload.email - Correo electrónico
   * @param {string} payload.password - Contraseña
   * @param {string} payload.passwordConfirm - Confirmación de contraseña
   * @param {string} payload.rol - "Estudiante" o "Orientador"
   * @param {string} payload.institucion - Institución (solo Orientador)
   * @param {string} payload.cargo - Cargo (solo Orientador)
   * @param {string} payload.area_especializacion - Área de especialización (solo Orientador)
   * @param {string} payload.perfil_profesional - Link a perfil profesional (opcional, solo Orientador)
   * @returns {Promise<Object>} Respuesta del servidor con datos del usuario registrado
   */
  async register(payload) {
        try {
            const { data } = await api.post("/api/auth/register/", payload);  // ← Cambiar aquí
            return data;
        } catch (error) {
            console.error("[API] Error en registro:", error.response?.data || error.message);
            throw error;
        }
    },

  /**
   * Login con JWT (SimpleJWT)
   * @param {Object} credentials - Credenciales de acceso
   * @param {string} credentials.username - DNI o Email del usuario
   * @param {string} credentials.password - Contraseña
   * @returns {Promise<Object>} Tokens de acceso y refresh
   */
  async login(credentials) {
    try {
      const { data } = await api.post("/api/auth/token/", credentials);
      if (data?.access) {
        localStorage.setItem(STORAGE.access, data.access);
        localStorage.setItem(STORAGE.refresh, data.refresh);
      }
      return data;
    } catch (error) {
      console.error("[API] Error en login:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Logout local - Elimina tokens del localStorage
   */
  logout() {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
  },

  /**
   * Refresh token manual
   * @returns {Promise<Object>} Nuevo access token
   */
  async refreshToken() {
    const refresh = localStorage.getItem(STORAGE.refresh);
    if (!refresh) {
      throw new Error("No hay refresh token disponible");
    }
    const { data } = await api.post("/api/auth/token/refresh/", { refresh });
    localStorage.setItem(STORAGE.access, data.access);
    return data;
  },

  /**
   * Obtener perfil del usuario autenticado
   * @returns {Promise<Object>} Datos del usuario
   */
  async me() {
    const { data } = await api.get("/api/auth/me/");
    return data;
  },

  // ============================================
  //         VALIDACIONES DE REGISTRO
  // ============================================

  /**
   * Verificar si un DNI ya está registrado
   * @param {string} dni - DNI a verificar
   * @returns {Promise<Object>} { exists: boolean }
   */
  async checkDNI(dni) {
    try {
      const { data } = await api.get(`/api/check-dni/${dni}/`);
      return data;
    } catch (error) {
      console.error("[API] Error al verificar DNI:", error);
      return { exists: false };
    }
  },

  /**
   * Verificar si un email ya está registrado
   * @param {string} email - Email a verificar
   * @returns {Promise<Object>} { exists: boolean }
   */
  async checkEmail(email) {
    try {
      const { data } = await api.get(`/api/check-email/${encodeURIComponent(email)}/`);
      return data;
    } catch (error) {
      console.error("[API] Error al verificar email:", error);
      return { exists: false };
    }
  },

  /**
   * Validar si un dominio de email está permitido para orientadores
   * @param {string} email - Email a validar
   * @returns {Promise<Object>} { valid: boolean, institucion?: string, tipo?: string, message?: string }
   */
  async validateDomain(email) {
    try {
      const { data } = await api.get(`/api/validate-domain/?email=${encodeURIComponent(email)}`);
      return data;
    } catch (error) {
      console.error("[API] Error al validar dominio:", error);
      return { 
        valid: false, 
        message: error.response?.data?.message || "Error al validar dominio" 
      };
    }
  },
};

// ============================================
//           ENDPOINTS DE USUARIO
// ============================================

export const usuarioAPI = {
  /**
   * Obtener perfil del usuario autenticado
   * @returns {Promise<Object>} Datos del perfil
   */
  async getPerfil() {
    return authAPI.me();
  },

  /**
   * Actualizar perfil del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Perfil actualizado
   */
  async updatePerfil(data) {
    const res = await api.put("/api/usuarios/perfil/actualizar/", data);
    return res.data;
  },
};

// ============================================
//           ENDPOINTS DE DNI (RENIEC)
// ============================================

export const dniAPI = {
  /**
   * Verificar DNI con RENIEC (si tienes integración)
   * @param {string} dni - DNI a verificar
   * @returns {Promise<Object>} Datos de RENIEC
   */
  async verificar(dni) {
    try {
      const { data } = await api.post("/api/dni/verificar/", { dni });
      return data;
    } catch (error) {
      console.error("[API] Error al verificar DNI con RENIEC:", error);
      throw error;
    }
  },
};

// ============================================
//           HELPERS Y UTILIDADES
// ============================================

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(STORAGE.access);
};

/**
 * Obtener token de acceso
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE.access);
};

/**
 * Obtener token de refresh
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE.refresh);
};

export const institucionesAPI = {
    listar: async (provincia = null) => {
        let url = '/api/instituciones/';
        if (provincia) {
            url += `?provincia=${provincia}`;
        }
        const response = await api.get(url);
        return response.data;
    },
};

export default api;