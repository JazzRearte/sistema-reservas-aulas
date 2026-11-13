
import axios from "axios";
import keycloak from "../config/keycloak";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
});

// Agregar automáticamente el token de Keycloak
api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      // Renovar el token si vence en menos de 30 segundos
      await keycloak.updateToken(30);

      if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
    } catch (error) {
      console.error("Error al renovar el token:", error);

      // No enviar un token vencido o inválido
      delete config.headers.Authorization;

      throw error;
    }
  }

  return config;
});

export default api;
