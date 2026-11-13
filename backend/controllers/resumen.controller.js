
const resumenService = require("../services/resumen.service");

function obtenerResumen(req, res, next) {
  try {
    const resumen = resumenService.obtenerResumen();

    return res.status(200).json(resumen);
  } catch (error) {
    next(error);
  }
}

module.exports = { obtenerResumen };
