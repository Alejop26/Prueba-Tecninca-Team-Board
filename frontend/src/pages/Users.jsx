import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = { name: "", email: "", password: "", role: "user" };

export function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { users } = await api.users.list();
      setUsers(users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const { user } = await api.users.create(form);
      setUsers((prev) => [...prev, user]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(id, patch) {
    setError("");
    try {
      const { user } = await api.users.update(id, patch);
      setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="h3 mb-1">Usuarios</h1>
      <p className="text-muted mb-4">
        Administra el acceso al área autenticada. Siempre debe quedar al menos un
        administrador activo.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4" style={{ maxWidth: 640 }}>
        <div className="card-body">
          <h2 className="h6 mb-3">Nuevo usuario</h2>
          <form className="row g-2 align-items-end" onSubmit={handleCreate}>
            <div className="col-12 col-md-3">
              <label className="form-label small">Nombre</label>
              <input
                className="form-control form-control-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small">Email</label>
              <input
                type="email"
                className="form-control form-control-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label small">Contraseña</label>
              <input
                type="password"
                className="form-control form-control-sm"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="col-8 col-md-2">
              <label className="form-label small">Rol</label>
              <select
                className="form-select form-select-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="col-4 col-md-2">
              <button className="btn btn-primary btn-sm w-100" disabled={creating}>
                {creating ? "Creando…" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Cargando usuarios…</p>
      ) : (
        <table className="table table-hover align-middle bg-white">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td style={{ width: 160 }}>
                  <select
                    className="form-select form-select-sm"
                    value={u.role}
                    onChange={(e) => updateUser(u._id, { role: e.target.value })}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.active ? "text-bg-success" : "text-bg-secondary"}`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={u._id === me._id && u.active}
                    onClick={() => updateUser(u._id, { active: !u.active })}
                  >
                    {u.active ? "Desactivar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
