
const request = require("supertest");

// Base de datos simulada en memoria.
// Las claves coinciden con los nombres reales de los archivos JSON.
const datosPrueba = {
  "aulas.json": [],
  "reservas.json": [],
  "historial_reservas.json": [],
};

// Simulamos las operaciones de lectura y escritura.
// No se modifican los archivos reales del proyecto.
jest.mock("../services/db", () => ({
  leerJSON: jest.fn((archivo) => {
    if (!(archivo in datosPrueba)) {
      throw new Error(
        `Archivo de prueba desconocido: ${archivo}`
      );
    }

    return JSON.parse(
      JSON.stringify(datosPrueba[archivo])
    );
  }),

  escribirJSON: jest.fn((archivo, datos) => {
    if (!(archivo in datosPrueba)) {
      throw new Error(
        `Archivo de prueba desconocido: ${archivo}`
      );
    }

    datosPrueba[archivo] = JSON.parse(
      JSON.stringify(datos)
    );
  }),
}));

// Autenticación simulada exclusivamente para las pruebas.
jest.mock("../middlewares/autenticar", () => {
  return (req, res, next) => {
    const tipoUsuario = req.headers["x-test-usuario"];

    if (tipoUsuario === "admin") {
      req.usuario = {
        id: "admin-test",
        usuarioId: "admin-test",
        rol: "admin",
      };

      return next();
    }

    if (tipoUsuario === "usuario") {
      req.usuario = {
        id: "usuario-test",
        usuarioId: "usuario-test",
        rol: "usuario",
      };

      return next();
    }

    return res.status(401).json({
      error: "Token no proporcionado",
    });
  };
});

const app = require("../index");

const aulaPrueba = {
  id: "aula-001",
  nombre: "Aula de prueba",
  ubicacion: "Primer piso",
  capacidad: 30,
  recursos: ["Proyector"],
  activa: true,
};

function crearDatosReserva(cambios = {}) {
  return {
    aulaId: "aula-001",
    fecha: "2026-12-15",
    horaInicio: "10:00",
    horaFin: "12:00",
    cantidadPersonas: 20,
    motivo: "Clase de programación",
    ...cambios,
  };
}

function agregarReserva(cambios = {}) {
  const reservas = datosPrueba["reservas.json"];

  const reserva = {
    id: `res-${reservas.length + 1}`,
    usuarioId: "usuario-test",
    estado: "pendiente",
    createdAt: "2026-11-09T10:00:00.000Z",
    ...crearDatosReserva(),
    ...cambios,
  };

  reservas.push(reserva);

  return reserva;
}

beforeEach(() => {
  datosPrueba["aulas.json"] = [
    {
      ...aulaPrueba,
      recursos: [...aulaPrueba.recursos],
    },
  ];

  datosPrueba["reservas.json"] = [];
  datosPrueba["historial_reservas.json"] = [];
});

