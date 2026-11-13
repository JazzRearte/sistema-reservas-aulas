
import api from "./axios";

export function getAulas(params = {}) {
  return api.get("/aulas", { params });
}

export function getAulaPorId(id) {
  return api.get(`/aulas/${id}`);
}
