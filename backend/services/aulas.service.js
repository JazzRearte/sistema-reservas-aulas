
const { leerJSON } = require("./db");

// Obtener todas las aulas, con filtros opcionales
function listarAulas({ activa, capacidadMinima } = {}) {
  let aulas = leerJSON("aulas.json");

  if (activa !== undefined) {
    const valor = activa === true || activa === "true";
    aulas = aulas.filter((aula) => aula.activa === valor);
  }

  if (capacidadMinima !== undefined) {
    const capacidad = Number(capacidadMinima);

    if (!Number.isFinite(capacidad) || capacidad < 0) {
      const error = new Error("Capacidad mínima inválida");
      error.status = 400;
      throw error;
    }

    aulas = aulas.filter((aula) => aula.capacidad >= capacidad);
  }

  return aulas;
}

// Obtener una única aula por su ID
function obtenerAulaPorId(id) {
  const aulas = leerJSON("aulas.json");

  const aula = aulas.find((a) => String(a.id) === String(id));

  if (!aula) {
    const error = new Error("Aula no encontrada");
    error.status = 404;
    throw error;
  }

  return aula;
}

module.exports = {
  listarAulas,
  obtenerAulaPorId,
};
