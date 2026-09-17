import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Verifica el JWT y adjunta el usuario autenticado a req.user.
 * Vuelve a comprobar en base de datos que el usuario sigue activo,
 * para que una desactivación surta efecto de inmediato aunque el
 * usuario ya tenga un token válido en curso.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    if (!user.active) {
      return res.status(403).json({ error: "Cuenta desactivada" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/** Restringe el acceso a uno o varios roles. Usar después de requireAuth. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permisos suficientes" });
    }
    next();
  };
}
