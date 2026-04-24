# DANGEROUS GAME — Developer Onboarding Guide

Welcome! This guide will get you running the game locally and making modifications quickly.

---

## 1. Project Overview

**DANGEROUS GAME** is a browser-based 2D tile platformer written in vanilla JavaScript. It has no build step, no npm dependencies, and no framework. If you know HTML, CSS, and JS, you can hack on this immediately.

The codebase is split into two main areas:
- **Runtime:** `index.html`, `game.js`, `levels.js`, `style.css` — the actual game
- **Tools:** `admin.html`, `admin.js`, `admin.css` — live balance/config editor

---

## 2. Local Setup

### Prerequisites

- Any modern web browser
- A local HTTP server (recommended)
- A code editor (VS Code recommended)

### Running the Game

```bash
# 1. Navigate to the project folder
cd dangerousgameV4.0

# 2. Start a local server
python -m http.server 8000

# 3. Open in browser
# http://localhost:8000
```

Or use VS Code **Live Server** extension for auto-reload.

### Running the Admin Panel

Open `http://localhost:8000/admin.html` in your browser.

> **Tip:** The game and admin panel can be open side-by-side. Changes made in the admin panel are saved to `localStorage` and picked up by the game on reload.

---

## 3. How to Modify Things

### 3.1 Player Properties

Player stats live in `game.config.json` under the `player` key:

```json
{
  "player": {
    "walkSpeed": 3.0,
    "runSpeed": 4.8,
    "jumpForce": -10,
    "gravity": 0.52,
    "startLives": 5,
    "jetpackFuel": 100,
    "jetpackLift": -3.8
  }
}
```

**Or** use the **Admin Panel** (`admin.html`) → **Player** tab for live editing with sliders and validation.

**Where the code uses these:**
- `game.js` → `updatePlayer()` reads `CFG.player.walkSpeed`, `CFG.player.runSpeed`, etc.
- `moveEntity()` uses `CFG.player.gravity` and `CFG.player.maxFallSpeed`

### 3.2 Add New Tiles

Tiles are defined in three parallel lookup tables in `game.js` (around line 80–180):

```js
const TILE_NAMES = {
  25: 'MyNewTile',
  // ...
};

const TILE_EMOJI = {
  25: '🌟',
  // ...
};

const TILE_COLORS = {
  25: '#ff00ff',
  // ...
};
```

**Add behavior logic** in the `TF` (Tile Functions) object:

```js
const TF = {
  isMyNewTile: t => t === 25,
  // ...
};
```

**Handle the tile in `loadLevel()`** (around line 1600):

```js
else if(t === 25){
  G.items.push(makeItem('myNewTile', col, row));
  G.map[row][col] = 0;
}
```

**Handle collision/pickup in `updateItems()`:**

```js
case 'myNewTile':
  showMsg('NEW TILE!');
  break;
```

**Add to the editor whitelist** in `game.config.json`:

```json
"editor": {
  "supportedTiles": [0, 1, 2, ..., 25]
}
```

**Add to `TILE_GROUPS`** in `game.js` (editor palette grouping):

```js
{ name:'POWER-UPS', icon:'⚡', ids:[14, 15, 18, 25], ... }
```

> **Tip:** If you only need a cosmetic/decorative tile with no behavior, just add it to `TILE_NAMES`, `TILE_EMOJI`, `TILE_COLORS`, and the editor whitelist. No code changes needed.

### 3.3 Add New Enemies

Enemy definitions are in `game.config.json`:

```json
{
  "enemies": {
    "myEnemy": {
      "label": "MY ENEMY",
      "tileId": 26,
      "width": 14,
      "height": 16,
      "speed": 2.0,
      "patrolRange": 100,
      "scoreValue": 400,
      "gravity": true,
      "color": "#ff00ff",
      "eyeColor": "#ffffff",
      "behavior": "patrol"
    }
  }
}
```

**Wire the tile ID** in `getEnemyDef()` in `game.js`:

```js
const cfgMap = {
  11:'grunt', 20:'heavy', 21:'flyer', 22:'jumper', 23:'sniper',
  26:'myEnemy'   // <-- add this
};
```

**Handle spawning in `loadLevel()`:**

```js
else if([11,20,21,22,23,26].includes(t)){
  G.enemies.push(makeEnemy(col, row, t));
  G.map[row][col] = 0;
}
```

**Add a sprite** in the `buildSprites()` IIFE. You can reuse `mkEnemy()` with custom colors:

```js
SPRITES['myEnemy_0'] = mkEnemy(0, '#ff00ff', '#ffffff');
SPRITES['myEnemy_1'] = mkEnemy(1, '#ff00ff', '#ffffff');
```

**Add behavior** in `updateEnemies()` if it's a new AI type:

```js
case 'myCustomBehavior':
  // custom logic here
  break;
```

