const STORE_KEY = "movielog:v1";

export const uid = () => Math.random().toString(36).slice(2, 9);

export const blankEntry = (n) => ({
  id: uid(),
  n,
  movie: "",
  year: "",
  dateWatched: "",
  director: "",
  rating: 0,
  aspects: [],
  formats: [],
  inTheater: false,
  atHome: false,
  firstWatch: false,
  rewatch: false,
  alone: false,
  withText: "",
  notes: "",
});

export const blankDeco = () => ({ stickers: [], strokes: [] });

export function getBookColor(book) {
  if (book.coverColor && book.coverColor !== "#E8A93B") return book.coverColor;
  let h = 0;
  const yr = String(book.year || "");
  for (let i = 0; i < yr.length; i++) h = ((h << 5) - h + yr.charCodeAt(i)) | 0;
  const SPINE_COLORS = [
    "#7B2D3B", "#1B3F5C", "#2D5016", "#6B2D5B", "#B8860B",
    "#4A3728", "#1A4A4A", "#8B2500", "#2F4F4F", "#CD853F",
    "#556B2F", "#483D8B", "#800020", "#4B6F44", "#7B3F00",
    "#36454F", "#5C3D2E", "#2D4A3E", "#6B4423", "#3B3F00"
  ];
  return SPINE_COLORS[Math.abs(h) % SPINE_COLORS.length];
}

export const blankBook = (year) => ({
  year: String(year),
  name: "",
  coverColor: getBookColor({ year }),
  entries: [],
  watchlist: [],
  deco: {},
});

export function parseRating(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const num = parseFloat(val);
  if (!isNaN(num)) return num;
  let rating = 0;
  for (let i = 0; i < val.length; i++) {
    const char = val[i];
    if (char === "★") rating += 1;
    else if (char === "½") rating += 0.5;
  }
  return rating;
}

export function fmtDate(raw) {
  if (!raw) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return raw;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable */
  }
  return null;
}

export function saveData(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function parseWatchDate(d) {
  if (!d) return new Date(0);
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(d);
  if (m) {
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    return new Date(year, parseInt(m[1]) - 1, parseInt(m[2]));
  }
  return new Date(d);
}

export function computeFirstWatch(books) {
  const all = [];
  for (const [yr, book] of Object.entries(books)) {
    for (const entry of book.entries) {
      all.push({ yr, entry });
    }
  }
  const groups = {};
  for (const { yr, entry } of all) {
    const key = (entry.movie || "").trim().toLowerCase();
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ yr, entry });
  }
  const patches = {};
  for (const group of Object.values(groups)) {
    if (group.length === 1) {
      patches[group[0].entry.id] = { firstWatch: true, rewatch: false };
    } else {
      const sorted = [...group].sort(
        (a, b) => parseWatchDate(a.entry.dateWatched) - parseWatchDate(b.entry.dateWatched),
      );
      sorted.forEach((item, i) => {
        patches[item.entry.id] =
          i === 0
            ? { firstWatch: true, rewatch: false }
            : { firstWatch: false, rewatch: true };
      });
    }
  }
  const result = {};
  for (const [yr, book] of Object.entries(books)) {
    result[yr] = {
      ...book,
      entries: book.entries.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)),
    };
  }
  return result;
}

export function migrateEntry(entry) {
  const migrated = { ...entry };
  if (migrated.aspect !== undefined && !migrated.aspects) {
    migrated.aspects = migrated.aspect ? [migrated.aspect] : [];
    delete migrated.aspect;
  }
  if (!Array.isArray(migrated.aspects)) {
    migrated.aspects = [];
  }
  return migrated;
}
