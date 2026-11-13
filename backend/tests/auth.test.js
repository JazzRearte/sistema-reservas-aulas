
const request = require("supertest");

// Simulamos la base de datos para evitar
// modificar usuarios.json durante los tests.
jest.mock("../services/usuarios.service", () => ({
  sincronizarUsuario: jest.fn((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: true,
    passwordHash: null,
  })),
}));

// Simulamos la autenticación de Keycloak.
// Los tokens de prueba no funcionan fuera de Jest.
jest.mock("../middlewares/autenticar", () => {
  const autenticarReal = jest.requireActual(
    "../middlewares/autenticar"
  );

  return (req, res, next) => {
    const authorization = req.headers.authorization;

    if (authorization === "Bearer token-usuario-simulado") {
      req.usuario = {
        id: "usuario-test-001",
        usuarioId: "usuario-test-001",
        nombre: "Usuario de Prueba",
        email: "usuario@test.com",
        rol: "usuario",
      };

      return next();
    }

    if (authorization === "Bearer token-admin-simulado") {
      req.usuario = {
        id: "admin-test-001",
        usuarioId: "admin-test-001",
        nombre: "Administrador de Prueba",
        email: "admin@test.com",
        rol: "admin",
      };

      return next();
    }

    return autenticarReal(req, res, next);
  };
});

const app = require("../index");

const usuariosService = require(
  "../services/usuarios.service"
);

describe("Rutas de autenticación con Keycloak", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    test("rechaza solicitudes sin token", async () => {
      const respuesta = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(respuesta.status).toBe(401);

      expect(
        usuariosService.sincronizarUsuario
      ).not.toHaveBeenCalled();
    });

    test("rechaza tokens inválidos", async () => {
      const respuesta = await request(app)
        .post("/api/auth/login")
        .set("Authorization", "Bearer token-invalido")
        .send({});

      expect(respuesta.status).toBe(401);

      expect(
        usuariosService.sincronizarUsuario
      ).not.toHaveBeenCalled();
    });

    test("rechaza email y contraseña sin JWT", async () => {
      const respuesta = await request(app)
        .post("/api/auth/login")
        .send({
          email: "usuario@test.com",
          password: "Password123",
        });

      expect(respuesta.status).toBe(401);
      expect(respuesta.body).not.toHaveProperty("token");

      expect(
        usuariosService.sincronizarUsuario
      ).not.toHaveBeenCalled();
    });

    test("autentica correctamente a un usuario", async () => {
      const respuesta = await request(app)
        .post("/api/auth/login")
        .set(
          "Authorization",
          "Bearer token-usuario-simulado"
        )
        .send({});

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.autenticado).toBe(true);

      expect(respuesta.body.usuario).toEqual({
        id: "usuario-test-001",
        nombre: "Usuario de Prueba",
        email: "usuario@test.com",
        rol: "usuario",
      });

      expect(
        usuariosService.sincronizarUsuario
      ).toHaveBeenCalledTimes(1);

      expect(respuesta.body).not.toHaveProperty("token");
      expect(respuesta.body).not.toHaveProperty("password");
    });

    test("autentica correctamente a un administrador", async () => {
      const respuesta = await request(app)
        .post("/api/auth/login")
        .set(
          "Authorization",
          "Bearer token-admin-simulado"
        )
        .send({});

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.usuario.rol).toBe("admin");

      expect(
        usuariosService.sincronizarUsuario
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "admin-test-001",
          rol: "admin",
        })
      );
    });
  });

  describe("POST /api/auth/register", () => {
    test("rechaza el registro sin token", async () => {
      const respuesta = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(respuesta.status).toBe(401);

      expect(
        usuariosService.sincronizarUsuario
      ).not.toHaveBeenCalled();
    });

    test("rechaza el registro con token inválido", async () => {
      const respuesta = await request(app)
        .post("/api/auth/register")
        .set("Authorization", "Bearer token-invalido")
        .send({});

      expect(respuesta.status).toBe(401);

      expect(
        usuariosService.sincronizarUsuario
      ).not.toHaveBeenCalled();
    });

    test("sincroniza un usuario registrado en Keycloak", async () => {
      const respuesta = await request(app)
        .post("/api/auth/register")
        .set(
          "Authorization",
          "Bearer token-usuario-simulado"
        )
        .send({});

      expect(respuesta.status).toBe(200);

      expect(respuesta.body.mensaje).toBe(
        "Usuario registrado correctamente"
      );

      expect(respuesta.body.usuario).toEqual({
        id: "usuario-test-001",
        nombre: "Usuario de Prueba",
        email: "usuario@test.com",
        rol: "usuario",
      });

      expect(
        usuariosService.sincronizarUsuario
      ).toHaveBeenCalledTimes(1);
    });

    test("no permite asignar el rol admin desde el cuerpo", async () => {
      const respuesta = await request(app)
        .post("/api/auth/register")
        .set(
          "Authorization",
          "Bearer token-usuario-simulado"
        )
        .send({
          nombre: "Administrador Falso",
          email: "falso@test.com",
          rol: "admin",
        });

      expect(respuesta.status).toBe(200);

      expect(respuesta.body.usuario.rol).toBe("usuario");

      expect(
        usuariosService.sincronizarUsuario
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "usuario-test-001",
          rol: "usuario",
        })
      );
    });
  });
});
