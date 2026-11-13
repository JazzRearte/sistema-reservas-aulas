

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const {
    usuario,
    cargando,
    registrarse,
  } = useAuth();

  if (cargando) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: 80,
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  if (usuario) {
    return <Navigate to="/reservas" replace />;
  }

  async function handleRegistro() {
    try {
      await registrarse();
    } catch (error) {
      console.error(
        "Error al abrir el registro de Keycloak:",
        error
      );
      alert(
        "No se pudo abrir el formulario de registro. Intentá nuevamente."
      );
    }
  }

  return (
    <div
      style={{
        maxWidth: 450,
        margin: "80px auto",
        padding: 24,
        textAlign: "center",
        border: "1px solid #ddd",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h2>Crear una cuenta</h2>

      <p
        style={{
          color: "#666",
          marginTop: 16,
          lineHeight: 1.6,
        }}
      >
        Registrate en el Sistema de Reservas de Aulas
        para solicitar aulas y consultar tus reservas.
      </p>

      <p
        style={{
          color: "#666",
          marginTop: 12,
          lineHeight: 1.6,
        }}
      >
        Al continuar, se abrirá el formulario seguro
        de registro de Keycloak.
      </p>

      <button
        type="button"
        onClick={handleRegistro}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 24,
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        Crear cuenta
      </button>

      <p style={{ marginTop: 24 }}>
        ¿Ya tenés una cuenta?{" "}
        <Link to="/login">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
