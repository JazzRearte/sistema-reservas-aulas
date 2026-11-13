
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getReservas } from "../api/reservasService";
import { getAulas } from "../api/aulasService";
import { useAuth } from "../context/AuthContext";

const filtrosIniciales = {
  fecha: "",
  estado: "",
  aulaId: "",
  q: "",
  page: 1,
  limit: 10,
  sortBy: "fecha",
  order: "desc",
};

export default function ListadoReservas() {
  const { usuario, cerrarSesion } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [paginacion, setPaginacion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [filtros, setFiltros] = useState(filtrosIniciales);

  const esAdmin = usuario?.rol === "admin";

  // Cargar las aulas para el filtro
  useEffect(() => {
    async function cargarAulas() {
      try {
        const respuesta = await getAulas();
        setAulas(respuesta.data);
      } catch (err) {
        console.error("Error al cargar aulas:", err);
      }
    }

    cargarAulas();
  }, []);

  // Cargar las reservas al cambiar los filtros
  useEffect(() => {
    let activo = true;

    async function cargarReservas() {
      setCargando(true);
      setError("");

      try {
        const params = Object.fromEntries(
          Object.entries(filtros).filter(
            ([, valor]) => valor !== ""
          )
        );

        const respuesta = await getReservas(params);

        if (activo) {
          setReservas(respuesta.data.datos);
          setPaginacion(respuesta.data.paginacion);
        }
      } catch (err) {
        if (activo) {
          setReservas([]);
          setPaginacion({});

          const mensaje =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "No se pudieron cargar las reservas";

          setError(mensaje);

          console.error("Error al cargar reservas:", err);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarReservas();

    return () => {
      activo = false;
    };
  }, [filtros]);

  function handleFiltro(e) {
    const { name, value } = e.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value,
      page: 1,
    }));
  }

  function handlePagina(pagina) {
    setFiltros((anteriores) => ({
      ...anteriores,
      page: pagina,
    }));
  }

  function nombreAula(aulaId) {
    const aula = aulas.find((a) => a.id === aulaId);
    return aula ? aula.nombre : aulaId;
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 24,
      }}
    >
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h2>Reservas de Aulas</h2>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {esAdmin && (
            <Link to="/resumen">
              <button>Panel resumen</button>
            </Link>
          )}

          <Link to="/reservas/nueva">
            <button>Nueva reserva</button>
          </Link>

          <button onClick={() => cerrarSesion()}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <p style={{ color: "#666", marginBottom: 20 }}>
        Usuario: <strong>{usuario?.nombre}</strong>
        {" — "}
        Rol: <strong>{usuario?.rol}</strong>
      </p>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleFiltro}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <select
          name="aulaId"
          value={filtros.aulaId}
          onChange={handleFiltro}
        >
          <option value="">Todas las aulas</option>

          {aulas.map((aula) => (
            <option key={aula.id} value={aula.id}>
              {aula.nombre}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="fecha"
          value={filtros.fecha}
          onChange={handleFiltro}
          aria-label="Filtrar por fecha"
        />

        <input
          type="text"
          name="q"
          placeholder="Buscar por motivo..."
          value={filtros.q}
          onChange={handleFiltro}
        />

        <select
          name="sortBy"
          value={filtros.sortBy}
          onChange={handleFiltro}
        >
          <option value="fecha">Ordenar por fecha</option>
          <option value="horaInicio">Ordenar por horario</option>
          <option value="estado">Ordenar por estado</option>
          <option value="createdAt">Ordenar por creación</option>
        </select>

        <select
          name="order"
          value={filtros.order}
          onChange={handleFiltro}
        >
          <option value="desc">Descendente</option>
          <option value="asc">Ascendente</option>
        </select>

        <button
          onClick={() => setFiltros({ ...filtrosIniciales })}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Estados de carga y error */}
      {cargando && <p>Cargando reservas...</p>}

      {error && (
        <p style={{ color: "red" }} role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && reservas.length === 0 && (
        <p style={{ color: "#666" }}>
          No hay reservas que coincidan con los filtros.
        </p>
      )}

      {/* Tabla */}
      {!cargando && !error && reservas.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={th}>ID</th>
                <th style={th}>Aula</th>
                <th style={th}>Fecha</th>
                <th style={th}>Inicio</th>
                <th style={th}>Fin</th>
                <th style={th}>Personas</th>
                <th style={th}>Motivo</th>
                <th style={th}>Estado</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reservas.map((reserva) => (
                <tr
                  key={reserva.id}
                  style={{
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  <td style={td}>{reserva.id}</td>

                  <td style={td}>
                    {nombreAula(reserva.aulaId)}
                  </td>

                  <td style={td}>{reserva.fecha}</td>
                  <td style={td}>{reserva.horaInicio}</td>
                  <td style={td}>{reserva.horaFin}</td>
                  <td style={td}>{reserva.cantidadPersonas}</td>
                  <td style={td}>{reserva.motivo}</td>

                  <td style={td}>
                    <span
                      style={{
                        ...badge,
                        backgroundColor:
                          coloresEstado[reserva.estado] ||
                          "#6b7280",
                      }}
                    >
                      {reserva.estado}
                    </span>
                  </td>

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

      {/* Paginación */}
      {!cargando && !error && paginacion.totalPaginas > 1 && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            disabled={filtros.page <= 1}
            onClick={() => handlePagina(filtros.page - 1)}
          >
            Anterior
          </button>

          <span>
            Página {paginacion.page} de{" "}
            {paginacion.totalPaginas}
          </span>

          <button
            disabled={
              filtros.page >= paginacion.totalPaginas
            }
            onClick={() => handlePagina(filtros.page + 1)}
          >
            Siguiente
          </button>
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
};

const badge = {
  padding: "4px 8px",
  borderRadius: 5,
  color: "white",
  fontSize: 12,
};

const coloresEstado = {
  pendiente: "#f59e0b",
  aprobada: "#10b981",
  rechazada: "#ef4444",
  cancelada: "#6b7280",
};
