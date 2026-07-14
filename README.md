# Movie Log

A personal film journal — log every movie you watch, organized into yearly "books" on a virtual shelf. Rate films, track first watches vs. rewatches, note formats and aspect ratios, keep a watchlist, and decorate book covers with stickers and doodles.

## Features

- **Shelf view** — yearly books displayed as book spines with varied colors, heights, and tilt for a hand-arranged look, resting on a wood-grain shelf with knot-mark texture
- **Last-logged ticket stub** — a torn-edge, stamped ticket highlighting the most recently logged film
- **Book viewer** — page-flip animation between cover, title page, entry spreads, watchlist, and back cover
- **Entry cards** — movie title, year, date watched, director, star rating (half-star precision), aspect ratio (multi-select), format tags (IMAX, 70MM, Dolby Vision, etc.), and checkboxes for in-theater/at-home/alone/first-watch/rewatch
- **Auto first-watch detection** — the first time you log a movie it's marked "First Watch"; subsequent entries for the same title are automatically marked "Rewatch"
- **Decorate layer** — freehand sketching and draggable/resizable emoji stickers on cover, title, and back pages
- **Letterboxd import** — import a Letterboxd diary CSV export directly into yearly books
- **Local persistence** — everything is saved to `localStorage`, no backend required

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Other commands

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Tech Stack

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [react-router-dom](https://reactrouter.com/) (hash-based routing, so it works without a server)
- [framer-motion](https://www.framer.com/motion/) for page-flip and cover-open animations
- [react-sketch-canvas](https://www.npmjs.com/package/react-sketch-canvas) + [react-rnd](https://www.npmjs.com/package/react-rnd) for the decorate layer
- [papaparse](https://www.papaparse.com/) for CSV import
- [lucide-react](https://lucide.dev/) for icons
- Vanilla CSS (no Tailwind) — styles live in `src/index.css`
- Fonts: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (serif headings), [Caveat](https://fonts.google.com/specimen/Caveat) (handwriting accents), [Space Mono](https://fonts.google.com/specimen/Space+Mono) (labels/mono), [Archivo](https://fonts.google.com/specimen/Archivo) (body)

## Project Structure

```
src/
  main.jsx                  entry point (React root + HashRouter)
  App.jsx                   routes, book state, persistence, CSV import
  index.css                 all styles
  lib/
    constants.js             design tokens, option lists, spine color palette
    models.js                data helpers, localStorage load/save, first-watch logic
  components/
    Shelf.jsx                home view — shelf of book spines, last-logged ticket, top favorites
    BookViewer.jsx           full book: cover, title, entries, watchlist, back — with page-flip
    EntryCard.jsx             single movie entry, with auto-shrinking title field
    StarRating.jsx           half-star precision rating widget
    Checkbox.jsx              reusable labeled checkbox
    Chips.jsx                 single/multi-select chip row (aspect ratio, format)
    Watchlist.jsx              "movies to watch" list for a book
    DecorateLayer.jsx          sketch canvas + draggable stickers overlay
```

## Data Model

Each book (keyed by year) contains:

- `year`, `name`, `coverColor`
- `entries[]` — individual movie logs (title, rating, dates, formats, aspect ratios, watch flags, notes)
- `watchlist[]` — planned movies for that year
- `deco` — per-page decoration data (stickers + ink strokes) for cover/title/back

All data is stored under the `movielog:v1` key in `localStorage`.

## Importing from Letterboxd

Export your diary from Letterboxd as CSV, then use the **Import Letterboxd** button on the shelf. Entries are grouped into yearly books by watch date, and first-watch/rewatch status is derived automatically from repeated titles.
