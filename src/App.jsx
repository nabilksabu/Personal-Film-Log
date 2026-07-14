import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Shelf from "./components/Shelf.jsx";
import BookViewer from "./components/BookViewer.jsx";
import {
  blankBook,
  blankEntry,
  loadData,
  saveData,
  fmtDate,
  computeFirstWatch,
  migrateEntry,
  getBookColor,
  parseRating,
} from "./lib/models.js";

export default function App() {
  const [books, setBooks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const saveTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const d = loadData();
    if (d && d.books) {
      const migrated = {};
      for (const [yr, book] of Object.entries(d.books)) {
        let coverColor = book.coverColor;
        if (!coverColor || coverColor === "#E8A93B") {
          coverColor = getBookColor({ year: yr });
        }
        migrated[yr] = {
          ...book,
          coverColor,
          entries: (book.entries || []).map(migrateEntry),
        };
      }
      setBooks(computeFirstWatch(migrated));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData({ books }), 500);
  }, [books, loaded]);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const addYear = () => {
    const y = String(new Date().getFullYear());
    let yr = y,
      i = 1;
    while (books[yr]) yr = String(Number(y) - i++);
    setBooks((prev) => computeFirstWatch({ ...prev, [yr]: blankBook(yr) }));
    flash(`Started book ${yr}`);
  };



  const exportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ books }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `movie-log-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      flash("Exported backup JSON!");
    } catch {
      flash("Could not export backup JSON.");
    }
  };

  const importJson = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.books) {
          setBooks((prev) => {
            const next = { ...prev };
            Object.keys(data.books).forEach((yr) => {
              next[yr] = data.books[yr];
            });
            return computeFirstWatch(next);
          });
          flash("Imported backup JSON successfully!");
        } else {
          flash("Invalid file format.");
        }
      } catch {
        flash("Could not parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const updateBook = useCallback((year, newBook) => {
    setBooks((prev) => computeFirstWatch({ ...prev, [year]: newBook }));
  }, []);

  return (
    <div className="ml-root">
      <Routes>
        <Route
          path="/"
          element={
            <Shelf
              books={books}
              onOpen={(y) => navigate(`/book/${y}`)}
              onAddYear={addYear}
              onExportJson={exportJson}
              onImportJson={importJson}
              toast={toast}
            />
          }
        />
        <Route
          path="/book/:year"
          element={<BookViewerRoute books={books} updateBook={updateBook} />}
        />
      </Routes>
    </div>
  );
}

function BookViewerRoute({ books, updateBook }) {
  const { year } = useParams();
  const navigate = useNavigate();
  const book = books[year];

  if (!book) {
    return (
      <div
        className="ml-root"
        style={{ textAlign: "center", padding: "100px 20px" }}
      >
        <h2>Book not found</h2>
        <button
          className="ml-btn"
          onClick={() => navigate("/")}
          type="button"
        >
          &larr; Back to shelf
        </button>
      </div>
    );
  }

  return (
    <BookViewer
      book={book}
      onClose={() => navigate("/")}
      onUpdate={(b) => updateBook(year, b)}
    />
  );
}
