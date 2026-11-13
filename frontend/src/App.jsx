
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ListadoReservas from "./pages/ListadoReservas";
import DetalleReserva from "./pages/DetalleReserva";
import FormularioReserva from "./pages/FormularioReserva";
import Resumen from "./pages/Resumen";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Listado de reservas */}
          <Route
            path="/reservas"
            element={
              <RutaProtegida>
                <ListadoReservas />
              </RutaProtegida>
            }
          />

          {/* Crear una nueva reserva */}
          <Route
            path="/reservas/nueva"
            element={
              <RutaProtegida>
                <FormularioReserva />
              </RutaProtegida>
            }
          />

          {/* Detalle de reserva */}
          <Route
            path="/reservas/:id"
            element={
              <RutaProtegida>
                <DetalleReserva />
              </RutaProtegida>
            }
          />

          {/* Editar reserva */}
          <Route
            path="/reservas/:id/editar"
            element={
              <RutaProtegida>
                <FormularioReserva />
              </RutaProtegida>
            }
          />

          {/* Panel resumen: solo administrador */}
          <Route
            path="/resumen"
            element={
              <RutaProtegida roles={["admin"]}>
                <Resumen />
              </RutaProtegida>
            }
          />

          {/* Redirección inicial */}
          <Route
            path="/"
            element={<Navigate to="/reservas" replace />}
          />

          {/* Página no encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
