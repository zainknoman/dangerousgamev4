// ══════════════════════════════════════════════════════════════════
//  ▒ ▒ ▒ D A N G E R O U S  G A M E ▒ ▒ ▒ — admin.js
//  Extracted from admin.html <script> block.
//  All template-string inline styles replaced with CSS classes.
// ══════════════════════════════════════════════════════════════════
console.log("✅ admin.js LOADED");

// ── Embedded default config (mirrors game.config.json) ───────────
const DEFAULT_CONFIG = {
  "game": {
    "title": "▒ ▒ ▒ DANGEROUS GAME ▒ ▒ ▒",
    "subtitle": "▒ BUILD YOUR OWN GAME▒",
    "version": "2.0",
    "canvas": { "width": 800, "height": 320, "tileSize": 32, "pixelated": true, "crtEffect": true }
  },
  "player": {
    "name": "Janzi", "width": 14, "height": 20,
    "walkSpeed": 3.0, "runSpeed": 4.8, "jumpForce": -10,
    "gravity": 0.52, "maxFallSpeed": 13, "startLives": 3, "maxLives": 9,
    "invincibilityFrames": 120, "shootCooldown": 10, "bulletSpeed": 11,
    "jetpackFuel": 100, "jetpackFuelRegen": 0.6, "jetpackLift": -3.8,
    "grenadeThrowSpeed": 6, "grenadeGravity": 0.4, "grenadeFuse": 80,
    "frameRate": 6, "animFrames": 4
  },
  "enemies": {
    "grunt":  { "label":"GRUNT",  "tileId":11, "width":14,"height":16, "speed":1.4,"patrolRange":80,  "scoreValue":300, "gravity":true, "color":"#44cc44","eyeColor":"#ff0000","behavior":"patrol" },
    "heavy":  { "label":"HEAVY",  "tileId":20, "width":18,"height":20, "speed":0.8,"patrolRange":100, "scoreValue":600, "gravity":true, "color":"#cc4422","eyeColor":"#ffffff","behavior":"patrol" },
    "flyer":  { "label":"FLYER",  "tileId":21, "width":16,"height":12, "speed":1.6,"patrolRange":120, "scoreValue":400, "gravity":false,"color":"#aa44ff","eyeColor":"#ffff00","behavior":"flying" },
    "jumper": { "label":"JUMPER", "tileId":22, "width":12,"height":14, "speed":2.4,"patrolRange":60,  "scoreValue":500, "gravity":true, "color":"#4488ff","eyeColor":"#ff4400","behavior":"jumper" },
    "sniper": { "label":"SNIPER", "tileId":23, "width":14,"height":18, "speed":0.5,"patrolRange":40,  "scoreValue":700, "gravity":true, "color":"#884444","eyeColor":"#00ffff","behavior":"sniper","shootRate":90 },
	  "boss1": {"label":"BOSS-1","tileId":30,"width":32,"height":36,"behavior":"sniper","speed":0.8,"patrolRange":60,"shootRate":45,"bulletSpeed":3,"health":12,"damage":1,"scoreValue":5000,"gravity": true,"color":"#cc2244","eyeColor":"#ffff00"},
	  "boss2": {"label":"BOSS-2","tileId":31,"width":48,"height":48,"behavior":"sniper","speed":0.35,"patrolRange":30,"shootRate":80,"bulletSpeed":2,"health":30,"damage":2,"scoreValue":10000,"gravity": true,"color":"#880022","eyeColor":"#ff00ff"}
	  },
  "scoring": {
    "trophy":500,"key":50,"enemyGrunt":300,"enemyHeavy":600,"enemyFlyer":400,"enemyJumper":500,"enemySniper":700,"boss1":5000,"boss2":10000,"levelComplete":1000,"extraLife":10000,"grenadeKillBonus":100
  },
  "weapons": {
    "pistol":     { "label":"PISTOL",      "bulletSpeed":11,"shootCooldown":10,"ammo":-1,  "damage":1,"bulletColor":"#ffff44","bulletW":6,"bulletH":3 },
    "machineGun": { "label":"MACHINE GUN", "bulletSpeed":13,"shootCooldown":5, "ammo":50,  "damage":1,"bulletColor":"#ff8800","bulletW":5,"bulletH":2 },
    "grenade":    { "label":"GRENADE",     "throwSpeed":6,  "gravity":0.4,     "fuse":80,             "blastRadius":80,"ammo":3 }
  },
  "audio": {
    "enabled": true,
    "sfx": {
      "jump":    {"freq":300,"duration":0.12,"type":"square",  "vol":0.1  },
      "shoot":   {"freq":800,"duration":0.05,"type":"sawtooth","vol":0.08 },
      "hit":     {"freq":150,"duration":0.25,"type":"sawtooth","vol":0.18 },
      "collect": {"freq":600,"duration":0.06,"type":"square",  "vol":0.12 },
      "die":     {"freq":300,"duration":0.12,"type":"sawtooth","vol":0.15 },
      "levelUp": {"freq":400,"duration":0.18,"type":"square",  "vol":0.14 },
      "door":    {"freq":400,"duration":0.15,"type":"square",  "vol":0.12 },
      "grenade": {"freq":120,"duration":0.35,"type":"sawtooth","vol":0.20 }
    }
  },
  "ui": {
    "hudHeight": 40, "msgDuration": 90,
    "fontSize": {"title":28,"hud":9,"msg":14,"tiny":7},
    "colors": { "crtGreen":"#00ff41","crtAmber":"#ffb000","crtRed":"#ff2020","bgDark":"#0a0a0f","bgPanel":"#0d0d1a","borderGlow":"#1a1a3e" }
  },
  "levels": [
    {"name":"LEVEL 1: JUNGLE BASE 🌿","bgColor":"#0a1205","parallaxBg":"jungle","music":"march","width":60,"height":10},
    {"name":"LEVEL 2: DESERT STORM 🏜️","bgColor":"#1a0f00","parallaxBg":"desert","music":"action","width":70,"height":10},
    {"name":"LEVEL 3: FACTORY RUN ⚙️","bgColor":"#0a0a12","parallaxBg":"factory","music":"tension","width":75,"height":10},
    {"name":"LEVEL 4: WARZONE ⚔️","bgColor":"#120003","parallaxBg":"war","music":"boss","width":80,"height":10}
  ],
  "editor": { "tileSize":32,"gridColor":"#1a1a2e","selectedColor":"#00ff41","supportedTiles":[0,1,2,3,4,5,6,7,8,11,12,14,15,16,20,21,22,23] },
  "cheatCodes": { "enabled":false,"codes":{"IDDQD":"godMode","IDKFA":"allWeapons"} }
};

