
const { leerJSON, escribirJSON } = require("./db");

const ARCHIVO_RESERVAS = "reservas.json";
const ARCHIVO_HISTORIAL = "historial_reservas.json";

const HORA_APERTURA = process.env.HORA_APERTURA || "08:00";
const HORA_CIERRE = process.env.HORA_CIERRE || "22:00";

function errorHTTP(mensaje, status = 400) {
  const error = new Error(mensaje);
  error.status = status;
  throw error;
}

function generarId(registros, prefijo) {
  const numeros = registros
    .map((r) => Number(String(r.id).replace(`${prefijo}-`, "")))
    .filter(Number.isFinite);

  return `${prefijo}-${Math.max(0, ...numeros) + 1}`;
}

function registrarHistorial(
  reservaId,
  usuarioId,
  accion,
  anterior,
  nuevo
) {
  const historial = leerJSON(ARCHIVO_HISTORIAL);

  historial.push({
    id: generarId(historial, "hist"),
    reservaId,
    usuarioId,
    accion,
    fechaHora: new Date().toISOString(),
    valorAnterior: anterior,
    valorNuevo: nuevo,
  });

  escribirJSON(ARCHIVO_HISTORIAL, historial);
}

function validarDisponibilidad(datos, excluirId = null) {
  const {
    aulaId,
    fecha,
    horaInicio,
    horaFin,
    cantidadPersonas,
  } = datos;

  const aulas = leerJSON("aulas.json");
  const aula = aulas.find((a) => a.id === aulaId);

  if (!aula) {
    errorHTTP("El aula no existe", 404);
  }

  if (!aula.activa) {
    errorHTTP("El aula no está activa");
  }

  const cantidad = Number(cantidadPersonas);

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    errorHTTP(
      "La cantidad de personas debe ser un entero positivo"
    );
  }

  if (cantidad > aula.capacidad) {
    errorHTTP(
      `El aula admite como máximo ${aula.capacidad} personas`
    );
  }

  const fechaValida =
    /^\d{4}-\d{2}-\d{2}$/.test(fecha || "");

  const horaValida =
    /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !fechaValida ||
    Number.isNaN(Date.parse(`${fecha}T00:00:00Z`))
  ) {
    errorHTTP(
      "La fecha debe tener formato YYYY-MM-DD"
    );
  }

  if (
    !horaValida.test(horaInicio || "") ||
    !horaValida.test(horaFin || "")
  ) {
    errorHTTP(
      "Las horas deben tener formato HH:mm"
    );
  }

  if (horaInicio >= horaFin) {
    errorHTTP(
      "La hora de inicio debe ser anterior a la hora de fin"
    );
  }

  if (
    horaInicio < HORA_APERTURA ||
    horaFin > HORA_CIERRE
  ) {
    errorHTTP(
      `Las reservas deben estar entre ${HORA_APERTURA} y ${HORA_CIERRE}`
    );
  }

  const reservas = leerJSON(ARCHIVO_RESERVAS);

  const conflicto = reservas.find((r) => {
    if (r.id === excluirId) return false;

    if (
      r.aulaId !== aulaId ||
      r.fecha !== fecha
    ) {
      return false;
    }

    if (
      !["pendiente", "aprobada"].includes(r.estado)
    ) {
      return false;
    }

    return (
      horaInicio < r.horaFin &&
      horaFin > r.horaInicio
    );
  });

  if (conflicto) {
    errorHTTP(
      `El aula ya tiene una reserva ${conflicto.estado} entre ` +
      `${conflicto.horaInicio} y ${conflicto.horaFin}`,
      409
    );
  }

  return aula;
}

function obtenerReserva(id, { usuarioId, rol }) {
  const reserva = leerJSON(ARCHIVO_RESERVAS)
    .find((r) => r.id === id);

  if (!reserva) {
    errorHTTP("Reserva no encontrada", 404);
  }

  if (
    rol !== "admin" &&
    reserva.usuarioId !== usuarioId
  ) {
    errorHTTP(
      "No tenés permisos para ver esta reserva",
      403
    );
  }

  return reserva;
}

function listarReservas(filtros = {}, usuario = {}) {
  let reservas = leerJSON(ARCHIVO_RESERVAS);

  if (usuario.rol !== "admin") {
    reservas = reservas.filter(
      (r) => r.usuarioId === usuario.usuarioId
    );
  }

  const {
    fecha,
    estado,
    aulaId,
    q,
    page,
    limit,
    sortBy,
    order,
  } = filtros;

  if (fecha) {
    reservas = reservas.filter(
      (r) => r.fecha === fecha
    );
  }

  if (estado) {
    reservas = reservas.filter(
      (r) => r.estado === estado
    );
  }

  if (aulaId) {
    reservas = reservas.filter(
      (r) => r.aulaId === aulaId
    );
  }

  if (q) {
    reservas = reservas.filter((r) =>
      r.motivo
        .toLowerCase()
        .includes(String(q).toLowerCase())
    );
  }

  const campos = [
    "id",
    "fecha",
    "horaInicio",
    "estado",
    "createdAt",
  ];

  const campo = campos.includes(sortBy)
    ? sortBy
    : "fecha";

  const direccion = order === "desc" ? -1 : 1;

  reservas.sort((a, b) => {
    return (
      String(a[campo] ?? "").localeCompare(
        String(b[campo] ?? "")
      ) * direccion
    );
  });

  const pagina = Math.max(
    1,
    parseInt(page, 10) || 1
  );

  const porPagina = Math.min(
    100,
    Math.max(1, parseInt(limit, 10) || 10)
  );

  const total = reservas.length;

  return {
    datos: reservas.slice(
      (pagina - 1) * porPagina,
      pagina * porPagina
    ),
    paginacion: {
      total,
      page: pagina,
      limit: porPagina,
      totalPaginas: Math.ceil(total / porPagina),
    },
  };
}

