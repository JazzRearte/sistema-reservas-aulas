

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAulas } from "../api/aulasService";

import {
  getReservaPorId,
  crearReserva,
  editarReserva,
} from "../api/reservasService";

const formularioInicial = {
  aulaId: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  cantidadPersonas: "",
  motivo: "",
};

const estiloCampo = {
  width: "100%",
  padding: 9,
  boxSizing: "border-box",
};

const estiloError = {
  color: "red",
  fontSize: 13,
  margin: "4px 0 0",
};

export default function FormularioReserva() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [aulas, setAulas] = useState([]);
  const [form, setForm] = useState({ ...formularioInicial });

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [erroresForm, setErroresForm] = useState({});
  const [puedeEditar, setPuedeEditar] = useState(!esEdicion);

  const esAdmin = usuario?.rol === "admin";

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargandoDatos(true);
      setError("");
      setErroresForm({});
      setPuedeEditar(!esEdicion);

      try {
        const respuestaAulas = await getAulas();

        if (!activo) return;

        setAulas(respuestaAulas.data);

        if (esEdicion) {
          const respuestaReserva = await getReservaPorId(id);

          if (!activo) return;

          const reserva = respuestaReserva.data;

          const esPropietario =
            reserva.usuarioId ===
            (usuario?.usuarioId ?? usuario?.id);

          const tienePermiso =
            esAdmin ||
            (esPropietario && reserva.estado === "pendiente");

          if (!tienePermiso) {
            setError(
              "No tenés permisos para editar esta reserva"
            );
            setPuedeEditar(false);
            return;
          }

          setForm({
            aulaId: reserva.aulaId,
            fecha: reserva.fecha,
            horaInicio: reserva.horaInicio,
            horaFin: reserva.horaFin,
            cantidadPersonas: String(reserva.cantidadPersonas),
            motivo: reserva.motivo,
          });

          setPuedeEditar(true);
        } else {
          setForm({ ...formularioInicial });
          setPuedeEditar(true);
        }
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "No se pudieron cargar los datos del formulario"
          );

          setPuedeEditar(false);
        }
      } finally {
        if (activo) {
          setCargandoDatos(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [id, esEdicion, esAdmin, usuario?.id, usuario?.usuarioId]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresForm((anterior) => ({
      ...anterior,
      [name]: "",
    }));

    setError("");
  }

  function validarFormulario() {
    const errores = {};

    if (!form.aulaId) {
      errores.aulaId = "Seleccioná un aula";
    }

    if (!form.fecha) {
      errores.fecha = "Ingresá la fecha";
    }

    if (!form.horaInicio) {
      errores.horaInicio = "Ingresá la hora de inicio";
    }

    if (!form.horaFin) {
      errores.horaFin = "Ingresá la hora de finalización";
    }

    if (
      form.horaInicio &&
      form.horaFin &&
      form.horaInicio >= form.horaFin
    ) {
      errores.horaFin =
        "La hora de finalización debe ser posterior al inicio";
    }

    if (
      form.horaInicio &&
      form.horaFin &&
      (form.horaInicio < "08:00" || form.horaFin > "22:00")
    ) {
      errores.horaFin =
        "El horario permitido es de 08:00 a 22:00";
    }

    const cantidad = Number(form.cantidadPersonas);

    if (
      !form.cantidadPersonas ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      errores.cantidadPersonas =
        "Ingresá una cantidad válida de personas";
    }

    const aula = aulas.find(
      (a) => a.id === form.aulaId
    );

    if (aula && !aula.activa) {
      errores.aulaId =
        "El aula seleccionada está inactiva";
    }

    if (aula && cantidad > aula.capacidad) {
      errores.cantidadPersonas =
        `El aula tiene capacidad para ${aula.capacidad} personas`;
    }

    if (!form.motivo.trim()) {
      errores.motivo =
        "Ingresá el motivo de la reserva";
    }

    return errores;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (guardando || !puedeEditar) return;

    setError("");
    setExito("");

    const errores = validarFormulario();
    setErroresForm(errores);

    if (Object.keys(errores).length > 0) {
      return;
    }

    const datos = {
      aulaId: form.aulaId,
      fecha: form.fecha,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      cantidadPersonas: Number(form.cantidadPersonas),
      motivo: form.motivo.trim(),
    };

    setGuardando(true);

    try {
      if (esEdicion) {
        await editarReserva(id, datos);
        setExito("Reserva actualizada correctamente");
      } else {
        await crearReserva(datos);
        setExito("Reserva creada correctamente");
      }

      navigate("/reservas", {
        replace: true,
        state: {
          mensaje: esEdicion
            ? "Reserva actualizada correctamente"
            : "Reserva creada correctamente",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo guardar la reserva"
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoDatos) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 550,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <Link to="/reservas">
        ← Volver al listado
      </Link>

      <h2 style={{ marginTop: 18 }}>
        {esEdicion ? "Editar reserva" : "Nueva reserva"}
      </h2>

      <p style={{ color: "#666" }}>
        {esEdicion
          ? "Modificá los datos de la reserva. El estado se mantiene sin cambios."
          : "Completá los datos para reservar un aula."}
        {" "}El horario permitido es de 08:00 a 22:00.
      </p>

      {error && (
        <p style={{ color: "red" }} role="alert">
          {error}
        </p>
      )}

      {exito && (
        <p style={{ color: "green" }} role="status">
          {exito}
        </p>
      )}

      {puedeEditar && (
        <form onSubmit={handleSubmit}>
          {/* Aula */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="aulaId">
              Aula *
            </label>

            <select
              id="aulaId"
              name="aulaId"
              value={form.aulaId}
              onChange={handleChange}
              style={estiloCampo}
            >
              <option value="">
                Seleccioná un aula
              </option>

              {aulas
                .filter(
                  (aula) =>
                    aula.activa ||
                    aula.id === form.aulaId
                )
                .map((aula) => (
                  <option
                    key={aula.id}
                    value={aula.id}
                    disabled={!aula.activa}
                  >
                    {aula.nombre} — Capacidad: {aula.capacidad}
                    {!aula.activa ? " (Inactiva)" : ""}
                  </option>
                ))}
            </select>

            {erroresForm.aulaId && (
              <p style={estiloError}>
                {erroresForm.aulaId}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="fecha">
              Fecha *
            </label>

            <input
              id="fecha"
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              style={estiloCampo}
            />

            {erroresForm.fecha && (
              <p style={estiloError}>
                {erroresForm.fecha}
              </p>
            )}
          </div>

          {/* Hora de inicio */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="horaInicio">
              Hora de inicio *
            </label>

            <input
              id="horaInicio"
              type="time"
              name="horaInicio"
              value={form.horaInicio}
              onChange={handleChange}
              style={estiloCampo}
            />

            {erroresForm.horaInicio && (
              <p style={estiloError}>
                {erroresForm.horaInicio}
              </p>
            )}
          </div>

          {/* Hora de finalización */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="horaFin">
              Hora de finalización *
            </label>

            <input
              id="horaFin"
              type="time"
              name="horaFin"
              value={form.horaFin}
              onChange={handleChange}
              style={estiloCampo}
            />

            {erroresForm.horaFin && (
              <p style={estiloError}>
                {erroresForm.horaFin}
              </p>
            )}
          </div>

          {/* Cantidad de personas */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cantidadPersonas">
              Cantidad de personas *
            </label>

            <input
              id="cantidadPersonas"
              type="number"
              name="cantidadPersonas"
              min="1"
              step="1"
              value={form.cantidadPersonas}
              onChange={handleChange}
              style={estiloCampo}
            />

            {erroresForm.cantidadPersonas && (
              <p style={estiloError}>
                {erroresForm.cantidadPersonas}
              </p>
            )}
          </div>

          {/* Motivo */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="motivo">
              Motivo *
            </label>

            <textarea
              id="motivo"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              rows={4}
              style={estiloCampo}
            />

            {erroresForm.motivo && (
              <p style={estiloError}>
                {erroresForm.motivo}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={guardando}
            style={{
              width: "100%",
              padding: 12,
              cursor: guardando ? "wait" : "pointer",
            }}
          >
            {guardando
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Crear reserva"}
          </button>
        </form>
      )}
    </div>
  );
}
