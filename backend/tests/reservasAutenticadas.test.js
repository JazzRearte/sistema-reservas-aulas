
const request = require("supertest");

// Simulamos la autenticación de Keycloak.
// No modificamos el middleware real.
jest.mock("../middlewares/autenticar", () => {
  return (req, res, next) => {
    const tipoUsuario = req.headers["x-test-usuario"];

    if (!tipoUsuario) {
      return res.status(401).json({
        error: "Token no proporcionado",
      });
    }

    if (tipoUsuario === "admin") {
      req.usuario = {
        id: "admin-test",
        usuarioId: "admin-test",
        nombre: "Administrador de prueba",
        email: "admin@test.local",
        rol: "admin",
      };

      return next();
    }

    if (tipoUsuario === "usuario") {
      req.usuario = {
        id: "usuario-test",
        usuarioId: "usuario-test",
        nombre: "Usuario de prueba",
        email: "usuario@test.local",
        rol: "usuario",
      };

      return next();
    }

    return res.status(401).json({
      error: "Usuario de prueba inválido",
    });
  };
});

const app = require("../index");

describe("API de Reservas - Usuarios autenticados", () => {
  test("GET /api/reservas como administrador devuelve 200", async () => {
    const respuesta = await request(app)
      .get("/api/reservas")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveProperty("datos");
    expect(respuesta.body).toHaveProperty("paginacion");
    expect(Array.isArray(respuesta.body.datos)).toBe(true);
  });

  test("GET /api/reservas como usuario devuelve 200", async () => {
    const respuesta = await request(app)
      .get("/api/reservas")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveProperty("datos");
    expect(Array.isArray(respuesta.body.datos)).toBe(true);
  });

  test("Un usuario común solo ve sus propias reservas", async () => {
    const respuesta = await request(app)
      .get("/api/reservas")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(200);

    respuesta.body.datos.forEach((reserva) => {
      expect(reserva.usuarioId).toBe("usuario-test");
    });
  });

  test("GET /api/reservas permite filtrar por estado", async () => {
    const respuesta = await request(app)
      .get("/api/reservas?estado=pendiente")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);

    respuesta.body.datos.forEach((reserva) => {
      expect(reserva.estado).toBe("pendiente");
    });
  });

  test("GET /api/reservas permite filtrar por fecha", async () => {
    const fecha = "2026-11-20";

    const respuesta = await request(app)
      .get(`/api/reservas?fecha=${fecha}`)
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);

    respuesta.body.datos.forEach((reserva) => {
      expect(reserva.fecha).toBe(fecha);
    });
  });

  test("GET /api/reservas permite filtrar por aula", async () => {
    const aulaId = "aula-001";

    const respuesta = await request(app)
      .get(`/api/reservas?aulaId=${aulaId}`)
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);

    respuesta.body.datos.forEach((reserva) => {
      expect(reserva.aulaId).toBe(aulaId);
    });
  });

  test("GET /api/reservas permite paginación", async () => {
    const respuesta = await request(app)
      .get("/api/reservas?page=1&limit=2")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.datos.length).toBeLessThanOrEqual(2);
    expect(respuesta.body.paginacion.page).toBe(1);
    expect(respuesta.body.paginacion.limit).toBe(2);
  });

  test("GET /api/reservas/resumen permite acceso al administrador", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/resumen")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveProperty("reservasPorEstado");
  });

  test("GET /api/reservas/resumen prohíbe acceso al usuario común", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/resumen")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH aprobar prohíbe acceso al usuario común", async () => {
    const respuesta = await request(app)
      .patch("/api/reservas/res-1/aprobar")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH rechazar prohíbe acceso al usuario común", async () => {
    const respuesta = await request(app)
      .patch("/api/reservas/res-1/rechazar")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toHaveProperty("error");
  });
});
