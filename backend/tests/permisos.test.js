
const express = require("express");
const request = require("supertest");

const autorizar = require("../middlewares/autorizar");

// Creamos una aplicación de prueba independiente.
// No utilizamos los datos reales del sistema.
function crearAppPrueba(usuario) {
  const app = express();

  app.use(express.json());

  // Simulamos un usuario autenticado.
  app.use((req, res, next) => {
    if (usuario) {
      req.usuario = usuario;
    }
    next();
  });

  // Ruta de prueba exclusiva para administradores.
  app.get(
    "/admin",
    autorizar("admin"),
    (req, res) => {
      res.status(200).json({
        mensaje: "Acceso autorizado"
      });
    }
  );

  // Ruta de prueba para usuarios autenticados.
  app.get(
    "/usuario",
    autorizar("usuario", "admin"),
    (req, res) => {
      res.status(200).json({
        mensaje: "Acceso autorizado"
      });
    }
  );

  return app;
}

describe("Middleware de autorización", () => {

  test("Sin autenticación devuelve 401", async () => {
    const app = crearAppPrueba(null);

    const respuesta = await request(app)
      .get("/admin");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error).toBe("No autenticado");
  });

  test("Usuario normal no puede acceder como administrador", async () => {
    const app = crearAppPrueba({
      usuarioId: "usuario-prueba",
      rol: "usuario"
    });

    const respuesta = await request(app)
      .get("/admin");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error).toMatch(/permisos/i);
  });

  test("Administrador puede acceder a ruta exclusiva", async () => {
    const app = crearAppPrueba({
      usuarioId: "admin-prueba",
      rol: "admin"
    });

    const respuesta = await request(app)
      .get("/admin");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe("Acceso autorizado");
  });

  test("Usuario normal puede acceder a una ruta permitida", async () => {
    const app = crearAppPrueba({
      usuarioId: "usuario-prueba",
      rol: "usuario"
    });

    const respuesta = await request(app)
      .get("/usuario");

    expect(respuesta.status).toBe(200);
  });

  test("Administrador también puede acceder a una ruta de usuario", async () => {
    const app = crearAppPrueba({
      usuarioId: "admin-prueba",
      rol: "admin"
    });

    const respuesta = await request(app)
      .get("/usuario");

    expect(respuesta.status).toBe(200);
  });

});