> **Alternative:** Use the in-game **Level Editor** → **+ ADD CUSTOM ENEMY** to create enemies with custom colors and stats without touching code. These are saved to `localStorage` as custom characters.

### 3.4 Add New Levels

Create a level object in `levels.js`:

```js
{
  name: "LEVEL 99: MY LEVEL 🌟",
  width: 60,
  height: 10,
  bgColor: "#0a0a0a",
  parallaxBg: "jungle",   // or "desert", "factory", "war"
  music: "march",
  tiles: [
    [1,1,1,1,1,...],
    [1,0,0,0,0,...],
    // ... 10 rows total
  ],
  movingPlatforms: [
    { x: 160, y: 160, w: 64, h: 8, axis: 'x', speed: 1.5, range: 96 }
  ]
}
```

**Rules for tile grids:**
- Must be a rectangular 2D array
- Row 9 (last row) should be mostly solid (`1`) so the player doesn't fall
- Include exactly one `12` (player spawn)
- Include exactly one `5` (key) and one `6` (door)
- Include at least one `4` (trophy) to unlock the door

**Level transition:** The game auto-advances when `G.level + 1 < LEVELS.length`. Just append your level to the `LEVELS` array.

> **Alternative:** Use the in-game **Level Editor** to design visually, then click **↓ EXPORT** to get the JSON. Paste it into `levels.js`.

---

## 4. Debugging Tips

### 4.1 Enable God Mode

Press `Q` during gameplay to toggle invincibility. The HUD will show a message.

### 4.2 Check Config Loading

Look at the top-right badge when the game loads. It shows:
- `★ admin config` — loaded from `localStorage` (admin panel edits)
- `file config` — loaded from `game.config.json`
- `default config` — using hard-coded fallback

If your config changes aren't applying, check the browser DevTools → Application → Local Storage → `ms_admin_cfg`.

### 4.3 View Console Logs

The engine logs helpful messages:
- `[REPLAY] Recording started`
- `[REPLAY] Playback complete`
- `[SHARE] Loaded shared level`
- `[AI_GEN] Error: ...`

Open DevTools → Console to see these.

### 4.4 Editor Coordinates

When painting in the level editor, the current tile coordinate and name appears below the canvas (if the `ed-coords` element exists in your DOM).

### 4.5 Test Specific Levels

In the browser console:

```js
// Load and play a specific level immediately
G.score = 0; G.lives = 5; G.level = 2;
loadLevel(2);
switchState('playing');
```

---

## 5. Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Game won't load config | Serve via HTTP, not `file://`. Or check that `game.config.json` is valid JSON. |
| New tile doesn't appear in editor | Add its ID to `game.config.json` → `editor.supportedTiles` and to `TILE_GROUPS`. |
| New enemy spawns as a Grunt | Make sure the tile ID is mapped in `getEnemyDef()`'s `cfgMap`. |
| Custom enemy sprite is missing | Ensure `SPRITES['yourName_0']` and `SPRITES['yourName_1']` are built in `buildSprites()`. |
| Level crashes on load | Verify the tile grid is rectangular (all rows same length). |
| Admin changes don't appear in game | Click **Apply Changes** in admin, then reload the game page. |
| Theme colors look wrong | Themes rebuild `SPRITES['tile_solid']` and `SPRITES['tile_brick']`. If you added new terrain tiles, they may need theme-aware color logic. |
| Replay doesn't play back | Replays are tied to level index and input timing. If the level layout changes, old replays desync. |

---

## 6. Quick Reference: Where Things Live

| Want to change... | Look in... |
|-------------------|------------|
| Player speed / jump / lives | `game.config.json` → `player` |
| Enemy stats / colors / behaviors | `game.config.json` → `enemies` |
| Weapon damage / fire rate / ammo | `game.config.json` → `weapons` |
| Score values | `game.config.json` → `scoring` |
| Sound effects | `game.config.json` → `audio.sfx` |
| HUD colors / font sizes | `game.config.json` → `ui` |
| Canvas size / tile size | `game.config.json` → `game.canvas` |
| Game title / subtitle | `game.config.json` → `game` |
| Level layouts | `levels.js` |
| Tile definitions (names, emojis, colors) | `game.js` → `TILE_NAMES`, `TILE_EMOJI`, `TILE_COLORS` |
| Physics (gravity, collision) | `game.js` → `moveEntity()` |
| Rendering order / effects | `game.js` → `render()` |
| CSS styling / CRT effects | `style.css` |
| Admin panel layout | `admin.html` / `admin.css` |

---

## 7. Getting Help

- Read **[ARCHITECTURE.md](ARCHITECTURE.md)** for deep engine internals
- Read **[TILE_DICTIONARY.md](TILE_DICTIONARY.md)** for the full tile reference
- Check the browser console for error messages
- Use the Admin Panel to experiment with values before editing JSON directly

---

**Happy hacking! 🎮🔧**
