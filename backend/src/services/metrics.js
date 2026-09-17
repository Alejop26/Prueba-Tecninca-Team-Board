import { Note, NOTE_STATUSES } from "../models/Note.js";

/**
 * Calcula el total de notas y su distribución por estado.
 * Se aísla en un servicio propio para poder reutilizarla tanto desde
 * la API Express como desde el handler de AWS Lambda (ver /lambda).
 */
export async function computeMetrics() {
  const counts = await Note.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = Object.fromEntries(NOTE_STATUSES.map((s) => [s, 0]));
  let total = 0;
  for (const row of counts) {
    byStatus[row._id] = row.count;
    total += row.count;
  }

  return { total, byStatus, updatedAt: new Date().toISOString() };
}
