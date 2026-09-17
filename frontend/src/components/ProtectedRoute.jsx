import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-muted p-4">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

/** Variante que además exige un rol concreto (p. ej. "admin"). */
export function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-muted p-4">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
}
