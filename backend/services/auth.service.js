
const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL ||
  "http://localhost:8080";

const KEYCLOAK_REALM =
  process.env.KEYCLOAK_REALM || "dds-materia";

const KEYCLOAK_CLIENT_ID =
  process.env.KEYCLOAK_CLIENT_ID || "frontend";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

function crearError(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function obtenerUrlKeycloak(accion) {
  const baseUrl = KEYCLOAK_URL.replace(/\/$/, "");

  const endpoint =
    accion === "registro"
      ? "registrations"
      : "auth";

  const url = new URL(
    `${baseUrl}/realms/${encodeURIComponent(
      KEYCLOAK_REALM
    )}/protocol/openid-connect/${endpoint}`
  );

  url.searchParams.set(
    "client_id",
    KEYCLOAK_CLIENT_ID
  );

  url.searchParams.set(
    "redirect_uri",
    FRONTEND_URL
  );

  url.searchParams.set(
    "response_type",
    "code"
  );

  url.searchParams.set(
    "scope",
    "openid"
  );

  return url.toString();
}

async function registrar() {
  return {
    mensaje:
      "El registro de usuarios se realiza mediante Keycloak.",
    proveedor: "Keycloak",
    urlRegistro: obtenerUrlKeycloak("registro"),
  };
}

async function login() {
  return {
    mensaje:
      "El inicio de sesión se realiza mediante Keycloak.",
    proveedor: "Keycloak",
    urlLogin: obtenerUrlKeycloak("login"),
  };
}

module.exports = {
  registrar,
  login,
};