// ── Working config + change tracking ─────────────────────────────
let CFG      = deepClone(DEFAULT_CONFIG);
let ORIGINAL = deepClone(DEFAULT_CONFIG);
const CHANGES = new Map(); // path → { old, new }

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// ── Path utilities ────────────────────────────────────────────────
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}
function setPath(obj, path, val) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = val;
}

// ══════════════════════════════════════════════════════════════════
//  INIT
//  Priority order:
//    1. localStorage  — user's saved edits  (most recent, survives refresh)
//    2. game.config.json — file on disk      (loaded only if no saved edits)
//    3. DEFAULT_CONFIG   — hard-coded default (absolute last resort)
// ══════════════════════════════════════════════════════════════════
async function init() {
  const LS_KEY = 'ms_admin_cfg';
  let   source = 'defaults';

  // ── 1. Try localStorage first ────────────────────────────────────
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      CFG      = deepClone(parsed);
      ORIGINAL = deepClone(parsed);
      source   = 'localStorage';
    } catch(e) {
      // Corrupted localStorage entry — clear it and fall through
      localStorage.removeItem(LS_KEY);
    }
  }

  // ── 2. No localStorage → try game.config.json file ───────────────
  if (source !== 'localStorage') {
    try {
      const r = await fetch('game.config.json');
      if (r.ok) {
        const loaded = await r.json();
        CFG      = deepClone(loaded);
        ORIGINAL = deepClone(loaded);
        source   = 'file';
      }
    } catch(e) { /* network/fetch error — fall through to defaults */ }
  }

  // ── Show config source banner ─────────────────────────────────────
  const banners = {
    localStorage: { msg: '✓ Loaded from saved session (localStorage)', cls: 'banner-ok' },
    file:         { msg: '✓ Loaded from game.config.json', cls: 'banner-ok' },
    defaults:     { msg: '⚠ Using built-in defaults — no file or saved session found', cls: 'banner-warn' },
  };
  showConfigBanner(banners[source].msg, banners[source].cls);

  document.getElementById('version-tag').textContent = `v${CFG.game?.version || '?'}`;
  updateSaveStatus();
  populateAllFields();
  renderEnemyCards();
  renderScoringTable();
  renderSfxTable();
  renderLevelsPanel();
  renderUiColors();
  updateJsonRaw();
}

