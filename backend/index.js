
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const aulasRoutes = require("./routes/aulas.routes");
const reservasRoutes = require("./routes/reservas.routes");

const manejarErrores = require("./middlewares/manejarErrores");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas del sistema de reservas de aulas
app.use("/api/auth", authRoutes);
app.use("/api/aulas", aulasRoutes);
app.use("/api/reservas", reservasRoutes);

// Verificar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.status(200).json({ estado: "ok" });
});

// Manejo centralizado de errores
app.use(manejarErrores);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
