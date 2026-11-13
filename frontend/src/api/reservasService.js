
import api from "./axios";

export function getReservas(params = {}) {
  return api.get("/reservas", { params });
}

export function getReservaPorId(id) {
  return api.get(`/reservas/${id}`);
}

export function getHistorialReserva(id) {
  return api.get(`/reservas/${id}/historial`);
}

export function crearReserva(datos) {
  return api.post("/reservas", datos);
}

export function editarReserva(id, datos) {
  return api.put(`/reservas/${id}`, datos);
}

export function cancelarReserva(id) {
  return api.patch(`/reservas/${id}/cancelar`);
}

export function aprobarReserva(id) {
  return api.patch(`/reservas/${id}/aprobar`);
}

export function rechazarReserva(id) {
  return api.patch(`/reservas/${id}/rechazar`);
}

export function getResumenReservas() {
  return api.get("/reservas/resumen");
}
