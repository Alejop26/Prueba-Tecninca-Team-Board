import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center bg-dark" style={{ minHeight: "100vh" }}>
      <div className="card shadow-lg border-0" style={{ width: 380 }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-1">Tablero de equipo</h1>
          <p className="text-muted small mb-4">
            Inicia sesión para ver tu actividad y el tablero compartido.
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label small fw-semibold">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label small fw-semibold">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
              {submitting ? "Entrando…" : "Iniciar sesión"}
            </button>
          </form>

          <div className="small text-muted border-top mt-4 pt-3">
            <strong>Cuentas de demostración</strong>
            <br />
            Administrador: admin@demo.com / Admin123!
            <br />
            Usuario: user@demo.com / User123!
          </div>
        </div>
      </div>
    </div>
  );
}
