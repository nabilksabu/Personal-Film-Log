import { useRef, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import StarRating from "./StarRating.jsx";
import Checkbox from "./Checkbox.jsx";
import { ChipRow } from "./Chips.jsx";
import { ASPECT_RATIOS, FORMATS, PAGE_LINE } from "../lib/constants.js";

function Cell({ label, children, right, style }) {
  return (
    <div className={"ml-cell" + (right ? " ml-cell--r" : "")} style={style}>
      <div className="ml-label">{label}</div>
      {children}
    </div>
  );
}

function Field({ value, onChange, placeholder }) {
  return (
    <input className="ml-in" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  );
}

/* Auto-shrink title font to fit available width */
function AutoShrinkField({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(20);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = 20;
    el.style.fontSize = size + "px";
    while (el.scrollWidth > el.clientWidth + 2 && size > 11) {
      size -= 0.5;
      el.style.fontSize = size + "px";
    }
    setFontSize(size);
  }, [value]);

  return (
    <input ref={ref} className="ml-in"
      style={{ fontSize, transition: "font-size 0.2s ease" }}
      value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} />
  );
}

export default function EntryCard({ entry, onPatch, onDelete }) {
  const p = (patch) => onPatch(entry.id, patch);

  /* Multi-select aspect ratios */
  const toggleAspect = (a) => {
    const current = entry.aspects || [];
    p({ aspects: current.includes(a) ? current.filter((x) => x !== a) : [...current, a] });
  };
  const toggleFmt = (f) =>
    p({ formats: entry.formats.includes(f) ? entry.formats.filter((x) => x !== f) : [...entry.formats, f] });

  return (
    <div className="ml-entry ml-entry-diary">
      <div className="ml-margin-line" aria-hidden="true" />

      <span className="ml-num-circle" aria-hidden="true">{entry.n}</span>

      {entry.rewatch && (
        <div className="ml-rewatch-stamp" aria-label="Rewatch">
          REWATCH
        </div>
      )}

      <div className="ml-grid" style={{ gridTemplateColumns: "1fr 74px 118px" }}>
        <Cell label="Movie:" right>
          <AutoShrinkField value={entry.movie} onChange={(v) => p({ movie: v })} placeholder="title" />
        </Cell>
        <Cell label="Year:" right>
          <Field value={entry.year} onChange={(v) => p({ year: v })} placeholder="—" />
        </Cell>
        <Cell label="Date Watched:">
          <Field value={entry.dateWatched} onChange={(v) => p({ dateWatched: v })} placeholder="mm/dd/yy" />
        </Cell>
      </div>

      <div className="ml-grid" style={{ gridTemplateColumns: "1fr 150px", borderTop: "none" }}>
        <Cell label="Directed By:" right>
          <Field value={entry.director} onChange={(v) => p({ director: v })} placeholder="director" />
        </Cell>
        <Cell label="My Rating:">
          <div style={{ paddingTop: 2 }}>
            <StarRating value={entry.rating} onChange={(v) => p({ rating: v })} />
          </div>
        </Cell>
      </div>

      <ChipRow label="Aspect Ratio:" options={ASPECT_RATIOS}
        isOn={(o) => (entry.aspects || []).includes(o)} onToggle={toggleAspect} />
      <ChipRow label="Format:" options={FORMATS}
        isOn={(o) => entry.formats.includes(o)} onToggle={toggleFmt} />

      <div className="ml-checks">
        <Checkbox label="In Theater" on={entry.inTheater} onToggle={() => p({ inTheater: !entry.inTheater })} />
        <Checkbox label="First Watch" on={entry.firstWatch} onToggle={() => p({ firstWatch: !entry.firstWatch })} />
        <Checkbox label="Alone" on={entry.alone} onToggle={() => p({ alone: !entry.alone })} />
        <Checkbox label="At Home" on={entry.atHome} onToggle={() => p({ atHome: !entry.atHome })} />
        <Checkbox label="Rewatch" on={entry.rewatch} onToggle={() => p({ rewatch: !entry.rewatch })} />
        <label className="ml-check" style={{ gap: 4 }}>
          <span className="ml-label" style={{ fontSize: 9 }}>With:</span>
          <input className="ml-in" style={{ fontSize: 16 }} value={entry.withText}
            onChange={(e) => p({ withText: e.target.value })} placeholder="—" />
        </label>
      </div>

      <div className="ml-notes-field" style={{ padding: "6px 8px 0", borderBottom: `1px solid ${PAGE_LINE}` }}>
        <div className="ml-label">Notes:</div>
        <textarea className="ml-in ml-notes" value={entry.notes}
          onChange={(e) => p({ notes: e.target.value })} placeholder="thoughts…" />
      </div>

      <button className="ml-del" title="Delete entry" onClick={onDelete} type="button">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
