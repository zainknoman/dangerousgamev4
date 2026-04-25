# DANGEROUS GAME — Architecture Overview

This document explains the internal architecture of the DANGEROUS GAME engine: how the game loop, physics, rendering, state management, and subsystems interact.

---

## 1. Core Systems

### 1.1 Game Loop (Update / Render Cycle)

The engine uses a classic **requestAnimationFrame** loop with a fixed-logic, variable-render approach:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  gameLoop() │────→│   update*   │────→│   render()  │
│  (raf)      │     │  functions  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
         ↑                                      │
         └──────────────────────────────────────┘
```

**Flow:**
1. `gameLoop(ts)` is called via `requestAnimationFrame`
2. **Update phase** (in order):
   - `updateMovingPlatforms()` — platform movement before player physics
   - `updatePlayer()` — input, movement, jumping, shooting, ladder climbing
   - `updateEnemies()` — AI behavior (patrol, flying, jumping, sniping)
   - `updateBullets()` — projectile movement, collision with tiles/enemies/boss
   - `updateGrenades()` — grenade physics, bouncing, explosion trigger
   - `updateItems()` — pickup detection, scoring, level transition
   - `updateParticles()` — particle decay, explosion fade
   - `updateBoss()` — boss AI, phase transitions, shooting patterns
   - `updateBreakingTiles()` — secret tile crack decay over time
   - `ACHV.tick()` — achievement toast timing
   - `DAILY.checkTick()` — daily challenge completion detection
3. **Render phase:**
   - `render()` draws the entire frame: parallax background → tiles → items → enemies → moving platforms → breakable tiles → boss → grenades → bullets → player → particles → HUD overlays
4. If `G.levelTransTimer > 0`, the loop pauses physics and shows the level transition animation

**Key files:** `game.js` — functions `gameLoop()`, `render()`

---

### 1.2 State Management

All global game state lives in a single object **`G`**:

```js
const G = {
  state: 'menu',        // menu | playing | editor | gameover | win
  score, lives, level,   // progression
  hasGun, hasMG, hasJetpack, hasKey, hasGrenade,  // inventory
  weaponType, ammo, grenadeCount,                  // combat
  trophiesLeft, doorOpen,                          // objectives
  camX,                              // camera scroll offset
  map, mapW, mapH, bgColor,          // current level
  player, enemies, items, bullets, grenades, particles, explosions,  // entities
  keys, touch,                      // input state
  boss, bossActive, bossDefeated,   // boss system
  movingPlatforms,                   // platform system
  breakingTiles,                     // secret tile state
  weaponUpgrades, upgradeChipsCollected,  // upgrade system
  godMode, invTimer,                 // cheat / damage immunity
  // ... plus roguelite, daily, replay, theme flags
};
```

**State transitions** are handled by `switchState(state)` which:
- Cancels the current animation frame
- Hides all `.screen` elements
- Shows the target screen
- Initializes screen-specific logic (e.g., `animateMenu()`, `initEditor()`)

**Config-driven state:** The `CFG` object (loaded from `game.config.json` or `localStorage` or `CONFIG_DEFAULT`) provides all balance values. The engine never hard-codes gameplay constants directly; they are always resolved through `CFG`.

---

### 1.3 Physics System

#### Gravity & Movement
- Gravity is applied every frame in `moveEntity(ent, useGravity)`
- Default gravity: `0.52` px/frame² (from `CFG.player.gravity`)
- Max fall speed: `13` px/frame (`CFG.player.maxFallSpeed`)
- Player walk speed: `3.0`, run speed: `4.8` (Shift key)

#### Collision Detection
- **Tile-based world:** The map is a 2D grid of tile IDs
- `tileAt(px, py)` converts world coordinates → tile ID
- `isSolid(px, py)` checks if a tile is solid (ground, brick)
- `moveEntity()` performs axis-separated collision:
  1. Move horizontally → resolve wall collisions
  2. Move vertically → resolve floor/ceiling collisions
  3. Set `ent.onGround` when entity lands on solid tile

#### Entity-to-Entity Collision
- `rectOverlap(ax, ay, aw, ah, bx, by, bw, bh)` — AABB overlap test
- Used for: player vs enemies, player vs items, bullets vs enemies, grenade blast radius

#### Special Physics
- **Jetpack:** Overrides gravity when active (`moveEntity(p, false)`)
- **Ladders:** Disable gravity; clamp vertical movement to ladder bounds
- **Moving platforms:** Platforms update first; player is "carried" by delta movement if standing on top
- **Grenades:** Bounce with dampened velocity (`vy *= -0.4`, `vx *= 0.7`)

---

### 1.4 Tile System

#### Grid Structure
- Tile size: `32×32` pixels (configurable via `CFG.game.canvas.tileSize`)
- Map format: 2D array `G.map[row][col]` stored in `levels.js`
- Each cell contains a **tile ID** (integer)

#### Tile Categories
| Category | IDs | Description |
|----------|-----|-------------|
| Empty | 0 | Air, walkable |
| Solid | 1, 2, 24 | Ground, brick, breakable secret |
| Hazard | 3, 8 | Spikes (instant kill), lava |
| Collectible | 4, 5, 7, 14, 15, 16, 17, 18 | Trophy, key, weapons, jetpack, life, grenade, upgrade |
| Interactive | 6, 9, 10, 12, 13 | Door, ladder, moving platform, spawn, warp |
| Enemy Spawn | 11, 20, 21, 22, 23 | Grunt, Heavy, Flyer, Jumper, Sniper |
| Boss Spawn | 30, 31 | Boss-1, Boss-2 |

#### Tile Helpers (`TF` object)
```js
const TF = {
  isSolid:   t => t === 1 || t === 2 || t === 24,
  isKill:    t => t === 3 || t === 8,
  isTrophy:  t => t === 4,
  isKey:     t => t === 5,
  // ... etc
};
```

#### Rendering
- Only visible tiles are drawn: `startCol = floor(camX / TILE_SIZE)` to `endCol = startCol + ceil(CANVAS_W / TILE_SIZE) + 2`
- Each tile ID maps to a pre-rendered sprite in the `SPRITES` object
- Special cases: lava has 2-frame animation; breakable tiles show crack overlays

---

### 1.5 Input Handling

#### Keyboard
- Raw key states stored in `G.keys` (e.g., `G.keys['ArrowLeft'] = true`)
- Bound via `document.addEventListener('keydown'/'keyup')`
- Default prevented on: Space, Arrow keys, Ctrl (to stop page scrolling)
- Escape → quit to menu; Q → god mode toggle

#### Touch
- `G.touch` mirrors keyboard state: `{ left, right, jump, shoot, grenade }`
- Touch buttons appear on coarse-pointer devices (`@media (hover: none)`)
- Events: `touchstart`/`touchend`/`touchcancel` + `mousedown`/`mouseup` fallback

#### Replay Injection
- During replay playback, `G.keys` is overwritten each frame with recorded inputs
- Recording captures a bitmask of 14 input keys packed into 1 byte per frame

---

## 2. Modules / Files

### 2.1 `game.js` (≈ 3,500 lines)
The monolithic engine file containing:

| Section | Purpose |
|---------|---------|
| Config loading | `bootstrap()`, `CONFIG_DEFAULT`, `CFG` resolution |
| Audio engine | `playTone()`, `SFX` object (Web Audio API) |
| Sprite system | `buildSprites()` IIFE — procedural pixel art for all entities |
| Parallax BG | `BG_LAYERS`, `drawParallax()`, `STARS` |
| Game state | `G` object declaration |
| Entity factories | `makePlayer()`, `makeEnemy()`, `makeItem()`, `makeBullet()`, `makeGrenade()` |
| Boss system | `spawnBoss()`, `updateBoss()`, `damageBoss()` |
| Moving platforms | `updateMovingPlatforms()`, `isOnMovingPlatform()` |
| Weapon upgrades | `applyWeaponUpgrade()`, `getUpgradedBullets()` |
| Level loader | `loadLevel()` — parses tile grid, spawns entities, resets state |
| Collision | `tileAt()`, `isSolid()`, `rectOverlap()`, `moveEntity()` |
| Player update | `updatePlayer()` — movement, shooting, jetpack, ladders |
| Item pickup | `updateItems()` — collision with pickups, scoring |
| Enemy AI | `updateEnemies()` — 5 behavior types |
| Bullets | `updateBullets()` — tile/enemy collision, secret tile breaking |
| Grenades | `updateGrenades()`, `explodeGrenade()` — blast radius damage |
| Particles | `spawnParticle()`, `updateParticles()` |
| Death/respawn | `killPlayer()` — lives decrement, game over or respawn |
| Rendering | `render()` — full frame drawing pipeline |
| HUD | `updateHUD()` — DOM element updates |
| Messages | `showMsg()`, `clearMsg()` |
| State machine | `switchState()` — screen transitions |
| Level editor | `initEditor()`, `renderEditor()`, `editorPaint()`, `exportLevel()`, `importLevel()` |
| Level transition | `showLevelTransition()` — animated corridor canvas |
| Menu animation | `animateMenu()` — background demo on menu screen |
| Input binding | `bindTouch()`, keyboard listeners |
| Bootstrap | `bootstrap()` — config fetch, DOM wiring, event listeners |
| Achievements | `ACHV` IIFE — 15 achievements with localStorage persistence |
| Daily challenge | `DAILY` IIFE — seeded daily level generation |
| Roguelite mode | `ROGUE` IIFE — permadeath + boon selection between levels |
| Theme system | `THEMES` object, `applyTheme()`, `loadSavedTheme()` |
| Replay system | `REPLAY` IIFE — record/playback/export base64 replays |
| URL sharing | `SHARE` IIFE — encode/decode levels to URL hashes |
| AI generator | `AI_GEN` IIFE — Claude API level generation UI |
| Custom enemies | `loadCustomChars()`, `bakeCustomCharSprite()`, `saveCustomChars()` |

### 2.2 `levels.js`
- Defines `TILE` constants (name → ID mapping)
- Defines `LEVELS` array — all playable level data
- Each level object: `{ name, width, height, bgColor, tiles: [[]], movingPlatforms: [...] }`
- `tiles` is a 2D array of integers (tile IDs)
- 25+ levels included: story levels, DK-inspired arcade levels, boss arenas, showcase levels

### 2.3 `game.config.json`
Runtime balance configuration. Loaded at boot and can be edited via the admin panel. Contains:
- `game` — title, subtitle, version, canvas settings
- `player` — all player stats (speed, jump, gravity, lives, jetpack, grenades)
- `enemies` — definitions for 7 enemy types (grunt, heavy, flyer, jumper, sniper, boss1, boss2)
- `tiles` — metadata for each tile ID
- `scoring` — point values for all events
- `weapons` — pistol, machine gun, grenade stats
- `audio` — Web Audio SFX parameters (freq, duration, waveform, volume)
- `ui` — HUD height, font sizes, color palette
- `levels` — level metadata (name, bgColor, parallaxBg, music, dimensions)
- `editor` — supported tile IDs for the editor
- `cheatCodes` — enable/disable + code mappings

### 2.4 `index.html`
Single-page application with multiple screen `<div>` elements:
- `#screen-menu` — title, animated canvas, game mode buttons, controls hint
- `#screen-game` — HUD, game canvas, message overlay, touch controls
- `#screen-gameover` — score display, retry/replay/menu buttons
- `#screen-editor` — tile palette, level select, canvas, import/export buttons
- `#screen-leaderboard` — high score table
- `#screen-transition` — animated level corridor

