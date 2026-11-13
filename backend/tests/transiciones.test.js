
jest.mock("../services/db", () => ({
  leerJSON: jest.fn(),
  escribirJSON: jest.fn(),
}));

const { leerJSON, escribirJSON } = require("../services/db");

const {
  cambiarEstado,
} = require("../services/reservas.service");

const USUARIO_ID = "usuario-test";
const ADMIN_ID = "admin-test";

const usuario = {
  usuarioId: USUARIO_ID,
  rol: "usuario",
};

const admin = {
  usuarioId: ADMIN_ID,
  rol: "admin",
};

let reservas;
let historial;
let aulas;

function crearReserva(estado = "pendiente") {
  return {
    id: "res-test-1",
    aulaId: "aula-test-1",
    usuarioId: USUARIO_ID,
    fecha: "2026-12-15",
    horaInicio: "10:00",
    horaFin: "12:00",
    cantidadPersonas: 20,
    motivo: "Reserva de prueba",
    estado,
    createdAt: "2026-11-09T10:00:00.000Z",
  };
}

beforeEach(() => {
  reservas = [crearReserva()];
  historial = [];

  aulas = [
    {
      id: "aula-test-1",
      nombre: "Aula de prueba",
      capacidad: 40,
      activa: true,
      recursos: ["proyector"],
    },
  ];

  leerJSON.mockImplementation((archivo) => {
    if (archivo === "reservas.json") return reservas;
    if (archivo === "historial_reservas.json") return historial;
    if (archivo === "aulas.json") return aulas;

    return [];
  });

  escribirJSON.mockImplementation((archivo, datos) => {
    if (archivo === "reservas.json") {
      reservas = datos;
    }

    if (archivo === "historial_reservas.json") {
      historial = datos;
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Transiciones de estado de reservas", () => {

  test("Administrador puede aprobar una reserva pendiente", () => {
    const resultado = cambiarEstado(
      "res-test-1",
      "aprobada",
      admin
    );

    expect(resultado.estado).toBe("aprobada");
    expect(reservas[0].estado).toBe("aprobada");
    expect(historial).toHaveLength(1);
    expect(historial[0].accion).toBe("aprobada");
  });

  test("Administrador puede rechazar una reserva pendiente", () => {
    const resultado = cambiarEstado(
      "res-test-1",
      "rechazada",
      admin
    );

    expect(resultado.estado).toBe("rechazada");
    expect(historial[0].accion).toBe("rechazada");
  });

  test("Usuario puede cancelar su propia reserva pendiente", () => {
    const resultado = cambiarEstado(
      "res-test-1",
      "cancelada",
      usuario
    );

    expect(resultado.estado).toBe("cancelada");
    expect(historial[0].accion).toBe("cancelada");
  });

  test("Usuario puede cancelar su propia reserva aprobada", () => {
    reservas = [crearReserva("aprobada")];

    const resultado = cambiarEstado(
      "res-test-1",
      "cancelada",
      usuario
    );

    expect(resultado.estado).toBe("cancelada");
  });

  test("Usuario normal no puede aprobar una reserva", () => {
    expect(() =>
      cambiarEstado("res-test-1", "aprobada", usuario)
    ).toThrow(/administrador/i);

    expect(reservas[0].estado).toBe("pendiente");
  });

  test("Usuario normal no puede rechazar una reserva", () => {
    expect(() =>
      cambiarEstado("res-test-1", "rechazada", usuario)
    ).toThrow(/administrador/i);

    expect(reservas[0].estado).toBe("pendiente");
  });

  test("No se puede aprobar una reserva rechazada", () => {
    reservas = [crearReserva("rechazada")];

    expect(() =>
      cambiarEstado("res-test-1", "aprobada", admin)
    ).toThrow(/no se puede pasar/i);
  });

  test("No se puede aprobar una reserva cancelada", () => {
    reservas = [crearReserva("cancelada")];

    expect(() =>
      cambiarEstado("res-test-1", "aprobada", admin)
    ).toThrow(/no se puede pasar/i);
  });

  test("No se puede aprobar dos veces la misma reserva", () => {
    reservas = [crearReserva("aprobada")];

    expect(() =>
      cambiarEstado("res-test-1", "aprobada", admin)
    ).toThrow(/no se puede pasar/i);
  });

  test("Una transición inválida no genera historial", () => {
    reservas = [crearReserva("rechazada")];

    expect(() =>
      cambiarEstado("res-test-1", "aprobada", admin)
    ).toThrow();

    expect(historial).toHaveLength(0);
  });

});
