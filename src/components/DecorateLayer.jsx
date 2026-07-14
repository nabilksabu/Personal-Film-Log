import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Rnd } from "react-rnd";
import { X, RotateCw } from "lucide-react";
import { uid } from "../lib/models.js";

export default function DecorateLayer({ deco, onChange, active, tool, color, width, picked }) {
  const canvasRef = useRef(null);

  /* ── Load persisted strokes on mount ── */
  useEffect(() => {
    const c = canvasRef.current;
    if (c && Array.isArray(deco.strokes) && deco.strokes.length > 0) {
      c.loadPaths(deco.strokes);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Toggle erase mode ── */
  useEffect(() => {
    const c = canvasRef.current;
    if (c) c.eraseMode(tool === "erase");
  }, [tool]);

  /* ── Persist strokes after each draw ── */
  const persistStrokes = async () => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const paths = await c.exportPaths();
      onChange({ ...deco, strokes: paths });
    } catch {
      /* keep in-canvas state */
    }
  };

  /* ── Sticker helpers ── */
  const stickers = deco.stickers || [];
  const updSticker = (id, patch) =>
    onChange({ ...deco, stickers: stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const delSticker = (id) =>
    onChange({ ...deco, stickers: stickers.filter((s) => s.id !== id) });

  /* ── Place sticker with imperfect rotation ── */
  const placeSticker = (e) => {
    if (tool !== "sticker" || !picked) return;
    const r = e.currentTarget.getBoundingClientRect();
    // Random rotation between -5 and +5, never exactly 0
    let rot = Math.random() * 10 - 5;
    if (Math.abs(rot) < 0.5) rot = rot >= 0 ? 1.2 : -1.2;
    onChange({
      ...deco,
      stickers: [
        ...stickers,
        {
          id: uid(),
          emoji: picked,
          x: e.clientX - r.left - 24,
          y: e.clientY - r.top - 24,
          w: 48, h: 48,
          rot,
          isNew: true, // flag for landing animation
        },
      ],
    });
  };

  const drawing = active && (tool === "draw" || tool === "erase");

  /* ── Spring config for sticker landing ── */
  const stickerSpring = { type: "spring", stiffness: 300, damping: 20 };

  return (
    <div
      className={"ml-deco" + (drawing ? " ml-deco-drawing" : "")}
      onClick={placeSticker}
      style={{
        pointerEvents: active ? "auto" : "none",
        cursor: tool === "sticker" && active ? "copy" : "default",
      }}
    >
      {/* Canvas for drawing / erasing */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: drawing ? "auto" : "none" }}>
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="100%"
          canvasColor="transparent"
          strokeColor={color}
          strokeWidth={width}
          eraserWidth={18}
          onStroke={persistStrokes}
          style={{ border: "none", borderRadius: 0 }}
        />
      </div>

      {/* Stickers */}
      {/* Stickers */}
      {stickers.map((s) => {
        const isImg = s.emoji && (s.emoji.startsWith("data:image/") || s.emoji.startsWith("blob:") || s.emoji.startsWith("http"));
        const content = isImg ? (
          <img src={s.emoji} alt="sticker" style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }} />
        ) : (
          s.emoji
        );

        return active && tool === "move" ? (
          <Rnd
            key={s.id}
            size={{ width: s.w, height: s.h }}
            position={{ x: s.x, y: s.y }}
            bounds="parent"
            lockAspectRatio
            onDragStop={(_, d) => updSticker(s.id, { x: d.x, y: d.y })}
            onResizeStop={(_, _dir, ref, _delta, pos) =>
              updSticker(s.id, { w: parseFloat(ref.style.width), h: parseFloat(ref.style.height), x: pos.x, y: pos.y })
            }
            style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, overflow: "visible" }}
          >
            <div style={{
              transform: `rotate(${s.rot}deg)`,
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isImg ? undefined : s.h * 0.72, lineHeight: 1,
              filter: "drop-shadow(1px 3px 4px rgba(0,0,0,0.25))",
            }}>{content}</div>
            <button className="ml-sticker-x" 
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); delSticker(s.id); }} title="Remove"><X size={11} /></button>
            <button className="ml-sticker-x" style={{ left: -9, right: "auto", background: "#3B6FE8" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); updSticker(s.id, { rot: (s.rot + 15) % 360 }); }} title="Rotate"><RotateCw size={10} /></button>
          </Rnd>
        ) : s.isNew ? (
          /* Sticker with "peel and place" landing animation */
          <motion.div
            key={s.id}
            initial={{ scale: 1.4, opacity: 0, rotate: (s.rot || 0) + 10 }}
            animate={{ scale: 1, opacity: 1, rotate: s.rot || 0 }}
            transition={stickerSpring}
            onAnimationComplete={() => {
              // Clear the isNew flag after animation finishes
              updSticker(s.id, { isNew: false });
            }}
            style={{
              position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h,
              display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
              fontSize: isImg ? undefined : s.h * 0.72, lineHeight: 1,
              filter: "drop-shadow(1px 3px 4px rgba(0,0,0,0.25))",
            }}
          >{content}</motion.div>
        ) : (
          /* Static sticker (no animation) */
          <div key={s.id} style={{
            position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h,
            display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
            transform: `rotate(${s.rot}deg)`,
            fontSize: isImg ? undefined : s.h * 0.72, lineHeight: 1,
            filter: "drop-shadow(1px 3px 4px rgba(0,0,0,0.25))",
          }}>{content}</div>
        );
      })}
    </div>
  );
}