### 2.5 `style.css`
- CRT scanline overlay (`body::before` repeating gradient)
- CRT vignette (`body::after` radial gradient)
- Screen management (`.screen` hide/show)
- Menu styling with flicker animation
- Game HUD layout
- Editor toolbar and tile palette grid
- Touch controls (mobile-only via media query)
- Leaderboard table styling
- High score entry modal
- Level transition screen
- Responsive breakpoints (`max-width: 600px`, `max-width: 400px`)

### 2.6 `admin.html` / `admin.js` / `admin.css`
Standalone configuration editor:
- Tabbed interface: Game, Player, Enemies, Weapons, Scoring, Levels, Audio, UI, JSON, Diff, Themes
- Live form fields bound to `CFG` via `data-path` attributes
- Change tracking with diff viewer
- Import/export JSON
- Theme preview and application
- SFX preview via Web Audio API

---

## 3. Key Concepts

### 3.1 Entity System

All entities share a common structure:

```js
// Player
{ x, y, vx, vy, w, h, dir, onGround, onLadder, frame, dead, jetFuel, shootCooldown }

// Enemy
{ x, y, vx, vy, w, h, typeId, def, dir, frame, dead, deadTimer, startX, patrolRange, behavior, hp }

// Item
{ type, x, y, collected, bobTimer }

// Bullet
{ x, y, vx, vy, dead, type }

// Grenade
{ x, y, vx, vy, w, h, dead, fuse, gravity, bounces }

// Particle
{ x, y, vx, vy, color, life, maxLife, text }

// Explosion
{ x, y, r, timer, maxTimer }
```

