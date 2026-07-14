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

export const blankBook = (year) => ({
  year: String(year),
  name: "",
  coverColor: "#E8A93B",
  entries: [],
  watchlist: [],
  deco: {},
});

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
