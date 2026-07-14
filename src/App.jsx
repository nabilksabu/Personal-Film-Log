import { useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
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
        migrated[yr] = { ...book, entries: (book.entries || []).map(migrateEntry) };
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

  const importCsv = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const byYear = {};
        rows.forEach((r) => {
          const watched = r["Watched Date"] || r["Date"] || "";
          const d = new Date(watched);
          const yr = isNaN(d.getTime()) ? "Undated" : String(d.getFullYear());
          (byYear[yr] = byYear[yr] || []).push({ r, watched });
        });
        setBooks((prev) => {
          const next = { ...prev };
          Object.keys(byYear).forEach((yr) => {
            const book = next[yr]
              ? { ...next[yr], entries: [...next[yr].entries] }
              : blankBook(yr);
            const sorted = byYear[yr].sort(
              (a, b) => new Date(a.watched) - new Date(b.watched),
            );
            sorted.forEach(({ r, watched }) => {
              const rating = parseFloat(r["Rating"]);
              book.entries.push({
                ...blankEntry(book.entries.length + 1),
                movie: r["Name"] || "",
                year: r["Year"] || "",
                dateWatched: fmtDate(watched),
                director: r["Director"] || "",
                rating: isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating)),
                aspects: r["Aspect Ratio"] ? [r["Aspect Ratio"]] : [],
              });
            });
            book.entries = book.entries.map((e, i) => ({ ...e, n: i + 1 }));
            next[yr] = book;
          });
          return computeFirstWatch(next);
        });
        flash(
          `Imported ${rows.length} film${rows.length === 1 ? "" : "s"} across ${Object.keys(byYear).length} book${Object.keys(byYear).length === 1 ? "" : "s"}`,
        );
      },
      error: () =>
        flash("Could not read that CSV — is it a Letterboxd diary export?"),
    });
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
              onImport={importCsv}
              onAddYear={addYear}
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
