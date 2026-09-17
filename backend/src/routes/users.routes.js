import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", async (_req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users });
});

router.post("/", async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
  }
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ error: "Rol no válido" });
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    return res.status(409).json({ error: "Ya existe un usuario con ese email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    active: true,
  });

  res.status(201).json({ user });
});

/**
 * Cuenta cuántos administradores activos hay, excluyendo opcionalmente un id
 * (útil para simular "qué pasaría si" antes de aplicar un cambio).
 */
async function countActiveAdmins(excludeId) {
  const filter = { role: "admin", active: true };
  if (excludeId) filter._id = { $ne: excludeId };
  return User.countDocuments(filter);
}

router.patch("/:id", async (req, res) => {
  const { name, email, role, active, password } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  const willLoseAdmin =
    target.role === "admin" &&
    ((role && role !== "admin") || active === false);

  if (willLoseAdmin) {
    const remaining = await countActiveAdmins(target._id);
    if (remaining === 0) {
      return res.status(400).json({
        error: "Debe existir siempre al menos un administrador activo",
      });
    }
  }

  if (name !== undefined) target.name = name;
  if (email !== undefined) target.email = email.toLowerCase().trim();
  if (role !== undefined) {
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Rol no válido" });
    }
    target.role = role;
  }
  if (active !== undefined) target.active = active;
  if (password) target.passwordHash = await bcrypt.hash(password, 10);

  await target.save();
  res.json({ user: target });
});

export default router;
