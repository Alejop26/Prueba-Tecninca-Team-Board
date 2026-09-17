// En local, ambas rutas pasan por el proxy de Vite hacia la API Express.
// En AWS, la API "normal" vive en EC2 y el dashboard se sirve desde
// API Gateway + Lambda, así que cada una puede apuntar a un host distinto
// (ver frontend/.env.production.example).
const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const DASHBOARD_BASE = import.meta.env.VITE_DASHBOARD_API_BASE || "/api/dashboard";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, base = API_BASE } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Sesión inválida o cuenta desactivada a mitad de sesión: forzar logout
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    throw new Error(data.error || "Error de red");
  }

  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  notes: {
    list: () => request("/notes"),
    create: (payload) => request("/notes", { method: "POST", body: payload }),
    update: (id, payload) => request(`/notes/${id}`, { method: "PATCH", body: payload }),
    move: (id, position) => request(`/notes/${id}/position`, { method: "PATCH", body: position }),
    remove: (id) => request(`/notes/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    // La Lambda expone la ruta en la raíz del API Gateway, no bajo /dashboard
    metrics: () => request("", { base: DASHBOARD_BASE }),
  },
  users: {
    list: () => request("/users"),
    create: (payload) => request("/users", { method: "POST", body: payload }),
    update: (id, payload) => request(`/users/${id}`, { method: "PATCH", body: payload }),
  },
};
