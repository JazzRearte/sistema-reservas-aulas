
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getResumenReservas } from "../api/reservasService";
import { getAulas } from "../api/aulasService";

export default function Resumen() {
  const [datos, setDatos] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const [resResumen, resAulas] = await Promise.all([
        getResumenReservas(),
        getAulas(),
      ]);

      setDatos(resResumen.data);
      setAulas(resAulas.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al cargar el resumen"
      );
    } finally {
      setCargando(false);
    }
  }

  function obtenerNombreAula(aulaId) {
    const aula = aulas.find((a) => a.id === aulaId);
    return aula ? aula.nombre : aulaId;
  }

  if (cargando) {
    return <p style={{ padding: 24 }}>Cargando resumen...</p>;
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/reservas">← Volver al listado</Link>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={cargar}>Reintentar</button>
      </div>
    );
  }

  if (!datos) return null;

  const estados = datos.reservasPorEstado || {};

  const tarjetas = [
    {
      label: "Total de aulas",
      valor: datos.totalAulas ?? 0,
      color: "#2563eb",
    },
    {
      label: "Aulas activas",
      valor: datos.aulasActivas ?? 0,
      color: "#059669",
    },
    {
      label: "Total de reservas",
      valor: datos.totalReservas ?? 0,
      color: "#7c3aed",
    },
    {
      label: "Pendientes",
      valor: estados.pendiente ?? 0,
      color: "#d97706",
    },
    {
      label: "Aprobadas",
      valor: estados.aprobada ?? 0,
      color: "#059669",
    },
    {
      label: "Rechazadas",
      valor: estados.rechazada ?? 0,
      color: "#dc2626",
    },
    {
      label: "Canceladas",
      valor: estados.cancelada ?? 0,
      color: "#64748b",
    },
  ];

  const aulasMasUtilizadas = Array.isArray(datos.aulasMasUtilizadas)
    ? datos.aulasMasUtilizadas
    : [];

  const reservasDeHoy = Array.isArray(datos.reservasDeHoy)
    ? datos.reservasDeHoy
    : [];

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <Link to="/reservas">← Volver al listado</Link>

      <h2 style={{ marginTop: 16 }}>
        Panel de administración
      </h2>

      <p style={{ color: "#666" }}>
        Resumen general del sistema de reservas de aulas.
      </p>

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          marginTop: 24,
        }}
      >
        {tarjetas.map(({ label, valor, color }) => (
          <div
            key={label}
            style={{
              backgroundColor: color,
              color: "white",
              borderRadius: 8,
              padding: "18px 24px",
              minWidth: 150,
              flex: "1 1 150px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
              }}
            >
              {valor}
            </div>

            <div
              style={{
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Aulas más utilizadas */}
      <h3 style={{ marginTop: 32 }}>
        Aulas más utilizadas
      </h3>

      {aulasMasUtilizadas.length === 0 ? (
        <p style={{ color: "#666" }}>
          Todavía no hay aulas con reservas registradas.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={estiloTabla}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={th}>Aula</th>
                <th style={th}>Cantidad de reservas</th>
              </tr>
            </thead>

            <tbody>
              {aulasMasUtilizadas.map((item, index) => (
                <tr
                  key={item.aulaId ?? index}
                  style={estiloFila}
                >
                  <td style={td}>
                    {obtenerNombreAula(item.aulaId)}
                  </td>
                  <td style={td}>
                    {item.cantidadReservas ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reservas del día */}
      <h3 style={{ marginTop: 32 }}>
        Reservas del día
      </h3>

      {reservasDeHoy.length === 0 ? (
        <p style={{ color: "#666" }}>
          No hay reservas programadas para hoy.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={estiloTabla}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={th}>Aula</th>
                <th style={th}>Fecha</th>
                <th style={th}>Inicio</th>
                <th style={th}>Fin</th>
                <th style={th}>Estado</th>
                <th style={th}>Acción</th>
              </tr>
            </thead>

            <tbody>
              {reservasDeHoy.map((reserva) => (
                <tr key={reserva.id} style={estiloFila}>
                  <td style={td}>
                    {obtenerNombreAula(reserva.aulaId)}
                  </td>
                  <td style={td}>{reserva.fecha}</td>
                  <td style={td}>{reserva.horaInicio}</td>
                  <td style={td}>{reserva.horaFin}</td>
                  <td style={td}>{reserva.estado}</td>
                  <td style={td}>
                    <Link to={`/reservas/${reserva.id}`}>
                      <button>Ver</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={cargar}>
          Actualizar estadísticas
        </button>
      </div>
    </div>
  );
}

const estiloTabla = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 8,
};

const estiloFila = {
  borderBottom: "1px solid #eee",
};

const th = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: "bold",
};

const td = {
  padding: "10px 12px",
};
