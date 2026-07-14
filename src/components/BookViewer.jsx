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
import { STICKERS, INK_COLORS, SPINE_COLORS } from "../lib/constants.js";

/* ── Reduced-motion check ── */
const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Leaf component ── */
const Leaf = ({ children, side }) => {
  const sideClass =
    side === "left"
      ? " ml-leaf-l"
      : side === "right"
      ? " ml-leaf-r"
      : " ml-leaf--single";
  return <div className={"ml-leaf" + sideClass}>{children}</div>;
};

export default function BookViewer({ book, onClose, onUpdate }) {
  /* ── Local state & Mobile Detection ── */
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
  const [isMobile, setIsMobile] = useState(false);

  const stageRef = useRef(null);
  const dragX = useMotionValue(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamically scale pageIdx to keep place when viewport size flips
  const lastIsMobile = useRef(isMobile);
  useEffect(() => {
    if (lastIsMobile.current !== isMobile) {
      if (isMobile) {
        setPageIdx((prev) => prev * 2);
      } else {
        setPageIdx((prev) => Math.floor(prev / 2));
      }
      lastIsMobile.current = isMobile;
    }
  }, [isMobile]);

  /* ── Cinematic book-open sequence ── */
  useEffect(() => {
    if (prefersReduced) return;
    const t1 = setTimeout(() => setCoverPhase("lifting"), 300);
    const t2 = setTimeout(() => setCoverPhase("opening"), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleCoverAnimComplete = useCallback((phase) => {
    if (phase === "opening") setCoverPhase("settling");
    else if (phase === "settling") setCoverPhase("open");
  }, []);

  /* ── Build page lists ── */
  const pairs = [];
  for (let i = 0; i < book.entries.length; i += 2)
    pairs.push(book.entries.slice(i, i + 2));
  if (pairs.length === 0) pairs.push([]);

  // PC Spreads
  const spreads = [
    { id: "cover", left: null, right: { type: "cover" } },
    { id: "title", left: { type: "endpaper" }, right: { type: "title" } },
    ...pairs.map((items, j) => ({
      id: "spread-" + j,
      left: items[0] || { type: "new-entry" },
      right: items[1] || (items[0] ? { type: "new-entry" } : null),
    })),
    { id: "watchlist", left: { type: "watchlist" }, right: { type: "endpaper" } },
    { id: "back", left: { type: "back" }, right: null },
  ];

  // Mobile Pages
  const mobilePages = [
    { type: "cover", id: "cover" },
    { type: "title", id: "title" },
    ...book.entries,
    { type: "new-entry", id: "new-entry" },
    { type: "watchlist", id: "watchlist" },
    { type: "back", id: "back" },
  ];

  const activePages = isMobile ? mobilePages : spreads;
  const idx = Math.max(0, Math.min(activePages.length - 1, pageIdx));
  const cur = activePages[idx];

  /* ── Entry operations ── */
  const patchEntry = (id, patch) =>
    onUpdate({ ...book, entries: book.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  
  const addEntry = () => {
    const len = book.entries.length;
    onUpdate({ ...book, entries: [...book.entries, blankEntry(len + 1)] });
    setFlipDir(1);
    setPageIdx(isMobile ? len + 2 : 2 + Math.floor(len / 2));
  };
  
  const delEntry = (id) => {
    const kept = book.entries.filter((e) => e.id !== id).map((e, i) => ({ ...e, n: i + 1 }));
    onUpdate({ ...book, entries: kept });
  };

  /* ── Decoration ── */
  const deco = book.deco?.[cur.id] || blankDeco();
  const setDeco = (d) => onUpdate({ ...book, deco: { ...book.deco, [cur.id]: d } });
  const clearDrawings = () => { setDeco({ ...deco, strokes: [] }); setClearKey((k) => k + 1); };

  /* ── Focus stage ── */
  useEffect(() => {
    if (stageRef.current) stageRef.current.focus({ preventScroll: true });
  }, [idx]);

  /* ── Render single page leaf ── */
  const renderLeaf = (leaf, side) => {
    if (!leaf) {
      const isClosedBook = cur.id === "cover" || cur.id === "back";
      if (isClosedBook) {
        return <div className="ml-leaf-empty" style={{ minHeight: 660, background: "transparent" }} />;
      }
      return (
        <Leaf side={side}>
          <div style={{ minHeight: 660 }} />
        </Leaf>
      );
    }

    const sideClass = side === "left" ? " ml-leaf-l" : side === "right" ? " ml-leaf-r" : " ml-leaf-single";

    if (leaf.type === "cover") {
      return (
        <Leaf single={side === "single"}>
          <div className={"ml-cover" + sideClass} style={{ background: book.coverColor, minHeight: 660 }}>
            {side === "right" && (
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: "linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), transparent)",
              }} />
            )}
            <div className="ml-cover-rule" />
            <div className="ml-cover-mark">MOVIE LOG</div>
            <div style={{ flex: 1 }} />
            <div className="ml-cover-title" style={{ marginBottom: 8 }}>{book.year}</div>
            <div className="ml-cover-rule" />
            <div style={{ flex: 1 }} />
          </div>
        </Leaf>
      );
    }

    if (leaf.type === "back") {
      return (
        <Leaf single={side === "single"}>
          <div className={"ml-cover" + sideClass} style={{ background: book.coverColor, minHeight: 660 }}>
            {side === "left" && (
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
                background: "linear-gradient(-90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.08), transparent)",
              }} />
            )}
            <div style={{ flex: 1 }} />
            <div className="ml-cover-mark" style={{ opacity: 0.6, textAlign: "center" }}>
              — {book.entries.length} films · {book.year} —
            </div>
            <div style={{ flex: 1 }} />
          </div>
        </Leaf>
      );
    }

    if (leaf.type === "endpaper") {
      return (
        <Leaf single={side === "single"}>
          <div className={"ml-endpaper" + sideClass} style={{ minHeight: 660 }} />
        </Leaf>
      );
    }

    if (leaf.type === "title") {
      const totalFilms = book.entries.filter((e) => e.movie).length;
      const ratedFilms = book.entries.filter((e) => e.movie && e.rating > 0);
      const avgRating = ratedFilms.length
        ? (ratedFilms.reduce((sum, e) => sum + e.rating, 0) / ratedFilms.length).toFixed(1)
        : "0.0";
      const theaterCount = book.entries.filter((e) => e.movie && e.inTheater).length;
      const homeCount = book.entries.filter((e) => e.movie && e.atHome).length;
      const rewatchCount = book.entries.filter((e) => e.movie && e.rewatch).length;

      return (
        <Leaf single={side === "single"}>
          <div className={"ml-title-page" + sideClass} style={{ padding: "26px 28px", minHeight: 660, position: "relative" }}>
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

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="ml-label">Journal Cover Color:</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {SPINE_COLORS.slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdate({ ...book, coverColor: c })}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: c,
                        border: book.coverColor === c ? "2.5px solid var(--ink)" : "1px solid var(--line)",
                        cursor: "pointer",
                        transition: "transform 0.1s",
                        padding: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={book.coverColor || "#E8A93B"}
                    onChange={(e) => onUpdate({ ...book, coverColor: e.target.value })}
                    style={{ width: 22, height: 22, border: "none", background: "none", cursor: "pointer", padding: 0 }}
                    title="Custom Cover Color"
                  />
                </div>
              </div>

              <div style={{ marginTop: 8, borderTop: "1px dashed var(--line)", paddingTop: 16 }}>
                <div className="ml-label">Journal Stats:</div>
                <div className="ml-grid" style={{ gridTemplateColumns: "1fr 1fr", borderTop: "none", marginTop: 8 }}>
                  <div style={{ padding: "4px 8px" }}>
                    <div className="ml-label" style={{ fontSize: 8 }}>Total Films</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700 }}>
                      {totalFilms}
                    </div>
                  </div>
                  <div style={{ padding: "4px 8px" }}>
                    <div className="ml-label" style={{ fontSize: 8 }}>Avg Rating</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700 }}>
                      {avgRating} ★
                    </div>
                  </div>
                </div>
                <div className="ml-grid" style={{ gridTemplateColumns: "1fr 1fr", borderTop: "none" }}>
                  <div style={{ padding: "4px 8px" }}>
                    <div className="ml-label" style={{ fontSize: 8 }}>Theater / Home</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                      🍿 {theaterCount} / 🏠 {homeCount}
                    </div>
                  </div>
                  <div style={{ padding: "4px 8px" }}>
                    <div className="ml-label" style={{ fontSize: 8 }}>Rewatches</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
                      🔄 {rewatchCount} films
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Leaf>
      );
    }

    if (leaf.type === "watchlist") {
      return (
        <Leaf single={side === "single"}>
          <div className={sideClass}>
            <Watchlist year={book.year} list={book.watchlist}
              onChange={(wl) => onUpdate({ ...book, watchlist: wl })} />
          </div>
        </Leaf>
      );
    }

    if (leaf.type === "new-entry") {
      return (
        <Leaf single={side === "single"}>
          <div className={sideClass} style={{ display: "flex", width: "100%", height: "100%", minHeight: 660 }}>
            <button onClick={addEntry} type="button" style={{
              width: "100%", minHeight: 660, border: "none", background: "transparent",
              color: "var(--ink-soft)", cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Plus size={26} /><span className="ml-label">Add entry</span>
            </button>
          </div>
        </Leaf>
      );
    }

    // Leaf is a diary entry card!
    return (
      <Leaf single={side === "single"}>
        <div className={sideClass}>
          <EntryCard entry={leaf} onPatch={patchEntry} onDelete={() => delEntry(leaf.id)} />
        </div>
      </Leaf>
    );
  };

  /* ── Render double spread (PC) or single page (Mobile) ── */
  const renderPage = (page) => {
    if (isMobile) {
      return renderLeaf(page, "single");
    } else {
      return (
        <div style={{ display: "flex", width: "100%", position: "relative" }}>
          <div className="ml-page-half" style={{ width: "50%" }}>
            {renderLeaf(page.left, "left")}
          </div>
          {page.left && page.right && (
            <div className="ml-gutter" aria-hidden="true" style={{ zIndex: 12 }} />
          )}
          <div className="ml-page-half" style={{ width: "50%" }}>
            {renderLeaf(page.right, "right")}
          </div>
        </div>
      );
    }
  };

  /* ── Navigate with page-flip ── */
  const go = useCallback((dir) => {
    if (isFlipping) return;
    const nextIdx = Math.max(0, Math.min(activePages.length - 1, idx + dir));
    if (nextIdx === idx) return;
    setExitSnapshot(activePages[idx]);
    setFlipDir(dir);
    setPageIdx(nextIdx);
    setIsFlipping(true);
    setTimeout(() => { setIsFlipping(false); setExitSnapshot(null); }, 650);
  }, [isFlipping, idx, activePages]);

  /* ── Keyboard navigation & Global shortcuts ── */
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.getAttribute("contenteditable") === "true"
      )) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        addEntry();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDecorate((dec) => !dec);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (isMobile) {
          if (cur && cur.id && cur.movie !== undefined) {
            if (confirm(`Delete "${cur.movie || "Untitled Film"}"?`)) {
              delEntry(cur.id);
            }
          }
        } else {
          const hasLeft = cur && cur.left && cur.left.id && cur.left.movie !== undefined;
          const hasRight = cur && cur.right && cur.right.id && cur.right.movie !== undefined;
          if (hasLeft && hasRight) {
            if (confirm(`Delete right entry "${cur.right.movie || "Untitled Film"}"?`)) {
              delEntry(cur.right.id);
            } else if (confirm(`Delete left entry "${cur.left.movie || "Untitled Film"}"?`)) {
              delEntry(cur.left.id);
            }
          } else if (hasLeft) {
            if (confirm(`Delete "${cur.left.movie || "Untitled Film"}"?`)) {
              delEntry(cur.left.id);
            }
          } else if (hasRight) {
            if (confirm(`Delete "${cur.right.movie || "Untitled Film"}"?`)) {
              delEntry(cur.right.id);
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [go, onClose, addEntry, isMobile, cur, delEntry]);

  /* ── Touch / swipe drag handler ── */
  const handleDragEnd = useCallback((_e, info) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > 60 || Math.abs(velocity.x) > 300) {
      if (offset.x < 0) go(1);
      else go(-1);
    }
  }, [go]);

  /* ── Spring and transition parameters ── */
  const coverSpring = { type: "spring", stiffness: 80, damping: 18 };
  const mobileSlideVariants = {
    initial: (dir) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="ml-viewer">
      {/* ARIA live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {`Page ${idx + 1} of ${activePages.length}`}
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
              
              {/* Main View Container */}
              <div style={{ display: "flex", width: "100%", visibility: (isFlipping && !isMobile) ? "hidden" : "visible" }}>
                {isMobile ? (
                  <AnimatePresence custom={flipDir} mode="popLayout">
                    <motion.div
                      key={idx}
                      custom={flipDir}
                      variants={mobileSlideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ width: "100%" }}
                    >
                      {renderPage(cur)}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  renderPage(cur)
                )}
              </div>

              {/* ── 3D Page Turn Overlay (PC Only) ── */}
              {isFlipping && exitSnapshot && !isMobile && (
                <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none", perspective: 2400 }}>
                  {/* Underlying left page */}
                  <div style={{ position: "absolute", left: 0, top: 0, width: "50%", bottom: 0 }}>
                    {renderLeaf(flipDir > 0 ? exitSnapshot.left : cur.left, "left")}
                  </div>
                  {/* Underlying right page */}
                  <div style={{ position: "absolute", left: "50%", top: 0, width: "50%", bottom: 0 }}>
                    {renderLeaf(flipDir > 0 ? cur.right : exitSnapshot.right, "right")}
                  </div>

                  {/* Flipping double-sided leaf */}
                  <motion.div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: flipDir > 0 ? "50%" : 0,
                      width: "50%",
                      transformStyle: "preserve-3d",
                      transformOrigin: flipDir > 0 ? "left center" : "right center",
                      zIndex: 25,
                    }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: flipDir > 0 ? -180 : 180 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    {/* Front face (old page facing screen) */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      zIndex: 2,
                      transform: "rotateY(0deg)",
                    }}>
                      {renderLeaf(flipDir > 0 ? exitSnapshot.right : exitSnapshot.left, flipDir > 0 ? "right" : "left")}
                    </div>

                    {/* Back face (new page facing back) */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      zIndex: 1,
                      transform: flipDir > 0 ? "rotateY(180deg)" : "rotateY(-180deg)",
                    }}>
                      {renderLeaf(flipDir > 0 ? cur.left : cur.right, flipDir > 0 ? "left" : "right")}
                    </div>
                  </motion.div>
                </div>
              )}

              <DecorateLayer key={cur.id + ":" + clearKey} deco={deco} onChange={setDeco}
                active={decorate} tool={tool} color={color} width={width} picked={picked} />
            </div>
          </motion.div>

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
        <span>{idx + 1} / {activePages.length}</span>
        <button className="ml-btn" style={{ borderColor: "#55555d", color: "#edebe4" }}
          onClick={() => go(1)} type="button"><ChevronRight size={13} /></button>
      </div>
    </div>
  );
}
