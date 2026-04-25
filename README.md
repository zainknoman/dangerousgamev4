# ▒ ▒ ▒ DANGEROUS GAME ▒ ▒ ▒

> **A retro 2D side-scrolling action game built entirely in vanilla HTML5, CSS3, and JavaScript.**
> No build tools. No frameworks. No installation. Just open and play.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📸 Screenshots

> *Screenshots will be added here. The game features a CRT scanline aesthetic with retro pixel art, a HUD bar, parallax backgrounds, and neon-glow UI elements.*

| Main Menu | Gameplay | Level Editor |
|-----------|----------|--------------|
| *(placeholder)* | *(placeholder)* | *(placeholder)* |

---

## 🎮 Features

- **Side-scrolling platformer action** — Run, jump, shoot, throw grenades, fly with jetpack
- **5 enemy types + 2 Bosses** — Grunt, Heavy, Flyer, Jumper, Sniper, Boss-1 (12 HP), Boss-2 (30 HP)
- **3 game modes** — Story Mode, Roguelite (permadeath + boons), Daily Challenge (seeded)
- **Built-in Level Editor** — Paint tiles, play-test instantly, export/import JSON, share via URL
- **AI Level Generator** — Describe a theme and Claude generates a playable level automatically
- **Replay System** — Record your run, playback, export/share as base64 strings
- **6 Visual Themes** — Default, Neon City, Ice Cave, Desert Ruins, Deep Space, Toxic Swamp
- **Achievements & Leaderboard** — 15 unlockable achievements, top-10 local high scores
- **Live Config Admin** — Tweak game balance, colors, audio, enemies without touching code
- **Mobile Ready** — Auto-detects touch devices and shows on-screen controls
- **Zero external assets** — All sprites are procedural pixel art generated at runtime

---

## 🕹️ Gameplay Overview

You control a soldier navigating dangerous tile-based levels. Your mission on each level:

1. **Collect all trophies** (🏆) scattered throughout the level
2. **Find the key** (🗝️) to unlock the exit
3. **Reach the door** (🚪) to advance

Along the way, pick up weapons (pistol, machine gun), grenades, jetpacks, and extra lives. Avoid or defeat enemies, dodge spikes and lava, climb ladders, and ride moving platforms.

---

## 🎮 Controls

### Keyboard (Desktop)

| Action | Keys |
|--------|------|
| Move Left | `←` Arrow / `A` |
| Move Right | `→` Arrow / `D` |
| Run | Hold `Shift` |
| Jump | `Space` / `↑` Arrow / `W` |
| Shoot | `Ctrl` / `Z` |
| Grenade | `G` / `X` |
| Menu / Quit | `Esc` |
| God Mode (cheat) | `Q` |

### Touch (Mobile / Tablet)

Touch controls automatically appear on devices with coarse pointers:

- **D-Pad:** `◀` `▶` for movement
- **Action Buttons:** `JUMP` | `FIRE` | `NADE`

---

## 🚀 How to Run Locally

Because this is a pure client-side project, you only need to serve the files over HTTP.

### Option A: VS Code Live Server (Recommended)

1. Install the **"Live Server"** extension by Ritwick Dey.
2. Right-click `index.html` → **"Open with Live Server"**.
3. Opens automatically at `http://127.0.0.1:5500`.

### Option B: Python HTTP Server

```bash
cd dangerousgameV4.0

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000`.

### Option C: Direct Open (Limited)

Double-click `index.html`. Some features (fetching `game.config.json`) may be restricted by browser CORS policies when using `file://`, so HTTP serving is preferred.

---

## 🌐 How to Deploy

This project is 100% static files. Deploy to any static host:

| Platform | Method |
|----------|--------|
| **GitHub Pages** | Push to GitHub → Settings → Pages → Select branch |
| **Netlify** | Drag & drop folder into [Netlify Drop](https://app.netlify.com/drop) |
| **Vercel** | Import Git repo via dashboard (zero config) |
| **Surge.sh** | `npm i -g surge && surge` inside project folder |
| **Any Web Server** | Copy files to `public_html`, Nginx, Apache, etc. |

> **Note:** The AI Level Generator calls `https://api.anthropic.com/v1/messages`. For production, consider proxying this or disabling it if API access is restricted.

---

## 🛠 Tech Stack

- **HTML5 Canvas 2D** — All game rendering
- **CSS3** — CRT scanlines, neon glow effects, responsive layout
- **Vanilla JavaScript (ES6+)** — Game engine, physics, audio synthesis, state management
- **Web Audio API** — Procedural sound effects (no audio files)
- **localStorage** — Persistent config, high scores, achievements, replays
- **No build step** — No npm, webpack, bundler, or transpiler

---

## 📁 Folder Structure

```
dangerousgameV4.0/
├── index.html           # Main game: menu, gameplay, editor, leaderboard
├── game.js              # Core engine: physics, rendering, audio, AI, replay
├── levels.js            # Level tile grids, metadata, moving platform data
├── game.config.json     # Runtime balance config: stats, weapons, scoring, audio
├── style.css            # Game styles: CRT effects, HUD, editor, touch controls
│
├── admin.html           # Configuration admin panel (standalone page)
├── admin.js             # Admin logic: forms, diff viewer, theme manager
├── admin.css            # Admin styles: tabs, enemy cards, color pickers
│
├── game.js.bak          # Backup of game.js
└── index.html.bak       # Backup of index.html
```

---

## 📖 Additional Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Internal engine architecture, data flow, module breakdown
- **[ONBOARDING.md](ONBOARDING.md)** — Developer guide: modifying players, tiles, enemies, levels

---

## 🏆 Credits

- **Engine & Code:** Custom vanilla JS engine with procedural sprite generation
- **Audio:** Web Audio API synthesized SFX (no external audio files)
- **Visuals:** Procedural pixel art rendered to offscreen canvases at runtime
- **Font:** [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) via Google Fonts
- **Design:** Retro CRT / DOS terminal aesthetic

---

## 📜 License

This project is provided as-is for educational and entertainment purposes. Feel free to fork, modify, and build your own levels!

---

**Happy gaming, soldier! 🎮🔥**