// ══════════════════════════════════════════════════════════════════
//  FIELD POPULATION
// ══════════════════════════════════════════════════════════════════
function populateAllFields() {
  document.querySelectorAll('[data-path]').forEach(el => {
    const path = el.dataset.path;
    const val  = getPath(CFG, path);
    if (val === undefined) return;
    if (el.type === 'checkbox') el.checked = !!val;
    else if (el.type === 'color') { el.value = val; updateColorPreview(el); }
    else el.value = val;
    el.classList.remove('changed');
  });
}

// ══════════════════════════════════════════════════════════════════
//  FIELD CHANGE HANDLER
// ══════════════════════════════════════════════════════════════════
function fieldChanged(el) {
  const path    = el.dataset.path;
  const origVal = getPath(ORIGINAL, path);
  let newVal = el.type === 'checkbox' ? el.checked
             : el.type === 'number'   ? parseFloat(el.value)
             : el.value;

  if (typeof origVal === 'number' && !isNaN(parseFloat(newVal))) newVal = parseFloat(newVal);
  if (typeof origVal === 'boolean') newVal = !!newVal;

  setPath(CFG, path, newVal);

  const changed = JSON.stringify(newVal) !== JSON.stringify(origVal);
  el.classList.toggle('changed', changed);

  if (changed) CHANGES.set(path, { old: origVal, new: newVal });
  else         CHANGES.delete(path);

  updateChangeCounter();
  updateDiffPanel();
  updateJsonRaw();
}

function updateColorPreview(el) {
  const key  = el.dataset.path.split('.').slice(1).join('-');
  const prev = document.getElementById('prev-' + key);
  if (prev) prev.style.background = el.value;
}

// ══════════════════════════════════════════════════════════════════
//  ENEMY CARDS — all inline styles replaced with CSS classes
// ══════════════════════════════════════════════════════════════════
const ENEMY_EMOJIS  = { grunt:'👾', heavy:'🦾', flyer:'🛸', jumper:'🐸', sniper:'🎯', boss1:'😈', boss2:'🧟' };
const BEHAVIOR_OPTS = ['patrol','fast','flying','jumper','sniper'];

function renderEnemyCards() {
  const grid = document.getElementById('enemy-grid');
  grid.innerHTML = '';
  for (const [key, def] of Object.entries(CFG.enemies)) {
    const card = document.createElement('div');
    card.className   = 'enemy-card';
    card.dataset.type = key;
    const base = `enemies.${key}`;
    card.innerHTML = `
      <div class="enemy-card-head">
        <div class="enemy-avatar" data-border-color="${def.color}">${ENEMY_EMOJIS[key]||'👾'}</div>
        <div>
          <div class="enemy-name">${def.label}</div>
          <div class="enemy-tile-id">TILE ID: ${def.tileId}</div>
        </div>
      </div>
      <div class="enemy-card-body">
        ${numField(`${base}.speed`,       'SPEED',         0.1, 0.1, 10)}
        ${numField(`${base}.patrolRange`, 'PATROL RANGE',  1,   10,  400)}
        ${numField(`${base}.scoreValue`,  'SCORE',         50,  50,  5000)}
        ${behaviorField(`${base}.behavior`, 'BEHAVIOR', def.behavior)}
        ${colorField(`${base}.color`,     'BODY COLOR', def.color,     key+'-color')}
        ${colorField(`${base}.eyeColor`,  'EYE COLOR',  def.eyeColor,  key+'-eye')}
        ${boolField(`${base}.gravity`, 'HAS GRAVITY', def.gravity)}
        ${key === 'sniper' ? numField(`${base}.shootRate`, 'SHOOT RATE (f)', 1, 1, 300) : ''}
      </div>`;
    grid.appendChild(card);

    // Apply border colour via JS (dynamic value — cannot use static CSS)
    const avatar = card.querySelector('.enemy-avatar');
    if (avatar) avatar.style.borderColor = def.color;

    // Bind events
    card.querySelectorAll('[data-path]').forEach(el => {
      const evt = el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(evt, () => { fieldChanged(el); if (el.type === 'color') updateColorPreview(el); });
      const v = getPath(CFG, el.dataset.path);
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v;
    });
  }
}

