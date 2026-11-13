
const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/reservas.controller");
const resumenCtrl = require("../controllers/resumen.controller");

const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

router.use(autenticar);

// Estadísticas exclusivas del administrador
// Debe estar antes de /:id
router.get(
  "/resumen",
  autorizar("admin"),
  resumenCtrl.obtenerResumen
);

// Consultas
router.get("/", ctrl.listar);
router.get("/:id/historial", ctrl.historial);
router.get("/:id", ctrl.detalle);

// Crear y editar
router.post("/", ctrl.crear);
router.put("/:id", ctrl.editar);

// Cambios de estado
router.patch("/:id/cancelar", ctrl.cancelar);

router.patch(
  "/:id/aprobar",
  autorizar("admin"),
  ctrl.aprobar
);

router.patch(
  "/:id/rechazar",
  autorizar("admin"),
  ctrl.rechazar
);

module.exports = router;
