
const express = require("express");
const router = express.Router();

const aulasController = require("../controllers/aulas.controller");

router.get("/", aulasController.listarAulas);
router.get("/:id", aulasController.obtenerAulaPorId);

module.exports = router;