function crearReserva(datos, { usuarioId }) {
  if (!usuarioId) {
    errorHTTP("Usuario no autenticado", 401);
  }

  const {
    aulaId,
    fecha,
    horaInicio,
    horaFin,
    cantidadPersonas,
    motivo,
  } = datos;

  if (
    !aulaId ||
    !fecha ||
    !horaInicio ||
    !horaFin ||
    typeof motivo !== "string" ||
    !motivo.trim()
  ) {
    errorHTTP(
      "Faltan campos obligatorios de la reserva"
    );
  }

  validarDisponibilidad(datos);

  const reservas = leerJSON(ARCHIVO_RESERVAS);

  const nueva = {
    id: generarId(reservas, "res"),
    aulaId,
    usuarioId,
    fecha,
    horaInicio,
    horaFin,
    cantidadPersonas: Number(cantidadPersonas),
    motivo: motivo.trim(),
    estado: "pendiente",
    createdAt: new Date().toISOString(),
  };

  reservas.push(nueva);

  escribirJSON(ARCHIVO_RESERVAS, reservas);

  registrarHistorial(
    nueva.id,
    usuarioId,
    "creacion",
    null,
    nueva
  );

  return nueva;
}

function editarReserva(id, cambios, usuario) {
  const reservas = leerJSON(ARCHIVO_RESERVAS);
  const actual = obtenerReserva(id, usuario);

  const esAdmin = usuario.rol === "admin";

  // El usuario común solo puede editar
  // sus propias reservas pendientes.
  // El administrador puede editar cualquier reserva.
  if (
    !esAdmin &&
    actual.estado !== "pendiente"
  ) {
    errorHTTP(
      "Solo se pueden editar reservas pendientes",
      403
    );
  }

  // Solo se permite modificar los campos
  // correspondientes a los datos de la reserva.
  // El estado se modifica mediante rutas específicas.
  const camposPermitidos = [
    "aulaId",
    "fecha",
    "horaInicio",
    "horaFin",
    "cantidadPersonas",
    "motivo",
  ];

  const actualizada = { ...actual };

  for (const campo of camposPermitidos) {
    if (
      Object.prototype.hasOwnProperty.call(
        cambios,
        campo
      )
    ) {
      actualizada[campo] = cambios[campo];
    }
  }

  if (
    typeof actualizada.motivo !== "string" ||
    !actualizada.motivo.trim()
  ) {
    errorHTTP("El motivo es obligatorio");
  }

  // Se validan las reglas de negocio,
  // excluyendo la propia reserva al buscar conflictos.
  validarDisponibilidad(actualizada, id);

  actualizada.cantidadPersonas = Number(
    actualizada.cantidadPersonas
  );

  actualizada.motivo =
    actualizada.motivo.trim();

  const indice = reservas.findIndex(
    (r) => r.id === id
  );

  reservas[indice] = actualizada;

  escribirJSON(
    ARCHIVO_RESERVAS,
    reservas
  );

  // Guardamos los cambios en el historial.
  registrarHistorial(
    id,
    usuario.usuarioId,
    "edicion",
    actual,
    actualizada
  );

  return actualizada;
}

function cambiarEstado(id, nuevoEstado, usuario) {
  const reservas = leerJSON(ARCHIVO_RESERVAS);
  const actual = obtenerReserva(id, usuario);

  const transiciones = {
    pendiente: [
      "aprobada",
      "rechazada",
      "cancelada",
    ],
    aprobada: ["cancelada"],
    rechazada: [],
    cancelada: [],
  };

  if (
    !transiciones[actual.estado]?.includes(
      nuevoEstado
    )
  ) {
    errorHTTP(
      `No se puede pasar de ${actual.estado} a ${nuevoEstado}`
    );
  }

  if (
    ["aprobada", "rechazada"].includes(
      nuevoEstado
    ) &&
    usuario.rol !== "admin"
  ) {
    errorHTTP(
      "Esta acción requiere rol administrador",
      403
    );
  }

  if (nuevoEstado === "aprobada") {
    validarDisponibilidad(actual, id);
  }

  const actualizada = {
    ...actual,
    estado: nuevoEstado,
  };

  const indice = reservas.findIndex(
    (r) => r.id === id
  );

  reservas[indice] = actualizada;

  escribirJSON(
    ARCHIVO_RESERVAS,
    reservas
  );

  registrarHistorial(
    id,
    usuario.usuarioId,
    nuevoEstado,
    { estado: actual.estado },
    { estado: nuevoEstado }
  );

  return actualizada;
}

function obtenerHistorial(id, usuario) {
  obtenerReserva(id, usuario);

  return leerJSON(ARCHIVO_HISTORIAL)
    .filter((h) => h.reservaId === id);
}

module.exports = {
  listarReservas,
  obtenerReserva,
  crearReserva,
  editarReserva,
  cambiarEstado,
  obtenerHistorial,
  validarDisponibilidad,
};
