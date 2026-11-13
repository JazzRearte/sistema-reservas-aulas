
const {
  validarDisponibilidad,
} = require("../services/reservas.service");

describe("Reglas de negocio - Reservas de aulas", () => {

  test("Permite una reserva válida", () => {
    const datos = {
      aulaId: "aula-001",
      fecha: "2026-12-10",
      horaInicio: "10:00",
      horaFin: "12:00",
      cantidadPersonas: 20,
      motivo: "Clase de programación",
    };

    expect(() => validarDisponibilidad(datos)).not.toThrow();
  });

  test("Rechaza una reserva que supera la capacidad", () => {
    const datos = {
      aulaId: "aula-001",
      fecha: "2026-12-10",
      horaInicio: "10:00",
      horaFin: "12:00",
      cantidadPersonas: 50,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/máximo 40 personas/i);
  });

  test("Rechaza una reserva en un aula inactiva", () => {
    const datos = {
      aulaId: "aula-005",
      fecha: "2026-12-10",
      horaInicio: "10:00",
      horaFin: "12:00",
      cantidadPersonas: 15,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/no está activa/i);
  });

  test("Rechaza una reserva antes de las 08:00", () => {
    const datos = {
      aulaId: "aula-001",
      fecha: "2026-12-10",
      horaInicio: "07:00",
      horaFin: "09:00",
      cantidadPersonas: 20,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/08:00 y 22:00/i);
  });

  test("Rechaza una reserva después de las 22:00", () => {
    const datos = {
      aulaId: "aula-001",
      fecha: "2026-12-10",
      horaInicio: "21:00",
      horaFin: "23:00",
      cantidadPersonas: 20,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/08:00 y 22:00/i);
  });

  test("Rechaza horarios donde el inicio es posterior al fin", () => {
    const datos = {
      aulaId: "aula-001",
      fecha: "2026-12-10",
      horaInicio: "15:00",
      horaFin: "12:00",
      cantidadPersonas: 20,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/anterior a la hora de fin/i);
  });

  test("Rechaza una reserva superpuesta con otra aprobada", () => {
    const datos = {
      aulaId: "aula-003",
      fecha: "2026-11-12",
      horaInicio: "11:15",
      horaFin: "12:00",
      cantidadPersonas: 20,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/ya tiene una reserva aprobada/i);
  });

  test("Rechaza un aula inexistente", () => {
    const datos = {
      aulaId: "aula-999",
      fecha: "2026-12-10",
      horaInicio: "10:00",
      horaFin: "12:00",
      cantidadPersonas: 20,
    };

    expect(() => validarDisponibilidad(datos))
      .toThrow(/aula no existe/i);
  });

});
