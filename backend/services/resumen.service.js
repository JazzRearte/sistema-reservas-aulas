
const { leerJSON } = require("./db");

function obtenerResumen() {
  const aulas = leerJSON("aulas.json");
  const reservas = leerJSON("reservas.json");

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Cordoba",
  });

  const porEstado = {
    pendiente: 0,
    aprobada: 0,
    rechazada: 0,
    cancelada: 0,
  };

  reservas.forEach((reserva) => {
    if (Object.hasOwn(porEstado, reserva.estado)) {
      porEstado[reserva.estado]++;
    }
  });

  const aulasMasUtilizadas = aulas.map((aula) => {
    const reservasDelAula = reservas.filter(
      (reserva) =>
        reserva.aulaId === aula.id &&
        ["pendiente", "aprobada"].includes(reserva.estado)
    );

    const minutosReservados = reservasDelAula.reduce(
      (total, reserva) => {
        const [hi, mi] = reserva.horaInicio.split(":").map(Number);
        const [hf, mf] = reserva.horaFin.split(":").map(Number);

        return total + (hf * 60 + mf) - (hi * 60 + mi);
      },
      0
    );

    return {
      aulaId: aula.id,
      nombre: aula.nombre,
      capacidad: aula.capacidad,
      cantidadReservas: reservasDelAula.length,
      horasReservadas: Number((minutosReservados / 60).toFixed(2)),
    };
  });

  aulasMasUtilizadas.sort(
    (a, b) => b.cantidadReservas - a.cantidadReservas
  );

  const reservasDeHoy = reservas
    .filter(
      (reserva) =>
        reserva.fecha === hoy &&
        ["pendiente", "aprobada"].includes(reserva.estado)
    )
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return {
    totalAulas: aulas.length,
    aulasActivas: aulas.filter((aula) => aula.activa).length,
    totalReservas: reservas.length,
    reservasPorEstado: porEstado,
    aulasMasUtilizadas,
    reservasDeHoy,
  };
}

module.exports = { obtenerResumen };
