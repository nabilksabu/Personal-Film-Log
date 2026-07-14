import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight,
  Sticker, Move, Pencil, Eraser, Trash2,
} from "lucide-react";
import EntryCard from "./EntryCard.jsx";
import Watchlist from "./Watchlist.jsx";
import DecorateLayer from "./DecorateLayer.jsx";
import { blankEntry, blankDeco } from "../lib/models.js";
import { STICKERS, INK_COLORS } from "../lib/constants.js";

/* ── Reduced-motion check ── */
const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Leaf component ── */
const Leaf = ({ children, single }) => (
  <div className={"ml-leaf" + (single ? " ml-leaf--single" : "")}>{children}</div>
);

export default function BookViewer({ book, onClose, onUpdate }) {
  /* ── Local state ── */
  const [pageIdx, setPageIdx] = useState(0);
  const [flipDir, setFlipDir] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [exitSnapshot, setExitSnapshot] = useState(null);
  const [coverPhase, setCoverPhase] = useState(prefersReduced ? "open" : "arriving");
  const [decorate, setDecorate] = useState(false);
  const [tool, setTool] = useState("move");
  const [color, setColor] = useState(INK_COLORS[0]);
  const [width, setWidth] = useState(3);
  const [picked, setPicked] = useState(STICKERS[0]);
  const [clearKey, setClearKey] = useState(0);

  const stageRef = useRef(null);
  const dragX = useMotionValue(0);

  /* ── Cinematic book-open sequence ── */
  useEffect(() => {
    if (prefersReduced) return;
    // arriving → lifting → opening → settling → open
    const t1 = setTimeout(() => setCoverPhase("lifting"), 300);
    const t2 = setTimeout(() => setCoverPhase("opening"), 700);
    // "settling" and "open" are triggered by onAnimationComplete
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleCoverAnimComplete = useCallback((phase) => {
    if (phase === "opening") setCoverPhase("settling");
    else if (phase === "settling") setCoverPhase("open");
  }, []);

  /* ── Build page list ── */
  const pairs = [];
  for (let i = 0; i < book.entries.length; i += 2)
    pairs.push(book.entries.slice(i, i + 2));
  if (pairs.length === 0) pairs.push([]);
  const pages = [
    { type: "cover", id: "cover" },
    { type: "title", id: "title" },
    ...pairs.map((items, j) => ({ type: "entries", id: "spread-" + j, items })),
    { type: "watchlist", id: "watchlist" },
    { type: "back", id: "back" },
  ];
  const idx = Math.max(0, Math.min(pages.length - 1, pageIdx));
  const cur = pages[idx];

  /* ── Entry operations ── */
  const patchEntry = (id, patch) =>
    onUpdate({ ...book, entries: book.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const addEntry = () => {
    const len = book.entries.length;
    onUpdate({ ...book, entries: [...book.entries, blankEntry(len + 1)] });
    setFlipDir(1);
    setPageIdx(2 + Math.floor(len / 2));
  };
  const delEntry = (id) => {
    const kept = book.entries.filter((e) => e.id !== id).map((e, i) => ({ ...e, n: i + 1 }));
    onUpdate({ ...book, entries: kept });
  };

  /* ── Decoration ── */
  const deco = book.deco?.[cur.id] || blankDeco();
  const setDeco = (d) => onUpdate({ ...book, deco: { ...book.deco, [cur.id]: d } });
  const clearDrawings = () => { setDeco({ ...deco, strokes: [] }); setClearKey((k) => k + 1); };

  /* ── Focus stage on page change ── */
  useEffect(() => {
    if (stageRef.current) stageRef.current.focus({ preventScroll: true });
  }, [idx]);

  /* ── Render page content ── */
  const renderPage = (page) => {
    if (!page) return null;
    switch (page.type) {
      case "cover":
        return (
          <Leaf single>
            <div className="ml-cover ml-cover-cloth ml-cover-worn" style={{ background: book.coverColor }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), transparent)",
              }} />
              <div className="ml-cover-rule" />
              <div className="ml-cover-mark">MOVIE LOG</div>
              <div style={{ flex: 1 }} />
              <div className="ml-cover-title" style={{ marginBottom: 8 }}>{book.year}</div>
              <div className="ml-cover-rule" />
              <div style={{ flex: 1 }} />
            </div>
          </Leaf>
        );
      case "title":
        return (
          <Leaf single>
            <div className="ml-title-page" style={{ padding: "26px 28px", minHeight: 660, position: "relative" }}>
              <div className="ml-ornament" />
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }} className="ml-tp-field">
                  <div className="ml-label ml-serif" style={{ fontSize: 28 }}>Movie Log</div>
                </div>
                <div style={{ width: 130, borderLeft: "1px solid var(--line)", paddingLeft: 8 }} className="ml-tp-field">
                  <div className="ml-label">Year:</div>
                  <input className="ml-in" value={book.year}
                    onChange={(e) => onUpdate({ ...book, year: e.target.value })} />
                </div>
              </div>
              <div className="ml-tp-field" style={{ marginTop: 4 }}>
                <div className="ml-label">Name:</div>
                <input className="ml-in" value={book.name}
                  onChange={(e) => onUpdate({ ...book, name: e.target.value })} placeholder="your name" />
              </div>
              <div className="ml-ornament" style={{ marginTop: 12 }} />
              <div className="ml-tp-field" style={{ height: 260, marginTop: 30 }} />
            </div>
          </Leaf>
        );
      case "entries":
        return (
          <>
            {[0, 1].map((slot) => (
              <Leaf key={slot}>
                {page.items[slot] ? (
                  <EntryCard entry={page.items[slot]} onPatch={patchEntry}
                    onDelete={() => delEntry(page.items[slot].id)} />
                ) : (
                  <button onClick={addEntry} type="button" style={{
                    width: "100%", minHeight: 320, border: "none", background: "transparent",
                    color: "var(--ink-soft)", cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <Plus size={26} /><span className="ml-label">Add entry</span>
                  </button>
                )}
              </Leaf>
            ))}
          </>
        );
      case "watchlist":
        return (
          <Leaf single>
            <Watchlist year={book.year} list={book.watchlist}
              onChange={(wl) => onUpdate({ ...book, watchlist: wl })} />
          </Leaf>
        );
      case "back":
        return (
          <Leaf single>
            <div className="ml-cover ml-cover-cloth ml-cover-worn" style={{ background: book.coverColor }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), transparent)",
              }} />
              <div style={{ flex: 1 }} />
              <div className="ml-cover-mark" style={{ opacity: 0.6, textAlign: "center" }}>
                — {book.entries.length} films · {book.year} —
              </div>
              <div style={{ flex: 1 }} />
            </div>
          </Leaf>
        );
      default:
        return null;
    }
  };

  /* ── Navigate with page-flip ── */
  const go = useCallback((dir) => {
    if (isFlipping) return;
    const nextIdx = Math.max(0, Math.min(pages.length - 1, idx + dir));
    if (nextIdx === idx) return;
    setExitSnapshot(renderPage(pages[idx]));
    setFlipDir(dir);
    setPageIdx(nextIdx);
    setIsFlipping(true);
    setTimeout(() => { setIsFlipping(false); setExitSnapshot(null); }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlipping, idx, pages.length]);

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  }, [go]);

  /* ── Touch / swipe drag handler ── */
  const handleDragEnd = useCallback((_e, info) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > 60 || Math.abs(velocity.x) > 300) {
      if (offset.x < 0) go(1);
      else go(-1);
    }
  }, [go]);

  /* ── Spring configs ── */
  const coverSpring = { type: "spring", stiffness: 80, damping: 18 };
  const pageSpring = { type: "spring", stiffness: 120, damping: 22, bounce: 0.15 };

  /* ── Flip progress for curl shadow ── */
  const flipDuration = 0.7;

  return (
    <div className="ml-viewer">
      {/* ARIA live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {`Page ${idx + 1} of ${pages.length}, ${cur.type}`}
      </div>

      {/* Top bar */}
      <div className="ml-vbar">
        <button className="ml-btn" onClick={onClose} type="button">
          <ArrowLeft size={13} /> Shelf
        </button>
        <div className="ml-mono" style={{ fontSize: 12, letterSpacing: ".1em" }}>
          MOVIE LOG · {book.year} · {book.entries.length} FILMS
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="ml-btn" onClick={addEntry} type="button"><Plus size={13} /> Entry</button>
          <button className={"ml-btn" + (decorate ? " ml-btn--on" : "")}
            onClick={() => setDecorate((d) => !d)} type="button">
            <Sticker size={13} /> Decorate
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className={"ml-stage" + (coverPhase !== "open" ? " ml-desk" : "")}
        ref={stageRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ outline: "none" }}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 1120, margin: "0 auto", perspective: 2400 }}>

          {/* Current page content — with touch/swipe wrapper */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, touchAction: "pan-y" }}
          >
            <div className="ml-spread" style={{ position: "relative" }}>
              {renderPage(cur)}

              {/* Gutter shadow for entry spreads */}
              {cur.type === "entries" && (
                <div className="ml-gutter" aria-hidden="true" />
              )}

              <DecorateLayer key={cur.id + ":" + clearKey} deco={deco} onChange={setDeco}
                active={decorate} tool={tool} color={color} width={width} picked={picked} />
            </div>
          </motion.div>

          {/* ── Page-flip overlay: old page turns away ── */}
          <AnimatePresence>
            {isFlipping && exitSnapshot && (
              <motion.div
                key={"flip-" + idx}
                style={{
                  position: "absolute", inset: 0, transformStyle: "preserve-3d",
                  transformOrigin: flipDir > 0 ? "left center" : "right center",
                  zIndex: 20, pointerEvents: "none",
                }}
                initial={{ rotateY: 0, scale: 1, opacity: 1 }}
                animate={{ rotateY: flipDir > 0 ? -130 : 130, scale: [1, 1.01, 0.97], opacity: [1, 1, 0] }}
                transition={{
                  rotateY: prefersReduced
                    ? { duration: 0.2 }
                    : { ...pageSpring, duration: flipDuration },
                  scale: { duration: flipDuration, times: [0, 0.3, 1] },
                  opacity: { duration: flipDuration, times: [0, 0.85, 1] },
                }}
              >
                {/* Front face */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", display: "flex" }}>
                  <div className="ml-spread" style={{ pointerEvents: "none", width: "100%" }}>
                    {exitSnapshot}
                  </div>
                </div>

                {/* Back face — warm off-white paper */}
                <div style={{
                  position: "absolute", inset: 0, backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "linear-gradient(90deg, #E5DFD5 0%, #EDE8DF 5%, #EDE8DF 50%, #EDE8DF 95%, #E5DFD5 100%)",
                  boxShadow: "inset 0 0 80px rgba(0,0,0,0.04)",
                }} />

                {/* Curl shadow overlay — diagonal gradient moving with the flip */}
                <motion.div
                  className="ml-page-curl-shadow"
                  style={{
                    position: "absolute", inset: 0, backfaceVisibility: "hidden",
                    pointerEvents: "none", zIndex: 2,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0.4, 0] }}
                  transition={{ duration: flipDuration, times: [0, 0.25, 0.6, 1] }}
                >
                  <div style={{
                    width: "100%", height: "100%",
                    background: flipDir > 0
                      ? "linear-gradient(105deg, transparent 30%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.04) 50%, transparent 55%)"
                      : "linear-gradient(255deg, transparent 30%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.04) 50%, transparent 55%)",
                  }} />
                </motion.div>

                {/* Fold line along turning edge */}
                <motion.div
                  style={{
                    position: "absolute", top: 0, bottom: 0,
                    width: 4,
                    [flipDir > 0 ? "left" : "right"]: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.10) 100%)",
                    backfaceVisibility: "hidden",
                    pointerEvents: "none", zIndex: 3,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6, 0] }}
                  transition={{ duration: flipDuration, times: [0, 0.2, 0.7, 1] }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shadow cast by turning page onto the underlying page */}
          <AnimatePresence>
            {isFlipping && (
              <motion.div
                key="page-cast-shadow"
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, times: [0, 0.35, 1] }}
              >
                <div style={{
                  width: "100%", height: "100%",
                  background: `linear-gradient(${flipDir > 0 ? "90deg" : "270deg"}, rgba(0,0,0,0.12) 0%, transparent 45%)`,
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Cinematic cover-opening sequence ── */}
          <AnimatePresence>
            {coverPhase !== "open" && (
              <motion.div
                key="cover-open"
                style={{
                  position: "absolute", inset: 0, transformStyle: "preserve-3d",
                  transformOrigin: "left center", zIndex: 30, pointerEvents: "none",
                }}
                initial={{ rotateY: 0, opacity: 1 }}
                animate={
                  coverPhase === "arriving"
                    ? { rotateY: 0, opacity: 1 }
                    : coverPhase === "lifting"
                    ? { rotateY: -8, opacity: 1 }
                    : coverPhase === "opening"
                    ? { rotateY: -170, opacity: 1 }
                    : /* settling */
                      { rotateY: -170, opacity: 0 }
                }
                exit={{ opacity: 0 }}
                transition={
                  coverPhase === "arriving"
                    ? { duration: 0.3 }
                    : coverPhase === "lifting"
                    ? { ...coverSpring, duration: 0.35 }
                    : coverPhase === "opening"
                    ? { ...coverSpring, duration: 1.1 }
                    : /* settling → fast fade */
                      { opacity: { duration: 0.25 } }
                }
                onAnimationComplete={() => handleCoverAnimComplete(coverPhase)}
              >
                {/* Front: book cover with cloth texture */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", display: "flex", justifyContent: "center" }}>
                  <Leaf single>
                    <div className="ml-cover ml-cover-cloth ml-cover-worn" style={{ background: book.coverColor, height: "100%" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                        background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), transparent)",
                      }} />
                      <div className="ml-cover-rule" />
                      <div className="ml-cover-mark">MOVIE LOG</div>
                      <div style={{ flex: 1 }} />
                      <div className="ml-cover-title" style={{ marginBottom: 8 }}>{book.year}</div>
                      <div className="ml-cover-rule" />
                      <div style={{ flex: 1 }} />
                    </div>
                  </Leaf>
                </div>
                {/* Back: endpaper */}
                <div style={{
                  position: "absolute", inset: 0, backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)", display: "flex", justifyContent: "center",
                }}>
                  <div className="ml-leaf ml-leaf--single ml-endpaper"
                    style={{ minHeight: 660 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorate tray with slide-up animation */}
      <AnimatePresence>
        {decorate && (
          <motion.div
            key="deco-tray"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="ml-tray"
          >
            {[["move", <Move size={11} key="m" />], ["draw", <Pencil size={11} key="d" />],
              ["erase", <Eraser size={11} key="e" />], ["sticker", <Sticker size={11} key="s" />]
            ].map(([t, icon]) => (
              <button key={t} className={"ml-tray-tool" + (tool === t ? " ml-tray-tool--on" : "")}
                onClick={() => setTool(t)} type="button">{icon} {t}</button>
            ))}
            <span style={{ width: 1, height: 20, background: "#44444c" }} />
            {INK_COLORS.map((c) => (
              <span key={c} className={"ml-swatch" + (color === c ? " ml-swatch--on" : "")}
                style={{ background: c }} onClick={() => { setColor(c); if (tool !== "erase") setTool("draw"); }} />
            ))}
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool("draw"); }}
              style={{ width: 22, height: 22, border: "none", background: "none", cursor: "pointer" }} title="Custom colour" />
            <input type="range" min="1" max="14" value={width} onChange={(e) => setWidth(Number(e.target.value))}
              title="Stroke width" style={{ width: 70 }} />
            <button className="ml-tray-tool" onClick={clearDrawings} type="button" title="Clear this page's ink">
              <Trash2 size={11} /> clear ink
            </button>
            <span style={{ width: 1, height: 20, background: "#44444c" }} />
            {STICKERS.map((em) => (
              <span key={em} className="ml-tray-em"
                style={{ outline: picked === em ? "2px solid var(--mustard)" : "none" }}
                onClick={() => { setPicked(em); setTool("sticker"); }}
                title="Pick, then click the page to place">{em}</span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page indicator */}
      <div className="ml-page-ind">
        <button className="ml-btn" style={{ borderColor: "#55555d", color: "#edebe4" }}
          onClick={() => go(-1)} type="button"><ChevronLeft size={13} /></button>
        <span>{idx + 1} / {pages.length} · {cur.type.toUpperCase()}</span>
        <button className="ml-btn" style={{ borderColor: "#55555d", color: "#edebe4" }}
          onClick={() => go(1)} type="button"><ChevronRight size={13} /></button>
      </div>
    </div>
  );
}
