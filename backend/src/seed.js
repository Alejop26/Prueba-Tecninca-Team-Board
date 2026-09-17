import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import mongoose from "mongoose";

async function upsertDemoUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email },
    { name, email, passwordHash, role, active: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`[seed] ${role} listo -> ${email} / ${password}`);
}

async function run() {
  await connectDB();

  await upsertDemoUser({
    name: "Admin Demo",
    email: process.env.DEMO_ADMIN_EMAIL || "admin@demo.com",
    password: process.env.DEMO_ADMIN_PASSWORD || "Admin123!",
    role: "admin",
  });

  await upsertDemoUser({
    name: "Usuario Demo",
    email: process.env.DEMO_USER_EMAIL || "user@demo.com",
    password: process.env.DEMO_USER_PASSWORD || "User123!",
    role: "user",
  });

  await mongoose.disconnect();
  console.log("[seed] completado");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
