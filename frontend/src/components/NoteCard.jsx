import { useRef, useState } from "react";

const STATUS_OPTIONS = ["Pendiente", "En curso", "Hecho"];
const STATUS_CLASS = {
  Pendiente: "status-pendiente",
  "En curso": "status-en-curso",
  Hecho: "status-hecho",
};

// Elementos interactivos dentro de la nota que NO deben iniciar el arrastre
const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

export function NoteCard({ note, onMove, onSave, onDelete }) {
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.text);
  const [status, setStatus] = useState(note.status);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const dragState = useRef(null);
  const [position, setPosition] = useState(note.position);

  function markDirty(setter) {
    return (e) => {
      setter(e.target.value);
      setDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(note._id, { title, text, status });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function handlePointerDown(e) {
    if (INTERACTIVE_TAGS.has(e.target.tagName)) return;

    const board = e.currentTarget.parentElement;
    const boardRect = board.getBoundingClientRect();

    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      boardRect,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current) return;
    const { startX, startY, originX, originY, boardRect } = dragState.current;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const maxX = boardRect.width - 210; // ancho de la nota
    const maxY = boardRect.height - 180; // alto mínimo de la nota

    const nextX = Math.min(Math.max(0, originX + deltaX), Math.max(0, maxX));
    const nextY = Math.min(Math.max(0, originY + deltaY), Math.max(0, maxY));

    setPosition({ x: nextX, y: nextY });
  }

  function handlePointerUp(e) {
    if (!dragState.current) return;
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onMove(note._id, position);
  }

  return (
    <div
      className={`note ${STATUS_CLASS[status]}`}
      style={{ left: position.x, top: position.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <input
        className="note-title"
        value={title}
        placeholder="Título"
        onChange={markDirty(setTitle)}
      />
      <textarea
        className="note-text"
        value={text}
        placeholder="Escribe algo…"
        onChange={markDirty(setText)}
      />
      <div className="note-footer d-flex flex-column">
        <select
          className="note-status-select"
          value={status}
          onChange={markDirty(setStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="note-actions d-flex gap-1">
          <button
            className="btn btn-sm btn-light"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(note._id)}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
