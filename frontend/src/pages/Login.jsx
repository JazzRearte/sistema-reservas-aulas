
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { usuario, cargando, iniciarSesion } = useAuth();

  const [error, setError] = useState("");
  const [ingresando, setIngresando] = useState(false);

  async function handleLogin() {
    setError("");
    setIngresando(true);

    try {
      await iniciarSesion();
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("No se pudo conectar con Keycloak.");
      setIngresando(false);
    }
  }

  if (cargando) {
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (usuario) {
    return <Navigate to="/reservas" replace />;
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 32,
        border: "1px solid #ddd",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <h1>Reservas de Aulas</h1>

      <p style={{ color: "#666", marginBottom: 28 }}>
        Sistema de gestión de reservas de aulas
      </p>

      <p>
        Iniciá sesión con tu cuenta de Keycloak
        para acceder al sistema.
      </p>

      {error && (
        <p style={{ color: "red" }} role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleLogin}
        disabled={ingresando}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: ingresando ? "wait" : "pointer",
          fontSize: 16,
        }}
      >
        {ingresando ? "Redirigiendo..." : "Iniciar sesión"}
      </button>
    </div>
  );
}