// ── Field template helpers — NO inline styles ─────────────────────
function numField(path, label, step=1, min=0, max=9999) {
  return `<div class="field">
    <div class="field-label field-label-sm">${label}</div>
    <input type="number" data-path="${path}" step="${step}" min="${min}" max="${max}">
  </div>`;
}

function behaviorField(path, label, val) {
  return `<div class="field">
    <div class="field-label field-label-sm">${label}</div>
    <select data-path="${path}">${BEHAVIOR_OPTS.map(b=>`<option${b===val?' selected':''}>${b}</option>`).join('')}</select>
  </div>`;
}

function colorField(path, label, val, previewId) {
  return `<div class="field">
    <div class="field-label field-label-sm">${label}</div>
    <div class="color-field">
      <div class="color-preview" id="prev-${previewId}"></div>
      <input type="color" data-path="${path}" value="${val}">
    </div>
  </div>`;
}

function boolField(path, label, val) {
  return `<div class="field">
    <div class="field-label field-label-sm">${label}</div>
    <label class="toggle-wrap toggle-wrap-sm">
      <span class="toggle-label toggle-label-sm">${label}</span>
      <label class="toggle-switch">
        <input type="checkbox" data-path="${path}"${val?' checked':''}>
        <div class="toggle-slider"></div>
      </label>
    </label>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════
//  SCORING TABLE — inline styles replaced with CSS classes
// ══════════════════════════════════════════════════════════════════
const SCORE_LABELS = {
  trophy:'Trophy collected', key:'Key collected',
  enemyGrunt:'Kill Grunt', enemyHeavy:'Kill Heavy',
  enemyFlyer:'Kill Flyer', enemyJumper:'Kill Jumper',
  enemySniper:'Kill Sniper', 
  boss1:'Kill Boss 1', boss2:'Kill Boss 2', 
  levelComplete:'Level complete',
  extraLife:'Extra life threshold', grenadeKillBonus:'Grenade kill bonus'
};

function renderScoringTable() {
  const tbody = document.getElementById('score-tbody');
  tbody.innerHTML = '';
  for (const [k, v] of Object.entries(CFG.scoring)) {
    const path = `scoring.${k}`;
    const tr   = document.createElement('tr');
    tr.innerHTML = `
      <td class="score-key">${SCORE_LABELS[k] || k}</td>
      <td class="score-path-cell">${path}</td>
      <td><input type="number" class="score-table-input" data-path="${path}"
            value="${v}" min="0" max="999999" step="50" oninput="fieldChanged(this)"></td>`;
    tbody.appendChild(tr);
  }
}

// ══════════════════════════════════════════════════════════════════
//  LEVELS PANEL — inline styles replaced with CSS classes
// ══════════════════════════════════════════════════════════════════
const PARALLAX_OPTS = ['jungle','desert','factory','war'];
const MUSIC_OPTS    = ['march','action','tension','boss','silence'];

function renderLevelsPanel() {
  const body = document.getElementById('levels-body');
  body.innerHTML = '';
  CFG.levels.forEach((lv, i) => {
    const base = `levels.${i}`;
    const sec  = document.createElement('div');
    sec.className = 'level-block';
    sec.innerHTML = `
      <div class="level-block-title">
        LV ${i+1} — <span>${lv.name}</span>
      </div>
      <div class="field-grid field-grid-3">
        <div class="field">
          <div class="field-label">NAME<span class="field-path">${base}.name</span></div>
          <input type="text" data-path="${base}.name" value="${lv.name}" oninput="fieldChanged(this)">
        </div>
        <div class="field">
          <div class="field-label">BG COLOR<span class="field-path">${base}.bgColor</span></div>
          <div class="color-field">
            <div class="color-preview" id="prev-lv${i}-bg"></div>
            <input type="color" data-path="${base}.bgColor" value="${lv.bgColor}"
                   oninput="fieldChanged(this);updateColorPreview(this)">
          </div>
        </div>
        <div class="field">
          <div class="field-label">PARALLAX<span class="field-path">${base}.parallaxBg</span></div>
          <select data-path="${base}.parallaxBg" onchange="fieldChanged(this)">
            ${PARALLAX_OPTS.map(o=>`<option${o===lv.parallaxBg?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <div class="field-label">MUSIC THEME<span class="field-path">${base}.music</span></div>
          <select data-path="${base}.music" onchange="fieldChanged(this)">
            ${MUSIC_OPTS.map(o=>`<option${o===lv.music?' selected':''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <div class="field-label">MAP WIDTH<span class="field-path">${base}.width</span></div>
          <div class="field-row">
            <input type="number" data-path="${base}.width" value="${lv.width}" min="20" max="300" oninput="fieldChanged(this)">
            <span class="field-unit">tiles</span>
          </div>
        </div>
        <div class="field">
          <div class="field-label">MAP HEIGHT<span class="field-path">${base}.height</span></div>
          <div class="field-row">
            <input type="number" data-path="${base}.height" value="${lv.height}" min="5" max="30" oninput="fieldChanged(this)">
            <span class="field-unit">tiles</span>
          </div>
        </div>
      </div>`;
    body.appendChild(sec);
    // Set colour preview (dynamic value)
    const prev = sec.querySelector(`#prev-lv${i}-bg`);
    if (prev) prev.style.background = lv.bgColor;
  });
}

// ══════════════════════════════════════════════════════════════════
//  SFX TABLE — inline styles replaced with CSS classes
// ══════════════════════════════════════════════════════════════════
const WAVE_OPTS = ['sine','square','sawtooth','triangle'];

function renderSfxTable() {
  const tbody = document.getElementById('sfx-tbody');
  tbody.innerHTML = '';
  for (const [name, sfx] of Object.entries(CFG.audio.sfx)) {
    const base = `audio.sfx.${name}`;
    const tr   = document.createElement('tr');
    tr.innerHTML = `
      <td class="sfx-name-cell">${name.toUpperCase()}</td>
      <td><input type="number" class="sfx-input sfx-input-freq"
            data-path="${base}.freq" value="${sfx.freq}"
            min="20" max="8000" step="10" oninput="fieldChanged(this)"></td>
      <td><input type="number" class="sfx-input sfx-input-duration"
            data-path="${base}.duration" value="${sfx.duration}"
            step="0.01" min="0.01" max="3" oninput="fieldChanged(this)"></td>
      <td><select class="sfx-input sfx-select-wave"
            data-path="${base}.type" onchange="fieldChanged(this)">
          ${WAVE_OPTS.map(o=>`<option${o===sfx.type?' selected':''}>${o}</option>`).join('')}
        </select></td>
      <td><input type="number" class="sfx-input sfx-input-vol"
            data-path="${base}.vol" value="${sfx.vol}"
            step="0.01" min="0" max="1" oninput="fieldChanged(this)"></td>
      <td><button class="play-sfx" onclick="previewSfx('${name}')">▶ PLAY</button></td>`;
    tbody.appendChild(tr);
  }
}

// ── SFX preview ───────────────────────────────────────────────────
let _audioCtx = null;
function previewSfx(name) {
  const sfx = getPath(CFG, `audio.sfx.${name}`);
  if (!sfx) return;
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.type = sfx.type || 'square';
    osc.frequency.setValueAtTime(sfx.freq, _audioCtx.currentTime);
    gain.gain.setValueAtTime(sfx.vol || 0.1, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + sfx.duration);
    osc.start(); osc.stop(_audioCtx.currentTime + sfx.duration);
    toast(`Playing: ${name.toUpperCase()} @ ${sfx.freq}Hz`);
  } catch(e) { toast('Audio preview failed', 'error'); }
}

