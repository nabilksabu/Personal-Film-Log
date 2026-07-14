import { PAGE_LINE } from "../lib/constants.js";

function chipRotation(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = ((h << 3) - h + text.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 5) - 2.5) * 0.8; // range: roughly -2° to +2°
}

export function ChipRow({ label, options, isOn, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${PAGE_LINE}`, padding: "5px 8px" }}>
      <div className="ml-label">{label}</div>
      <div className="ml-chips">
        {options.map((o) => {
          const selected = isOn(o);
          const rotation = chipRotation(o) + (selected ? 1 : 0);
          return (
            <button
              key={o}
              type="button"
              className={
                "ml-chip" +
                (selected ? " ml-chip--on ml-chip--stamped" : "")
              }
              aria-pressed={selected}
              onClick={() => onToggle(o)}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
