
const reservasService = require("../services/reservas.service");

function obtenerUsuario(req) {
  return {
    usuarioId: req.usuario.id,
    rol: req.usuario.rol,
  };
}

function listar(req, res, next) {
  try {
    const resultado = reservasService.listarReservas(
      req.query,
      obtenerUsuario(req)
    );

    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

function detalle(req, res, next) {
  try {
    const reserva = reservasService.obtenerReserva(
      req.params.id,
      obtenerUsuario(req)
    );

    return res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

function historial(req, res, next) {
  try {
    const resultado = reservasService.obtenerHistorial(
      req.params.id,
      obtenerUsuario(req)
    );

    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

function crear(req, res, next) {
  try {
    const nuevaReserva = reservasService.crearReserva(
      req.body,
      obtenerUsuario(req)
    );

    return res.status(201).json(nuevaReserva);
  } catch (error) {
    next(error);
  }
}

function editar(req, res, next) {
  try {
    const reserva = reservasService.editarReserva(
      req.params.id,
      req.body,
      obtenerUsuario(req)
    );

    return res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

function cancelar(req, res, next) {
  try {
    const reserva = reservasService.cambiarEstado(
      req.params.id,
      "cancelada",
      obtenerUsuario(req)
    );

    return res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

function aprobar(req, res, next) {
  try {
    const reserva = reservasService.cambiarEstado(
      req.params.id,
      "aprobada",
      obtenerUsuario(req)
    );

    return res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

function rechazar(req, res, next) {
  try {
    const reserva = reservasService.cambiarEstado(
      req.params.id,
      "rechazada",
      obtenerUsuario(req)
    );

    return res.status(200).json(reserva);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  detalle,
  historial,
  crear,
  editar,
  cancelar,
  aprobar,
  rechazar,
};