// ══════════════════════════════════════════════════════════════════
//  UI COLORS GRID
// ══════════════════════════════════════════════════════════════════
const UI_COLOR_LABELS = {
  crtGreen:'CRT Green', crtAmber:'CRT Amber', crtRed:'CRT Red',
  bgDark:'Background Dark', bgPanel:'Panel BG', borderGlow:'Border Glow'
};

function renderUiColors() {
  const grid = document.getElementById('ui-colors-grid');
  grid.innerHTML = '';
  for (const [k, v] of Object.entries(CFG.ui.colors)) {
    const path = `ui.colors.${k}`;
    const div  = document.createElement('div');
    div.className = 'field';
    div.innerHTML = `
      <div class="field-label">${(UI_COLOR_LABELS[k]||k).toUpperCase()}<span class="field-path">${path}</span></div>
      <div class="color-field">
        <div class="color-preview" id="prev-ui-${k}"></div>
        <input type="color" data-path="${path}" value="${v}"
               oninput="fieldChanged(this);updateColorPreview(this)">
      </div>`;
    grid.appendChild(div);
    // Set colour preview (dynamic value)
    const prev = div.querySelector(`#prev-ui-${k}`);
    if (prev) prev.style.background = v;
  }
}

// ══════════════════════════════════════════════════════════════════
//  JSON PANEL
// ══════════════════════════════════════════════════════════════════
function updateJsonRaw() {
  document.getElementById('json-raw').value = JSON.stringify(CFG, null, 2);
}
function formatJson() {
  const ta = document.getElementById('json-raw');
  try   { ta.value = JSON.stringify(JSON.parse(ta.value), null, 2); clearJsonError(); }
  catch (e) { showJsonError(e.message); }
}
function onJsonEdit() {
  const ta = document.getElementById('json-raw');
  try   { JSON.parse(ta.value); clearJsonError(); }
  catch (e) { showJsonError(e.message); }
}
function syncFromJson() {
  const ta = document.getElementById('json-raw');
  try {
    const parsed = JSON.parse(ta.value);
    CFG = deepClone(parsed);
    CHANGES.clear();
    populateAllFields();
    renderEnemyCards();
    renderScoringTable();
    renderSfxTable();
    renderLevelsPanel();
    renderUiColors();
    updateChangeCounter();
    updateDiffPanel();
    clearJsonError();
    toast('Synced from JSON ✓');
  } catch(e) { showJsonError(e.message); toast('Invalid JSON', 'error'); }
}
function showJsonError(msg) {
  const el = document.getElementById('json-error');
  el.textContent = '⚠ ' + msg;
  el.classList.add('visible');
}
function clearJsonError() {
  document.getElementById('json-error').classList.remove('visible');
}

