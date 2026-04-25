# DANGEROUS GAME — Tile Dictionary

Complete reference of all tile IDs used in the game engine, level editor, and config system.

---

## Tile Table

| ID | Name | Emoji | Color | Category | Behavior | Description |
|----|------|-------|-------|----------|----------|-------------|
| 0 | Empty | ⬛ | `#111122` | Environment | Pass-through | Air / blank space. Player and enemies fall through. |
| 1 | Ground | ▓ | `#6b4f2a` | Environment | Solid (collision) | Stone floor. Player can walk and stand on it. |
| 2 | Brick | ▒ | `#a0522d` | Environment | Solid (collision) | Brick wall. Same collision as ground but different visual. |
| 3 | Spike | ⚠️ | `#aaaaaa` | Hazard | Instant kill | Deadly hazard. Touching any part of the tile kills the player instantly. |
| 4 | Trophy | 🏆 | `#ffcc00` | Objective | Collectible | Must collect all trophies in a level to unlock the exit door. Worth 500 points. |
| 5 | Key | 🗝️ | `#e6b800` | Objective | Collectible | Unlocks the exit door. Exactly one required per level. |
| 6 | Door | 🚪 | `#5a3a1a` | Objective | Interactive | Exit portal. Requires key + all trophies collected to open. |
| 7 | Pistol | 🔫 | `#888888` | Weapon | Collectible | Gives the player an infinite-ammo pistol. |
| 8 | Lava | 🌋 | `#ff3300` | Hazard | Instant kill | Animated hazard tile. Touching it kills the player instantly. 2-frame flame animation. |
| 9 | Ladder | 🪜 | `#2e7d32` | Environment | Climbable | Player can climb up/down. Disables gravity while on ladder. Jump to detach. |
| 10 | Moving Platform | ⬛ | `#4a6fa5` | Environment | Solid (moving) | Horizontal or vertical moving platform. Player is carried when standing on it. |
| 11 | Grunt | 👾 | `#aa44ff` | Enemy | AI: Patrol | Basic ground enemy. Walks back and forth, 1 HP, 300 points. |
| 12 | Spawn | 🧍 | `#00aaff` | Objective | Marker | Player start position. Removed from map after loading; sets spawn point. |
| 13 | Warp | 🌀 | `#cc66ff` | Objective | Interactive | Instant skip to the next level. Grants 1000 bonus points. |
| 14 | Jetpack | 🚀 | `#3366ff` | Power-Up | Collectible | Enables jetpack flight. Hold jump while airborne to fly upward. Has fuel meter. |
| 15 | +Life | ❤️ | `#ff3355` | Power-Up | Collectible | Adds 1 extra life (up to max 9). |
| 16 | Grenade | 💣 | `#ff8800` | Weapon | Collectible | Adds 3 throwable grenades. Explodes after fuse timer or on bounce. |
| 17 | Machine Gun | 🔫 | `#ff5500` | Weapon | Collectible | Fast-firing weapon with 50 rounds of ammo. Higher fire rate than pistol. |
| 18 | Upgrade Chip | 💎 | `#00e5ff` | Power-Up | Collectible | Upgrades current weapon tier. Pistol gets burst/spread; MG gets rapid fire. |
| 19 | *(reserved)* | 🟪 | `#9966cc` | — | — | Reserved for future use. |
| 20 | Heavy | 🦍 | `#cc4444` | Enemy | AI: Patrol | Tough ground enemy. 2 HP, slower speed, 600 points. Shows HP bar. |
| 21 | Flyer | 🛸 | `#aa44ff` | Enemy | AI: Flying | Airborne enemy. Moves in sine wave, no gravity. 1 HP, 400 points. |
| 22 | Jumper | 🐇 | `#44aaff` | Enemy | AI: Jumper | Bouncing enemy. Jumps periodically when on ground. 1 HP, 500 points. |
| 23 | Sniper | 🎯 | `#ff4444` | Enemy | AI: Sniper | Stationary shooter. Fires bullets at player when in range. 1 HP, 700 points. |
| 24 | Secret | 💥 | `#889966` | Environment | Breakable | Breakable secret brick. Shoot or grenade it 3 times to destroy. Reveals trophy or upgrade chip. |
| 30 | Boss | 👹 | `#ff0033` | Boss | AI: Boss-1 | Phase boss spawn. 12 HP, two combat phases, shoots projectiles. Worth 5000 points. |
| 31 | Boss-2 | 💀 | `#990033` | Boss | AI: Boss-2 | Elite boss spawn. 30 HP, two combat phases, aggressive bullet patterns. Worth 10000 points. |

---

## Tile ID Ranges

| Range | Purpose |
|-------|---------|
| 0–9 | Environment & basic tiles |
| 10–19 | Platforms, power-ups, weapons |
| 20–29 | Enemies (heavy variants + custom) |
| 30–31 | Boss spawns |
| 100+ | Custom characters (user-created enemies via editor) |

---

## Tile Function Helpers (`TF`)

The engine uses a `TF` (Tile Functions) object for quick category checks:

```js
const TF = {
  isSolid:   t => t === 1 || t === 2 || t === 24,     // Ground, Brick, Secret
  isKill:    t => t === 3 || t === 8,                   // Spike, Lava
  isTrophy:  t => t === 4,
  isKey:     t => t === 5,
  isDoor:    t => t === 6,
  isGun:     t => t === 7,
  isSpawn:   t => t === 12,
  isJetpack: t => t === 14,
  isLife:    t => t === 15,
  isGrenade: t => t === 16,
  isMachineGun: t => t === 17,
  isUpgradeChip: t => t === 18,
  isBreakable:   t => t === 24,
  isLadder:      t => t === 9,
  isMovingPlatformTile: t => t === 10,
  isEnemy:   t => [11,20,21,22,23].includes(t),
  isBossSpawn:  t => t === 30,
  isBoss2Spawn: t => t === 31,
};
```

---

## Editor Tile Groups

Tiles are organized into these categories in the level editor palette:

| Group | Icon | Tile IDs |
|-------|------|----------|
| **TERRAIN** | 🏗️ | 0, 1, 2, 3, 8, 9, 10, 24 |
| **OBJECTIVES** | 🎯 | 4, 5, 6, 12, 13 |
| **POWER-UPS** | ⚡ | 14, 15, 18 |
| **WEAPONS** | 🔫 | 7, 16, 17 |
| **ENEMIES** | 👾 | 11, 20, 21, 22, 23 (+ custom 100+) |
| **BOSS** | 💀 | 30, 31 |

---

## Level Design Rules

When creating levels, follow these conventions:

1. **Exactly one** tile `12` (Spawn) per level
2. **Exactly one** tile `5` (Key) per level
3. **Exactly one** tile `6` (Door) per level
4. **At least one** tile `4` (Trophy) per level (collect all to unlock door)
5. Row 9 (last row) should be mostly `1` (Ground) to prevent falling into void
6. Enemy tiles (`11`, `20`, `21`, `22`, `23`) must be placed above solid ground (except Flyer `21`)
7. Boss tiles (`30`, `31`) should be placed in open arena areas with solid floor

---

## Custom Characters

The editor supports creating custom enemies with tile IDs starting at `100`:

- Name, body color, eye color, behavior, speed, patrol range, and score are configurable
- Custom enemies are saved to `localStorage` and persist across sessions
- They are rendered using the base `mkEnemy()` sprite builder with custom colors
- In the editor palette, custom enemies appear in the **ENEMIES** group

---

*End of Tile Dictionary*

