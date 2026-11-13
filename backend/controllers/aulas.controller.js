
const aulasService = require("../services/aulas.service");

function listarAulas(req, res, next) {
  try {
    const aulas = aulasService.listarAulas(req.query);
    res.status(200).json(aulas);
  } catch (error) {
    next(error);
  }
}

function obtenerAulaPorId(req, res, next) {
  try {
    const aula = aulasService.obtenerAulaPorId(req.params.id);
    res.status(200).json(aula);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarAulas,
  obtenerAulaPorId,
};