Entities are stored in arrays on `G` and filtered each frame to remove dead ones:
```js
G.enemies = G.enemies.filter(e => !e.dead || e.deadTimer > 0);
G.bullets = G.bullets.filter(b => !b.dead);
```

### 3.2 Tile Groups & Behaviors

Tiles are organized into **groups** for the editor palette:

```js
const TILE_GROUPS = [
  { name:'TERRAIN',     ids:[0,1,2,3,8,9,10,24] },
  { name:'OBJECTIVES',  ids:[4,5,6,12,13] },
  { name:'POWER-UPS',   ids:[14,15,18] },
  { name:'WEAPONS',     ids:[7,16,17] },
  { name:'ENEMIES',     ids:[11,20,21,22,23] },
  { name:'BOSS',        ids:[30,31] },
];
```

Each tile ID has:
- **Name** (`TILE_NAMES`) — human-readable label
- **Emoji** (`TILE_EMOJI`) — editor icon
- **Color** (`TILE_COLORS`) — editor background + admin preview
- **Behavior** — defined via `TF` helpers and handled in `loadLevel()` / `updateItems()` / collision code

### 3.3 Rendering Strategy

**Canvas-based rendering** with procedural sprites:

1. **Offscreen canvases:** All sprites are drawn once to hidden `<canvas>` elements stored in `SPRITES`
2. **Pixel art generation:** `buildSprites()` uses `px(ctx, x, y, color)` to draw 1×1 pixels
3. **Frame caching:** Player has 4 walk frames × 2 directions + dead + 2 climb frames
4. **Dynamic scaling:** Sprites are drawn with `ctx.drawImage(spr, 0, 0, w, h)` to match entity size
5. **Effects:**
   - Shadow blur for glow effects (items, bullets)
   - Global alpha for invincibility flicker, explosion fade
   - Radial gradients for explosions
   - Frame-based lava animation (2 frames, switches every 8 game frames)

