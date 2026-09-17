import { useEffect, useState } from "react";
import { api } from "../api/client";

const STATUS_META = [
  { key: "Pendiente", label: "Pendientes", border: "border-warning" },
  { key: "En curso", label: "En curso", border: "border-info" },
  { key: "Hecho", label: "Hechas", border: "border-success" },
];

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.dashboard.metrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="h3 mb-1">Dashboard</h1>
      <p className="text-muted mb-4">Resumen del tablero compartido de notas.</p>

      {loading && <p className="text-muted">Cargando métricas…</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {metrics && (
        <>
          <div className="row g-3" style={{ maxWidth: 760 }}>
            <div className="col-6 col-md-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="fs-2 fw-bold text-primary">{metrics.total}</div>
                  <div className="text-muted small">Notas totales</div>
                </div>
              </div>
            </div>
            {STATUS_META.map(({ key, label, border }) => (
              <div className="col-6 col-md-3" key={key}>
                <div className={`card h-100 border-top border-4 ${border}`}>
                  <div className="card-body">
                    <div className="fs-2 fw-bold">{metrics.byStatus[key] ?? 0}</div>
                    <div className="text-muted small">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 d-flex align-items-center gap-3">
            <span className="text-muted small">
              Actualizado: {new Date(metrics.updatedAt).toLocaleString()}
            </span>
            <button className="btn btn-outline-secondary btn-sm" onClick={load}>
              Actualizar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
