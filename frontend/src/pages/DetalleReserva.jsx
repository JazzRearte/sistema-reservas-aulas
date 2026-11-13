

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAulas } from "../api/aulasService";

import {
  getReservaPorId,
  getHistorialReserva,
  cancelarReserva,
  aprobarReserva,
  rechazarReserva,
} from "../api/reservasService";

export default function DetalleReserva() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [reserva, setReserva] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [aulas, setAulas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [accionError, setAccionError] = useState("");
  const [accionExito, setAccionExito] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargando(true);
      setError("");

      try {
        const [resReserva, resHistorial, resAulas] =
          await Promise.all([
            getReservaPorId(id),
            getHistorialReserva(id),
            getAulas(),
          ]);

        if (!activo) return;

        setReserva(resReserva.data);
        setHistorial(resHistorial.data);
        setAulas(resAulas.data);
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Error al cargar el detalle de la reserva"
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [id]);

  async function actualizarDatos() {
    const [resReserva, resHistorial] = await Promise.all([
      getReservaPorId(id),
      getHistorialReserva(id),
    ]);

    setReserva(resReserva.data);
    setHistorial(resHistorial.data);
  }

  async function ejecutarAccion(
    accionFn,
    mensaje,
    confirmar = false
  ) {
    if (procesando) return;

    if (
      confirmar &&
      !window.confirm("¿Confirmás esta acción?")
    ) {
      return;
    }

    setProcesando(true);
    setAccionError("");
    setAccionExito("");

    try {
      await accionFn(id);
      await actualizarDatos();
      setAccionExito(mensaje);
    } catch (err) {
      setAccionError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Error al ejecutar la acción"
      );
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <p style={{ padding: 24 }}>
        Cargando reserva...
      </p>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/reservas">
          ← Volver al listado
        </Link>

        <p style={{ color: "red" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!reserva) {
    return (
      <p style={{ padding: 24 }}>
        Reserva no encontrada.
      </p>
    );
  }

  // PERMISOS SEGÚN ROL Y PROPIEDAD

  const esAdmin = usuario?.rol === "admin";

  const esPropietario =
    reserva.usuarioId ===
    (usuario?.usuarioId ?? usuario?.id);

  const puedeGestionar =
    esAdmin || esPropietario;

  // El administrador puede editar cualquier reserva.
  // El usuario común solo puede editar la suya
  // cuando está pendiente.
  const puedeEditar =
    esAdmin ||
    (esPropietario && reserva.estado === "pendiente");

  // Solo se pueden cancelar reservas
  // pendientes o aprobadas.
  const puedeCancelar =
    puedeGestionar &&
    ["pendiente", "aprobada"].includes(
      reserva.estado
    );

  // Aprobar y rechazar es exclusivo del administrador.
  const puedeAprobarORechazar =
    esAdmin &&
    reserva.estado === "pendiente";

  const aula = aulas.find(
    (a) => a.id === reserva.aulaId
  );

  const nombreAula = aula
    ? `${aula.nombre} — ${aula.ubicacion}`
    : reserva.aulaId;

  function mostrarValor(valor) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "—";
    }

    if (typeof valor === "object") {
      return JSON.stringify(valor, null, 2);
    }

    return String(valor);
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <Link to="/reservas">
        ← Volver al listado
      </Link>

      <h2 style={{ marginTop: 16 }}>
        Detalle de reserva
      </h2>

      {/* DATOS DE LA RESERVA */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
        }}
      >
        <tbody>
          {[
            ["ID", reserva.id],
            ["Aula", nombreAula],
            ["Solicitante", reserva.usuarioId],
            ["Fecha", reserva.fecha],
            ["Hora de inicio", reserva.horaInicio],
            ["Hora de finalización", reserva.horaFin],
            [
              "Cantidad de personas",
              reserva.cantidadPersonas,
            ],
            ["Motivo", reserva.motivo],
            ["Estado", reserva.estado],
            [
              "Fecha de creación",
              reserva.createdAt
                ? new Date(
                    reserva.createdAt
                  ).toLocaleString("es-AR")
                : "—",
            ],
          ].map(([etiqueta, valor]) => (
            <tr
              key={etiqueta}
              style={{
                borderBottom: "1px solid #eee",
              }}
            >
              <td
                style={{
                  padding: "10px 12px",
                  fontWeight: "bold",
                  width: 200,
                }}
              >
                {etiqueta}
              </td>

              <td
                style={{
                  padding: "10px 12px",
                }}
              >
                {valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MENSAJES DE LAS ACCIONES */}

      {accionError && (
        <p
          style={{
            color: "red",
            marginTop: 16,
          }}
          role="alert"
        >
          {accionError}
        </p>
      )}

      {accionExito && (
        <p
          style={{
            color: "green",
            marginTop: 16,
          }}
          role="status"
        >
          {accionExito}
        </p>
      )}

      {/* BOTONES SEGÚN ROL Y ESTADO */}

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {puedeEditar && (
          <Link to={`/reservas/${id}/editar`}>
            <button disabled={procesando}>
              Editar
            </button>
          </Link>
        )}

        {puedeCancelar && (
          <button
            disabled={procesando}
            onClick={() =>
              ejecutarAccion(
                cancelarReserva,
                "Reserva cancelada correctamente",
                true
              )
            }
            style={{
              backgroundColor: "#6b7280",
              color: "white",
            }}
          >
            Cancelar reserva
          </button>
        )}

        {puedeAprobarORechazar && (
          <>
            <button
              disabled={procesando}
              onClick={() =>
                ejecutarAccion(
                  aprobarReserva,
                  "Reserva aprobada correctamente"
                )
              }
              style={{
                backgroundColor: "#10b981",
                color: "white",
              }}
            >
              Aprobar
            </button>

            <button
              disabled={procesando}
              onClick={() =>
                ejecutarAccion(
                  rechazarReserva,
                  "Reserva rechazada correctamente",
                  true
                )
              }
              style={{
                backgroundColor: "#ef4444",
                color: "white",
              }}
            >
              Rechazar
            </button>
          </>
        )}
      </div>

      {/* HISTORIAL DE CAMBIOS */}

      <h3 style={{ marginTop: 32 }}>
        Historial de cambios
      </h3>

      {historial.length === 0 ? (
        <p style={{ color: "#666" }}>
          Sin historial registrado.
        </p>
      ) : (
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 8,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f0f0f0",
                }}
              >
                <th style={th}>Fecha</th>
                <th style={th}>Usuario</th>
                <th style={th}>Acción</th>
                <th style={th}>Antes</th>
                <th style={th}>Después</th>
              </tr>
            </thead>

            <tbody>
              {historial.map((h) => (
                <tr
                  key={h.id}
                  style={{
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <td style={td}>
                    {new Date(
                      h.fechaHora
                    ).toLocaleString("es-AR")}
                  </td>

                  <td style={td}>
                    {h.usuarioId}
                  </td>

                  <td style={td}>
                    {h.accion}
                  </td>

                  <td style={td}>
                    <pre
                      style={estiloHistorial}
                    >
                      {mostrarValor(
                        h.valorAnterior
                      )}
                    </pre>
                  </td>

                  <td style={td}>
                    <pre
                      style={estiloHistorial}
                    >
                      {mostrarValor(
                        h.valorNuevo
                      )}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: "bold",
};

const td = {
  padding: "10px 12px",
  verticalAlign: "top",
};

const estiloHistorial = {
  margin: 0,
  fontSize: 12,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};