**No external image assets** — everything is generated at runtime.

### 3.4 Event Systems

#### Achievement Events (`ACHV`)
```js
ACHV.emit('enemy_killed', { jetpacking: true });
ACHV.emit('level_complete', { levelIdx: G.level });
ACHV.emit('boss_killed');
```
- 15 achievement definitions with unlock conditions
- Persistent storage in `localStorage`
- Toast queue with fade-in/out animation on canvas

#### Replay Events (`REPLAY`)
- Records `G.keys` state as a bitmask every frame
- Exports as base64 string
- Playback injects recorded keys into `G.keys` each frame

#### Config Events (implicit)
- Admin panel saves to `localStorage` (`ms_admin_cfg`)
- Game reads from same key on boot
- No explicit event system — game must reload to pick up new config

---

## 4. Data Flow

### Input → Update → Physics → Render

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              INPUT LAYER                                 │
│  Keyboard ──→ G.keys        Touch ──→ G.touch       Replay ──→ G.keys   │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              UPDATE LAYER                                │
│  updatePlayer()     ← reads G.keys, G.touch, CFG.player.*               │
│  updateEnemies()    ← reads G.player position for AI targeting          │
│  updateBullets()    ← reads G.map for tile collision                    │
│  updateGrenades()   ← reads G.map for bounce collision                  │
│  updateItems()      ← reads G.player rect for pickup collision          │
│  updateBoss()       ← reads G.player position for aiming                │
│  updateParticles()  ← self-contained (life decay)                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                             PHYSICS LAYER                                │
│  moveEntity()       ← applies gravity, resolves tile collision          │
│  rectOverlap()      ← entity-to-entity collision                        │
│  isSolid()          ← tile lookup for collision                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                             RENDER LAYER                                 │
│  drawParallax()     ← background gradient + stars                        │
│  draw tiles         ← G.map lookup with camera offset                   │
│  draw items         ← G.items with bob animation                        │
│  draw enemies       ← G.enemies with frame animation                    │
│  draw platforms     ← G.movingPlatforms                                 │
│  draw boss          ← G.boss with HP bar                                │
│  draw player        ← G.player with invincibility flicker               │
│  draw particles     ← G.particles + G.explosions                        │
│  draw HUD overlays  ← achievement toasts, roguelite boons, badges       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              OUTPUT LAYER                                │
│  Canvas → screen        HUD → DOM elements       Audio → Web Audio API  │
└──────────────────────────────────────────────────────────────────────────┘
```

### State Mutation Flow

```
loadLevel(idx)
    │
    ├──→ Parse tile grid
    ├──→ Spawn entities (player, enemies, items)
    ├──→ Reset game state (lives, score, inventory)
    └──→ Set G.state = 'playing'
         │
         ▼
    gameLoop() ──→ update*() ──→ render()
         │
         ├──→ Entities mutated (positions, HP, dead flags)
         ├──→ G.score updated
         ├──→ G.items[i].collected = true
         └──→ G.map[row][col] = 0  (breakable tiles destroyed)
              │
              ▼
    killPlayer() / level complete
         │
         ├──→ G.lives--  or  G.level++
         ├──→ switchState('gameover') / loadLevel(next)
         └──→ localStorage updated (high scores, achievements)
