
const { leerJSON, escribirJSON } = require("./db");

const ARCHIVO_USUARIOS = "usuarios.json";

function sincronizarUsuario(usuarioKeycloak) {
  if (!usuarioKeycloak || !usuarioKeycloak.id) {
    const error = new Error(
      "No se puede sincronizar un usuario sin ID"
    );

    error.status = 400;
    throw error;
  }

  const usuarios = leerJSON(ARCHIVO_USUARIOS);

  const rolKeycloak =
    usuarioKeycloak.rol === "admin"
      ? "admin"
      : "usuario";

  const usuarioExistente = usuarios.find(
    (usuario) => usuario.id === usuarioKeycloak.id
  );

  // Si ya existe, actualizamos sus datos
  // utilizando la información validada de Keycloak.
  if (usuarioExistente) {
    if (usuarioExistente.activo === false) {
      const error = new Error(
        "El usuario se encuentra desactivado"
      );

      error.status = 403;
      throw error;
    }

    usuarioExistente.nombre =
      usuarioKeycloak.nombre ||
      usuarioExistente.nombre ||
      "Usuario";

    usuarioExistente.email =
      usuarioKeycloak.email ||
      usuarioExistente.email ||
      "";

    usuarioExistente.rol = rolKeycloak;

    escribirJSON(ARCHIVO_USUARIOS, usuarios);

    return usuarioExistente;
  }

  // Si no existe, creamos un nuevo usuario.
  const nuevoUsuario = {
    id: usuarioKeycloak.id,
    nombre: usuarioKeycloak.nombre || "Usuario",
    email: usuarioKeycloak.email || "",
    passwordHash: null,
    rol: rolKeycloak,
    activo: true,
  };

  usuarios.push(nuevoUsuario);

  escribirJSON(ARCHIVO_USUARIOS, usuarios);

  return nuevoUsuario;
}

module.exports = {
  sincronizarUsuario,
};