// ══════════════════════════════════════════════════════════════════
//  DIFF / CHANGES
// ══════════════════════════════════════════════════════════════════
function updateChangeCounter() {
  const n  = CHANGES.size;
  const el = document.getElementById('change-counter');
  el.textContent = n === 0 ? 'NO CHANGES' : `${n} CHANGE${n>1?'S':''}`;
  el.classList.toggle('has-changes', n > 0);
  document.getElementById('diff-count-badge').textContent = `${n} change${n!==1?'s':''}`;
}

function updateDiffPanel() {
  const list = document.getElementById('diff-list');
  if (CHANGES.size === 0) {
    list.innerHTML = '<div class="diff-empty">NO CHANGES YET — MODIFY ANY FIELD TO SEE DIFFS HERE</div>';
    return;
  }
  list.innerHTML = '';
  for (const [path, {old: o, new: n}] of CHANGES) {
    const item = document.createElement('div');
    item.className = 'diff-item';
    item.innerHTML = `
      <span class="diff-path">${path}</span>
      <span class="diff-old">${JSON.stringify(o)}</span>
      <span class="diff-new">${JSON.stringify(n)}</span>`;
    list.appendChild(item);
  }
}

// ══════════════════════════════════════════════════════════════════
//  SAVE STATUS BANNER — explains persistence model to user
// ══════════════════════════════════════════════════════════════════

// Inject the banner element once into the DOM (inside savebar)
(function createBanner() {
  window.addEventListener('DOMContentLoaded', () => {
    const savebar = document.querySelector('.savebar');
    if (!savebar) return;
    const banner = document.createElement('div');
    banner.id = 'config-banner';
    banner.className = 'config-banner banner-hidden';
    savebar.after(banner);
  });
})();

function showConfigBanner(msg, cls = 'banner-ok') {
  const el = document.getElementById('config-banner');
  if (!el) return;
  el.textContent  = msg;
  el.className    = `config-banner ${cls}`;
}

// Show the last-saved timestamp in the save bar
function updateSaveStatus() {
  let el = document.getElementById('save-status');
  if (!el) {
    el = document.createElement('span');
    el.id = 'save-status';
    el.className = 'save-status';
    const savebar = document.querySelector('.savebar');
    if (savebar) savebar.appendChild(el);
  }
  const now = new Date().toLocaleTimeString();
  el.textContent = `LAST SAVED: ${now}`;
}

