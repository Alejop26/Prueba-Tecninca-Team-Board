import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  if (!user.active) {
    return res.status(403).json({ error: "Esta cuenta está desactivada" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = signToken(user);
  res.json({ token, user });
});

// Permite al frontend recuperar el usuario actual al recargar la app
router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.post("/logout", requireAuth, async (_req, res) => {
  // El logout es "stateless": el cliente simplemente descarta el token.
  // Se deja el endpoint por consistencia con el resto de la API.
  res.json({ ok: true });
});

export default router;
