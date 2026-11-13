
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({
  children,
  roles = [],
}) {
  const { usuario, cargando } = useAuth();

  // Esperar a que Keycloak compruebe la sesión
  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  // Si no inició sesión, enviarlo al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si no tiene el rol necesario, impedir el acceso
  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/reservas" replace />;
  }

  // Usuario autenticado y autorizado
  return children;
}
