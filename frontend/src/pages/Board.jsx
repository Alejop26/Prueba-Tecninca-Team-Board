import { useEffect, useState } from "react";
import { api } from "../api/client";
import { NoteCard } from "../components/NoteCard";

export function Board() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notes
      .list()
      .then(({ notes }) => setNotes(notes))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    try {
      // Posición inicial ligeramente escalonada para no apilar notas nuevas
      const offset = (notes.length % 6) * 24;
      const { note } = await api.notes.create({
        title: "",
        text: "",
        status: "Pendiente",
        position: { x: 40 + offset, y: 40 + offset },
      });
      setNotes((prev) => [...prev, note]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(id, payload) {
    const { note } = await api.notes.update(id, payload);
    setNotes((prev) => prev.map((n) => (n._id === id ? note : n)));
  }

  async function handleMove(id, position) {
    try {
      await api.notes.move(id, position);
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, position } : n)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.notes.remove(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Tablero</h1>
          <p className="text-muted mb-0">
            Arrastra las notas para organizarlas. Los cambios se guardan solos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Nueva nota
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="board-canvas">
        {loading && <p className="empty-board">Cargando tablero…</p>}
        {!loading && notes.length === 0 && (
          <p className="empty-board">
            Todavía no hay notas. Crea la primera con “Nueva nota”.
          </p>
        )}
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onSave={handleSave}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
