import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Shell() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside
        className="d-flex flex-column p-3 text-white"
        style={{ width: 220, background: "#1f2430", flexShrink: 0 }}
      >
        <div className="fw-bold mb-4">Tablero de equipo</div>

        <nav className="nav nav-pills flex-column gap-1 mb-auto">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link sidebar-link text-white-50 ${isActive ? "active" : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/board"
            className={({ isActive }) => `nav-link sidebar-link text-white-50 ${isActive ? "active" : ""}`}
          >
            Tablero
          </NavLink>
          {user?.role === "admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link sidebar-link text-white-50 ${isActive ? "active" : ""}`}
            >
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="border-top border-secondary pt-3 mt-3">
          <div className="small">{user?.name}</div>
          <div className="small text-white-50 text-capitalize mb-2">{user?.role}</div>
          <button className="btn btn-outline-light btn-sm w-100" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 p-4" style={{ overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