// ══════════════════════════════════════════════════════════════════
//  OPERATIONS
// ══════════════════════════════════════════════════════════════════
function applyChanges() {
  if (CHANGES.size === 0) { toast('No changes to apply', 'warn'); return; }
  localStorage.setItem('ms_admin_cfg', JSON.stringify(CFG));
  ORIGINAL = deepClone(CFG);
  CHANGES.clear();
  document.querySelectorAll('[data-path].changed').forEach(el => el.classList.remove('changed'));
  updateChangeCounter();
  updateDiffPanel();
  updateSaveStatus();
  document.getElementById('version-tag').textContent = `v${CFG.game?.version || '?'}`;
  toast('✓ Changes saved — will persist on refresh');
  showConfigBanner('✓ Config saved to session. Click ↓ EXPORT JSON to update game.config.json on disk.', 'banner-ok');
}

function revertAll() {
  CFG = deepClone(ORIGINAL);
  CHANGES.clear();
  populateAllFields();
  renderEnemyCards();
  renderScoringTable();
  renderSfxTable();
  renderLevelsPanel();
  renderUiColors();
  updateChangeCounter();
  updateDiffPanel();
  updateJsonRaw();
  toast('Reverted all changes', 'warn');
}

function resetConfig() {
  if (!confirm('RESET ALL CONFIG TO FACTORY DEFAULTS?\nThis cannot be undone.')) return;
  CFG      = deepClone(DEFAULT_CONFIG);
  ORIGINAL = deepClone(DEFAULT_CONFIG);
  CHANGES.clear();
  localStorage.removeItem('ms_admin_cfg');
  populateAllFields();
  renderEnemyCards();
  renderScoringTable();
  renderSfxTable();
  renderLevelsPanel();
  renderUiColors();
  updateChangeCounter();
  updateDiffPanel();
  updateJsonRaw();
  updateSaveStatus();
  showConfigBanner('↺ Reset to factory defaults. Click ⬆ APPLY CHANGES to save.', 'banner-warn');
  toast('Factory reset complete', 'warn');
}

function exportConfig() {
  const json = JSON.stringify(CFG, null, 2);
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([json], { type:'application/json' }));
  a.download = 'game.config.json';
  a.click();
  toast('Exported game.config.json ↓');
}

function copyConfig() {
  navigator.clipboard.writeText(JSON.stringify(CFG, null, 2))
    .then(() => toast('JSON copied to clipboard ⧉'))
    .catch(()  => toast('Copy failed — use Export instead', 'error'));
}

function importConfig(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      CFG      = deepClone(parsed);
      ORIGINAL = deepClone(parsed);
      CHANGES.clear();
      populateAllFields();
      renderEnemyCards();
      renderScoringTable();
      renderSfxTable();
      renderLevelsPanel();
      renderUiColors();
      updateChangeCounter();
      updateDiffPanel();
      updateJsonRaw();
      toast(`Imported: ${file.name} ✓`);
    } catch(err) { toast('Invalid JSON file', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ══════════════════════════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════════════════════════
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'json') updateJsonRaw();
  if (name === 'diff') updateDiffPanel();
}

// ══════════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════════
function toast(msg, type='') {
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('load', init);

// ── Ctrl+S = Apply Changes ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); applyChanges(); }
});

// ══════════════════════════════════════════════════════════════════
//  FULLSCREEN — admin page
// ══════════════════════════════════════════════════════════════════
(function initAdminFullscreen() {
  const btn = document.getElementById('btn-fullscreen-admin');
  if (!btn) return;

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
  }

  function syncBtn() {
    const full = isFullscreen();
    btn.textContent = full ? '✕ EXIT FULL' : '⛶ FULLSCREEN';
    btn.title       = full ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen (F11)';
    btn.classList.toggle('btn-amber', full);
  }

  function toggle() {
    if (!isFullscreen()) {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen ||
       el.mozRequestFullScreen || el.msRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen ||
       document.mozCancelFullScreen || document.msExitFullscreen).call(document);
    }
  }

  btn.addEventListener('click', toggle);
  document.addEventListener('keydown', e => { if (e.key === 'F11') { e.preventDefault(); toggle(); } });
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange']
    .forEach(ev => document.addEventListener(ev, syncBtn));
  syncBtn();
})();
// ════════════════════════════════════════════════════════════════
//  PHASE 3 — FEAT-011: THEMES ADMIN PANEL
//  Renders theme cards with live preview swatches.
//  Communicates to game.js via localStorage key 'dg_theme'.
// ════════════════════════════════════════════════════════════════

