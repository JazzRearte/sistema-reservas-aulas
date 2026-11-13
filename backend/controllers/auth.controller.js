
const autenticar = require("../middlewares/autenticar");
const usuariosService = require("../services/usuarios.service");

// POST /api/auth/register
// Sincroniza una cuenta registrada previamente en Keycloak.
function register(req, res, next) {
  autenticar(req, res, async () => {
    try {
      const usuario = usuariosService.sincronizarUsuario(
        req.usuario
      );

      return res.status(200).json({
        mensaje: "Usuario registrado correctamente",
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

// POST /api/auth/login
// Valida el JWT de Keycloak y sincroniza el usuario.
function login(req, res, next) {
  autenticar(req, res, async () => {
    try {
      const usuario = usuariosService.sincronizarUsuario(
        req.usuario
      );

      return res.status(200).json({
        mensaje: "Token validado correctamente",
        autenticado: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

module.exports = {
  register,
  login,
};
