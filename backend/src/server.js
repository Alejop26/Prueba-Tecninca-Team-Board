import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);

// Manejador de errores genérico
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] escuchando en :${PORT}`));
  })
  .catch((err) => {
    console.error("No se pudo conectar a MongoDB:", err);
    process.exit(1);
  });