// Minimal theme metadata mirrored from game.js THEMES object
// (admin.js has no access to game.js scope)
const ADMIN_THEMES = {
  default:      { name:'DEFAULT',      icon:'🎮', bg:'#070a0f', solid:'#445588', brick:'#774422', spike:'#aaaaaa', lava:'#ff3300', platform:'#4a6fa5', desc:'Classic military retro' },
  neon_city:    { name:'NEON CITY',    icon:'🌆', bg:'#050010', solid:'#3a1a6a', brick:'#4a00aa', spike:'#ff00ff', lava:'#ff00aa', platform:'#cc00ff', desc:'Cyberpunk skyline' },
  ice_cave:     { name:'ICE CAVE',     icon:'❄️', bg:'#020814', solid:'#1a4a6a', brick:'#1a5a80', spike:'#aaddff', lava:'#00aaff', platform:'#44aadd', desc:'Frozen tundra depths' },
  desert_ruins: { name:'DESERT RUINS', icon:'🏜️', bg:'#150a00', solid:'#8b6a30', brick:'#aa7a25', spike:'#ddcc88', lava:'#ff8800', platform:'#cc9944', desc:'Ancient crumbling sands' },
  deep_space:   { name:'DEEP SPACE',   icon:'🚀', bg:'#000008', solid:'#152a3a', brick:'#152030', spike:'#00ff88', lava:'#ff4400', platform:'#00ff88', desc:'Zero-gravity void' },
  toxic_swamp:  { name:'TOXIC SWAMP',  icon:'☠️', bg:'#040a00', solid:'#2a5500', brick:'#336600', spike:'#aaff00', lava:'#66ff00', platform:'#88cc00', desc:'Radioactive wasteland' },
};

function adminApplyTheme(key) {
  localStorage.setItem('dg_theme', key);
  // If game window is open in same tab, call applyTheme directly
  if (typeof applyTheme === 'function') applyTheme(key);
  renderThemeGrid();
  toast('Theme applied: ' + (ADMIN_THEMES[key]?.name || key), 'success');
}

function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  const activeDisplay = document.getElementById('active-theme-display');
  if (!grid) return;

  const saved = localStorage.getItem('dg_theme') || 'default';
  if (activeDisplay) {
    const t = ADMIN_THEMES[saved];
    activeDisplay.textContent = t ? `${t.icon}  ${t.name} — ${t.desc}` : saved;
  }

  grid.innerHTML = '';
  for (const [key, t] of Object.entries(ADMIN_THEMES)) {
    const isActive = key === saved;
    const card = document.createElement('div');
    card.style.cssText = `
      background:${t.bg};
      border:2px solid ${isActive ? '#00e5ff' : '#222'};
      padding:14px;cursor:pointer;
      transition:border-color 0.15s;
      position:relative;`;
    card.innerHTML = `
      <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:${isActive?'#00e5ff':'#ccc'};margin-bottom:8px;">
        ${t.icon} ${t.name}${isActive ? ' ✓' : ''}
      </div>
      <div style="font-size:7px;color:#666;font-family:'Press Start 2P',monospace;margin-bottom:12px;line-height:1.7;">${t.desc}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        ${[
          ['SOLID',t.solid],['BRICK',t.brick],['SPIKE',t.spike],
          ['LAVA',t.lava],['PLATFORM',t.platform],
        ].map(([label,color])=>`
          <div style="text-align:center;">
            <div style="width:24px;height:24px;background:${color};border:1px solid #333;"></div>
            <div style="font-size:5px;color:#555;font-family:monospace;margin-top:2px;">${label}</div>
          </div>`).join('')}
      </div>
      <button onclick="adminApplyTheme('${key}')" style="
        background:${isActive?'#00e5ff':'#1a1a2e'};
        color:${isActive?'#000':'#888'};
        border:1px solid ${isActive?'#00e5ff':'#333'};
        padding:6px 12px;
        font-family:'Press Start 2P',monospace;font-size:7px;
        cursor:pointer;width:100%;">
        ${isActive ? '✓ ACTIVE' : 'APPLY THEME'}
      </button>`;
    grid.appendChild(card);
  }
}

// Auto-render when the themes tab becomes active
const _origSwitchTab = typeof switchTab === 'function' ? switchTab : null;
// Patch switchTab to also render theme grid
(function patchSwitchTab() {
  const orig = window.switchTab;
  window.switchTab = function(name, btn) {
    orig(name, btn);
    if (name === 'themes') renderThemeGrid();
  };
})();
