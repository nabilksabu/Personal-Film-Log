import { Plus, X } from "lucide-react";
import { uid } from "../lib/models.js";

export default function Watchlist({ year, list, onChange }) {
  const add = () => onChange([...list, { id: uid(), text: "", checked: false }]);
  const upd = (id, patch) =>
    onChange(list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const del = (id) => onChange(list.filter((r) => r.id !== id));

  return (
    <div className="ml-ruled ml-watchlist-page">
      <div className="ml-ruled-title ml-serif">Movies to Watch in {year}</div>
      {list.map((r) => (
        <div className="ml-wl-row ml-wl-hand" key={r.id}>
          <input
            className="ml-wl-in"
            value={r.text}
            placeholder="film…"
            onChange={(e) => upd(r.id, { text: e.target.value })}
          />
          <div
            className="ml-wl-check"
            role="checkbox"
            aria-checked={r.checked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                upd(r.id, { checked: !r.checked });
              }
            }}
            onClick={() => upd(r.id, { checked: !r.checked })}
            style={{ cursor: "pointer" }}
          >
            <span className={"ml-box ml-box--hand" + (r.checked ? " ml-box--on" : "")}>
              {r.checked && (
                <svg
                  width={10}
                  height={10}
                  viewBox="0 0 16 14"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7.5 L6 11 L13 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
          <button
            className="ml-del"
            style={{ position: "static", marginLeft: 6 }}
            onClick={() => del(r.id)}
            type="button"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button className="ml-btn ml-btn-quiet" style={{ marginTop: 12 }} onClick={add} type="button">
        <Plus size={12} /> Add row
      </button>
    </div>
  );
}
