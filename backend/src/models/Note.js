import mongoose from "mongoose";

export const NOTE_STATUSES = ["Pendiente", "En curso", "Hecho"];

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    text: { type: String, default: "" },
    status: { type: String, enum: NOTE_STATUSES, default: "Pendiente" },
    position: {
      x: { type: Number, default: 40 },
      y: { type: Number, default: 40 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Note = mongoose.model("Note", noteSchema);
