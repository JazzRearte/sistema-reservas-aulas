
const request = require("supertest");
const app = require("../index");

describe("API de Reservas - Autenticación", () => {
  test("GET /api/reservas sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .get("/api/reservas");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("POST /api/reservas sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .post("/api/reservas")
      .send({
        aulaId: "aula-001",
        fecha: "2026-11-20",
        horaInicio: "10:00",
        horaFin: "12:00",
        cantidadPersonas: 20,
        motivo: "Prueba de reserva",
      });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error).toBe(
      "Token no proporcionado"
    );
  });

  test("GET /api/reservas/resumen sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/resumen");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error).toBe(
      "Token no proporcionado"
    );
  });

  test("GET /api/reservas/:id sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/res-1");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("GET /api/reservas/:id/historial sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/res-1/historial");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PUT /api/reservas/:id sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .put("/api/reservas/res-1")
      .send({
        motivo: "Intento de edición sin autenticación",
      });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH /api/reservas/:id/cancelar sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .patch("/api/reservas/res-1/cancelar");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH /api/reservas/:id/aprobar sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .patch("/api/reservas/res-1/aprobar");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH /api/reservas/:id/rechazar sin token devuelve 401", async () => {
    const respuesta = await request(app)
      .patch("/api/reservas/res-1/rechazar");

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("GET /api/reservas con token inválido devuelve 401", async () => {
    const respuesta = await request(app)
      .get("/api/reservas")
      .set(
        "Authorization",
        "Bearer token-invalido"
      );

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("POST /api/reservas con token inválido devuelve 401", async () => {
    const respuesta = await request(app)
      .post("/api/reservas")
      .set(
        "Authorization",
        "Bearer token-invalido"
      )
      .send({
        aulaId: "aula-001",
        fecha: "2026-11-20",
        horaInicio: "10:00",
        horaFin: "12:00",
        cantidadPersonas: 20,
        motivo: "Prueba con token inválido",
      });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toHaveProperty("error");
  });
});
