import { useRef, useCallback, useState, useEffect } from "react";
import { Plus, Upload, Download, Shield } from "lucide-react";
import StarRating from "./StarRating.jsx";
import { fmtDate, blankBook } from "../lib/models.js";
import { SPINE_COLORS } from "../lib/constants.js";

/* Deterministic hash for per-book visual variety */
function hashYear(year) {
  let h = 0;
  for (let i = 0; i < year.length; i++) h = ((h << 5) - h + year.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Shelf({ books, onOpen, onAddYear, onExportJson, onImportJson, toast }) {
  const jsonFileRef = useRef(null);
  const spineRefs = useRef({});
  const years = Object.keys(books).sort((a, b) => Number(b) - Number(a));
  const allEntries = years.flatMap((y) => books[y].entries.map((e) => ({ ...e, _year: y })));
  const totalFilms = allEntries.length;

  const [isPersisted, setIsPersisted] = useState(true);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persistent) => {
        setIsPersisted(persistent);
      });
    }
  }, []);

  const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
    }
  };

  const last = allEntries
    .filter((e) => e.movie).slice()
    .sort((a, b) => new Date(b.dateWatched || 0) - new Date(a.dateWatched || 0))[0];

  const top4 = allEntries.filter((e) => e.movie).sort((a, b) => b.rating - a.rating).slice(0, 4);

  /* Keyboard handler for spine focus */
  const handleSpineKey = useCallback((e, year) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(year);
    }
  }, [onOpen]);

  /* Empty-shelf guide book handler */
  const handleGuideClick = useCallback(() => {
    onAddYear();
    /* The onAddYear creates a new year book — we need to open it.
       Since onAddYear doesn't return the year, we derive it the same way App.jsx does */
    const y = String(new Date().getFullYear());
    setTimeout(() => onOpen(y), 60);
  }, [onAddYear, onOpen]);

  return (
    <div className="ml-shell">
      <div className="ml-topbar">
        <div>
          <div className="ml-eyebrow">Personal Film Journal</div>
          <div className="ml-wordmark">Movie&nbsp;Log</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="ml-btn ml-btn--fill" onClick={onAddYear} type="button"><Plus size={13} /> New book</button>
          <button className="ml-btn" onClick={onExportJson} type="button" title="Export Backup JSON"><Download size={12} /> Export JSON</button>
          <button className="ml-btn" onClick={() => jsonFileRef.current.click()} type="button" title="Import Backup JSON"><Upload size={12} /> Import JSON</button>
          <input ref={jsonFileRef} type="file" accept=".json" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files[0]) onImportJson(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>

      {!isPersisted && (
        <div className="ml-persist-banner" style={{
          background: "var(--cream)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          padding: "14px 18px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.4, maxWidth: 650 }}>
              <strong>Browser Storage protection:</strong> Your film journal is currently marked as temporary. To prevent the browser from automatically deleting your logs when disk space is low, enable storage guard protection.
            </div>
          </div>
          <button className="ml-btn ml-btn--fill" onClick={requestPersistence} style={{
            background: "var(--mustard)",
            color: "var(--ink)",
            borderColor: "var(--mustard)",
            fontSize: 10.5,
            padding: "6px 12px",
            whiteSpace: "nowrap"
          }} type="button">
            Enable Protection
          </button>
        </div>
      )}

      {/* ── Last-logged ticket stub ── */}
      {last && (
        <div
          className="ml-ticket"
          onClick={() => onOpen(last._year)}
          role="button"
          tabIndex={0}
          aria-label={`Last logged: ${last.movie}. Press Enter to open.`}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(last._year); }}}
        >
          <div className="ml-ticket-l">
            <div className="ml-eyebrow" style={{ marginBottom: 6 }}>◍ Last Logged</div>
            <div style={{ fontFamily: "var(--serif)", fontWeight: 800, fontSize: 26, lineHeight: 1.05 }}>{last.movie}</div>
            <div style={{ marginTop: 10 }}><StarRating value={last.rating} readOnly size={15} /></div>
            <div className="ml-mono" style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 8 }}>
              {last.director || "—"} · {fmtDate(last.dateWatched) || "no date"}
            </div>
          </div>
          <div className="ml-ticket-r">
            <div className="ml-ticket-label">Admit One</div>
            <div className="ml-barcode" />
            <div className="ml-mono" style={{ fontSize: 10 }}>NO. {String(totalFilms).padStart(6, "0")}</div>
          </div>
        </div>
      )}

      {/* ── Shelf section heading ── */}
      <div className="ml-section-h">
        <h2>Shelf</h2>
        <span className="ml-section-sub">{totalFilms} films · {years.length} book{years.length === 1 ? "" : "s"}</span>
      </div>

      {/* ── Book shelf ── */}
      {years.length === 0 ? (
        <div className="ml-shelf-strip">
          {/* Guide book — the only spine on an empty shelf */}
          <div
            className="ml-spine ml-guide-spine"
            style={{
              width: 52,
              height: 210,
              background: `linear-gradient(90deg,
                rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 5%, transparent 12%,
                rgba(255,255,255,0.07) 44%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 56%,
                transparent 70%, rgba(0,0,0,0.05) 85%, rgba(0,0,0,0.20) 100%), #4A3728`,
              cursor: "pointer",
            }}
            onClick={handleGuideClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleGuideClick(); }}}
            tabIndex={0}
            role="button"
            aria-label="Start your journal. Press Enter to create your first book."
          >
            <span className="ml-spine-yr" style={{ fontSize: 11, letterSpacing: "0.08em" }}>Start</span>
            <div className="ml-spine-divider" />
            <span className="ml-spine-tag" style={{ fontSize: 6 }}>YOUR LOG</span>
            <div className="ml-spine-edge" />
            <div className="ml-spine-wear" />
          </div>
        </div>
      ) : (
        <div className="ml-shelf-strip">
          {years.map((y) => {
            const b = books[y];
            const h = hashYear(y);
            const spineColor = b.coverColor && b.coverColor !== "#E8A93B"
              ? b.coverColor
              : SPINE_COLORS[h % SPINE_COLORS.length];
            const baseW = Math.max(32, Math.min(66, 30 + b.entries.length * 0.9));
            const w = Math.round(baseW + (h % 7) - 3);
            const height = 194 + (h % 40);
            const tilt = ((h % 30) - 15) / 10;
            const topOffset = h % 8;
            /* Per-spine letter-spacing variance */
            const lsVariance = 0.03 + (h % 5) * 0.008;

            return (
              <div
                key={y}
                ref={(el) => { spineRefs.current[y] = el; }}
                className="ml-spine"
                style={{
                  width: w, height, marginTop: topOffset,
                  background: `linear-gradient(90deg,
                    rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.10) 5%, transparent 12%,
                    rgba(255,255,255,0.07) 44%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 56%,
                    transparent 70%, rgba(0,0,0,0.05) 85%, rgba(0,0,0,0.20) 100%), ${spineColor}`,
                  transform: `rotate(${tilt}deg)`, transformOrigin: "bottom center",
                  "--tilt": `${tilt}deg`,
                }}
                onClick={() => onOpen(y)}
                onKeyDown={(e) => handleSpineKey(e, y)}
                tabIndex={0}
                role="button"
                aria-label={`${y} — ${b.entries.length} film${b.entries.length === 1 ? "" : "s"}. Press Enter to open.`}
                title={`${y} — ${b.entries.length} films`}
              >
                <span className="ml-spine-yr" style={{ fontSize: w < 40 ? 14 : 19, letterSpacing: `${lsVariance}em` }}>{y}</span>
                <div className="ml-spine-divider" />
                <span className="ml-spine-tag">LOG</span>
                <div className="ml-spine-edge" />
                <div className="ml-spine-wear" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Top favorites ── */}
      {top4.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div className="ml-section-h">
            <h2>Top {top4.length}</h2>
            <span className="ml-section-sub">your favorites</span>
          </div>
          <div className="ml-fav-row">
            {top4.map((e, i) => (
              <div className="ml-fav" key={e.id}>
                <div
                  className="ml-fav-case"
                  style={{ background: books[e._year]?.coverColor || "#E8A93B" }}
                  onClick={() => onOpen(e._year)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${e.movie}, rated ${e.rating} out of 5. Press Enter to open ${e._year} book.`}
                  onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onOpen(e._year); }}}
                >
                  <div className="ml-fav-title">{e.movie}</div>
                  <div><StarRating value={e.rating} readOnly size={13} /></div>
                  <span className="ml-fav-rank">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="ml-toast">{toast}</div>}
    </div>
  );
}
