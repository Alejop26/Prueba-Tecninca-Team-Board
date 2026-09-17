import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { computeMetrics } from "../services/metrics.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const metrics = await computeMetrics();
  res.json(metrics);
});

export default router;