describe("API de Reservas - Operaciones HTTP", () => {
  test("POST crea una reserva válida y devuelve 201", async () => {
    const respuesta = await request(app)
      .post("/api/reservas")
      .set("x-test-usuario", "usuario")
      .send(crearDatosReserva());

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toHaveProperty("id");
    expect(respuesta.body.estado).toBe("pendiente");
    expect(respuesta.body.usuarioId).toBe(
      "usuario-test"
    );

    expect(datosPrueba["reservas.json"]).toHaveLength(1);

    expect(
      datosPrueba["historial_reservas.json"]
    ).toHaveLength(1);
  });

  test("POST rechaza una reserva que supera la capacidad", async () => {
    const respuesta = await request(app)
      .post("/api/reservas")
      .set("x-test-usuario", "usuario")
      .send(
        crearDatosReserva({
          cantidadPersonas: 40,
        })
      );

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toHaveProperty("error");

    expect(datosPrueba["reservas.json"]).toHaveLength(0);
  });

  test("POST rechaza horarios superpuestos", async () => {
    agregarReserva();

    const respuesta = await request(app)
      .post("/api/reservas")
      .set("x-test-usuario", "usuario")
      .send(
        crearDatosReserva({
          horaInicio: "11:00",
          horaFin: "13:00",
        })
      );

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toHaveProperty("error");

    expect(datosPrueba["reservas.json"]).toHaveLength(1);
  });

  test("POST permite reservas consecutivas", async () => {
    agregarReserva();

    const respuesta = await request(app)
      .post("/api/reservas")
      .set("x-test-usuario", "usuario")
      .send(
        crearDatosReserva({
          horaInicio: "12:00",
          horaFin: "14:00",
        })
      );

    expect(respuesta.status).toBe(201);

    expect(datosPrueba["reservas.json"]).toHaveLength(2);
  });

  test("GET devuelve una reserva existente", async () => {
    const reserva = agregarReserva();

    const respuesta = await request(app)
      .get(`/api/reservas/${reserva.id}`)
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.id).toBe(reserva.id);
  });

  test("GET devuelve 404 si la reserva no existe", async () => {
    const respuesta = await request(app)
      .get("/api/reservas/res-inexistente")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("GET impide consultar reservas ajenas", async () => {
    const reserva = agregarReserva({
      usuarioId: "otro-usuario",
    });

    const respuesta = await request(app)
      .get(`/api/reservas/${reserva.id}`)
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PUT rechaza una edición con superposición", async () => {
    agregarReserva({
      id: "res-1",
      horaInicio: "10:00",
      horaFin: "12:00",
    });

    agregarReserva({
      id: "res-2",
      horaInicio: "14:00",
      horaFin: "16:00",
    });

    const respuesta = await request(app)
      .put("/api/reservas/res-2")
      .set("x-test-usuario", "usuario")
      .send({
        horaInicio: "11:00",
        horaFin: "13:00",
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toHaveProperty("error");

    const reserva = datosPrueba["reservas.json"].find(
      (r) => r.id === "res-2"
    );

    expect(reserva.horaInicio).toBe("14:00");
    expect(reserva.horaFin).toBe("16:00");
  });

  test("PUT permite al admin editar una reserva aprobada", async () => {
    agregarReserva({
      id: "res-1",
      estado: "aprobada",
    });

    const respuesta = await request(app)
      .put("/api/reservas/res-1")
      .set("x-test-usuario", "admin")
      .send({
        motivo: "Motivo actualizado por administrador",
      });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe("aprobada");

    expect(respuesta.body.motivo).toBe(
      "Motivo actualizado por administrador"
    );

    expect(
      datosPrueba["historial_reservas.json"]
    ).toHaveLength(1);
  });

  test("PUT impide editar una reserva aprobada al usuario", async () => {
    agregarReserva({
      id: "res-1",
      estado: "aprobada",
    });

    const respuesta = await request(app)
      .put("/api/reservas/res-1")
      .set("x-test-usuario", "usuario")
      .send({
        motivo: "Edición no autorizada",
      });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toHaveProperty("error");
  });

  test("PATCH rechaza una transición inválida", async () => {
    agregarReserva({
      id: "res-1",
      estado: "rechazada",
    });

    const respuesta = await request(app)
      .patch("/api/reservas/res-1/aprobar")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toHaveProperty("error");

    expect(
      datosPrueba["reservas.json"][0].estado
    ).toBe("rechazada");
  });

  test("PATCH permite aprobar una reserva pendiente", async () => {
    agregarReserva({
      id: "res-1",
      estado: "pendiente",
    });

    const respuesta = await request(app)
      .patch("/api/reservas/res-1/aprobar")
      .set("x-test-usuario", "admin");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe("aprobada");

    expect(
      datosPrueba["historial_reservas.json"]
    ).toHaveLength(1);
  });

  test("PATCH permite cancelar una reserva propia aprobada", async () => {
    agregarReserva({
      id: "res-1",
      estado: "aprobada",
    });

    const respuesta = await request(app)
      .patch("/api/reservas/res-1/cancelar")
      .set("x-test-usuario", "usuario");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe("cancelada");

    expect(
      datosPrueba["historial_reservas.json"]
    ).toHaveLength(1);
  });
});
