
const { leerJSON } = require("../services/db");

const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL ||
  "http://localhost:8080";

const KEYCLOAK_REALM =
  process.env.KEYCLOAK_REALM || "dds-materia";

const KEYCLOAK_CLIENT_ID =
  process.env.KEYCLOAK_CLIENT_ID || "frontend";

const issuer =
  `${KEYCLOAK_URL.replace(/\/$/, "")}/realms/${KEYCLOAK_REALM}`;

const jwksUrl =
  `${issuer}/protocol/openid-connect/certs`;

let josePromise;
let jwksPromise;

async function obtenerJOSE() {
  if (!josePromise) {
    josePromise = import("jose");
  }

  return josePromise;
}

async function obtenerJWKS() {
  if (!jwksPromise) {
    jwksPromise = obtenerJOSE().then(
      ({ createRemoteJWKSet }) =>
        createRemoteJWKSet(new URL(jwksUrl))
    );
  }

  return jwksPromise;
}

async function autenticar(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token no proporcionado",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: "Token no proporcionado",
    });
  }

  try {
    const { jwtVerify } = await obtenerJOSE();
    const JWKS = await obtenerJWKS();

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      algorithms: ["RS256"],
    });

    const audiencias = Array.isArray(payload.aud)
      ? payload.aud
      : payload.aud
        ? [payload.aud]
        : [];

    const clienteAutorizado =
      payload.azp === KEYCLOAK_CLIENT_ID ||
      audiencias.includes(KEYCLOAK_CLIENT_ID);

    if (!clienteAutorizado) {
      return res.status(401).json({
        error: "Token emitido para otro cliente",
      });
    }

    const roles = payload.realm_access?.roles || [];

    if (
      !roles.includes("usuario") &&
      !roles.includes("admin")
    ) {
      return res.status(403).json({
        error: "El usuario no tiene un rol autorizado",
      });
    }

    // Verificamos si el usuario está desactivado
    // en la base de datos local.
    const usuarios = leerJSON("usuarios.json");

    const usuarioLocal = usuarios.find(
      (usuario) => usuario.id === payload.sub
    );

    if (usuarioLocal?.activo === false) {
      return res.status(403).json({
        error: "El usuario se encuentra desactivado",
      });
    }

    req.usuario = {
      id: payload.sub,
      usuarioId: payload.sub,
      nombre:
        payload.name ||
        payload.preferred_username ||
        "Usuario",
      email: payload.email || "",
      rol: roles.includes("admin")
        ? "admin"
        : "usuario",
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido o expirado",
    });
  }
}

module.exports = autenticar;
