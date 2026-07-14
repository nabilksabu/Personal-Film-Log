# Movie Log

A beautiful, physical-book styled personal film journal. Log every movie you watch, organized into yearly "books" on a virtual wood-grain shelf. Rate films, track rewatches, note formats, customize book cover colors, draw or place stickers on pages, and keep a yearly watchlist.

Designed with a premium skeletal aesthetic featuring smooth 3D animations for desktop and a swipe-friendly card UI for mobile.

---

## Features

- **Virtual Shelf View** — Books are displayed as realistic spines with deterministic heights, width, colors, and tilts. Includes a **Last-Logged Ticket Stub** showing your most recent watch.
- **Cinematic Book Opening** — Experience a smooth 3D cover lifting and swinging open animation when opening any journal.
- **Flawless 3D Page Turns (PC)** — A mathematically correct double-sided page leaf rotation around the center spine. Unlocks realistic depth shadow curls and paper creases.
- **Mobile-Exclusive Card UI** — Seamlessly adapts to mobile viewports. On phones, it renders single centered cards with horizontal swipe transitions and touch-friendly targets.
- **Statistics Summary** — The book title page displays real-time statistics (total movies, average rating, theater vs home counts, and rewatch metrics).
- **Decorate & Doodle** — Canvas drawing overlay with freehand sketching and draggable/resizable emoji stickers on the cover, title, and back pages.
- **JSON Backup & Import** — Complete data backups in JSON format to save, share, or download your journal so you never lose your logs.
- **Browser Storage Protection Guard** — Requests browser storage persistence (`navigator.storage.persist()`) through a warning banner, preventing the browser from wiping your local storage when disk space is low.
- **Keyboard Navigation & Global Shortcuts** — Full control via keybinds on PC (deactivates when typing in text inputs).

---

## Keyboard Shortcuts (PC)

When viewing a book:
* `ArrowRight` / `ArrowLeft` — Turn pages forward / backward.
* `Escape` — Close the book and return to the main shelf.
* `N` — Instantly create a new movie entry.
* `D` — Toggle the stickers and drawing Decorate tray.
* `Delete` or `Backspace` — Prompt to delete the current film log (on PC, safely asks which page's entry you wish to remove with dual-confirmation).

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed.

### Setup and Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the App:**
   Open the local address printed in the terminal (usually `http://localhost:5173`) in your web browser.

### Other Commands

* Build production bundle (outputs to `dist/`):
  ```bash
  npm run build
  ```
* Preview the production build locally:
  ```bash
  npm run preview
  ```

---

## Tech Stack

* **React 18** + **Vite**
* **React Router Dom 6** (using HashRouter for serverless deployment)
* **Framer Motion** for 3D page flips, cover-lifts, and mobile slide animations
* **React Sketch Canvas** + **React Rnd** for doodles and sticker positioning
* **Lucide React** for premium vector iconography
* **CSS** (Vanilla CSS for maximum control and custom typography)
* **Fonts:** Playfair Display (Serif headers), Caveat (Handwriting doodle details), Space Mono (Monospace statistics and labels), Archivo (Sans-serif body)

---

## Project Structure

```
src/
  main.jsx                  Entry point (wraps App in HashRouter)
  App.jsx                   Routes, local storage persistence, JSON import/export
  index.css                 Design tokens, 3D leaf folds, desk styling, responsiveness
  lib/
    constants.js            Design palette, HSL values, default stickers, and colors
    models.js               blankEntry/blankBook models, rewatch detection, storage helpers
  components/
    Shelf.jsx               Main shelf layout, favorites, ticket stub, and storage guard
    BookViewer.jsx          Double-page PC spread / Single-page Mobile card routing & flip loops
    EntryCard.jsx           Diary log input fields, multi-aspect-chips, and rewatch stamps
    StarRating.jsx          Interactive half-star rating widget (click again to toggle to 0)
    Checkbox.jsx            Accessible keyboard checkbox
    Chips.jsx               Format and aspect ratios tag selectors
    Watchlist.jsx           Togglable yearly watchlist
    DecorateLayer.jsx       Framer drag stickers and React Sketch canvas wrapper
```

---

## Data Model

Each year book contains:
* `year` (string)
* `name` (string, owner's name)
* `coverColor` (hex color)
* `entries[]` — movie log entries (movie title, director, date watched, rating, aspects, formats, notes, tags)
* `watchlist[]` — watch targets for the year
* `deco` — doodles and sticker locations

All data is safely stored in the browser's persistent storage under the `movielog:v1` key.

---

## Deployment

Deploy directly to **Vercel** in seconds:
```bash
# Install and log in to Vercel CLI
npx vercel login

# Deploy production bundle
npx vercel --prod
```
