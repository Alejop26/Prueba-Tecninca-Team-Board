// Handler de AWS Lambda para el cálculo de métricas del dashboard.
// Reutiliza el mismo servicio que la API Express (src/services/metrics.js)
// para no duplicar la lógica de negocio. Pensado para invocarse vía
// API Gateway y para ejecutarse en local con `sam local start-api`
// o `sam local invoke`.
import mongoose from "mongoose";
import { computeMetrics } from "../src/services/metrics.js";

let cachedConnection = null;

async function ensureConnection() {
  if (cachedConnection) return cachedConnection;
  const uri = process.env.MONGO_URI;
  cachedConnection = await mongoose.connect(uri);
  return cachedConnection;
}

export const handler = async () => {
  try {
    await ensureConnection();
    const metrics = await computeMetrics();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudieron calcular las métricas" }),
    };
  }
};