```

---

## 5. Subsystem Details

### 5.1 Boss System
- **Boss-1** (tile 30): 32×36 px, 12 HP, 2 phases
  - Phase 1: Slow patrol, shoots single bullets every 80 frames
  - Phase 2 (HP ≤ 6): Faster, shoots triple bullets, occasional charge dash
- **Boss-2** (tile 31): 48×48 px, 30 HP, 2 phases
  - Phase 1: Slower, shoots single bullets every 50 frames
  - Phase 2 (HP ≤ 15): Berserk mode, shoots 5-bullet spread + diagonal shots
- On death: massive particle burst, score bonus, explosions, achievement unlock

### 5.2 Weapon Upgrade System
- Collecting upgrade chips (tile 18) increments `G.weaponUpgrades`
- **Pistol tiers:**
  - Tier 0: Single shot
  - Tier 1: Burst fire (3 bullets)
  - Tier 2: Spread shot (3 forward + 2 diagonal)
- **Machine Gun tiers:**
  - Tier 0: Standard 50 rounds
  - Tier 1: +40 ammo capacity
  - Tier 2: Rapid fire (cooldown reduced to 3 frames)

### 5.3 Roguelite Mode (`ROGUE`)
- Permadeath: 1 life, no continues
- Between levels: choose 1 of 3 random boons
- Boons: speed up, extra life, fast shoot, more grenades, armor, score boost, double jump
- Applied via direct mutation of `CFG` and `G` state

### 5.4 Daily Challenge (`DAILY`)
- Seeded PRNG (`mulberry32`) based on calendar date
- Shuffles enemy positions within each row
- Single level run; score saved to `localStorage` with date key
- Can only be played once per day

### 5.5 Theme System (`THEMES`)
- 6 visual themes with complete palette swaps
- Rebuilds `SPRITES['tile_solid']` and `SPRITES['tile_brick']` at runtime
- Applies CSS background color and CRT tint overlay
- Persisted to `localStorage` as `dg_theme`

### 5.6 Replay System (`REPLAY`)
- Packs 14 input keys into 1 byte per frame using bitmasks
- Header: 3 bytes (level index + frame count)
- Exported as base64 string for sharing
- Playback resets game state to level start, then injects recorded inputs frame-by-frame

### 5.7 URL Level Sharing (`SHARE`)
- Levels encoded with run-length encoding (RLE) for compactness
- Binary packed into Uint8Array → base64
- Meta (name, bgColor, parallaxBg, movingPlatforms) as JSON prefix
- Full URL: `location.origin + location.pathname + #level=<encoded>`
- Decode reverses the process and prepends level to `LEVELS[0]`

---

## 6. Performance Considerations

| Technique | Purpose |
|-----------|---------|
| Offscreen sprite canvases | Avoid regenerating pixel art every frame |
| Visible tile culling | Only draw tiles within camera bounds (+2 margin) |
| Entity filtering | Remove dead entities once per frame |
| Bitmask input recording | Compact replay data (1 byte / frame) |
| RLE level encoding | Small URL share strings |
| `requestAnimationFrame` | Sync with display refresh, battery efficient |
| `imageSmoothingEnabled = false` | Crisp pixel art scaling |

---

## 7. Extension Points

To add a new subsystem:

1. **Define state** in `G` object
2. **Add update function** and call it from `gameLoop()`
3. **Add render code** inside `render()` (or as overlay)
4. **Wire inputs** in `updatePlayer()` or keyboard listeners
5. **Add config values** to `game.config.json` and `CONFIG_DEFAULT`
6. **Add editor support** (if tile-based): `TILE_NAMES`, `TILE_EMOJI`, `TILE_COLORS`, `TF` helpers, `TILE_GROUPS`, `loadLevel()` handling

---

*End of Architecture Overview*

