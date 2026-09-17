import { Router } from "express";
import { Note, NOTE_STATUSES } from "../models/Note.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Todas las rutas del tablero requieren estar autenticado y activo
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const notes = await Note.find().sort({ createdAt: 1 });
  res.json({ notes });
});

router.post("/", async (req, res) => {
  const { title = "", text = "", status = "Pendiente", position } = req.body;

  if (status && !NOTE_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Estado no válido" });
  }

  const note = await Note.create({
    title,
    text,
    status,
    position: position || { x: 40, y: 40 },
    createdBy: req.user._id,
  });

  res.status(201).json({ note });
});

// Actualiza contenido y/o estado de una nota (acción "Guardar")
router.patch("/:id", async (req, res) => {
  const { title, text, status } = req.body;

  if (status && !NOTE_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Estado no válido" });
  }

  const update = {};
  if (title !== undefined) update.title = title;
  if (text !== undefined) update.text = text;
  if (status !== undefined) update.status = status;

  const note = await Note.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!note) return res.status(404).json({ error: "Nota no encontrada" });

  res.json({ note });
});

// Endpoint dedicado para guardar la posición al soltar el arrastre.
// Separado de PATCH general para que el drag-and-drop sea una llamada
// ligera e independiente de la edición de contenido.
router.patch("/:id/position", async (req, res) => {
  const { x, y } = req.body;
  if (typeof x !== "number" || typeof y !== "number") {
    return res.status(400).json({ error: "Posición inválida" });
  }

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { position: { x, y } },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: "Nota no encontrada" });

  res.json({ note });
});

router.delete("/:id", async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ error: "Nota no encontrada" });
  res.json({ ok: true });
});

export default router;
