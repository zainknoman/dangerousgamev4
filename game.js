// ═══════════════════════════════════════════════════════════════════
//  ▒ ▒ ▒ D A N G E R O U S  G A M E ▒ ▒ ▒ — game.js
//  Full side-scrolling engine, config-driven, 5 enemy types,
//  grenades, jetpack, machine gun, parallax, level editor, HUD.
// ═══════════════════════════════════════════════════════════════════

/*
🎮 TILE EMOJI OPTIONS TABLE
ID	Tile	Option A (Clean)	Option B (Game)	Option C (Fun)
0	Empty	⬛	▫️	·
1	Ground	🟫	🟩	⬜
2	Brick	🧱	🟧	▒
3	Spike	⚠️	🔺	🪦
4	Trophy	🏆	🥇	🎖️
5	Key	🗝️	🔑	🧰
6	Door	🚪	🟫🚪	🚪
7	Pistol	🔫	🪖🔫	🔫
8	Lava	🌋	🔥	🟥
9	Ladder	🪜	🟫🪜	↕️
10	Platform	🟦	⬜	▬
11	Grunt	👾	👽	😈
12	Spawn	🚩	🧍	🟢
13	Warp	🌀	🟣	✨
14	Jetpack	🚀	🪖🚀	🔥
15	+Life	❤️	💚	💖
16	Grenade	💣	🧨	💥
17	MachineGun	🔫	🔫🔥	⚙️
18	Upgrade	💎	🔷	🆙
19	Mov Platform	🟪	🔳	⏹️
20	Heavy	🦾	🦍	🧱
21	Flyer	🛸	🐦	🦅
22	Jumper	🐸	🐇	🤸
23	Sniper	🎯	🔫🎯	👁️
24	Solid Block	⬛	🟫	⬜
30	Boss	👹	😈	🧟
31	Boss 2	💀	☠️	👻

*/

'use strict';

// ── Config (loaded from game.config.json via fetch, or inline below) ──
let CFG = null;

// Inline fallback / master config reference (matches game.config.json)
const CONFIG_DEFAULT = {
  game:   { title:'▒ ▒ ▒ DANGEROUS GAME ▒ ▒ ▒', subtitle:'▒ BUILD YOUR OWN GAME ▒', version:'1.0', recordReplays:true,
            canvas: { width:800, height:320, tileSize:32, pixelated:true, crtEffect:true } },
  player: {
    name:'SOLDIER', width:18, height:24, walkSpeed:3.0, runSpeed:4.8,
    jumpForce:-10, gravity:0.52, maxFallSpeed:13,
    startLives:3, maxLives:9, invincibilityFrames:120,
    shootCooldown:10, bulletSpeed:11,
    jetpackFuel:100, jetpackFuelRegen:0.6, jetpackLift:-3.8,
    grenadeThrowSpeed:6, grenadeGravity:0.4, grenadeFuse:80,
    frameRate:6, animFrames:4
  },
  enemies: {
    grunt:  { label:'GRUNT',  tileId:11, width:14, height:16, speed:1.4, patrolRange:80,  scoreValue:300, gravity:true,  color:'#44cc44', eyeColor:'#ff0000', behavior:'patrol' },
    heavy:  { label:'HEAVY',  tileId:20, width:18, height:20, speed:0.8, patrolRange:100, scoreValue:600, gravity:true,  color:'#cc4422', eyeColor:'#ffffff', behavior:'patrol' },
    flyer:  { label:'FLYER',  tileId:21, width:16, height:12, speed:1.6, patrolRange:120, scoreValue:400, gravity:false, color:'#aa44ff', eyeColor:'#ffff00', behavior:'flying' },
    jumper: { label:'JUMPER', tileId:22, width:12, height:14, speed:2.4, patrolRange:60,  scoreValue:500, gravity:true,  color:'#4488ff', eyeColor:'#ff4400', behavior:'jumper' },
    sniper: { label:'SNIPER', tileId:23, width:14, height:18, speed:0.5, patrolRange:40,  scoreValue:700, gravity:true,  color:'#884444', eyeColor:'#00ffff', behavior:'sniper', shootRate:90 }
  },
  weapons: {
    pistol:     { label:'PISTOL',       bulletSpeed:11, shootCooldown:10, ammo:-1, damage:1, bulletColor:'#ffff44', bulletW:6, bulletH:3 },
    machineGun: { label:'MACHINE GUN',  bulletSpeed:13, shootCooldown:5,  ammo:50, damage:1, bulletColor:'#ff8800', bulletW:5, bulletH:2 },
    grenade:    { label:'GRENADE', throwSpeed:6, gravity:0.4, fuse:80, blastRadius:80, ammo:3 }
  },
  scoring: { trophy:500, key:50, enemyGrunt:300, enemyHeavy:600, enemyFlyer:400,
             enemyJumper:500, enemySniper:700, levelComplete:1000, extraLife:10000, grenadeKillBonus:100 },
  audio: { enabled:true, sfx:{
    jump:    { freq:300, duration:0.12, type:'square',   vol:0.10 },
    shoot:   { freq:800, duration:0.05, type:'sawtooth', vol:0.08 },
    hit:     { freq:150, duration:0.25, type:'sawtooth', vol:0.18 },
    collect: { freq:600, duration:0.06, type:'square',   vol:0.12 },
    die:     { freq:300, duration:0.12, type:'sawtooth', vol:0.15 },
    levelUp: { freq:400, duration:0.18, type:'square',   vol:0.14 },
    door:    { freq:400, duration:0.15, type:'square',   vol:0.12 },
    grenade: { freq:120, duration:0.35, type:'sawtooth', vol:0.20 }
  }},
  ui: { hudHeight:40, msgDuration:90,
        fontSize:{ title:28, hud:9, msg:14, tiny:7 },
        colors:{ crtGreen:'#00ff41', crtAmber:'#ffb000', crtRed:'#ff2020',
                 bgDark:'#0a0a0f', bgPanel:'#0d0d1a', borderGlow:'#1a1a3e' } }
};

// ── Core constants (resolved after config loads) ──────────────────
let TILE_SIZE = 32;
let CANVAS_W  = 800;
let CANVAS_H  = 320;
let COLS_VIS, ROWS_VIS;

// ── Tile helpers ──────────────────────────────────────────────────
const TF = {
  isSolid:   t => t === 1 || t === 2 || t === 24,
  isKill:    t => t === 3 || t === 8,
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
  isBreakable:  t => t === 24,
  isLadder:     t => t === 9,
  isMovingPlatformTile: t => t === 10,
  isEnemy:   t => [11,20,21,22,23].includes(t),
  isBossSpawn:  t => t === 30,
  isBoss2Spawn: t => t === 31,
};

const TILE_NAMES = {
  0:'Empty', 1:'Ground', 2:'Brick', 3:'Spike', 4:'Trophy', 5:'Key',
  6:'Door', 7:'Pistol', 8:'Lava', 9:'Ladder', 10:'Mov.Plat', 11:'Grunt',
  12:'Spawn', 13:'Warp', 14:'Jetpack', 15:'+Life', 16:'Grenade',17:'MachineGun', 18:'UpgChip',
  20:'Heavy', 21:'Flyer', 22:'Jumper', 23:'Sniper',
  24:'Secret', 30:'BOSS', 31:'BOSS-2'
};

// Emoji icons for the editor palette tiles
const TILE_EMOJI = {
  0:'⬛',   1:'▓',  2:'▒',  3:'⚠️',  4:'🏆', 5:'🗝️',
  6:'🚪',  7:'🔫', 8:'🌋', 9:'🪜', 10:'⬛', 11:'👾',
  12:'🧍', 13:'🌀',14:'🚀',15:'❤️', 16:'💣',17:'⚙️',
  18:'💎', 19:'🟪', 20:'🦍', 21:'🛸',22:'🐇',23:'🎯',24:'💥',30:'👹',31:'🧟'
};

const TILE_COLORS = {
  0:'#111122', // Empty (dark)
  1:'#6b4f2a', // Ground (earth brown)
  2:'#a0522d', // Brick (brick brown)
  3:'#aaaaaa', // Spike (metal gray)
  4:'#ffcc00', // Trophy (gold)
  5:'#e6b800', // Key (gold darker)
  6:'#5a3a1a', // Door (wood)
  7:'#888888', // Pistol (metal)
  8:'#ff3300', // Lava (hot red)
  9:'#2e7d32', // Ladder (green wood tone)
  10:'#4a6fa5', // Moving Platform — FEAT-004 (tile ID corrected from 24 to 10)
  
  11:'#aa44ff', // Grunt (👾 purple)
  12:'#00aaff', // Spawn (blue marker)
  13:'#cc66ff', // Warp (magenta/purple swirl)
  14:'#3366ff', // Jetpack (blue energy)
  15:'#ff3355', // Life (red heart)
  16:'#ff8800', // Grenade (orange explosive)
  17:'#ff5500', // MachineGun (aggressive orange-red)
  18:'#00e5ff', // Upgrade (cyan tech)

  19:'#9966cc', // (reserved)
  
  20:'#cc4444', // Heavy (strong red)
  21:'#aa44ff', // Flyer (alien purple)
  22:'#44aaff', // Jumper (blue agile)
  23:'#ff4444', // Sniper (danger red)

  24:'#889966', // Breakable secret tile — FEAT-008 Phase 2 (earthy cracked brick)
  
  30:'#ff0033', // Boss (intense red)
  31:'#990033'  // Boss-2 (dark deadly red)
};

// ── Phase 1 + Phase 2: tile metadata ──
// TILE 10 = Moving Platform (FEAT-004, was mistakenly 24 — now corrected)
// TILE 24 = Breakable Secret Tile (FEAT-008, Phase 2)
// TILE 30/31 = Boss spawns (FEAT-001)

// ═══════════════════════════════════════════════════════════════════
//  AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type='square', vol=0.12, delay=0) {
  if (!CFG || !CFG.audio || !CFG.audio.enabled) return;
  try {
    const ctx = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur);
  } catch(e) {}
}

const SFX = {
  jump()    { playTone(320,0.12,'square',0.10); setTimeout(()=>playTone(520,0.08,'square',0.08),60); },
  shoot()   { playTone(820,0.05,'sawtooth',0.08); },
  mgShoot() { playTone(980,0.03,'sawtooth',0.06); },
  hit()     { playTone(140,0.28,'sawtooth',0.18); },
  collect() { [600,900,1200].forEach((f,i)=>setTimeout(()=>playTone(f,0.08),i*60)); },
  door()    { [400,520,650,820].forEach((f,i)=>setTimeout(()=>playTone(f,0.15),i*80)); },
  die()     { [300,240,180,140,100].forEach((f,i)=>setTimeout(()=>playTone(f,0.12,'sawtooth',0.15),i*60)); },
  levelUp() { [400,500,600,720,900,1100].forEach((f,i)=>setTimeout(()=>playTone(f,0.18),i*70)); },
  grenade() { playTone(80,0.06,'sawtooth',0.20); setTimeout(()=>playTone(120,0.35,'sawtooth',0.22),60); },
  jetpack() { playTone(280,0.06,'sawtooth',0.05); },
};

// ═══════════════════════════════════════════════════════════════════
//  SPRITE SYSTEM — procedural pixel art
// ═══════════════════════════════════════════════════════════════════
const SPRITES = {};

function mkC(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
function px(ctx,x,y,col){ ctx.fillStyle=col; ctx.fillRect(x,y,1,1); }

(function buildSprites() {
  // ══════════════════════════════════════════════════════════════
  //  AUTOFIRE-STYLE PLAYER SPRITE  (18×24, 4 walk frames)
  //  Modern mobile game aesthetic: helmet visor, armored vest,
  //  animated arms & legs, gun hand with muzzle detail.
  // ══════════════════════════════════════════════════════════════
  function drawSoldier(ctx, frame, dir, dead=false, climbing=false) {
    ctx.clearRect(0,0,18,24);
    if(dir===-1){ ctx.save(); ctx.scale(-1,1); ctx.translate(-18,0); }

    // ── Palette ──────────────────────────────────────────────────
    const SKIN  = '#f5c07a';  // face/skin
    const HELM  = '#1a2a4a';  // helmet dark blue
    const HELM2 = '#253a60';  // helmet midtone
    const VISOR = '#44ddff';  // visor glow cyan
    const VIS2  = '#0099bb';  // visor shadow
    const VEST  = '#2a5c8a';  // armor vest
    const VEST2 = '#1a3c60';  // vest shadow
    const VEST3 = '#3a7ab0';  // vest highlight
    const ARM   = '#1e4070';  // arm color
    const BOOT  = '#1a1a2e';  // boot/pant dark
    const PANT  = '#1e3050';  // pants
    const GUN   = '#888';
    const GUN2  = '#555';
    const GUN3  = '#ffcc00';  // muzzle flash
    const RED   = '#ff2244';

    if(dead) {
      // Flat dead pose — splayed
      // torso
      for(let x=3;x<15;x++) for(let y=8;y<14;y++) px(ctx,x,y,VEST);
      // head lolled to side
      for(let x=1;x<7;x++) for(let y=6;y<10;y++) px(ctx,x,y,HELM);
      px(ctx,2,7,VISOR); px(ctx,3,7,VISOR); px(ctx,4,7,VISOR);
      // X eyes
      px(ctx,2,8,RED); px(ctx,3,9,RED); px(ctx,3,8,RED); px(ctx,2,9,RED);
      // splayed limbs
      for(let x=0;x<4;x++) px(ctx,x,13,ARM);
      for(let x=0;x<4;x++) px(ctx,x,14,ARM);
      for(let x=14;x<18;x++) px(ctx,x,13,ARM);
      for(let x=14;x<18;x++) px(ctx,x,14,ARM);
      for(let x=4;x<8;x++) px(ctx,x,20,PANT);
      for(let x=4;x<8;x++) px(ctx,x,21,BOOT);
      for(let x=10;x<14;x++) px(ctx,x,20,PANT);
      for(let x=10;x<14;x++) px(ctx,x,21,BOOT);
      if(dir===-1) ctx.restore();
      return;
    }

    // ── LEG ANIMATION ─────────────────────────────────────────────
    // 4 frames: stride cycle — left/right legs alternate
    if (climbing) {
      // Climbing pose: legs spread, arms up
      // Left leg
      px(ctx,5,15,PANT); px(ctx,5,16,PANT); px(ctx,5,17,PANT);
      px(ctx,4,18,BOOT); px(ctx,4,19,BOOT); px(ctx,3,20,BOOT);
      // Right leg
      px(ctx,10,15,PANT); px(ctx,10,16,PANT); px(ctx,10,17,PANT);
      px(ctx,11,18,BOOT); px(ctx,11,19,BOOT); px(ctx,12,20,BOOT);
    } else {
      const lf = frame % 4; // 0,1,2,3
      // Left leg
      const lly = [0,2,-1,1][lf]; // Y offset for left leg
      const rly = [0,-1,2,-1][lf]; // Y offset for right leg (opposite phase)
      // Left thigh
      px(ctx,5,14+lly,PANT); px(ctx,5,15+lly,PANT); px(ctx,4,16+lly,PANT);
      // Left shin
      px(ctx,4,17+lly,PANT); px(ctx,4,18+lly,PANT);
      // Left boot
      px(ctx,3,19+lly,BOOT); px(ctx,4,19+lly,BOOT); px(ctx,3,20+lly,BOOT);
      // Right thigh
      px(ctx,11,14+rly,PANT); px(ctx,11,15+rly,PANT); px(ctx,12,16+rly,PANT);
      // Right shin
      px(ctx,12,17+rly,PANT); px(ctx,12,18+rly,PANT);
      // Right boot
      px(ctx,12,19+rly,BOOT); px(ctx,13,19+rly,BOOT); px(ctx,13,20+rly,BOOT);
    }

    // ── BODY / TORSO ───────────────────────────────────────────────
    // Armored vest main body
    for(let y=9;y<15;y++) for(let x=4;x<14;x++) px(ctx,x,y,VEST);
    // Vest highlight strip
    for(let y=9;y<13;y++) px(ctx,4,y,VEST3);
    for(let y=9;y<12;y++) px(ctx,13,y,VEST2);
    // Chest armor plate
    for(let y=10;y<13;y++) for(let x=6;x<12;x++) px(ctx,x,y,VEST3);
    px(ctx,8,11,VEST2); px(ctx,9,11,VEST2); // plate detail
    // Belt
    for(let x=4;x<14;x++) px(ctx,x,14,BOOT);
    px(ctx,8,14,'#555'); px(ctx,9,14,'#555'); // buckle

    // ── ARM ANIMATION ───────────────────────────────────────────────
    // Left arm (back arm, no gun) — swings opposite to right
    const armSwing = [0,1,-1,0][frame%4];
    // Back arm (left)
    px(ctx,3,9+armSwing,ARM); px(ctx,3,10+armSwing,ARM);
    px(ctx,2,10+armSwing,ARM); px(ctx,2,11+armSwing,ARM); px(ctx,2,12+armSwing,ARM);
    px(ctx,1,11+armSwing,ARM); // fist
    // Front arm (right) — holds gun, counter-swing
    const gSwing = [-armSwing, -armSwing+1, armSwing, -armSwing][frame%4];
    px(ctx,14,9-gSwing,ARM); px(ctx,14,10-gSwing,ARM);
    px(ctx,15,10-gSwing,ARM); px(ctx,15,11-gSwing,ARM);
    // Gun in hand
    px(ctx,15,11-gSwing,GUN2);
    px(ctx,16,10-gSwing,GUN);  px(ctx,17,10-gSwing,GUN);
    px(ctx,17,9-gSwing,GUN2); // barrel top
    if(frame===1||frame===3) { // shoot flash every other frame
      px(ctx,17,9-gSwing,'#ffee44');
    }

    // ── HELMET ────────────────────────────────────────────────────
    // Helmet dome
    for(let y=1;y<4;y++) for(let x=5;x<13;x++) px(ctx,x,y,HELM);
    for(let y=0;y<2;y++) for(let x=6;x<12;x++) px(ctx,x,y,HELM2);
    // Side ear/cheek guards
    for(let y=3;y<8;y++) { px(ctx,4,y,HELM); px(ctx,13,y,HELM); }
    px(ctx,3,4,HELM); px(ctx,3,5,HELM);
    px(ctx,14,4,HELM); px(ctx,14,5,HELM);
    // Neck/face connector
    for(let y=6;y<9;y++) for(let x=5;x<13;x++) px(ctx,x,y,HELM2);
    // ── VISOR ─────────────────────────────────────────────────────
    for(let y=3;y<7;y++) for(let x=5;x<13;x++) px(ctx,x,y,VISOR);
    // Visor shading gradient (top darker)
    for(let x=5;x<13;x++) px(ctx,x,3,VIS2);
    for(let x=5;x<13;x++) px(ctx,x,6,VIS2);
    // Visor shine (top-left bright spot)
    px(ctx,6,4,'#aaffff'); px(ctx,7,4,'#88eeff');
    px(ctx,6,5,'#66ddff');
    // Helmet ridge
    for(let x=6;x<12;x++) px(ctx,x,0,HELM2);
    // Antenna
    px(ctx,11,0,GUN); px(ctx,11,-1,GUN);

    if(dir===-1) ctx.restore();
  }

  // Build 4 walk frames × 2 directions
  for(let f=0;f<4;f++) for(const d of[1,-1]){
    const c=mkC(18,24); drawSoldier(c.getContext('2d'),f,d,false); SPRITES[`player_${f}_${d}`]=c;
  }
  // Dead sprite
  const dc=mkC(18,24); drawSoldier(dc.getContext('2d'),0,1,true); SPRITES['player_dead']=dc;
  // Climbing sprites
  for(let f=0;f<2;f++) for(const d of[1,-1]){
    const c=mkC(18,24); drawSoldier(c.getContext('2d'),f,d,false,true); SPRITES[`player_climb_${f}_${d}`]=c;
  }

  // ── Enemy: Grunt ──────────────────────────────────────────────
  function mkEnemy(frame, color='#44cc44', eyeColor='#ff0000') {
    const c=mkC(14,16); const ctx=c.getContext('2d');
    const g=color, dg='#228822', e=eyeColor, k='#000';
    for(let y=2;y<13;y++) for(let x=1;x<13;x++) px(ctx,x,y,g);
    [2,3,5,6,9,10].forEach(x=>px(ctx,x,1,g));
    px(ctx,5,0,g);px(ctx,6,0,g);
    px(ctx,2,3,e);px(ctx,3,3,e);px(ctx,9,3,e);px(ctx,10,3,e);
    for(let x=4;x<9;x++) px(ctx,x,7,k);
    px(ctx,4,6,k);px(ctx,9,6,k);
    if(frame===0){ for(let y=13;y<16;y++){px(ctx,3,y,dg);px(ctx,4,y,dg);px(ctx,9,y,dg);px(ctx,10,y,dg);} }
    else{ px(ctx,2,13,dg);px(ctx,3,13,dg);px(ctx,10,13,dg);px(ctx,11,13,dg);px(ctx,2,14,dg);px(ctx,3,14,dg);px(ctx,10,14,dg);px(ctx,11,14,dg); }
    return c;
  }
  SPRITES['grunt_0']=mkEnemy(0); SPRITES['grunt_1']=mkEnemy(1);
  SPRITES['heavy_0']=mkEnemy(0,'#cc4422','#ffffff'); SPRITES['heavy_1']=mkEnemy(1,'#cc4422','#ffffff');
  SPRITES['jumper_0']=mkEnemy(0,'#4488ff','#ff4400'); SPRITES['jumper_1']=mkEnemy(1,'#4488ff','#ff4400');
  SPRITES['sniper_0']=mkEnemy(0,'#884444','#00ffff'); SPRITES['sniper_1']=mkEnemy(1,'#884444','#00ffff');
  
  // ── Phase 1: BOSS SPRITE (32×36, 3 frames) ──────────────────────
  function mkBoss(frame) {
    const c = mkC(32,36); const ctx = c.getContext('2d');
    const body='#cc2244', dark='#881122', eye='#ffff00', arm='#aa1133';
    for(let y=4;y<26;y++) for(let x=4;x<28;x++) px(ctx,x,y,body);
    for(let y=4;y<10;y++){ px(ctx,1,y,arm);px(ctx,2,y,arm);px(ctx,3,y,arm);px(ctx,29,y,arm);px(ctx,30,y,arm); }
    for(let x=8;x<24;x++) for(let y=0;y<6;y++) px(ctx,x,y,dark);
    for(let x=10;x<14;x++) for(let y=2;y<5;y++) px(ctx,x,y,eye);
    for(let x=18;x<22;x++) for(let y=2;y<5;y++) px(ctx,x,y,eye);
    for(let x=6;x<26;x++) px(ctx,x,10,dark);
    for(let x=6;x<26;x++) px(ctx,x,18,dark);
    const armOff = frame===0?0:frame===1?-2:2;
    for(let y=8+armOff;y<18+armOff;y++){ px(ctx,0,y,arm);px(ctx,1,y,arm);px(ctx,2,y,arm);px(ctx,3,y,arm); }
    for(let y=8-armOff;y<18-armOff;y++){ px(ctx,28,y,arm);px(ctx,29,y,arm);px(ctx,30,y,arm);px(ctx,31,y,arm); }
    px(ctx,0,18+armOff,'#ff4400'); px(ctx,31,18-armOff,'#ff4400');
    for(let y=26;y<32;y++){ for(let x=6;x<14;x++) px(ctx,x,y,dark); for(let x=18;x<26;x++) px(ctx,x,y,dark); }
    const stepOff = (frame===1)?2:0;
    for(let x=5;x<14;x++) px(ctx,x,32+stepOff,dark);
    for(let x=18;x<27;x++) px(ctx,x,32-(frame===1?0:2),dark);
    return c;
  }
  for(let f=0;f<3;f++) SPRITES[`boss_${f}`] = mkBoss(f);

  // ── Boss2 (48x48, dark armored, magenta eyes) ─────────────
  function mkBoss2(frame){
    const c=mkC(48,48),ctx=c.getContext('2d');
    const r='#880022',dr='#440011',accent='#ff00aa',e='#ff00ff',k='#000',g='#aa0044';
    for(let y=10;y<42;y++)for(let x=4;x<44;x++)px(ctx,x,y,r);
    for(let y=6;y<20;y++)for(let x=0;x<8;x++){px(ctx,x,y,dr);px(ctx,47-x,y,dr);}
    for(let i=0;i<4;i++){px(ctx,1,6-i,accent);px(ctx,2,5-i,accent);px(ctx,46,6-i,accent);px(ctx,45,5-i,accent);}
    for(let y=0;y<14;y++)for(let x=6;x<42;x++)px(ctx,x,y,r);
    for(let x=8;x<40;x++)px(ctx,x,0,dr);
    for(let x=12;x<20;x++)for(let y=4;y<9;y++)px(ctx,x,y,k);
    for(let x=28;x<36;x++)for(let y=4;y<9;y++)px(ctx,x,y,k);
    for(let x=14;x<18;x++)for(let y=5;y<8;y++)px(ctx,x,y,e);
    for(let x=30;x<34;x++)for(let y=5;y<8;y++)px(ctx,x,y,e);
    px(ctx,13,4,accent);px(ctx,18,4,accent);px(ctx,29,4,accent);px(ctx,34,4,accent);
    for(let y=16;y<28;y++)for(let x=18;x<30;x++)px(ctx,x,y,g);
    for(let y=18;y<24;y++){px(ctx,19,y,k);px(ctx,20,y,k);px(ctx,27,y,k);px(ctx,28,y,k);}
    for(let x=21;x<27;x++)px(ctx,x,26,k);
    for(let y=14;y<36;y++){px(ctx,2,y,dr);px(ctx,3,y,dr);px(ctx,44,y,dr);px(ctx,45,y,dr);}
    for(let i=0;i<3;i++){px(ctx,1,16+i*6,accent);px(ctx,0,15+i*6,accent);px(ctx,46,16+i*6,accent);px(ctx,47,15+i*6,accent);}
    const lo=frame===0?0:3;
    for(let y=42;y<48;y++){px(ctx,5+lo,y,dr);px(ctx,6+lo,y,dr);px(ctx,7+lo,y,dr);px(ctx,39-lo,y,dr);px(ctx,40-lo,y,dr);px(ctx,41-lo,y,dr);}
    return c;
  }
  for(let f=0;f<3;f++) SPRITES[`boss2_${f}`] = mkBoss2(f%2);

  // ── Phase 1: UPGRADE CHIP SPRITE ─────────────────────────────────
  (function(){
    const c=mkC(18,18); const ctx=c.getContext('2d');
    ctx.fillStyle='#00ccff'; ctx.fillRect(3,3,12,12);
    ctx.fillStyle='#001833'; ctx.fillRect(5,5,8,8);
    ctx.fillStyle='#00ffff';
    ctx.fillRect(7,6,4,1); ctx.fillRect(7,11,4,1);
    ctx.fillRect(6,7,1,4); ctx.fillRect(11,7,1,4);
    ctx.fillRect(8,8,2,2);
    ctx.fillStyle='#0088aa';
    for(let i=3;i<15;i++){ ctx.fillRect(i,2,1,1); ctx.fillRect(i,15,1,1); }
    for(let i=3;i<15;i++){ ctx.fillRect(2,i,1,1); ctx.fillRect(15,i,1,1); }
    SPRITES['upgrade_chip']=c;
  })();

  // ── Flyer ─────────────────────────────────────────────────────
  function mkFlyer(frame) {
	  const c = mkC(16,12); const ctx = c.getContext('2d');
	  const body = '#aa44ff';
	  const wing = '#cc66ff';
	  const eye  = '#ffff00';
	  // center body (smaller, not rectangle)
	  for(let y=4;y<8;y++) for(let x=5;x<11;x++) px(ctx,x,y,body);
	  // eyes
	  px(ctx,6,5,eye); px(ctx,9,5,eye);
	  // animated wings (UP / DOWN)
	  if(frame === 0){
		// wings up
		for(let i=0;i<5;i++){
		  px(ctx,4-i,4-i,wing);
		  px(ctx,11+i,4-i,wing);
		}
	  } else {
		// wings down
		for(let i=0;i<5;i++){
		  px(ctx,4-i,7+i-2,wing);
		  px(ctx,11+i,7+i-2,wing);
		}
	  }
	  return c;
	}
	SPRITES['flyer_0']=mkFlyer(0);
	SPRITES['flyer_1']=mkFlyer(1);


  // ── Trophy ────────────────────────────────────────────────────
  const tC = mkC(12,14); const tX = tC.getContext('2d');
	tX.fillStyle='#ffcc00';
	tX.fillRect(2,1,8,3);   // cup top
	tX.fillRect(3,4,6,2);
	tX.fillRect(5,6,2,3);   // stem
	tX.fillRect(3,9,6,2);   // base
	// shine
	tX.fillStyle='#ffee88';
	tX.fillRect(3,2,2,1);
	tX.fillRect(4,5,1,1);
	// glow dots
	tX.fillStyle='#ffffaa';
	tX.fillRect(6,2,1,1);

	SPRITES['trophy']=tC;

  // ── Key ───────────────────────────────────────────────────────
  const kC=mkC(10,12); const kX=kC.getContext('2d');
  [[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[1,1],[8,1],[1,2],[8,2],[1,3],[8,3],
   [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[4,5],[4,6],[4,7],[4,8],[4,9],[5,7],[6,7],[5,9],[6,9]
  ].forEach(([x,y])=>{kX.fillStyle='#ddaa00';kX.fillRect(x,y,1,1);});
  SPRITES['key']=kC;

  // ── Door (open) ───────────────────────────────────────────────
  const dC=mkC(16,28); const dX=dC.getContext('2d');
  dX.fillStyle='#663300'; dX.fillRect(0,0,16,28);
  dX.fillStyle='#884422';
  for(let y=2;y<26;y+=4) dX.fillRect(2,y,12,2);
  dX.fillStyle='#ffcc00'; dX.fillRect(12,13,2,2);
  dX.fillStyle='#221100'; dX.fillRect(0,0,1,28); dX.fillRect(15,0,1,28);
  SPRITES['door']=dC;

  const doC=mkC(16,28); const doX=doC.getContext('2d');
  doX.fillStyle='#001122'; doX.fillRect(0,0,16,28);
  doX.fillStyle='#002244';
  for(let y=0;y<28;y+=3) doX.fillRect(2,y,12,1);
  doX.fillStyle='#0066aa'; doX.fillRect(7,11,2,5);
  SPRITES['door_open']=doC;

  // ── Gun ───────────────────────────────────────────────────────

	const gC = mkC(14,9); const gX = gC.getContext('2d');
	// barrel
	gX.fillStyle='#aaa'; gX.fillRect(3,3,8,2);
	// muzzle tip
	gX.fillStyle='#ffcc00';	gX.fillRect(11,3,2,2);
	// top slide
	gX.fillStyle='#666'; gX.fillRect(4,2,5,1);
	// grip (angled feel)
	gX.fillStyle='#333'; gX.fillRect(5,5,2,3); gX.fillRect(4,6,1,2);
	// trigger
	gX.fillStyle='#888'; gX.fillRect(6,4,1,1);
	SPRITES['gun']=gC;

  // ── Machine Gun ───────────────────────────────────────────────
  const mgC=mkC(14,8); const mgX=mgC.getContext('2d');
  for(let x=0;x<14;x++) mgX.fillStyle='#888', mgX.fillRect(x,3,1,2);
  mgX.fillStyle='#cc6600'; mgX.fillRect(8,0,5,3); mgX.fillRect(8,5,5,3);
  mgX.fillStyle='#555'; mgX.fillRect(12,1,2,6);
  SPRITES['machinegun']=mgC;

  // ── Grenade ───────────────────────────────────────────────────
	const rnC=mkC(10,14); const rnX=rnC.getContext('2d');
	rnX.fillStyle='#335533'; rnX.fillRect(3,4,4,7);
	rnX.fillStyle='#999'; rnX.fillRect(4,3,2,1);
	rnX.fillStyle='#ddd'; rnX.fillRect(5,2,1,1);
	rnX.fillStyle='#66aa66'; rnX.fillRect(3,5,1,3);
	rnX.fillStyle='#223322'; rnX.fillRect(6,5,1,4);
	rnX.fillStyle='#ff2200'; rnX.fillRect(3,7,4,1);
	SPRITES['grenade']=rnC;

  // ── Jetpack ───────────────────────────────────────────────────
	const jpC=mkC(12,16); const jpX=jpC.getContext('2d');
	// tanks
	jpX.fillStyle='#4466ff'; jpX.fillRect(2,1,3,9); jpX.fillRect(7,1,3,9);
	// connectors
	jpX.fillStyle='#2244cc'; jpX.fillRect(4,3,4,4);
	// 🔥 FLAMES (based on lava style)
	function drawFlame(x){
	  jpX.fillStyle='#ff6600'; jpX.fillRect(x,10,3,3);
	  jpX.fillStyle='#ffaa00'; jpX.fillRect(x,11,3,2);
	  jpX.fillStyle='#ffee00'; jpX.fillRect(x+1,11,1,2);
	  jpX.fillStyle='#ffffff'; jpX.fillRect(x+1,12,1,1);
	}
	drawFlame(2);
	drawFlame(7);

	SPRITES['jetpack']=jpC;

  // ── Life heart ────────────────────────────────────────────────
	const lC=mkC(10,9); const lX=lC.getContext('2d');
	lX.fillStyle='#ff2244';
	[[1,1],[2,1],[6,1],[7,1],
	 [0,2],[1,2],[2,2],[3,2],[5,2],[6,2],[7,2],[8,2],
	 [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
	 [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
	 [2,5],[3,5],[4,5],[5,5],[6,5],
	 [3,6],[4,6],[5,6],
	 [4,7]
	].forEach(([x,y])=>lX.fillRect(x,y,1,1));
	lX.fillStyle='#ff8899';
	lX.fillRect(2,2,2,1);

	SPRITES['life']=lC;

  // ── Bullet ────────────────────────────────────────────────────
  const bC=mkC(6,3); bC.getContext('2d').fillStyle='#ffff44'; bC.getContext('2d').fillRect(0,0,6,3);
  SPRITES['bullet']=bC;

  const mgBulC=mkC(5,2); mgBulC.getContext('2d').fillStyle='#ff8800'; mgBulC.getContext('2d').fillRect(0,0,5,2);
  SPRITES['mg_bullet']=mgBulC;

  // ── Grenade projectile ────────────────────────────────────────
  const gbC=mkC(5,6); const gbX=gbC.getContext('2d');
  gbX.fillStyle='#446644'; gbX.fillRect(1,0,3,5); gbX.fillStyle='#888'; gbX.fillRect(1,0,3,1);
  SPRITES['grenade_proj']=gbC;

  // ── Spike ─────────────────────────────────────────────────────
  const spC=mkC(32,16); const spX=spC.getContext('2d');
  for(let i=0;i<4;i++){
    spX.fillStyle='#aaaaaa';
    spX.beginPath(); spX.moveTo(i*8+4,0); spX.lineTo(i*8,16); spX.lineTo(i*8+8,16); spX.fill();
    spX.fillStyle='#cccccc'; spX.fillRect(i*8+2,8,3,2);
  }
  SPRITES['spike']=spC;

  // ── Ladder (tile 9) ──────────────────────────────────────────
  (function() {
    const c=mkC(32,32); const ctx=c.getContext('2d');
    // Side rails
    ctx.fillStyle='#5a3a1a';
    ctx.fillRect(4,0,4,32);
    ctx.fillRect(24,0,4,32);
    // Rail highlights
    ctx.fillStyle='#8a5a2a';
    ctx.fillRect(4,0,2,32);
    ctx.fillRect(24,0,2,32);
    // Rail shadow
    ctx.fillStyle='#2a1a08';
    ctx.fillRect(7,0,1,32);
    ctx.fillRect(27,0,1,32);
    // Rungs (6 rungs)
    for(let r=0;r<6;r++){
      const y=2+r*5;
      ctx.fillStyle='#6b4f2a';
      ctx.fillRect(4,y,24,3);
      ctx.fillStyle='#9a6a3a';
      ctx.fillRect(4,y,24,1);  // highlight
      ctx.fillStyle='#2a1a08';
      ctx.fillRect(4,y+2,24,1); // shadow
    }
    SPRITES['tile_ladder']=c;
  })();

  // ── Ground tile ───────────────────────────────────────────────
  function mkTile(bg,hi,sh){
    const c=mkC(32,32); const ctx=c.getContext('2d');
    ctx.fillStyle=bg; ctx.fillRect(0,0,32,32);
    ctx.fillStyle=hi; ctx.fillRect(0,0,32,2); ctx.fillRect(0,0,2,32);
    ctx.fillStyle=sh; ctx.fillRect(0,30,32,2); ctx.fillRect(30,0,2,32);
    // pixel detail
    ctx.fillStyle='rgba(255,255,255,0.06)';
    for(let y=4;y<32;y+=8) for(let x=4;x<32;x+=8) ctx.fillRect(x,y,2,2);
    return c;
  }
  // Tile sprites
  SPRITES['tile_solid']  = mkTile('#445588','#6677aa','#223366');
  SPRITES['tile_brick']  = mkTile('#774422','#995533','#442211');
  //SPRITES['tile_hazard'] = mkTile('#cc2200','#ee4422','#881100');

	// Add after SPRITES['tile_solid'] / tile definitions:
	function mkWarp(){
	  const c=mkC(32,32); const ctx=c.getContext('2d');
	  // Dark background
	  ctx.fillStyle='#0a0022'; ctx.fillRect(0,0,32,32);
	  // Swirling portal rings
	  ctx.strokeStyle='#aa44ff'; ctx.lineWidth=2;
	  ctx.beginPath(); ctx.arc(16,16,12,0,Math.PI*2); ctx.stroke();
	  ctx.strokeStyle='#cc66ff'; ctx.lineWidth=1;
	  ctx.beginPath(); ctx.arc(16,16,8,0,Math.PI*2); ctx.stroke();
	  ctx.strokeStyle='#ff88ff'; ctx.lineWidth=1;
	  ctx.beginPath(); ctx.arc(16,16,4,0,Math.PI*2); ctx.stroke();
	  // Bright center
	  ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(16,16,2,0,Math.PI*2); ctx.fill();
	  // Corner sparks
	  [[4,4],[28,4],[4,28],[28,28]].forEach(([x,y])=>{
		ctx.fillStyle='#aa44ff'; ctx.fillRect(x,y,2,2);
	  });
	  return c;
	}
	SPRITES['warp'] = mkWarp();

	// REPLACE with this lava sprite builder:
	function mkLava(){
	  const c=mkC(32,32); const ctx=c.getContext('2d');
	  // Base deep lava pool
	  ctx.fillStyle='#1a0000'; ctx.fillRect(0,0,32,32);
	  // Glowing lava layers
	  ctx.fillStyle='#cc2200';
	  ctx.fillRect(0,8,32,24);
	  ctx.fillStyle='#ee4400';
	  ctx.fillRect(0,12,32,20);
	  ctx.fillStyle='#ff6600';
	  ctx.fillRect(0,18,32,14);
	  // Bright core
	  ctx.fillStyle='#ff9900';
	  ctx.fillRect(4,22,6,10); ctx.fillRect(14,20,8,12); ctx.fillRect(24,23,6,9);
	  ctx.fillStyle='#ffcc00';
	  ctx.fillRect(6,24,3,8); ctx.fillRect(15,22,4,10); ctx.fillRect(25,25,3,7);
	  // Flame tips — pointed pixel triangles
	  // Flame 1 (left)
	  ctx.fillStyle='#ff6600';
	  ctx.fillRect(3,4,6,6); ctx.fillRect(4,2,4,4); ctx.fillRect(5,0,2,4);
	  ctx.fillStyle='#ffcc00';
	  ctx.fillRect(4,5,4,4); ctx.fillRect(5,3,2,3);
	  ctx.fillStyle='#ffffff';
	  ctx.fillRect(5,4,2,2);
	  // Flame 2 (center)
	  ctx.fillStyle='#ff4400';
	  ctx.fillRect(12,3,8,7); ctx.fillRect(13,1,6,4); ctx.fillRect(14,0,4,3);
	  ctx.fillStyle='#ff8800';
	  ctx.fillRect(13,4,6,5); ctx.fillRect(14,2,4,4);
	  ctx.fillStyle='#ffee00';
	  ctx.fillRect(14,3,4,3); ctx.fillRect(15,1,2,3);
	  ctx.fillStyle='#ffffff';
	  ctx.fillRect(15,2,2,2);
	  // Flame 3 (right)
	  ctx.fillStyle='#ff5500';
	  ctx.fillRect(22,5,7,5); ctx.fillRect(23,3,5,4); ctx.fillRect(24,1,3,4);
	  ctx.fillStyle='#ffaa00';
	  ctx.fillRect(23,5,5,4); ctx.fillRect(24,3,3,3);
	  ctx.fillStyle='#ffffff';
	  ctx.fillRect(24,4,2,2);
	  // Surface bubble detail
	  ctx.fillStyle='#ff3300';
	  ctx.fillRect(1,14,2,2); ctx.fillRect(10,10,3,2); ctx.fillRect(20,13,2,3); ctx.fillRect(28,11,2,2);
	  return c;
	}
	SPRITES['tile_hazard'] = mkLava();
	// Also pre-bake frame 1 (shifted flames for animation)
	function mkLava1(){
	  const c=mkC(32,32); const ctx=c.getContext('2d');
	  ctx.fillStyle='#1a0000'; ctx.fillRect(0,0,32,32);
	  ctx.fillStyle='#cc2200'; ctx.fillRect(0,9,32,23);
	  ctx.fillStyle='#ee4400'; ctx.fillRect(0,13,32,19);
	  ctx.fillStyle='#ff6600'; ctx.fillRect(0,19,32,13);
	  ctx.fillStyle='#ff9900';
	  ctx.fillRect(2,23,6,9); ctx.fillRect(13,21,8,11); ctx.fillRect(22,24,8,8);
	  ctx.fillStyle='#ffcc00';
	  ctx.fillRect(3,25,3,7); ctx.fillRect(14,23,4,9); ctx.fillRect(23,26,4,6);
	  // Flame 1 shifted up 1px
	  ctx.fillStyle='#ff6600';
	  ctx.fillRect(3,3,6,6); ctx.fillRect(4,1,4,4); ctx.fillRect(5,0,2,3);
	  ctx.fillStyle='#ffcc00';
	  ctx.fillRect(4,4,4,4); ctx.fillRect(5,2,2,3);
	  ctx.fillStyle='#ffffff'; ctx.fillRect(5,3,2,2);
	  // Flame 2 shifted up 2px
	  ctx.fillStyle='#ff4400';
	  ctx.fillRect(12,1,8,7); ctx.fillRect(13,0,6,3);
	  ctx.fillStyle='#ff8800';
	  ctx.fillRect(13,3,6,5); ctx.fillRect(14,1,4,4);
	  ctx.fillStyle='#ffee00';
	  ctx.fillRect(14,2,4,3); ctx.fillRect(15,0,2,3);
	  ctx.fillStyle='#ffffff'; ctx.fillRect(15,1,2,2);
	  // Flame 3 shifted up 1px
	  ctx.fillStyle='#ff5500';
	  ctx.fillRect(22,4,7,5); ctx.fillRect(23,2,5,4); ctx.fillRect(24,0,3,4);
	  ctx.fillStyle='#ffaa00';
	  ctx.fillRect(23,4,5,4); ctx.fillRect(24,2,3,3);
	  ctx.fillStyle='#ffffff'; ctx.fillRect(24,3,2,2);
	  ctx.fillStyle='#ff3300';
	  ctx.fillRect(2,15,2,2); ctx.fillRect(11,11,3,2); ctx.fillRect(21,14,2,3); ctx.fillRect(27,12,2,2);
	  return c;
	}
	SPRITES['tile_hazard_1'] = mkLava1();

    SPRITES['ready'] = true;
})();

// ═══════════════════════════════════════════════════════════════════
//  PARALLAX BACKGROUNDS
// ═══════════════════════════════════════════════════════════════════
const BG_LAYERS = {
  jungle: [
    { color:'#0a1205', speed:0.05 },
    { color:'#0d1808', speed:0.12 },
    { color:'#0f2008', speed:0.22 },
  ],
  desert: [
    { color:'#1a0f00', speed:0.05 },
    { color:'#221400', speed:0.15 },
    { color:'#2a1800', speed:0.25 },
  ],
  factory: [
    { color:'#080812', speed:0.05 },
    { color:'#0a0a18', speed:0.15 },
    { color:'#0c0c22', speed:0.25 },
  ],
  war: [
    { color:'#120003', speed:0.05 },
    { color:'#180004', speed:0.15 },
    { color:'#200006', speed:0.25 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════════════════
const G = {
  canvas: null, ctx: null,
  state: 'menu',  // menu | playing | editor | gameover | win
  score: 0,
  hiScore: 0, // Derived in loadLeaderboard() during bootstrap
  leaderboard: [],   // [{name,score,date}] top 10
  lives: 3,
  level: 0,

  // Weapons
  hasGun: false,      // pistol
  hasMG:  false,      // machine gun
  hasJetpack: false,
  hasKey: false,
  hasGrenade: false,
  grenadeCount: 0,
  weaponType: 'pistol', // 'pistol' | 'machinegun'
  ammo: -1,           // -1 = infinite (pistol)

  trophiesLeft: 0,
  doorOpen: false,
  camX: 0,
  map: null,
  mapW: 0, mapH: 0,
  bgColor: '#000',
  parallaxBg: 'jungle',
  spawnX: 0, spawnY: 0,

  player: null,
  enemies: [],
  items: [],
  bullets: [],
  grenades: [],
  particles: [],
  explosions: [],

  keys: {},
  invTimer: 0,
  levelTransTimer: 0,
  frameCount: 0,
  lastTime: 0,
  animFrame: 0,

  msgText: '', msgTimer: 0,

  // Touch input
  touch: { left:false, right:false, jump:false, shoot:false, grenade:false },

  // Cheat
  godMode: false,

  // Config-driven enemy data
  enemyDefs: {},
  
  
  // ── Phase 1: Weapon Upgrades ──────────────────────────────────────
  weaponUpgrades: { pistol:0, machinegun:0 },
  upgradeChipsCollected: 0,

  // ── Phase 1: Moving Platforms ─────────────────────────────────────
  movingPlatforms: [],

  // ── Phase 1: Boss ─────────────────────────────────────────────────
  boss: null,
  bossActive: false,
  bossDefeated: false,
};

// ═══════════════════════════════════════════════════════════════════
//  ENTITY FACTORIES
// ═══════════════════════════════════════════════════════════════════
function makePlayer(x,y) {
  const pc = CFG.player;
  return {
    x, y, vx:0, vy:0,
    w: 18, h: 24,  // autofire sprite size (18×24)
    dir:1, onGround:false, onLadder:false,
    frame:0, frameTimer:0,
    dead:false,
    jetFuel: pc.jetpackFuel,
    shootCooldown:0,
    grenadesHeld: 0,
  };
}

function makeEnemy(tx, ty, typeId) {
  const def = getEnemyDef(typeId);
  return {
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE,
    vx: def.speed, vy:0,
    w: def.width, h: def.height,
    typeId, def,
    dir:1, frame:0, frameTimer:0,
    dead:false, deadTimer:0,
    startX: tx * TILE_SIZE,
    patrolRange: def.patrolRange,
    behavior: def.behavior,
    jumpTimer:0,
    shootTimer: def.behavior==='sniper'? Math.floor(Math.random()*60):0,
    hp: def.hp || 1,
  };
}
/*
function getEnemyDef(typeId) {
  const map = {
    11:{ label:'Grunt',  sprite:'grunt',  width:14,height:16, speed:1.4, patrolRange:80,  scoreValue:300, gravity:true,  behavior:'patrol',  hp:1 },
    20:{ label:'Heavy',  sprite:'heavy',  width:18,height:20, speed:0.8, patrolRange:100, scoreValue:600, gravity:true,  behavior:'patrol',  hp:2 },
    21:{ label:'Flyer',  sprite:'flyer',  width:16,height:12, speed:1.6, patrolRange:120, scoreValue:400, gravity:false, behavior:'flying',  hp:1 },
    22:{ label:'Jumper', sprite:'jumper', width:12,height:14, speed:2.4, patrolRange:60,  scoreValue:500, gravity:true,  behavior:'jumper',  hp:1 },
    23:{ label:'Sniper', sprite:'sniper', width:14,height:18, speed:0.5, patrolRange:40,  scoreValue:700, gravity:true,  behavior:'sniper',  hp:1, shootRate:90 },
  };
  // Override from config if available
  const cfgMap = { 11:'grunt',20:'heavy',21:'flyer',22:'jumper',23:'sniper' };
  const cfgKey = cfgMap[typeId];
  if(CFG && CFG.enemies && CFG.enemies[cfgKey]) {
    const ce = CFG.enemies[cfgKey];
    return Object.assign({}, map[typeId], ce, { hp: map[typeId].hp });
  }
  return map[typeId] || map[11];
}
*/
function getEnemyDef(typeId) {
  const map = {
    11:{ label:'Grunt',  sprite:'grunt',  width:14,height:16, speed:1.4, patrolRange:80,  scoreValue:300, gravity:true,  behavior:'patrol',  hp:1 },
    20:{ label:'Heavy',  sprite:'heavy',  width:18,height:20, speed:0.8, patrolRange:100, scoreValue:600, gravity:true,  behavior:'patrol',  hp:2 },
    21:{ label:'Flyer',  sprite:'flyer',  width:16,height:12, speed:1.6, patrolRange:120, scoreValue:400, gravity:false, behavior:'flying',  hp:1 },
    22:{ label:'Jumper', sprite:'jumper', width:12,height:14, speed:2.4, patrolRange:60,  scoreValue:500, gravity:true,  behavior:'jumper',  hp:1 },
    23:{ label:'Sniper', sprite:'sniper', width:14,height:18, speed:0.5, patrolRange:40,  scoreValue:700, gravity:true,  behavior:'sniper',  hp:1, shootRate:90 },
  };
  const cfgMap = { 11:'grunt',20:'heavy',21:'flyer',22:'jumper',23:'sniper' };
  const cfgKey = cfgMap[typeId];
  if(CFG && CFG.enemies && CFG.enemies[cfgKey]) {
    const ce = CFG.enemies[cfgKey];
    return Object.assign({}, map[typeId], ce, { hp: map[typeId].hp });
  }
  if(map[typeId]) return map[typeId];

  // ✅ Custom character lookup
  const customChar = CUSTOM_CHARS.find(c => c.tileId === typeId);
  if(customChar){
    return {
      label:       customChar.name,
      sprite:      `custom_${typeId}`,        // ✅ not 'grunt'
      width:       14,
      height:      16,
      speed:       parseFloat(customChar.speed) || 1.4,
      patrolRange: parseInt(customChar.patrolRange) || 80,
      scoreValue:  parseInt(customChar.scoreValue) || 300,
      gravity:     true,
      behavior:    customChar.behavior || 'patrol',
      hp:          1,
      color:       customChar.color,
      eyeColor:    customChar.eyeColor,
    };
  }
  return map[11];
}

function makeItem(type, tx, ty) {
  return { type, x: tx*TILE_SIZE, y: ty*TILE_SIZE, collected:false, bobTimer:0 };
}

function makeBullet(x,y,dir,type='pistol') {
  const spd = type==='machinegun' ? (CFG.weapons.machineGun.bulletSpeed||13) : (CFG.weapons.pistol.bulletSpeed||11);
  return { x, y, vx: dir*spd, vy:0, dead:false, type };
}

function makeGrenade(x,y,dir) {
  const pc = CFG.player;
  return {
    x, y,
    vx: dir * (pc.grenadeThrowSpeed||6),
    vy: -5,
    w:5, h:6,
    dead:false,
    fuse: pc.grenadeFuse || 80,
    gravity: pc.grenadeGravity || 0.4,
    bounces: 0,
  };
}

function makeExplosion(x,y,r=80) {
  return { x, y, r, timer:20, maxTimer:20 };
}

// Boss & Moving Platforms
// ═══════════════════════════════════════════════════════════════════
//  PHASE 1 — BOSS SYSTEM
// ═══════════════════════════════════════════════════════════════════
function spawnBoss(col, row, tier=1) {
  const isBoss2 = tier === 2;
  G.boss = {
    x: col * TILE_SIZE - 9, y: row * TILE_SIZE - TILE_SIZE,
    w: isBoss2 ? 48 : 32, h: isBoss2 ? 48 : 36,
    vx: isBoss2 ? 1.8 : 1.2, vy: 0, dir: 1,
    startX: col * TILE_SIZE - 9,
    hp:    isBoss2 ? 30 : 12,
    maxHp: isBoss2 ? 30 : 12,
    frame: 0, frameTimer: 0,
    phase: 1, shootTimer: 0,
    shootRate: isBoss2 ? 50 : 80,
    chargeTimer: 0, dead: false, deadTimer: 0,
    onGround: false, invTimer: 0, jumpTimer: 120,
    tier: tier,           // 1=Boss, 2=Boss2
    scoreValue: isBoss2 ? 10000 : 5000,
    bulletSpeed: isBoss2 ? 8 : 6,
    patrolRange: isBoss2 ? 300 : 200,
  };
  G.bossActive = true;
}

function updateBoss() {
  if (!G.boss || !G.bossActive) return;
  const b = G.boss; const p = G.player;

  if (b.dead) {
    b.deadTimer--;
    if (b.deadTimer <= 0) {
      G.boss = null; G.bossActive = false; G.bossDefeated = true;
      G.score += 5000 * (G.scoreMultiplier||1);
      addScoreParticle(b.x + b.w/2, b.y, `+${5000*(G.scoreMultiplier||1)}`);
      showMsg('BOSS DEFEATED! +5000!', 150);
      SFX.levelUp();
      ACHV.emit('boss_killed');
      for(let i=0;i<30;i++) spawnParticle(b.x+b.w/2, b.y+b.h/2, '#ff2244', (Math.random()-0.5)*8, (Math.random()-0.5)*8);
      for(let i=0;i<20;i++) spawnParticle(b.x+b.w/2, b.y+b.h/2, '#ffcc00', (Math.random()-0.5)*6, (Math.random()-0.5)*6);
    }
    return;
  }

  if (b.hp <= b.maxHp / 2 && b.phase === 1) {
    b.phase = 2;
    b.shootRate = b.tier === 2 ? 25 : 45;
    b.vx = b.dir * (b.tier === 2 ? 3.0 : 2.2);
    showMsg(b.tier === 2 ? '💀 BOSS-2 BERSERK!' : 'BOSS ENRAGED!', 90);
    for(let i=0;i<12;i++) spawnParticle(b.x+b.w/2, b.y, '#ff0000', (Math.random()-0.5)*5, -Math.random()*4);
  }

  b.vx = b.dir * (b.phase === 2 ? 2.2 : 1.2);
  moveEntity(b, true);
  if (b.vx === 0 || Math.abs(b.x - b.startX) > (b.patrolRange||200)) b.dir *= -1;

  if (b.phase === 2) {
    b.chargeTimer++;
    if (b.chargeTimer > 180) {
      b.vx = b.dir * 5; b.chargeTimer = 0;
      for(let i=0;i<6;i++) spawnParticle(b.x+b.w/2, b.y+b.h, '#ff4400', b.dir*2, -1);
    }
  }

  b.jumpTimer--;
  if (b.jumpTimer <= 0 && b.onGround) {
    b.vy = -9; b.jumpTimer = b.phase === 2 ? 80 : 140;
  }

  b.shootTimer++;
  if (b.shootTimer >= b.shootRate) {
    b.shootTimer = 0;
    const dx = p.x - b.x; const bdir = dx > 0 ? 1 : -1;
    const bspd = b.bulletSpeed || 6;
    G.bullets.push({ x:b.x+b.w/2, y:b.y+8, vx:bdir*bspd, vy:0, dead:false, type:'enemy', color: b.tier===2 ? '#ff00aa' : '#ff2244' });
    if (b.phase === 2) {
      G.bullets.push({ x:b.x+b.w/2, y:b.y+8, vx:bdir*bspd, vy:-1.5, dead:false, type:'enemy', color:'#ff6600' });
      G.bullets.push({ x:b.x+b.w/2, y:b.y+8, vx:bdir*bspd, vy:1.5,  dead:false, type:'enemy', color:'#ff6600' });
      if (b.tier === 2) {
        // Boss2 phase 2: extra diagonal shots
        G.bullets.push({ x:b.x+b.w/2, y:b.y+8, vx:bdir*(bspd*0.7), vy:-3.5, dead:false, type:'enemy', color:'#ff00ff' });
        G.bullets.push({ x:b.x+b.w/2, y:b.y+8, vx:bdir*(bspd*0.7), vy:3.5,  dead:false, type:'enemy', color:'#ff00ff' });
      }
    }
    SFX.shoot();
  }

  if (b.invTimer > 0) b.invTimer--;
  if (!G.godMode && G.invTimer <= 0 && !p.dead &&
      rectOverlap(p.x+2, p.y+2, p.w-4, p.h-4, b.x, b.y, b.w, b.h)) {
    killPlayer();
  }

  b.frameTimer++;
  if (b.frameTimer > 10) { b.frame = (b.frame + 1) % 3; b.frameTimer = 0; }
  if (b.x < 0) { b.x = 0; b.dir = 1; }
  if (b.x + b.w > G.mapW * TILE_SIZE) { b.x = G.mapW * TILE_SIZE - b.w; b.dir = -1; }
}

function damageBoss(dmg) {
  if (!G.boss || G.boss.dead || G.boss.invTimer > 0) return;
  G.boss.hp -= dmg;
  G.boss.invTimer = 18;
  for(let i=0;i<6;i++) spawnParticle(G.boss.x+G.boss.w/2, G.boss.y+G.boss.h/2, '#ff2244', (Math.random()-0.5)*4, -Math.random()*3);
  SFX.hit();
  if (G.boss.hp <= 0) {
    G.boss.dead = true; G.boss.deadTimer = 60;
    G.explosions.push(makeExplosion(G.boss.x+G.boss.w/2, G.boss.y+G.boss.h/2, 100));
    G.explosions.push(makeExplosion(G.boss.x+G.boss.w/2-20, G.boss.y+10, 70));
    G.explosions.push(makeExplosion(G.boss.x+G.boss.w/2+20, G.boss.y+10, 70));
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 1 — MOVING PLATFORMS
// ═══════════════════════════════════════════════════════════════════
function updateMovingPlatforms() {
  const p = G.player;
  for (const mp of G.movingPlatforms) {
    const prevX = mp.x, prevY = mp.y;
    if (mp.axis === 'x') {
      mp.x += mp.vx;
      if (Math.abs(mp.x - mp.ox) > mp.range) mp.vx *= -1;
    } else {
      mp.y += mp.vy;
      if (Math.abs(mp.y - mp.oy) > mp.range) mp.vy *= -1;
    }
    if (!p.dead) {
      // Check if player feet are within a generous band around the platform top
      // Uses NEW platform position (mp.y) so the snap is accurate each frame
      const feetY   = p.y + p.h;
      const overlapX = p.x + p.w > mp.x + 2 && p.x < mp.x + mp.w - 2;
      const onTop   = overlapX && feetY >= mp.y - 10 && feetY <= mp.y + 14 && p.vy >= 0;
      if (onTop) {
        // Carry the platform's delta movement
        p.x += (mp.x - prevX);
        // Snap feet to the platform surface
        p.y = mp.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }
}

function isOnMovingPlatform(px, py, pw, ph) {
  for (const mp of G.movingPlatforms) {
    if (py + ph >= mp.y - 10 && py + ph <= mp.y + 14 &&
        px + pw > mp.x + 2 && px < mp.x + mp.w - 2) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 1 — WEAPON UPGRADE SYSTEM
// ═══════════════════════════════════════════════════════════════════
function applyWeaponUpgrade() {
  G.upgradeChipsCollected++;
  let upgraded = false;
  if (G.hasMG && G.weaponUpgrades.machinegun < 2) {
    G.weaponUpgrades.machinegun++;
    const tier = G.weaponUpgrades.machinegun;
    if (tier === 1) { G.ammo = Math.min((G.ammo > 0 ? G.ammo : 0) + 40, 120); showMsg('MG UPGRADED: +40 AMMO!', 120); }
    if (tier === 2) showMsg('MG RAPID FIRE UNLOCKED!', 120);
    upgraded = true;
  } else if (G.hasGun && G.weaponUpgrades.pistol < 2) {
    G.weaponUpgrades.pistol++;
    const tier = G.weaponUpgrades.pistol;
    if (tier === 1) showMsg('PISTOL BURST FIRE!', 120);
    if (tier === 2) showMsg('PISTOL SPREAD SHOT!', 120);
    upgraded = true;
  }
  if (!upgraded) showMsg('UPGRADE CHIP SAVED!', 90);
  SFX.levelUp();
}

function getUpgradedBullets(bx, by, dir) {
  const bullets = [];
  if (G.hasMG) {
    bullets.push(makeBullet(bx, by, dir, 'machinegun'));
  } else if (G.hasGun) {
    const tier = G.weaponUpgrades.pistol;
    bullets.push(makeBullet(bx, by, dir, 'pistol'));
    if (tier >= 1) {
      bullets.push({...makeBullet(bx+dir*4, by, dir, 'pistol')});
      bullets.push({...makeBullet(bx+dir*8, by, dir, 'pistol')});
    }
    if (tier >= 2) {
      const b2 = makeBullet(bx, by, dir, 'pistol'); b2.vy = -2.5; bullets.push(b2);
      const b3 = makeBullet(bx, by, dir, 'pistol'); b3.vy =  2.5; bullets.push(b3);
    }
  }
  return bullets;
}

// ═══════════════════════════════════════════════════════════════════
//  LEVEL LOADER
// ═══════════════════════════════════════════════════════════════════
function loadLevel(idx) {
  const ld = (typeof idx === 'object') ? idx : LEVELS[idx];
  G.mapH = ld.tiles.length;
  G.mapW = ld.tiles[0].length;
  G.bgColor = ld.bgColor || '#000';
  G.parallaxBg = ld.parallaxBg || 'jungle';
  G.map = ld.tiles.map(row=>[...row]);
  G.enemies=[]; G.items=[]; G.bullets=[]; G.grenades=[]; G.particles=[]; G.explosions=[];
  G.trophiesLeft=0; G.hasKey=false; G.doorOpen=false; G.camX=0;
  G.hasJetpack=false; G.hasMG=false; G.hasGrenade=false; G.grenadeCount=0;
  G.ammo=-1; G.weaponType='pistol';
  // ── Phase 2: reset breaking tiles and emit level_start ──
  G.breakingTiles = {};
  G._armorUsed = false;
  ACHV.emit('level_start');

// ── Phase 1: reset boss + load moving platforms ──
  G.boss=null; G.bossActive=false; G.bossDefeated=false;
  G.movingPlatforms = (ld.movingPlatforms || []).map(mp=>({
    x: mp.x, y: mp.y, ox: mp.x, oy: mp.y,
    w: mp.w || TILE_SIZE*2, h: mp.h || 8,
    vx: mp.axis==='x' ? mp.speed : 0,
    vy: mp.axis==='y' ? mp.speed : 0,
    range: mp.range || 96, axis: mp.axis || 'x', color: mp.color || '#aabb66',
  }));

  for(let row=0;row<G.mapH;row++) {
    for(let col=0;col<G.mapW;col++) {
      const t = G.map[row][col];
      if(t===12){ G.spawnX=col*TILE_SIZE; G.spawnY=row*TILE_SIZE; G.map[row][col]=0; }
      else if(t===4){ G.items.push(makeItem('trophy',col,row)); G.trophiesLeft++; G.map[row][col]=0; }
      else if(t===5){ G.items.push(makeItem('key',col,row)); G.map[row][col]=0; }
      else if(t===6){ G.items.push(makeItem('door',col,row)); G.map[row][col]=0; }
      else if(t===7){ G.items.push(makeItem('gun',col,row)); G.map[row][col]=0; }
	  else if(t===13){ G.items.push(makeItem('warp',col,row)); G.map[row][col]=0; }
      else if(t===14){ G.items.push(makeItem('jetpack',col,row)); G.map[row][col]=0; }
      else if(t===15){ G.items.push(makeItem('life',col,row)); G.map[row][col]=0; }
      else if(t===16){ G.items.push(makeItem('grenade',col,row)); G.map[row][col]=0; }
	  else if(t===17){ G.items.push(makeItem('machinegun',col,row)); G.map[row][col]=0; }
      // ── Phase 1: upgrade chip ──
      else if(t===18){ G.items.push(makeItem('upgrade_chip',col,row)); G.map[row][col]=0; }
      // ── Moving Platform tile (10) — create live platform from grid position ──
      else if(t===10){
        G.movingPlatforms.push({
          x: col*TILE_SIZE, y: row*TILE_SIZE,
          ox: col*TILE_SIZE, oy: row*TILE_SIZE,
          w: TILE_SIZE*2, h: 8,
          vx: 1.5, vy: 0,
          range: 96, axis: 'x',
          color: '#4a6fa5',
        });
        G.map[row][col]=0;
      }
      // ── Phase 2: FEAT-008 — Breakable secret tile (24) ──
      else if(t===24){
        // Breakable tiles stay in the map; they are handled in bullet/grenade collision
        // No removal here — the tile renders as a cracked brick until destroyed
      }
	  else if([11,20,21,22,23].includes(t) || CUSTOM_CHARS.some(c=>c.tileId===t)){
		  G.enemies.push(makeEnemy(col,row,t)); G.map[row][col]=0;
		}
      // ── Phase 1: boss spawn ──
      else if(t===30){ spawnBoss(col,row,1); G.map[row][col]=0; }
      else if(t===31){ spawnBoss(col,row,2); G.map[row][col]=0; }
    }
  }

  const maxLives = CFG ? CFG.player.maxLives : 9;
  G.player = makePlayer(G.spawnX, G.spawnY);
  G.invTimer = 0;
}

// ═══════════════════════════════════════════════════════════════════
//  COLLISION HELPERS
// ═══════════════════════════════════════════════════════════════════
function tileAt(px,py) {
  const col=Math.floor(px/TILE_SIZE), row=Math.floor(py/TILE_SIZE);
  if(col<0||col>=G.mapW||row<0||row>=G.mapH) return 1;
  return G.map[row][col];
}
function isSolid(px,py) { return TF.isSolid(tileAt(px,py)); }
function rectOverlap(ax,ay,aw,ah,bx,by,bw,bh) {
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}

function moveEntity(ent, useGravity=true) {
  const TS = TILE_SIZE;
  const gravity = CFG ? CFG.player.gravity : 0.52;
  const maxFall = CFG ? CFG.player.maxFallSpeed : 13;
  if(useGravity) ent.vy = Math.min(ent.vy + gravity, maxFall);

  // Horizontal
  ent.x += ent.vx;
  const left=ent.x, right=ent.x+ent.w-1, top=ent.y, bot=ent.y+ent.h-1;
  if(ent.vx>0 && (isSolid(right,top+2)||isSolid(right,bot-2))){
    ent.x=Math.floor(right/TS)*TS-ent.w; ent.vx=0;
  }
  if(ent.vx<0 && (isSolid(left,top+2)||isSolid(left,bot-2))){
    ent.x=Math.ceil(left/TS)*TS; ent.vx=0;
  }

  // Vertical
  ent.y += ent.vy;
  const l2=ent.x, r2=ent.x+ent.w-1, t2=ent.y, b2=ent.y+ent.h-1;
  ent.onGround=false;
  if(ent.vy>=0 && (isSolid(l2+2,b2)||isSolid(r2-2,b2))){
    ent.y=Math.floor(b2/TS)*TS-ent.h; ent.vy=0; ent.onGround=true;
  }
  if(ent.vy<0 && (isSolid(l2+2,t2)||isSolid(r2-2,t2))){
    ent.y=Math.ceil(t2/TS)*TS; ent.vy=0;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  PLAYER UPDATE
// ═══════════════════════════════════════════════════════════════════
function updatePlayer() {
  const p = G.player;
  if(p.dead) return;

  const pc = CFG.player;
  const walkSpeed = pc.walkSpeed;
  const runSpeed  = pc.runSpeed;
  const spd = (G.keys['ShiftLeft']||G.keys['ShiftRight']) ? runSpeed : walkSpeed;
  let moving = false;

  // Horizontal movement
  const goLeft  = G.keys['ArrowLeft']  || G.keys['KeyA'] || G.touch.left;
  const goRight = G.keys['ArrowRight'] || G.keys['KeyD'] || G.touch.right;
  if(goLeft)  { p.vx=-spd; p.dir=-1; moving=true; }
  else if(goRight){ p.vx=spd;  p.dir=1;  moving=true; }
  else { p.vx*=0.72; if(Math.abs(p.vx)<0.1) p.vx=0; }

  // Jump / jetpack
  const jumpPressed = G.keys['Space']||G.keys['ArrowUp']||G.keys['KeyW']||G.touch.jump;
  const _jetting = G.hasJetpack && p.jetFuel > 0 && jumpPressed; // track for gravity removal
  if(G.hasJetpack && p.jetFuel>0 && jumpPressed) {
    p.vy = pc.jetpackLift;
    p.jetFuel = Math.max(0, p.jetFuel - 1.5);
    SFX.jetpack();
    spawnParticle(p.x+p.w/2, p.y+p.h, '#ff6600', 0, 2);
    spawnParticle(p.x+p.w/2, p.y+p.h, '#ff9900', (Math.random()-0.5)*2, 2);
  } else if(jumpPressed && p.onGround) {
    p.vy = pc.jumpForce;
    p._doubleJumpAvail = G.rogueDoubleJump ? true : false;
    SFX.jump();
    G.keys['Space']=false; G.keys['ArrowUp']=false; G.keys['KeyW']=false;
    G.touch.jump=false;
  } else if(jumpPressed && !p.onGround && p._doubleJumpAvail && G.rogueDoubleJump) {
    // Double jump (roguelite boon)
    p.vy = pc.jumpForce * 0.85;
    p._doubleJumpAvail = false;
    SFX.jump();
    for(let i=0;i<5;i++) spawnParticle(p.x+p.w/2, p.y+p.h/2, '#aaddff', (Math.random()-0.5)*3, (Math.random()-0.5)*3);
    G.keys['Space']=false; G.keys['ArrowUp']=false; G.keys['KeyW']=false;
    G.touch.jump=false;
  }
  if(p.onGround && G.hasJetpack) p.jetFuel=Math.min(pc.jetpackFuel, p.jetFuel+pc.jetpackFuelRegen);

  // Shoot
	const shootPressed = G.keys['ControlLeft']||G.keys['ControlRight']||G.keys['KeyZ']||G.touch.shoot;
	if(shootPressed && (G.hasGun||G.hasMG)) {
		const baseCooldown = G.hasMG
		  ? (G.weaponUpgrades.machinegun >= 2 ? 3 : (CFG.weapons.machineGun.shootCooldown||5))
		  : (CFG.weapons.pistol.shootCooldown||10);

		if(p.shootCooldown<=0) {
		  const bx = p.dir===1 ? p.x+p.w : p.x-6;

		  // 🔥 NEW: upgraded bullets
		  const newBullets = getUpgradedBullets(bx, p.y+6, p.dir);
		  for(const nb of newBullets) G.bullets.push(nb);

		  G.hasMG ? SFX.mgShoot() : SFX.shoot();

		  p.shootCooldown = baseCooldown;      if(G.hasMG && G.ammo>0) {
			G.ammo--;
			if(G.ammo===0){ G.hasMG=false; G.weaponType='pistol'; G.ammo=-1; showMsg('OUT OF AMMO!'); }
		  }
		}
	}
	if(p.shootCooldown>0) p.shootCooldown--;

  // Grenade throw
  const gPressed = G.keys['KeyG'] || G.keys['KeyX'] || G.touch.grenade;
  if(gPressed && G.grenadeCount>0 && p.grenadeThrowCooldown<=0) {
    G.grenades.push(makeGrenade(p.x+p.w/2, p.y+4, p.dir));
    G.grenadeCount--;
    p.grenadeThrowCooldown=40;
    showMsg('GRENADE!', 40);
  }
  if(!p.grenadeThrowCooldown) p.grenadeThrowCooldown=0;
  if(p.grenadeThrowCooldown>0) p.grenadeThrowCooldown--;

  // ── Ladder climbing ────────────────────────────────────────────
  const midTile = tileAt(p.x + p.w/2, p.y + p.h/2);
  const topTile = tileAt(p.x + p.w/2, p.y + 2);
  const p_onLadder = TF.isLadder(midTile) || TF.isLadder(topTile);
  p.onLadder = p_onLadder;

  if (p_onLadder) {
    const goUp   = G.keys['ArrowUp']  || G.keys['KeyW'] || G.touch.jump;
    const goDown = G.keys['ArrowDown']|| G.keys['KeyS'];
    const climbSpd = 2.2;

    // Jump off ladder — always allowed (no onGround requirement)
    if (jumpPressed) {
      p.vy = pc.jumpForce;
      p.onLadder = false;
      // Consume jump key so it doesn't re-trigger next frame
      G.keys['Space'] = false; G.keys['ArrowUp'] = false;
      G.keys['KeyW'] = false; G.touch.jump = false;
      moveEntity(p, true); // restore gravity immediately on jump
    } else {
      if (goUp)        p.vy = -climbSpd;
      else if (goDown) p.vy =  climbSpd;
      else             p.vy = 0;

      // Detect ladder top: tile above head is NOT a ladder — snap player up
      const aboveTile = tileAt(p.x + p.w/2, p.y - 2);
      if (goUp && !TF.isLadder(aboveTile) && TF.isSolid(aboveTile)) {
        // Solid ceiling above — stop climbing
        p.vy = 0;
      } else if (goUp && !TF.isLadder(aboveTile) && !TF.isSolid(aboveTile)) {
        // Open air above — allow player to step off the top of the ladder
        const ladderTopY = Math.floor(p.y / TILE_SIZE) * TILE_SIZE;
        if (p.y <= ladderTopY + 2) {
          // Snap feet to top of ladder tile and stop
          p.y = ladderTopY - p.h;
          p.vy = 0;
          p.onLadder = false;
        }
      }
      moveEntity(p, false); // no gravity on ladder
    }
  } else if (_jetting) {
    moveEntity(p, false); // NO gravity while actively jetting with fuel
  } else {
    moveEntity(p, true);
  }

  // ── Phase 1: moving platform ground detection ──
  if (!p.onGround && G.movingPlatforms.length > 0) {
    if (isOnMovingPlatform(p.x, p.y, p.w, p.h)) {
      p.onGround = true; p.vy = 0;
    }
  }

  // World bounds
  // World bounds
  if(p.x<0){ p.x=0; p.vx=0; }
  if(p.x+p.w>G.mapW*TILE_SIZE){ p.x=G.mapW*TILE_SIZE-p.w; p.vx=0; }

  // Smooth camera follow
  const targetCam = p.x - CANVAS_W/2 + p.w/2;
  G.camX += (targetCam - G.camX)*0.14;
  G.camX = Math.max(0, Math.min(G.camX, G.mapW*TILE_SIZE-CANVAS_W));

  // Animation
  if(moving||!p.onGround){
    p.frameTimer++;
    if(p.frameTimer>6){ p.frame=(p.frame+1)%4; p.frameTimer=0; }
  } else { p.frame=0; }

  // Hazard tile contact
  if(!G.godMode && G.invTimer<=0) {
    if(TF.isKill(tileAt(p.x+p.w/2,p.y+p.h-1))) killPlayer();
    if(TF.isKill(tileAt(p.x+p.w/2,p.y+2)))     killPlayer();
  }

  // Fall out of world
  if(p.y > G.mapH*TILE_SIZE+96) killPlayer();
  if(G.invTimer>0) G.invTimer--;
}

// ═══════════════════════════════════════════════════════════════════
//  ITEM PICKUP
// ═══════════════════════════════════════════════════════════════════
function updateItems() {
  const p = G.player;
  if(p.dead) return;
  for(const item of G.items) {
    if(item.collected) continue;
    item.bobTimer+=0.06;
    if(!rectOverlap(p.x,p.y,p.w,p.h,item.x,item.y,TILE_SIZE,TILE_SIZE)) continue;
    item.collected=true;
    SFX.collect();
    const sc = CFG.scoring;
    switch(item.type) {
      case 'trophy':
        G.score += (sc.trophy||500) * (G.scoreMultiplier||1);
        G.trophiesLeft--;
        addScoreParticle(item.x,item.y,`+${Math.round((sc.trophy||500)*(G.scoreMultiplier||1))}`);
        if (G.trophiesLeft === 0) ACHV.emit('all_trophies');
        break;
      case 'key':
        G.hasKey=true; showMsg('KEY!'); addScoreParticle(item.x,item.y,'KEY!'); break;
      case 'door':
        if(G.hasKey && G.trophiesLeft===0){
          SFX.door(); showMsg('NEXT LEVEL!'); G.doorOpen=true;
          G.score+=(sc.levelComplete||1000)*(G.scoreMultiplier||1); G.levelTransTimer=130;
          ACHV.emit('level_complete', { levelIdx: G.level });
          // Roguelite: offer boons between levels
          if (ROGUE.isActive() && !G.isDailyRun) {
            G.levelTransTimer = 999; // pause transition
            ROGUE.offerBoons(() => {
              G.levelTransTimer = 130; // resume after boon chosen
            });
          }
        } else if(!G.hasKey){
          item.collected=false; showMsg('NEED KEY!');
        } else {
          item.collected=false; showMsg(`${G.trophiesLeft} TROPHIES LEFT!`);
        }
        break;
      case 'gun':
        G.hasGun=true; G.weaponType='pistol'; G.ammo=-1;
        showMsg('PISTOL!'); addScoreParticle(item.x,item.y,'PISTOL!'); break;
      case 'machinegun':
        G.hasGun=true; G.hasMG=true; G.weaponType='machinegun';
        G.ammo = CFG.weapons.machineGun.ammo||50;
        showMsg('MACHINE GUN!'); addScoreParticle(item.x,item.y,'M.GUN!'); break;
      case 'jetpack':
        G.hasJetpack=true; p.jetFuel=CFG.player.jetpackFuel||100;
        showMsg('JETPACK!'); addScoreParticle(item.x,item.y,'JETPACK!'); break;
      case 'life': {
        const max = CFG.player.maxLives||9;
        G.lives=Math.min(max,G.lives+1); showMsg('+1 UP!'); addScoreParticle(item.x,item.y,'+1UP!'); break;
      }
      case 'grenade':
        G.grenadeCount+=3; G.hasGrenade=true;
        showMsg('GRENADES x3!'); addScoreParticle(item.x,item.y,'x3 NADE'); break;
	  case 'warp':
		  SFX.levelUp();
		  G.score += CFG.scoring.levelComplete || 1000;
		  showMsg('WARP!');
		  const warpNext = G.level + 1;
		  if(warpNext >= LEVELS.length){
			checkAndShowHighScore(G.score, ()=>switchState('win'));
		  } else {
			cancelAnimationFrame(G.animFrame);
			showLevelTransition(G.level, warpNext, ()=>{
			  G.level = warpNext;
			  loadLevel(G.level);
			  switchState('playing');
			});
		  }
		  break;
		  
      // ── Phase 1: Upgrade Chip ──
      case 'upgrade_chip':
        addScoreParticle(item.x, item.y, 'UPGRADE!');
        applyWeaponUpgrade();
        break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  ENEMY UPDATE
// ═══════════════════════════════════════════════════════════════════
function updateEnemies() {
  const p = G.player;
  for(const e of G.enemies) {
    if(e.dead){ e.deadTimer--; continue; }

    switch(e.behavior) {
      case 'patrol':
      case 'fast':
        e.vx = e.dir * e.def.speed;
        moveEntity(e, e.def.gravity);
        if(e.vx===0 || (!e.onGround && e.def.gravity)) e.dir*=-1;
        if(Math.abs(e.x-e.startX)>e.patrolRange) e.dir*=-1;
        break;
      // case 'flying':
        // e.vx = e.dir * e.def.speed;
        // // Fly in sine wave
        // e.y += Math.sin(G.frameCount*0.05 + e.startX*0.02)*0.8;
        // e.x += e.vx;
        // if(Math.abs(e.x-e.startX)>e.patrolRange){ e.dir*=-1; }
        // e.onGround=false;
        // break;
		case 'flying':
		  e.vx = e.dir * e.def.speed;

		  // ── Horizontal: check walls before moving ──
		  const nextX = e.x + e.vx;
		  const fRight = nextX + e.w - 1;
		  const fLeft  = nextX;
		  const fMidY  = e.y + e.h / 2;
		  if(e.vx > 0 && isSolid(fRight, fMidY)){
			// Hit wall on right — snap to wall edge and reverse
			e.x = Math.floor(fRight / TILE_SIZE) * TILE_SIZE - e.w;
			e.dir *= -1;
		  } else if(e.vx < 0 && isSolid(fLeft, fMidY)){
			// Hit wall on left — snap to wall edge and reverse
			e.x = Math.ceil(fLeft / TILE_SIZE) * TILE_SIZE;
			e.dir *= -1;
		  } else {
			e.x = nextX;
		  }

		  // ── Vertical: sine wave but clamp against ceilings and floors ──
		  const sineStep = Math.sin(G.frameCount * 0.05 + e.startX * 0.02) * 0.8;
		  const nextY = e.y + sineStep;
		  const fTop = nextY;
		  const fBot = nextY + e.h - 1;
		  const fMidX = e.x + e.w / 2;
		  if(sineStep < 0 && isSolid(fMidX, fTop)){
			// Ceiling — stop moving up, snap below ceiling
			e.y = Math.ceil(fTop / TILE_SIZE) * TILE_SIZE;
		  } else if(sineStep > 0 && isSolid(fMidX, fBot)){
			// Floor — stop moving down, snap above floor
			e.y = Math.floor(fBot / TILE_SIZE) * TILE_SIZE - e.h;
		  } else {
			e.y = nextY;
		  }

		  // Patrol range reversal (only when not already reversed by wall)
		  if(Math.abs(e.x - e.startX) > e.patrolRange) e.dir *= -1;

		  e.onGround = false;
		  break;
      case 'jumper':
        e.vx = e.dir * e.def.speed;
        moveEntity(e, true);
        if(e.onGround){
          e.jumpTimer++;
          if(e.jumpTimer>40){ e.vy=-8; e.jumpTimer=0; }
        }
        if(e.vx===0) e.dir*=-1;
        if(Math.abs(e.x-e.startX)>e.patrolRange) e.dir*=-1;
        break;
      case 'sniper':
        e.vx = e.dir * e.def.speed * 0.3;
        moveEntity(e, true);
        if(Math.abs(e.x-e.startX)>e.patrolRange) e.dir*=-1;
        // Shoot at player
        e.shootTimer++;
        if(e.shootTimer>=(e.def.shootRate||90)){
          const dx = p.x-e.x;
          if(Math.abs(dx)<CANVAS_W && !p.dead && G.invTimer<=0){
            const bdir = dx>0?1:-1;
            G.bullets.push({x:e.x+e.w/2, y:e.y+6, vx:bdir*7, vy:0, dead:false, type:'enemy', color:'#ff4422'});
          }
          e.shootTimer=0;
        }
        break;
    }

    // Anim
    e.frameTimer++;
    if(e.frameTimer>8){ e.frame=(e.frame+1)%2; e.frameTimer=0; }

    // Hit player
    if(!G.godMode && G.invTimer<=0 && !p.dead &&
        rectOverlap(p.x+2,p.y+2,p.w-4,p.h-4,e.x,e.y,e.w,e.h)){
      killPlayer();
    }
  }
  // Cleanup dead enemies
  G.enemies = G.enemies.filter(e=>!e.dead||e.deadTimer>0);
}

// ═══════════════════════════════════════════════════════════════════
//  BULLETS UPDATE
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — FEAT-008: BREAKABLE SECRET TILES (tile ID 24)
// ═══════════════════════════════════════════════════════════════════
function tileCol(wx) { return Math.floor(wx / TILE_SIZE); }
function tileRow(wy) { return Math.floor(wy / TILE_SIZE); }

function tryBreakTile(wx, wy) {
  const col = tileCol(wx);
  const row = tileRow(wy);
  if (row < 0 || row >= G.mapH || col < 0 || col >= G.mapW) return false;
  if (G.map[row][col] !== 24) return false;
  // Crack animation state
  if (!G.breakingTiles) G.breakingTiles = {};
  const key = `${row}_${col}`;
  if (!G.breakingTiles[key]) {
    G.breakingTiles[key] = { col, row, frame: 0, timer: 0 };
  }
  G.breakingTiles[key].frame++;
  if (G.breakingTiles[key].frame >= 3) {
    // Fully broken — clear the tile, spawn a bonus pickup
    G.map[row][col] = 0;
    delete G.breakingTiles[key];
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    for (let i = 0; i < 10; i++)
      spawnParticle(cx, cy, '#aabb66', (Math.random()-0.5)*4, (Math.random()-0.5)*4);
    // Randomly spawn trophy or upgrade chip
    const bonus = Math.random() < 0.5 ? 'trophy' : 'upgrade_chip';
    if (bonus === 'trophy') { G.items.push(makeItem('trophy', col, row)); G.trophiesLeft++; }
    else G.items.push(makeItem('upgrade_chip', col, row));
    G.score += 50;
    addScoreParticle(cx, cy, '+50 SECRET!');
    SFX.collect();
    ACHV.emit('secret_broken');
    return true;
  }
  // Not fully broken yet — play crack SFX
  playTone(180, 0.08, 'sawtooth', 0.12);
  for (let i = 0; i < 4; i++)
    spawnParticle(col*TILE_SIZE + TILE_SIZE/2, row*TILE_SIZE, '#aabb66', (Math.random()-0.5)*2, -Math.random()*2);
  return false;
}

function drawBreakingTiles(ctx) {
  if (!G.breakingTiles) return;
  for (const k in G.breakingTiles) {
    const bt = G.breakingTiles[k];
    const sx = bt.col * TILE_SIZE - G.camX;
    const sy = bt.row * TILE_SIZE;
    ctx.fillStyle = '#889966';
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    // Crack overlay lines based on frame
    ctx.strokeStyle = '#222200';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (bt.frame >= 1) { ctx.moveTo(sx+8,sy+4); ctx.lineTo(sx+16,sy+20); }
    if (bt.frame >= 2) { ctx.moveTo(sx+16,sy+4); ctx.lineTo(sx+8,sy+28); ctx.moveTo(sx+4,sy+16); ctx.lineTo(sx+28,sy+16); }
    ctx.stroke();
  }
}

function updateBreakingTiles() {
  if (!G.breakingTiles) return;
  // Decay crack state over time if not hit again
  for (const k in G.breakingTiles) {
    G.breakingTiles[k].timer++;
    if (G.breakingTiles[k].timer > 180) {
      G.breakingTiles[k].frame = Math.max(0, G.breakingTiles[k].frame - 1);
      G.breakingTiles[k].timer = 0;
      if (G.breakingTiles[k].frame === 0) delete G.breakingTiles[k];
    }
  }
}

function updateBullets() {
  for(const b of G.bullets) {
    if(b.dead) continue;
    b.x+=b.vx;
    if(b.vy!==0) b.y+=b.vy;
    if(isSolid(b.x,b.y)||isSolid(b.x,b.y+1)){
      // FEAT-008: try to break secret tile before stopping bullet
      tryBreakTile(b.x, b.y) || tryBreakTile(b.x, b.y+1);
      b.dead=true;
      spawnParticle(b.x,b.y,'#ffff88',0,0);
      continue;
    }
    if(b.x<G.camX-32||b.x>G.camX+CANVAS_W+32){ b.dead=true; continue; }

    if(b.type==='enemy') {
      // enemy bullet hits player
      const p=G.player;
      if(!p.dead && G.invTimer<=0 && rectOverlap(b.x,b.y,5,3,p.x,p.y,p.w,p.h)){
        b.dead=true; killPlayer();
      }
    } else {
      // player bullet hits enemies
      for(const e of G.enemies) {
        if(e.dead) continue;
        if(rectOverlap(b.x,b.y,6,3,e.x,e.y,e.w,e.h)){
          b.dead=true;
          e.hp--;
          if(e.hp<=0){
            e.dead=true; e.deadTimer=25;
            const sv = (e.def.scoreValue||300) * (G.scoreMultiplier||1);
            G.score+=sv;
            addScoreParticle(e.x,e.y,`+${Math.round(sv)}`);
            for(let i=0;i<7;i++) spawnParticle(e.x+e.w/2,e.y+e.h/2,'#44cc44',(Math.random()-0.5)*3,-Math.random()*3);
            SFX.collect();
            ACHV.emit('enemy_killed', { jetpacking: G.player.jetpackFuel > 0 && !G.player.onGround });
          } else {
            spawnParticle(e.x+e.w/2,e.y,'#ff4444',0,-1);
          }
          break;
        }
      }
      // ── Boss hit check (outside enemy loop) ──
      if (!b.dead && G.boss && !G.boss.dead) {
        if (rectOverlap(b.x, b.y, 6, 3, G.boss.x, G.boss.y, G.boss.w, G.boss.h)) {
          b.dead = true;
          damageBoss(1);
        }
      }
    }
  }
  G.bullets = G.bullets.filter(b=>!b.dead);
}

// ═══════════════════════════════════════════════════════════════════
//  GRENADES UPDATE
// ═══════════════════════════════════════════════════════════════════
function updateGrenades() {
  const p = G.player;
  for(const g of G.grenades) {
    if(g.dead) continue;
    g.vy = Math.min(g.vy+g.gravity, 10);
    g.x+=g.vx; g.y+=g.vy;

    // Bounce off ground
    if(g.vy>0 && isSolid(g.x+g.w/2, g.y+g.h)){
      g.y = Math.floor((g.y+g.h)/TILE_SIZE)*TILE_SIZE-g.h;
      g.vy *= -0.4;
      g.vx *= 0.7;
      g.bounces++;
      if(g.bounces>4) g.vy=0;
    }
    if(isSolid(g.x, g.y+g.h/2)||isSolid(g.x+g.w,g.y+g.h/2)){
      g.vx*=-0.6;
    }

    g.fuse--;
    if(g.fuse<=0) {
      g.dead=true;
      explodeGrenade(g.x+g.w/2, g.y+g.h/2);
    }
  }
  G.grenades=G.grenades.filter(g=>!g.dead);
}

function explodeGrenade(cx,cy) {
  SFX.grenade();
  const r = 80;
  G.explosions.push(makeExplosion(cx,cy,r));
  for(let i=0;i<20;i++) spawnParticle(cx,cy,'#ff6600',(Math.random()-0.5)*6,(Math.random()-0.5)*6);
  for(let i=0;i<10;i++) spawnParticle(cx,cy,'#ffcc00',(Math.random()-0.5)*4,(Math.random()-0.5)*4);

  const p=G.player;
  if(!G.godMode && G.invTimer<=0 && !p.dead && Math.hypot(p.x+p.w/2-cx,p.y+p.h/2-cy)<r/2){
    killPlayer();
  }

  for(const e of G.enemies) {
    if(e.dead) continue;
    const dist = Math.hypot(e.x+e.w/2-cx, e.y+e.h/2-cy);
    if(dist<r) {
      e.dead=true; e.deadTimer=25;
      const sv = ((e.def.scoreValue||300) + (CFG.scoring.grenadeKillBonus||100)) * (G.scoreMultiplier||1);
      G.score+=Math.round(sv);
      addScoreParticle(e.x,e.y,`+${Math.round(sv)}`);
      ACHV.emit('enemy_killed');
    }
  }
  // Grenade multi-kill check
  const grenadeKills = G.enemies.filter(e=>e.dead && e.deadTimer===25).length;
  if (grenadeKills >= 3) ACHV.emit('grenade_multi', { count: grenadeKills });

  // ── Phase 1: grenade damages boss ──
  if (G.boss && !G.boss.dead) {
    const dist = Math.hypot(G.boss.x+G.boss.w/2-cx, G.boss.y+G.boss.h/2-cy);
    if (dist < r) damageBoss(3);
  }
  // ── Phase 2 FEAT-008: grenade breaks secret tiles in radius ──
  const gr = Math.ceil(r / TILE_SIZE) + 1;
  const gc = tileCol(cx), gRow = tileRow(cy);
  for (let dr = -gr; dr <= gr; dr++) {
    for (let dc = -gr; dc <= gr; dc++) {
      const tr = gRow+dr, tc = gc+dc;
      if (tr < 0 || tr >= G.mapH || tc < 0 || tc >= G.mapW) continue;
      if (G.map[tr][tc] === 24) {
        const dist = Math.hypot((tc+0.5)*TILE_SIZE-cx, (tr+0.5)*TILE_SIZE-cy);
        if (dist < r) {
          // Force 3 hits to instantly break
          if (!G.breakingTiles) G.breakingTiles = {};
          const key = `${tr}_${tc}`;
          G.breakingTiles[key] = { col:tc, row:tr, frame:3, timer:0 };
          tryBreakTile((tc+0.5)*TILE_SIZE, (tr+0.5)*TILE_SIZE);
        }
      }
    }
  }

}

// ═══════════════════════════════════════════════════════════════════
//  PARTICLES & EXPLOSIONS
// ═══════════════════════════════════════════════════════════════════
function spawnParticle(x,y,color,vx,vy) {
  G.particles.push({ x,y, vx:vx+(Math.random()-0.5)*1.5, vy:vy-Math.random()*1.5, color, life:20+Math.random()*20, maxLife:30 });
}
function addScoreParticle(x,y,txt) {
  G.particles.push({ x,y, vx:0, vy:-0.8, color:'#ffcc00', life:60, maxLife:60, text:txt });
}
function updateParticles() {
  for(const p of G.particles){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life--; }
  G.particles=G.particles.filter(p=>p.life>0);
  for(const ex of G.explosions) ex.timer--;
  G.explosions=G.explosions.filter(ex=>ex.timer>0);
}

// ═══════════════════════════════════════════════════════════════════
//  DEATH / RESPAWN
// ═══════════════════════════════════════════════════════════════════
function killPlayer() {
  if((G.godMode||G.invTimer>0)||G.player.dead) return;
  // ── Bug 1 fix: ignore damage during level transition countdown ──
  if (G.levelTransTimer > 0) return;
  // Roguelite armor reduces death to damage
  if (G.rogueArmor && !G._armorUsed) { G._armorUsed = true; showMsg('ARMOR SAVED YOU!'); G.invTimer = CFG.player.invincibilityFrames||120; return; }
  ACHV.emit('took_damage');
  SFX.die();
  G.player.dead=true;
  G.lives--;
  for(let i=0;i<14;i++) spawnParticle(G.player.x+7,G.player.y+10,'#ff4444',(Math.random()-0.5)*5,-Math.random()*5);

  setTimeout(()=>{
    if(G.lives<=0){
      // Roguelite permadeath — no continue, force game over
      if (ROGUE.isActive()) { ROGUE.stop(); }
      checkAndShowHighScore(G.score, ()=>switchState('gameover'));
    } else {
      G.player=makePlayer(G.spawnX,G.spawnY);
      // Allow user to use guns, jetpack, grenade after player dies
	  // G.hasGun=false; G.hasMG=false; G.hasJetpack=false; G.hasGrenade=false;
      G.grenadeCount=0; G.weaponType='pistol'; G.ammo=-1;
      G.invTimer=CFG.player.invincibilityFrames||120;
      showMsg('READY!');
    }
  }, 1500);
}

// ═══════════════════════════════════════════════════════════════════
//  PARALLAX STAR FIELD
// ═══════════════════════════════════════════════════════════════════
const STARS = Array.from({length:80},()=>({
  x:Math.random()*CANVAS_W, y:Math.random()*CANVAS_H,
  r:Math.random()*1.2+0.3, a:Math.random()*0.6+0.1,
  parallax:Math.random()*0.4+0.02,
}));

function drawParallax(ctx) {
  // Draw gradient bg
  const grad = ctx.createLinearGradient(0,0,0,CANVAS_H);
  const bgLayers = BG_LAYERS[G.parallaxBg] || BG_LAYERS.jungle;
  grad.addColorStop(0, bgLayers[0].color);
  grad.addColorStop(0.5, bgLayers[1]?.color || bgLayers[0].color);
  grad.addColorStop(1, bgLayers[2]?.color || bgLayers[0].color);
  ctx.fillStyle=grad; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Stars
  for(const s of STARS){
    const sx=((s.x-G.camX*s.parallax)%CANVAS_W+CANVAS_W)%CANVAS_W;
    ctx.globalAlpha=s.a;
    ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(sx,s.y,s.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
}

// ═══════════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════════
function render() {
  const ctx = G.ctx;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);

  drawParallax(ctx);

  const cx = Math.floor(G.camX);
  const startCol = Math.max(0, Math.floor(cx/TILE_SIZE));
  const endCol   = Math.min(G.mapW-1, startCol+Math.ceil(CANVAS_W/TILE_SIZE)+2);

  // ── Tiles ──
  for(let row=0;row<G.mapH;row++){
    for(let col=startCol;col<=endCol;col++){
      const t=G.map[row][col]; if(t===0) continue;
      const sx=col*TILE_SIZE-cx, sy=row*TILE_SIZE;
      if(t===3){
        ctx.save(); ctx.translate(sx,sy+TILE_SIZE-16);
        ctx.drawImage(SPRITES['spike'],0,0,32,16); ctx.restore();
      } else if(t===9){
        ctx.drawImage(SPRITES['tile_ladder'],sx,sy,TILE_SIZE,TILE_SIZE);
      } else if(t===8){
        ctx.save(); ctx.translate(sx,sy);
        //ctx.drawImage(SPRITES['tile_hazard'],0,0,TILE_SIZE,TILE_SIZE);
        const lavaSpr = (Math.floor(G.frameCount/8)%2===0) ? SPRITES['tile_hazard'] : SPRITES['tile_hazard_1'];
	    ctx.drawImage(lavaSpr, 0, 0, TILE_SIZE, TILE_SIZE);
	    ctx.restore();
      } else if(t===2){
        ctx.drawImage(SPRITES['tile_brick'],sx,sy,TILE_SIZE,TILE_SIZE);
      }  else if(t===24){
        ctx.drawImage(SPRITES['tile_brick'],sx,sy,TILE_SIZE,TILE_SIZE);
        ctx.fillStyle='rgba(100,120,60,0.45)'; ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
        ctx.strokeStyle='rgba(40,50,20,0.6)'; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(sx+TILE_SIZE/2, sy+4);
        ctx.lineTo(sx+TILE_SIZE/2+3, sy+TILE_SIZE/2);
        ctx.lineTo(sx+TILE_SIZE/2, sy+TILE_SIZE-4);
        ctx.lineTo(sx+TILE_SIZE/2-3, sy+TILE_SIZE/2);
        ctx.closePath(); ctx.stroke();
      } else {
        ctx.drawImage(SPRITES['tile_solid'],sx,sy,TILE_SIZE,TILE_SIZE);
      }
    }
  }

  // ── Explosions ──
  for(const ex of G.explosions){
    const prog = ex.timer/ex.maxTimer;
    ctx.save();
    ctx.globalAlpha = prog*0.7;
    const grad=ctx.createRadialGradient(ex.x-cx,ex.y,0,ex.x-cx,ex.y,ex.r*prog);
    grad.addColorStop(0,'#ffffff');
    grad.addColorStop(0.3,'#ffcc00');
    grad.addColorStop(0.7,'#ff4400');
    grad.addColorStop(1,'rgba(255,68,0,0)');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(ex.x-cx,ex.y,ex.r,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── Items ──
  for(const item of G.items){
    if(item.collected) continue;
    const sx=item.x-cx;
    if(sx<-TILE_SIZE||sx>CANVAS_W+TILE_SIZE) continue;
    const bob=Math.sin(item.bobTimer)*3;
    ctx.save();
    ctx.translate(sx, item.y+bob);
    switch(item.type){
      case 'trophy':
        ctx.shadowColor='#ffcc00'; ctx.shadowBlur=10;
        ctx.globalAlpha=0.85+Math.abs(Math.sin(item.bobTimer))*0.15;
        ctx.drawImage(SPRITES['trophy'],0,0,28,32);
        break;
      case 'key':   ctx.drawImage(SPRITES['key'],0,0,24,28); break;
      case 'door':  ctx.drawImage(G.doorOpen?SPRITES['door_open']:SPRITES['door'],0,0,32,TILE_SIZE); break;
      case 'gun':   ctx.drawImage(SPRITES['gun'],0,4,28,16); break;
      case 'machinegun': ctx.drawImage(SPRITES['machinegun'],0,4,28,18); break;
      case 'jetpack': ctx.drawImage(SPRITES['jetpack'],0,0,28,32); break;
      case 'life':  ctx.drawImage(SPRITES['life'],0,4,24,20); break;
      case 'grenade': ctx.drawImage(SPRITES['grenade'],0,0,20,28); break;
      case 'upgrade_chip':
        ctx.shadowColor='#00ccff'; ctx.shadowBlur=14;
        ctx.globalAlpha=0.85+Math.abs(Math.sin(item.bobTimer))*0.15;
        ctx.drawImage(SPRITES['upgrade_chip'],0,0,18,18);
        ctx.shadowBlur=0;
        break;
	  case 'warp':
		  ctx.save();
		  ctx.globalAlpha = 0.7 + Math.sin(item.bobTimer * 2) * 0.3;
		  ctx.shadowColor = '#aa44ff';
		  ctx.shadowBlur = 12;
		  ctx.drawImage(SPRITES['warp'], 0, 0, TILE_SIZE, TILE_SIZE);
		  ctx.restore();
		  break;
    }
    ctx.restore();
  }

  // ── Enemies ──
  for(const e of G.enemies){
    if(e.dead) continue;
    const sx=e.x-cx;
    if(sx<-48||sx>CANVAS_W+48) continue;
    const spName=`${e.def.sprite||'grunt'}_${e.frame}`;
	const spr=SPRITES[spName]||SPRITES['grunt_0'];
	
	ctx.save();
    ctx.translate(sx,e.y);
    if(e.dir===-1){ ctx.scale(-1,1); ctx.translate(-e.w,0); }
    // Scale to entity size
    ctx.drawImage(spr,0,0,e.w,e.h);
    ctx.restore();

    // HP bar for heavy
    if(e.def.hp>1){
      const bx=sx,by=e.y-6,bw=e.w,bh=4;
      ctx.fillStyle='#333'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle='#44cc44'; ctx.fillRect(bx,by,bw*(e.hp/e.def.hp),bh);
    }
  }
  
  // ── Phase 1: Moving Platforms ──
  for(const mp of G.movingPlatforms){
    const sx = mp.x - cx;
    if(sx < -mp.w || sx > CANVAS_W + mp.w) continue;
    ctx.fillStyle = mp.color || '#4a6fa5';
    ctx.fillRect(Math.floor(sx), Math.floor(mp.y), mp.w, mp.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(Math.floor(sx), Math.floor(mp.y), mp.w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(Math.floor(sx), Math.floor(mp.y)+mp.h-2, mp.w, 2);
  }

  // ── Phase 2 FEAT-008: Breakable tile crack overlays ──
  drawBreakingTiles(ctx);

  // ── Phase 1: Boss ──
  if(G.boss && !G.boss.dead){
    const b = G.boss;
    const bsx = b.x - cx;
    if(bsx > -64 && bsx < CANVAS_W + 64){
      ctx.save();
      if(b.invTimer > 0 && Math.floor(G.frameCount/2)%2===0){
        ctx.globalAlpha=0.4; ctx.fillStyle='#ff0000';
        ctx.fillRect(bsx, b.y, b.w, b.h); ctx.globalAlpha=1;
      }
      ctx.translate(bsx, b.y);
      if(b.dir===-1){ ctx.save(); ctx.scale(-1,1); ctx.translate(-b.w,0); }
      const bsprKey = b.tier===2 ? (`boss2_${b.frame}`) : (`boss_${b.frame}`);
      ctx.drawImage(SPRITES[bsprKey]||SPRITES[`boss_${b.frame}`]||SPRITES['boss_0'], 0, 0, b.w, b.h);
      if(b.dir===-1) ctx.restore();
      ctx.restore();
      // On-canvas HP bar
      const barW=60, barH=6, barX=bsx+b.w/2-30, barY=b.y-14;
      ctx.fillStyle='#220000'; ctx.fillRect(barX,barY,barW,barH);
      ctx.fillStyle=b.phase===2?'#ff2020':'#ff6600';
      ctx.fillRect(barX,barY,barW*(b.hp/b.maxHp),barH);
      ctx.strokeStyle='#ff4400'; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,barH);
      ctx.fillStyle='#ffcc00'; ctx.font='5px "Press Start 2P",monospace';
      ctx.textAlign='center';
      ctx.fillText(b.phase===2?'⚠ BOSS ⚠':'BOSS', bsx+b.w/2, barY-3);
      ctx.textAlign='left';
    }
  }
  
  // ── Grenades (in flight) ──
  for(const g of G.grenades){
    const sx=g.x-cx;
    ctx.save(); ctx.translate(sx,g.y);
    ctx.drawImage(SPRITES['grenade_proj'],0,0,10,12);
    // fuse blink
    if(g.fuse<40 && Math.floor(G.frameCount/4)%2===0){
      ctx.fillStyle='rgba(255,80,0,0.5)'; ctx.fillRect(0,0,10,12);
    }
    ctx.restore();
  }

  // ── Bullets ──
  for(const b of G.bullets){
    const sx=b.x-cx;
    ctx.save();
    if(b.type==='enemy'){
      ctx.fillStyle='#ff4422'; ctx.shadowColor='#ff4422'; ctx.shadowBlur=6;
      ctx.fillRect(Math.floor(sx),Math.floor(b.y),6,3);
    } else {
      const spr=b.type==='machinegun'?SPRITES['mg_bullet']:SPRITES['bullet'];
      ctx.shadowColor=b.type==='machinegun'?'#ff8800':'#ffff88'; ctx.shadowBlur=8;
      ctx.drawImage(spr,Math.floor(sx),Math.floor(b.y),spr.width,spr.height);
    }
    ctx.restore();
  }

  // ── Player ──
  const p=G.player;
  const psx=p.x-cx;
  if(!p.dead){
    ctx.save();
    if(G.invTimer>0 && Math.floor(G.invTimer/4)%2===0) ctx.globalAlpha=0.25;
    ctx.translate(psx,p.y);
    const spName = p.onLadder
      ? `player_climb_${Math.floor(G.frameCount/8)%2}_${p.dir}`
      : `player_${p.frame}_${p.dir}`;
    const spr = SPRITES[spName] || SPRITES[`player_0_1`];
    if(p.dir===-1){ ctx.scale(-1,1); ctx.translate(-p.w,0); }
    ctx.drawImage(spr,0,0,p.w,p.h);
    ctx.restore();

    // Jetpack flame
    if(G.hasJetpack && p.jetFuel<(CFG.player.jetpackFuel||100)){
      ctx.save();
      ctx.globalAlpha=0.7;
      ctx.fillStyle='#ff6600';
      ctx.fillRect(psx+2, p.y+p.h, 4, 4+Math.random()*4);
      ctx.fillRect(psx+p.w-6, p.y+p.h, 4, 4+Math.random()*4);
      ctx.restore();
    }
  } else {
    ctx.save(); ctx.translate(psx,p.y);
    ctx.drawImage(SPRITES['player_dead'],0,0,p.w,p.h);
    ctx.restore();
  }

  // ── Particles ──
  for(const pt of G.particles){
    ctx.globalAlpha=pt.life/pt.maxLife;
    if(pt.text){
      ctx.fillStyle=pt.color;
      ctx.font='7px "Press Start 2P",monospace';
      ctx.fillText(pt.text, pt.x-cx, pt.y);
    } else {
      ctx.fillStyle=pt.color;
      ctx.fillRect(Math.floor(pt.x-cx),Math.floor(pt.y),3,3);
    }
  }
  ctx.globalAlpha=1;

  // ── Phase 2: Achievement toast overlay ──
  ACHV.drawToast(ctx);
  // ── Phase 2: Roguelite boon selection overlay ──
  ROGUE.drawBoonSelect(ctx);
  // ── Phase 2: Daily/Roguelite mode badge ──
  if (G.isDailyRun || G.isRogueRun) {
    ctx.save();
    ctx.fillStyle = G.isDailyRun ? 'rgba(255,160,0,0.85)' : 'rgba(170,68,255,0.85)';
    ctx.fillRect(4, 4, 70, 12);
    ctx.fillStyle = '#000';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText(G.isDailyRun ? '📅 DAILY' : '💀 ROGUELITE', 8, 13);
    ctx.restore();
  }
  // ── Phase 2: Score multiplier badge ──
  if ((G.scoreMultiplier||1) > 1) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,204,0,0.9)';
    ctx.fillRect(4, 18, 60, 12);
    ctx.fillStyle = '#000';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText(`⭐ ×${G.scoreMultiplier}`, 8, 27);
    ctx.restore();
  }

  // ── Phase 3: Theme CRT tint overlay ──
  if (G._themeTint) {
    ctx.save();
    ctx.fillStyle = G._themeTint;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }

  // ── Phase 3: Replay recording/playback indicator ──
  if (REPLAY.isPlaying()) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,200,255,0.88)';
    ctx.fillRect(CANVAS_W - 78, 4, 74, 12);
    ctx.fillStyle = '#000';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('▶ REPLAY', CANVAS_W - 74, 13);
    // Progress bar
    ctx.fillStyle = 'rgba(0,150,200,0.5)';
    ctx.fillRect(CANVAS_W - 78, 17, 74, 3);
    ctx.fillStyle = '#00c8ff';
    ctx.fillRect(CANVAS_W - 78, 17, Math.round(74 * REPLAY.progress()), 3);
    ctx.restore();
  } else if (REPLAY.isRecording()) {
    ctx.save();
    const blink = Math.floor(G.frameCount / 30) % 2 === 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255,40,40,0.88)';
      ctx.fillRect(CANVAS_W - 52, 4, 48, 12);
      ctx.fillStyle = '#fff';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText('● REC', CANVAS_W - 48, 13);
    }
    ctx.restore();
  } else if (CFG?.game?.recordReplays === false) {
    // Recording OFF ribbon — bottom-right corner
    ctx.save();
    ctx.fillStyle = 'rgba(60,60,80,0.75)';
    ctx.fillRect(CANVAS_W - 80, CANVAS_H - 16, 80, 16);
    ctx.fillStyle = '#ff4444';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('◉ REC OFF', CANVAS_W - 74, CANVAS_H - 5);
    ctx.restore();
  }

  updateHUD();
}

// ═══════════════════════════════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════════════════════════════
function updateHUD() {
  const score7=n=>String(n).padStart(7,'0');
  const el=id=>document.getElementById(id);
  el('hud-score').textContent  = score7(G.score);
  el('hud-hi').textContent     = score7(G.hiScore);
  el('hud-lives').textContent  = '♥'.repeat(Math.max(0,G.lives));
  el('hud-level').textContent  = LEVELS[G.level].name.slice(0,12);
  el('hud-trophy').textContent = G.trophiesLeft;
  el('hud-key').textContent    = G.hasKey?'YES':'NO';
  // el('hud-weapon').textContent = G.hasMG?'M.GUN': (G.hasGun?'PISTOL':'NONE');
  // ── Phase 1: weapon name shows upgrade tier ──
  const mgTier = G.weaponUpgrades.machinegun;
  const pTier  = G.weaponUpgrades.pistol;
  const tierStar = n => n===0?'':n===1?'★':'★★';
  el('hud-weapon').textContent = G.hasMG ? `MG${tierStar(mgTier)}` : (G.hasGun ? `PISTOL${tierStar(pTier)}` : 'NONE');
  el('hud-ammo').textContent   = G.ammo===-1?'∞':G.ammo;
  el('hud-nade').textContent   = `x${G.grenadeCount}`;

  // Jetpack bar
  const pJet = G.hasJetpack ? (G.player.jetFuel/(CFG.player.jetpackFuel||100))*100 : 0;
  // el('hud-jetbar-fill').style.width = pJet+'%';
  // el('hud-jetbar-wrap').style.opacity = G.hasJetpack?'1':'0.3';
  el('hud-jetbar-fill').style.width = pJet+'%';
  el('hud-jetbar-wrap').style.opacity = G.hasJetpack?'1':'0.3';
  // ── Phase 1: Boss HP bar ──
  const bossBar = document.getElementById('hud-boss-wrap');
  const bossFill = document.getElementById('hud-boss-fill');
  const bossLabel = document.getElementById('hud-boss-label');
  if (bossBar) {
    if (G.bossActive && G.boss && !G.boss.dead) {
      bossBar.style.display = 'flex';
      bossBar.className = G.boss.tier===2 ? 'hud-item boss2' : 'hud-item';
      const pct = Math.max(0, G.boss.hp / G.boss.maxHp) * 100;
      bossFill.style.width = pct + '%';
      if (G.boss.tier === 2) {
        bossFill.style.background = G.boss.phase === 2 ? '#ff00ff' : '#ff00aa';
      } else {
        bossFill.style.background = G.boss.phase === 2 ? '#ff2020' : '#ff6600';
      }
      bossLabel.textContent = G.boss.tier===2 ? `💀 BOSS-2 ${G.boss.hp}/${G.boss.maxHp}` : `BOSS ${G.boss.hp}/${G.boss.maxHp}`;
    } else {
      bossBar.style.display = 'none';
      bossBar.className = 'hud-item';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  MESSAGE OVERLAY
// ═══════════════════════════════════════════════════════════════════
function showMsg(txt,dur=90){
  G.msgText=txt; G.msgTimer=dur;
  const el=document.getElementById('msg-overlay');
  el.textContent=txt; el.classList.add('visible');
}
function clearMsg(){
  G.msgTimer=0;
  document.getElementById('msg-overlay').classList.remove('visible');
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN GAME LOOP
// ═══════════════════════════════════════════════════════════════════
function gameLoop(ts) {
  if(G.state!=='playing') return;
  G.animFrame=requestAnimationFrame(gameLoop);
  G.lastTime=ts; G.frameCount++;

  // ── Phase 3: Replay — inject recorded inputs OR record live inputs ──
  if (REPLAY.isPlaying()) {
    REPLAY.playbackFrame();
  } else if (REPLAY.isRecording()) {
    REPLAY.recordFrame();
  }

  // ── Phase 1: moving platforms run FIRST so player rides before physics ──
  updateMovingPlatforms();
  updatePlayer();
  updateEnemies();
  updateBullets();
  updateGrenades();
  updateItems();
  updateParticles();
  // ── Phase 1 ──
  updateBoss();
  // ── Phase 2 ──
  updateBreakingTiles();
  ACHV.tick();
  DAILY.checkTick();

  if(G.msgTimer>0){ G.msgTimer--; if(G.msgTimer===0) clearMsg(); }

  if(G.levelTransTimer>0){
    // ── Bug 1 fix: freeze player in place, skip physics/damage during countdown ──
    G.levelTransTimer--;
    if(G.levelTransTimer===0){
      const nextLevel = G.level + 1;
      if(nextLevel>=LEVELS.length){
        checkAndShowHighScore(G.score, ()=>switchState('win'));
        return;
      }
      // Daily challenge: only one level — end run on door
      if (G.isDailyRun) {
        checkAndShowHighScore(G.score, ()=>switchState('win'));
        return;
      }
      // Show animated level transition corridor before loading next level
      cancelAnimationFrame(G.animFrame);
      showLevelTransition(G.level, nextLevel, ()=>{
        G.level = nextLevel;
        SFX.levelUp();
        loadLevel(G.level);
        switchState('playing');
      });
    }
    // While counting down: freeze player velocity and skip update/damage
    if (G.player) { G.player.vx = 0; G.player.vy = 0; }
    render();
    return;
  }
  render();
}

// ═══════════════════════════════════════════════════════════════════
//  LEVEL TRANSITION ANIMATION
//  Animated corridor: player sprite walks from Door 1 to Door 2.
//  Canvas-drawn, pure JS, no external assets.
//  onDone() is called when the walk completes.
// ═══════════════════════════════════════════════════════════════════
function showLevelTransition(fromIdx, toIdx, onDone) {
  // Hide all screens, show transition screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById('screen-transition');
  screen.classList.add('active');

  const fromName  = LEVELS[fromIdx].name;
  const toName    = LEVELS[toIdx].name;
  const total     = LEVELS.length;
  const remaining = total - toIdx;      // levels still to go after this one
  const cfgTotal  = CFG && CFG.levels ? CFG.levels.length : total;

  // Update header / footer text
  document.getElementById('trans-level-from').textContent = fromName.split(':')[0] || fromName;
  document.getElementById('trans-level-to').textContent   = toName.split(':')[0]   || toName;
  document.getElementById('trans-message').textContent    =
    remaining === 0
      ? 'FINAL LEVEL!'
      : `ONLY ${remaining} LEVEL${remaining>1?'S':''} LEFT`;
  document.getElementById('trans-score-val').textContent  = String(G.score).padStart(7,'0');
  document.getElementById('trans-sub').textContent        = 'KEEP MOVING, SOLDIER...';

  // ── Canvas setup ────────────────────────────────────────────────────────────
  const cv   = document.getElementById('trans-canvas');
  const ctx  = cv.getContext('2d');
  const W    = cv.width;    // 700
  const H    = cv.height;   // 120

  // Layout constants (all in canvas pixels)
  const WALL_H   = 16;   // top & bottom wall thickness
  const FLOOR_Y  = H - WALL_H;   // y where floor starts
  const CEIL_Y   = WALL_H;       // y where ceiling ends
  const DOOR_W   = 24;
  const DOOR_H   = H - WALL_H * 2;
  const DOOR_L_X = 12;           // left door x
  const DOOR_R_X = W - DOOR_W - 12; // right door x
  const GROUND_Y = FLOOR_Y - 1;  // where sprite stands

  // Sprite pixel dimensions on canvas
  const SP_W = 14, SP_H = 20;

  // Walk from just right of left door to just left of right door
  const startX = DOOR_L_X + DOOR_W + 4;
  const endX   = DOOR_R_X - SP_W - 4;
  const WALK_FRAMES = 140;  // total frames for the walk
  let   frame  = 0;
  let   raf    = null;

  // Particles for footstep dust
  const DUST = [];

  function spawnDust(x) {
    for(let i=0;i<3;i++) DUST.push({
      x: x + SP_W/2 + (Math.random()-0.5)*8,
      y: GROUND_Y - SP_H + 2,
      vx:(Math.random()-0.5)*1.2,
      vy:-Math.random()*0.8,
      life:18, maxLife:18,
      c:'rgba(0,255,65,'
    });
  }

  // ── Draw helpers ───────────────────────────────────────────────────────────

  function drawBg() {
    // Deep background
    ctx.fillStyle = '#04080c';
    ctx.fillRect(0, 0, W, H);

    // Subtle gradient depth
    const grad = ctx.createLinearGradient(0, CEIL_Y, 0, FLOOR_Y);
    grad.addColorStop(0,   '#060c10');
    grad.addColorStop(0.5, '#04080c');
    grad.addColorStop(1,   '#030609');
    ctx.fillStyle = grad;
    ctx.fillRect(0, CEIL_Y, W, FLOOR_Y - CEIL_Y);

    // Perspective floor lines (vanishing point center)
    ctx.strokeStyle = 'rgba(0,80,20,0.15)';
    ctx.lineWidth = 1;
    const vanX = W / 2, vanY = H / 2;
    for(let i = 0; i <= 8; i++) {
      const t  = i / 8;
      const fx = t * W;
      ctx.beginPath();
      ctx.moveTo(fx, FLOOR_Y);
      ctx.lineTo(vanX + (fx - vanX) * 0.3, vanY);
      ctx.stroke();
    }

    // Ceiling lights — glowing dots
    for(let lx = 80; lx < W - 80; lx += 120) {
      const grd = ctx.createRadialGradient(lx, CEIL_Y + 4, 0, lx, CEIL_Y + 4, 18);
      grd.addColorStop(0, 'rgba(0,255,65,0.22)');
      grd.addColorStop(1, 'rgba(0,255,65,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(lx - 18, CEIL_Y, 36, 22);
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(lx - 2, CEIL_Y + 2, 4, 3);
    }
  }

  function drawWalls() {
    // Top wall
    ctx.fillStyle = '#0f2010';
    ctx.fillRect(0, 0, W, CEIL_Y);
    // Highlight edge
    ctx.fillStyle = '#1a3820';
    ctx.fillRect(0, CEIL_Y - 2, W, 3);
    ctx.fillStyle = 'rgba(0,255,65,0.08)';
    ctx.fillRect(0, CEIL_Y - 1, W, 1);

    // Bottom wall
    ctx.fillStyle = '#0f2010';
    ctx.fillRect(0, FLOOR_Y, W, WALL_H);
    ctx.fillStyle = '#1a3820';
    ctx.fillRect(0, FLOOR_Y, W, 3);
    ctx.fillStyle = 'rgba(0,255,65,0.08)';
    ctx.fillRect(0, FLOOR_Y, W, 1);

    // Wall rivet details
    ctx.fillStyle = '#1a4020';
    for(let rx = 40; rx < W - 20; rx += 60) {
      ctx.fillRect(rx, 4, 3, 3);
      ctx.fillRect(rx, FLOOR_Y + 6, 3, 3);
    }
  }

  function drawDoor(x, open, label) {
    const dy = CEIL_Y;
    const dh = DOOR_H;

    // Door frame (thick border)
    ctx.fillStyle = '#224422';
    ctx.fillRect(x - 3, dy - 3, DOOR_W + 6, dh + 6);

    // Door body
    if (open) {
      // Open door — dark void with glow
      ctx.fillStyle = '#000a04';
      ctx.fillRect(x, dy, DOOR_W, dh);
      // Inner glow
      const og = ctx.createRadialGradient(x + DOOR_W/2, dy + dh/2, 0, x + DOOR_W/2, dy + dh/2, DOOR_W);
      og.addColorStop(0, 'rgba(0,255,65,0.25)');
      og.addColorStop(1, 'rgba(0,255,65,0)');
      ctx.fillStyle = og;
      ctx.fillRect(x, dy, DOOR_W, dh);
    } else {
      // Closed door — steel panels
      ctx.fillStyle = '#1a3320';
      ctx.fillRect(x, dy, DOOR_W, dh);
      ctx.fillStyle = '#224422';
      for(let ry = dy + 6; ry < dy + dh - 4; ry += 10) {
        ctx.fillRect(x + 3, ry, DOOR_W - 6, 4);
      }
      // Handle
      ctx.fillStyle = '#ffb000';
      ctx.fillRect(x + DOOR_W - 6, dy + dh/2 - 3, 4, 6);
    }

    // Door frame highlight
    ctx.strokeStyle = open ? 'rgba(0,255,65,0.6)' : '#336633';
    ctx.lineWidth   = open ? 2 : 1;
    ctx.strokeRect(x - 3, dy - 3, DOOR_W + 6, dh + 6);

    if (open) {
      // Portal glow effect
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur  = 12;
      ctx.strokeStyle = 'rgba(0,255,65,0.4)';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x, dy, DOOR_W, dh);
      ctx.shadowBlur  = 0;
    }

    // Label above door
    ctx.font      = '7px monospace';
    ctx.fillStyle = open ? '#00ff41' : '#336633';
    ctx.textAlign = 'center';
    if (open) {
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur  = 6;
    }
    ctx.fillText(label, x + DOOR_W / 2, dy - 6);
    ctx.shadowBlur = 0;
  }

  // Player pixel art (simplified 14x20, matching game sprite palette)
  function drawPlayer(px, t) {
    const legFrame = Math.floor(t * 8) % 4;
    ctx.save();
    ctx.translate(Math.floor(px), GROUND_Y - SP_H);

    // legs
    const b = '#4488ff', fl = '#ff6644';
    if(legFrame === 0 || legFrame === 2) {
      // standing
      [[2,15],[3,15],[9,15],[10,15],[2,16],[3,16],[9,16],[10,16],
       [2,17],[3,17],[9,17],[10,17],[2,18],[3,18],[9,18],[10,18]].forEach(([x,y]) => {
        ctx.fillStyle = b; ctx.fillRect(x,y,1,1);
      });
    } else {
      // striding
      [[1,15],[2,15],[9,15],[10,15],[1,16],[2,16],[10,16],[11,16],
       [1,17],[2,17],[11,17],[12,17],[2,18],[3,18],[9,18],[10,18]].forEach(([x,y]) => {
        ctx.fillStyle = legFrame===1?b:fl; ctx.fillRect(x,y,1,1);
      });
    }
    // body
    for(let y=5;y<13;y++) for(let x=2;x<12;x++) {
      ctx.fillStyle='#4488ff'; ctx.fillRect(x,y,1,1);
    }
    // head
    [[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
     [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
     [2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],
     [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],
     [3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4]
    ].forEach(([x,y])=>{ ctx.fillStyle='#ffcc44'; ctx.fillRect(x,y,1,1); });
    // eyes
    ctx.fillStyle='#222'; ctx.fillRect(4,2,1,1); ctx.fillRect(7,2,1,1);
    // helmet stripe
    for(let x=4;x<=8;x++){ctx.fillStyle='#334466'; ctx.fillRect(x,0,1,1);}
    // gun arm
    ctx.fillStyle='#999';
    ctx.fillRect(11,7,2,1); ctx.fillRect(12,8,1,1);

    ctx.restore();
  }

  function drawDust() {
    for(const d of DUST) {
      const a = d.life / d.maxLife;
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawProgressBar(t) {
    const BAR_Y  = H - 6;
    const BAR_W  = W - 40;
    const BAR_X  = 20;
    const BAR_H  = 4;

    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
    ctx.strokeStyle = '#1a3020';
    ctx.lineWidth = 1;
    ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    const fill = t * BAR_W;
    if (fill > 0) {
      const grad = ctx.createLinearGradient(BAR_X, 0, BAR_X + fill, 0);
      grad.addColorStop(0, '#004d14');
      grad.addColorStop(1, '#00ff41');
      ctx.fillStyle = grad;
      ctx.fillRect(BAR_X, BAR_Y, fill, BAR_H);
      // Glow tip
      ctx.fillStyle = 'rgba(0,255,65,0.7)';
      ctx.fillRect(BAR_X + fill - 2, BAR_Y, 3, BAR_H);
    }
  }

  // ── Animation loop ────────────────────────────────────────────────────────────────

  function tick() {
    frame++;
    const t = Math.min(frame / WALK_FRAMES, 1); // 0→1 progress

    // Ease-in-out for natural walk pace
    const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const sprX  = startX + eased * (endX - startX);

    // Spawn dust every 8 frames
    if(frame % 8 === 0) spawnDust(sprX);
    for(const d of DUST){ d.x+=d.vx; d.y+=d.vy; d.vy+=0.05; d.life--; }
    // Prune dead particles
    for(let i=DUST.length-1;i>=0;i--){ if(DUST[i].life<=0) DUST.splice(i,1); }

    // Left door: open while player hasn't passed it, then closing
    const leftOpen  = t < 0.15;
    // Right door: closed until player almost arrives, then open
    const rightOpen = t > 0.82;

    // Draw everything
    drawBg();
    drawWalls();
    drawDoor(DOOR_L_X, leftOpen,  'LV ' + (fromIdx+1));
    drawDoor(DOOR_R_X, rightOpen, 'LV ' + (toIdx+1));
    drawDust();
    drawPlayer(sprX, t);
    drawProgressBar(t);

    // Scanline overlay on canvas too
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for(let sy = 0; sy < H; sy += 4) ctx.fillRect(0, sy, W, 1);

    if(t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      // Walk complete — brief pause then call onDone
      setTimeout(() => {
        screen.classList.remove('active');
        onDone();
      }, 320);
    }
  }

  raf = requestAnimationFrame(tick);
}

// ═══════════════════════════════════════════════════════════════════
//  STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function switchState(state) {
  cancelAnimationFrame(G.animFrame);
  if(state !== 'menu') cancelAnimationFrame(_menuRaf);
  G.state=state;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));

  if(state==='menu'){
    document.getElementById('screen-menu').classList.add('active');
    // document.getElementById('menu-hi').innerHTML=`HI-SCORE: <span>${String(G.hiScore).padStart(7,'0')}</span>`;
	document.querySelector('.dg-hi-score').textContent = String(G.hiScore).padStart(7,'0');
  } else if(state==='leaderboard'){
    document.getElementById('screen-leaderboard').classList.add('active');
  } else if(state==='playing'){
    document.getElementById('screen-game').classList.add('active');
    G.lastTime=performance.now();
    showMsg(LEVELS[G.level].name,130);
    // ── Phase 3: start recording (unless we're in replay playback mode) ──
    if (!REPLAY.isPlaying() && (CFG?.game?.recordReplays !== false)) {
      REPLAY.startRecording(G.level, LEVELS[G.level]);
    }
    G.animFrame=requestAnimationFrame(gameLoop);
  } else if(state==='editor'){
    document.getElementById('screen-editor').classList.add('active');
    initEditor();
  } else if(state==='gameover'){
    // ── Phase 3: stop recording, offer replay ──
    if (REPLAY.isRecording()) REPLAY.stopRecording();
    if (REPLAY.isPlaying())   REPLAY.stopPlayback();
    document.getElementById('screen-gameover').classList.add('active');
    document.getElementById('go-score').textContent=String(G.score).padStart(7,'0');
    document.getElementById('go-hi').textContent   =String(G.hiScore).padStart(7,'0');
    document.getElementById('go-title').textContent='GAME OVER';
    document.getElementById('go-title').style.color='var(--crt-red)';
    // Show watch-replay button if we have frames
    const btnReplay = document.getElementById('btn-watch-replay');
    if (btnReplay) btnReplay.style.display = REPLAY.hasReplay() ? '' : 'none';
    const btnExpReplay = document.getElementById('btn-export-replay');
    if (btnExpReplay) btnExpReplay.style.display = REPLAY.hasReplay() ? '' : 'none';
  } else if(state==='win'){
    // ── Phase 3: stop recording on win too ──
    if (REPLAY.isRecording()) REPLAY.stopRecording();
    if (REPLAY.isPlaying())   REPLAY.stopPlayback();
    document.getElementById('screen-gameover').classList.add('active');
    document.getElementById('go-score').textContent=String(G.score).padStart(7,'0');
    document.getElementById('go-hi').textContent   =String(G.hiScore).padStart(7,'0');
    document.getElementById('go-title').textContent='MISSION COMPLETE!';
    document.getElementById('go-title').style.color='var(--crt-green)';
    // Phase 3: show replay buttons
    const _wr2 = document.getElementById('btn-watch-replay');
    if (_wr2) _wr2.style.display = REPLAY.hasReplay() ? '' : 'none';
    const _er2 = document.getElementById('btn-export-replay');
    if (_er2) _er2.style.display = REPLAY.hasReplay() ? '' : 'none';
    // Phase 2: roguelite win achievement
    if (G.isRogueRun) { ACHV.emit('roguelite_win'); ROGUE.stop(); }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  LEVEL EDITOR
// ═══════════════════════════════════════════════════════════════════
const ED = {
  levelIdx:0, selectedTile:1, painting:false, erasing:false,
  map:null, mapW:0, mapH:0, canvas:null, ctx:null,
};

function initEditor(){
  ED.canvas=document.getElementById('editorCanvas');
  ED.ctx=ED.canvas.getContext('2d');
  ED.levelIdx=0;
  loadEditorLevel(0);
  buildPalette();
  buildCharList();
  buildTileGuide();
  renderEditor();
}

function loadEditorLevel(idx){
  const ld=LEVELS[idx];
  ED.mapH=ld.tiles.length; ED.mapW=ld.tiles[0].length;
  ED.map=ld.tiles.map(r=>[...r]);
  ED.canvas.width=ED.mapW*TILE_SIZE; ED.canvas.height=ED.mapH*TILE_SIZE;
  renderEditor();
}

// TILE_GROUPS definition — used by both palette and guide
const TILE_GROUPS = [
  { name:'TERRAIN',     icon:'🏗️',  desc:'Draw the world',           color:'#445588', ids:[0,1,2,3,8,9,10,24] },
  { name:'OBJECTIVES',  icon:'🎯',  desc:'Key, door, trophies',      color:'#ffcc00', ids:[4,5,6,12,13] },
  { name:'POWER-UPS',   icon:'⚡',  desc:'Collectible boosts',       color:'#4466ff', ids:[14,15,18] },
  { name:'WEAPONS',     icon:'🔫',  desc:'Guns, grenades & upgrades', color:'#ff8800', ids:[7,16,17] },
  { name:'ENEMIES',     icon:'👾',  desc:'Patrol, fly, jump, snipe', color:'#44cc44', ids:[11,20,21,22,23] },
  { name:'BOSS',        icon:'💀',  desc:'Phase bosses',             color:'#ff0044', ids:[30,31] },
];

function getTileGroups() {
  // Merge in custom characters under ENEMIES group (tileId >= 100)
  const customIds = CUSTOM_CHARS.map(c=>c.tileId);
  return TILE_GROUPS.map(g => {
    if(g.name === 'ENEMIES') return { ...g, ids:[...g.ids, ...customIds] };
    return g;
  });
}

function makeTileBtn(tid) {
  const customChar = CUSTOM_CHARS.find(c=>c.tileId===tid);
  const btn = document.createElement('div');
  btn.className = 'tile-btn tile-btn-emoji' + (tid===ED.selectedTile?' selected':'');
  btn.dataset.tid = tid;
  const name = customChar ? customChar.name : (TILE_NAMES[tid] || '?');
  const emoji = customChar ? customChar.name.slice(0,2).toUpperCase() : (TILE_EMOJI[tid]||'?');
  btn.title = name + ' [id:' + tid + '] — click to select';
  btn.innerHTML = `
    <span class="tile-icon" style="${customChar?`color:${customChar.color};font-size:9px;font-weight:bold;`:''}">${emoji}</span>
    <span class="tile-id-badge">${tid}</span>
    <span class="tile-name-badge">${name.slice(0,5)}</span>`;
  if(customChar){
    btn.style.background = customChar.color + '33';
    btn.style.borderColor = customChar.color;
    btn.style.boxShadow = `0 0 6px ${customChar.color}88`;
  } else {
    btn.style.background = (TILE_COLORS[tid]||'#0a0a12') + 'cc';
  }
  btn.addEventListener('click',()=>{
    ED.selectedTile = tid;
    document.querySelectorAll('.tile-btn, .tg-cell').forEach(b=>b.classList.remove('selected'));
    document.querySelectorAll(`[data-tid="${tid}"]`).forEach(b=>b.classList.add('selected'));
  });
  return btn;
}

function buildPalette(){
  const pal = document.getElementById('tile-palette');
  if(!pal) return;
  pal.innerHTML = '';
  const groups = getTileGroups();
  for(const g of groups){
    if(!g.ids.length) continue;
    // Group header
    const hdr = document.createElement('div');
    hdr.className = 'tile-group-header';
    hdr.innerHTML = `<span>${g.icon}</span> <span>${g.name}</span>`;
    hdr.style.cssText = `grid-column:1/-1;display:flex;align-items:center;gap:5px;padding:3px 4px 2px;
      font-family:'Press Start 2P',monospace;font-size:6px;color:${g.color};
      border-bottom:1px solid ${g.color}44;margin-top:4px;letter-spacing:1px;`;
    pal.appendChild(hdr);
    // Tiles in group
    for(const tid of g.ids){
      pal.appendChild(makeTileBtn(tid));
    }
  }
}

function buildTileGuide(){
  const guide = document.getElementById('tile-guide');
  if(!guide) return;
  guide.innerHTML = '';

	const TILE_DETAIL = {
	  0:  { emoji:'⬛', name:'EMPTY',    desc:'Air / blank space',        color:'#222233' },

	  1:  { emoji:'🟫', name:'GROUND',   desc:'Solid stone floor',        color:'#6b4f2a' },
	  2:  { emoji:'🧱', name:'BRICK',    desc:'Solid brick wall',         color:'#774422' },
	  3:  { emoji:'⚠️', name:'SPIKE',    desc:'Instant death',            color:'#aaaaaa' },

	  8:  { emoji:'🌋', name:'LAVA',     desc:'Instant death liquid',     color:'#ff3300' },
	  9:  { emoji:'🪜', name:'LADDER',   desc:'Climb up/down — use ↑↓',  color:'#2e7d32' },
	  10: { emoji:'🟪',  name:'MOV-PLAT', desc:'Moving platform (horizontal)', color:'#9966cc' },
	  24: { emoji:'💥', name:'SECRET',   desc:'Breakable brick — shoot to reveal secret', color:'#889966' },

	  4:  { emoji:'🏆', name:'TROPHY',   desc:'Collect all to unlock door',color:'#ffcc00' },
	  5:  { emoji:'🗝️',name:'KEY',      desc:'Unlocks the exit door',     color:'#e6b800' },
	  6:  { emoji:'🚪', name:'DOOR',     desc:'Exit — needs key+trophies',color:'#5a3a1a' },

	  12: { emoji:'🧍', name:'SPAWN',    desc:'Player start position',    color:'#00aaff' },
	  13: { emoji:'🌀', name:'WARP',     desc:'Skip to next level',       color:'#cc66ff' },
	  14: { emoji:'🚀', name:'JETPACK',  desc:'Enables flight boost',     color:'#3366ff' },
	  15: { emoji:'❤️',name:'+LIFE',     desc:'Extra life pickup',        color:'#ff3355' },

//	  9:  { emoji:'🪜', name:'LADDER',   desc:'Climb up/down',            color:'#2e7d32' },
//	  10: { emoji:'🟦', name:'PLATFORM', desc:'Stand-on thin ledge',      color:'#4a6fa5' },

	  7:  { emoji:'🔫', name:'PISTOL',   desc:'Infinite ammo handgun',    color:'#888888' },
	  16: { emoji:'💣', name:'GRENADE',  desc:'+3 throwable grenades',    color:'#ff8800' },
	  17: { emoji:'🔫', name:'MACH.GUN', desc:'Fast fire, 50 rounds',     color:'#ff5500' },
	  18: { emoji:'💎', name:'UPGRADE',  desc:'Upgrades current weapon',  color:'#00e5ff' },

	  11: { emoji:'👾', name:'GRUNT',    desc:'Basic patrol enemy',       color:'#aa44ff' },
	  20: { emoji:'🦍', name:'HEAVY',    desc:'Tough patrol, 2 HP',       color:'#cc4444' },
	  21: { emoji:'🛸', name:'FLYER',    desc:'Hovering flying enemy',    color:'#aa44ff' },
	  22: { emoji:'🐇', name:'JUMPER',   desc:'Bouncing jumper enemy',    color:'#44aaff' },
	  23: { emoji:'🎯', name:'SNIPER',   desc:'Shoots bullets at player', color:'#ff4444' },

	  30: { emoji:'👹', name:'BOSS',     desc:'12HP phase boss',          color:'#ff0033' },
	  31: { emoji:'💀', name:'BOSS-2',   desc:'30HP elite boss, tier-2',  color:'#990033' },
	};
  const groups = getTileGroups();
  for(const g of groups){
    // Group heading card
    const heading = document.createElement('div');
    heading.className = 'tg-group-heading';
    heading.style.cssText = `
      padding:6px 10px 5px; margin:8px 0 4px;
      background:${g.color}18; border:1px solid ${g.color}55;
      border-left:3px solid ${g.color};
      font-family:'Press Start 2P',monospace; font-size:7px;
      color:${g.color}; letter-spacing:2px;
      display:flex; align-items:center; gap:8px;`;
    heading.innerHTML = `<span style="font-size:13px">${g.icon}</span>
      <div>
        <div>${g.name}</div>
        <div style="font-size:5px;color:${g.color}99;margin-top:2px;letter-spacing:1px">${g.desc}</div>
      </div>`;
    //guide.appendChild(heading);

    // Tile cards for this group
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:3px;margin-bottom:4px;';
    //guide.appendChild(grid);
	
	const groupBox = document.createElement('div');
	groupBox.className = 'tg-group-box';
	groupBox.appendChild(heading);
	groupBox.appendChild(grid);
	guide.appendChild(groupBox);

    const idsToShow = g.ids.filter(id => TILE_DETAIL[id] || CUSTOM_CHARS.find(c=>c.tileId===id));
    for(const tid of idsToShow){
      const customChar = CUSTOM_CHARS.find(c=>c.tileId===tid);
      const info = TILE_DETAIL[tid] || { emoji:'👾', name:customChar?.name||'?', desc:'Custom enemy', color:customChar?.color||'#44cc44' };
      if(customChar){ info.name=customChar.name; info.color=customChar.color; info.emoji=customChar.name.slice(0,2).toUpperCase(); info.desc='Custom enemy'; }

      const cell = document.createElement('div');
      cell.className = 'tg-cell' + (tid===ED.selectedTile?' selected':'');
      cell.dataset.tid = tid;
      cell.style.cssText = `
        border:1px solid ${info.color}55; background:${info.color}12;
        display:flex; flex-direction:column; align-items:center;
        padding:4px 2px 3px; cursor:pointer; border-radius:2px;
        transition:border-color 0.1s, background 0.1s; position:relative;`;
      cell.title = `[${tid}] ${info.name} — ${info.desc}`;
      cell.innerHTML = `
        <span style="font-size:15px;line-height:1">${info.emoji}</span>
        <span style="font-family:'Press Start 2P',monospace;font-size:5px;color:${info.color};margin-top:2px;text-align:center;line-height:1.3">${info.name}</span>
        <span style="font-family:monospace;font-size:8px;color:${info.color}88;position:absolute;top:2px;right:3px">${tid}</span>`;
      cell.addEventListener('mouseenter',()=>{ cell.style.borderColor=info.color; cell.style.background=info.color+'28'; });
      cell.addEventListener('mouseleave',()=>{ if(tid!==ED.selectedTile){ cell.style.borderColor=info.color+'55'; cell.style.background=info.color+'12'; }});
      cell.addEventListener('click',()=>{
        ED.selectedTile = tid;
        document.querySelectorAll('.tile-btn, .tg-cell').forEach(b=>{ b.classList.remove('selected'); if(b.dataset.tid==tid){ b.style.borderColor=(TILE_COLORS[tid]||info.color); b.style.boxShadow=`0 0 8px ${info.color}88`; } });
        guide.querySelectorAll('.tg-cell').forEach(c=>{ const cid=parseInt(c.dataset.tid); if(cid!==tid){ c.style.borderColor=(TILE_DETAIL[cid]||{color:info.color}).color+'55'; c.style.background=(TILE_DETAIL[cid]||{color:info.color}).color+'12'; c.style.boxShadow='none'; } });
        cell.style.borderColor=info.color; cell.style.background=info.color+'28'; cell.style.boxShadow=`0 0 8px ${info.color}88`;
        document.querySelectorAll(`.tile-btn[data-tid="${tid}"]`).forEach(b=>b.classList.add('selected'));
      });
      grid.appendChild(cell);
    }
  }
}

function buildCharList(){
  const list=document.getElementById('char-list'); if(!list) return;
  list.innerHTML='';
  const custom=loadCustomChars();
  for(const ch of custom){
    const div=document.createElement('div');
    div.className='char-entry';
    const sw=document.createElement('canvas'); sw.width=14; sw.height=16;
    sw.className='char-swatch';
    const sx=sw.getContext('2d');
    for(let y=0;y<16;y++) for(let x=0;x<14;x++) sx.fillStyle=ch.color, sx.fillRect(x,y,1,1);
    div.appendChild(sw);
    const lbl=document.createElement('span'); lbl.className='char-label'; lbl.textContent=ch.name;
    div.appendChild(lbl);
    // ✅ NEW: edit button
    const edt=document.createElement('span'); edt.className='char-del'; edt.textContent='✎';
    edt.style.color='#88aaff'; edt.title='Edit';
    edt.addEventListener('click',()=>openCharModal(ch));
    div.appendChild(edt);
    const del=document.createElement('span'); del.className='char-del'; del.textContent='✕';
    del.addEventListener('click',()=>{ deleteCustomChar(ch.tileId); buildCharList(); buildPalette(); });
    div.appendChild(del);
    list.appendChild(div);
  }
}

function renderEditor(){
  if(!ED.ctx) return;
  const ctx=ED.ctx;
  ctx.fillStyle='#000'; ctx.fillRect(0,0,ED.canvas.width,ED.canvas.height);
  for(let row=0;row<ED.mapH;row++){
    for(let col=0;col<ED.mapW;col++){
      const t=ED.map[row][col], x=col*TILE_SIZE, y=row*TILE_SIZE;

      // Background fill
      const customChar = CUSTOM_CHARS.find(c=>c.tileId===t);
      ctx.fillStyle = customChar ? customChar.color+'44' : (TILE_COLORS[t]||'#0a0a12');
      ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);

      // Grid line
      ctx.strokeStyle='#12121e'; ctx.strokeRect(x,y,TILE_SIZE,TILE_SIZE);

      if(t!==0){
        // Emoji icon — large, centered
        const emoji = TILE_EMOJI[t] || (customChar ? '👾' : null);
        if(emoji){
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, x+TILE_SIZE/2, y+TILE_SIZE/2 - 4);
        }
        // Small tile ID at bottom-left
        ctx.font='6px monospace';
        ctx.textAlign='left';
        ctx.textBaseline='alphabetic';
        ctx.fillStyle='rgba(255,255,255,0.5)';
        ctx.fillText(t, x+2, y+TILE_SIZE-3);
        // Custom char name
        if(customChar){
          ctx.font='5px monospace';
          ctx.fillStyle='rgba(255,255,255,0.7)';
          ctx.fillText(customChar.name.slice(0,5), x+2, y+10);
        }
      }
    }
  }
  ctx.textAlign='left';
  ctx.textBaseline='alphabetic';
}

function editorPaint(ex,ey){
  const rect=ED.canvas.getBoundingClientRect();
  const scaleX=ED.canvas.width/rect.width, scaleY=ED.canvas.height/rect.height;
  const x=(ex-rect.left)*scaleX, y=(ey-rect.top)*scaleY;
  const col=Math.floor(x/TILE_SIZE), row=Math.floor(y/TILE_SIZE);
  if(col>=0&&col<ED.mapW&&row>=0&&row<ED.mapH){
    ED.map[row][col]=ED.erasing?0:ED.selectedTile;
    renderEditor();
    const id=document.getElementById('ed-coords');
    if(id) id.textContent=`Col:${col} Row:${row} → ${TILE_NAMES[ED.map[row][col]]||ED.map[row][col]}`;
  }
}

function exportLevel(){
  const ld = LEVELS[ED.levelIdx];
  // Serialize tiles: one row per line, matching the levels.js compact format
  const tilesStr = '[\n' + ED.map.map(row => '    ' + JSON.stringify(row)).join(', \n') + '\n  ]';
  const header = JSON.stringify({name:ld.name, width:ED.mapW, height:ED.mapH, bgColor:ld.bgColor}, null, 2);
  // Inject the compact tiles block in place of the placeholder
  const json = header.replace('"bgColor"', '"bgColor"').replace(/\}$/, `,\n  "tiles": ${tilesStr}\n}`);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], {type:'application/json'}));
  a.download = `level_${ED.levelIdx+1}.json`; a.click();
}

function importLevel(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const data=JSON.parse(ev.target.result);
      if(!data.tiles) throw new Error('no tiles');

      const choice = confirm(
        `Import "${data.name||'Level'}"?\n\nOK = Add as NEW level\nCancel = Replace current level (${LEVELS[ED.levelIdx].name})`
      );

      if(choice){
        // Add as new level at end of LEVELS array
        const newLevel = {
          name: data.name || `CUSTOM ${LEVELS.length+1}`,
          width: data.width || data.tiles[0].length,
          height: data.height || data.tiles.length,
          bgColor: data.bgColor || '#000000',
          tiles: data.tiles
        };
        LEVELS.push(newLevel);
        const newIdx = LEVELS.length - 1;

        // Add option to the dropdown
        const sel = document.getElementById('ed-level-select');
        const o = document.createElement('option');
        o.value = newIdx; o.textContent = newLevel.name;
        sel.appendChild(o);
        sel.value = newIdx;

        // Switch editor to the new level
        ED.levelIdx = newIdx;
      } else {
        // Replace current level
        LEVELS[ED.levelIdx].tiles = data.tiles;
        LEVELS[ED.levelIdx].name = data.name || LEVELS[ED.levelIdx].name;
        if(data.bgColor) LEVELS[ED.levelIdx].bgColor = data.bgColor;

        // Update dropdown label
        const sel = document.getElementById('ed-level-select');
        sel.options[sel.selectedIndex].textContent = LEVELS[ED.levelIdx].name;
      }

      loadEditorLevel(ED.levelIdx);
    }catch(err){ alert('Invalid level JSON'); }
  };
  reader.readAsText(file);
  // Reset input so same file can be re-imported
  e.target.value = '';
}

function playTestLevel(){
  LEVELS[ED.levelIdx].tiles=ED.map.map(r=>[...r]);
  G.level=ED.levelIdx; G.score=0; G.lives=3;
  G.hasGun=true; G.hasMG=true; G.hasJetpack=true;
  loadLevel(G.level);
  switchState('playing');
}

// ── Custom character persistence ──────────────────────────────────
const CUSTOM_CHAR_STORE='ms_custom_chars';
let CUSTOM_CHARS=[];
let NEXT_CHAR_TILE=100;


function loadCustomChars(){
  try{ CUSTOM_CHARS=JSON.parse(localStorage.getItem(CUSTOM_CHAR_STORE)||'[]'); }
  catch(e){ CUSTOM_CHARS=[]; }
  if(CUSTOM_CHARS.length>0) NEXT_CHAR_TILE=Math.max(...CUSTOM_CHARS.map(c=>c.tileId))+1;
  // Register custom tile IDs into shared lookup tables
  for(const ch of CUSTOM_CHARS){
	  TILE_NAMES[ch.tileId]  = ch.name;
	  TILE_COLORS[ch.tileId] = ch.color;
	  TILE_EMOJI[ch.tileId]  = '👾';
	  bakeCustomCharSprite(ch);
	}
  return CUSTOM_CHARS;
}
// Add this helper function near the SPRITES section (or near loadCustomChars):
function bakeCustomCharSprite(ch){
  // Reuse mkEnemy if it's still in scope — but it's inside initSprites closure.
  // So we replicate the minimal pixel-draw here:
  function mkC(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
  function px(ctx,x,y,col){ ctx.fillStyle=col; ctx.fillRect(x,y,1,1); }
  
  const color = ch.color || '#44cc44';
  const eyeColor = ch.eyeColor || '#ff0000';
  const dg = '#228822';
  
  for(const frame of [0,1]){
    const c = mkC(14,16); const ctx = c.getContext('2d');
    for(let y=2;y<13;y++) for(let x=1;x<13;x++) px(ctx,x,y,color);
    [2,3,5,6,9,10].forEach(x=>px(ctx,x,1,color));
    px(ctx,5,0,color); px(ctx,6,0,color);
    px(ctx,2,3,eyeColor); px(ctx,3,3,eyeColor); px(ctx,9,3,eyeColor); px(ctx,10,3,eyeColor);
    for(let x=4;x<9;x++) px(ctx,x,7,'#000');
    px(ctx,4,6,'#000'); px(ctx,9,6,'#000');
    if(frame===0){ for(let y=13;y<16;y++){px(ctx,3,y,dg);px(ctx,4,y,dg);px(ctx,9,y,dg);px(ctx,10,y,dg);} }
    else{ px(ctx,2,13,dg);px(ctx,3,13,dg);px(ctx,10,13,dg);px(ctx,11,13,dg);px(ctx,2,14,dg);px(ctx,3,14,dg);px(ctx,10,14,dg);px(ctx,11,14,dg); }
    SPRITES[`custom_${ch.tileId}_${frame}`] = c;
  }
}

function saveCustomChars(){ localStorage.setItem(CUSTOM_CHAR_STORE,JSON.stringify(CUSTOM_CHARS)); }
function deleteCustomChar(id){
  CUSTOM_CHARS=CUSTOM_CHARS.filter(c=>c.tileId!==id);
  saveCustomChars();
}

let _editingTileId=null;
function openCharModal(ch){
  _editingTileId=ch?ch.tileId:null;
  document.getElementById('char-modal-title').textContent=ch?'◈ EDIT CHARACTER':'◈ NEW CHARACTER';
  document.getElementById('char-name').value=ch?.name||'CUSTOM';
  document.getElementById('char-color').value=ch?.color||'#cc4444';
  document.getElementById('char-eyecolor').value=ch?.eyeColor||'#ff0000';
  document.getElementById('char-behavior').value=ch?.behavior||'patrol';
  document.getElementById('char-speed').value=ch?.speed||1.4;
  document.getElementById('char-range').value=ch?.patrolRange||80;
  document.getElementById('char-score').value=ch?.scoreValue||300;
  _refreshModalLabels(); _refreshModalPreview();
  document.getElementById('char-modal-bg').classList.add('open');
}
function closeCharModal(){ document.getElementById('char-modal-bg').classList.remove('open'); }
function _refreshModalLabels(){
  document.getElementById('rv-speed').textContent=parseFloat(document.getElementById('char-speed').value).toFixed(1);
  document.getElementById('rv-range').textContent=document.getElementById('char-range').value;
  document.getElementById('rv-score').textContent=document.getElementById('char-score').value;
}
function _refreshModalPreview(){
  const cnv=document.getElementById('char-prev-cnv');
  const ctx=cnv.getContext('2d'); ctx.clearRect(0,0,48,56);
  const col=document.getElementById('char-color').value;
  const eye=document.getElementById('char-eyecolor').value;
  ctx.fillStyle=col; ctx.fillRect(4,6,20,22);
  ctx.fillStyle=eye; ctx.fillRect(7,10,3,3); ctx.fillRect(16,10,3,3);
  ctx.fillStyle='#000'; for(let x=8;x<20;x++) ctx.fillRect(x,18,1,1);
  const info=document.getElementById('char-prev-info');
  info.innerHTML=`NAME: ${document.getElementById('char-name').value}<br>BEHAV: ${document.getElementById('char-behavior').value}<br>SPD: ${document.getElementById('char-speed').value}<br>RANGE: ${document.getElementById('char-range').value}px<br>SCORE: ${document.getElementById('char-score').value}`;
}
function saveCharModal(){
  const tileId = _editingTileId || NEXT_CHAR_TILE++;   // resolve once
  const def={
    name:document.getElementById('char-name').value||'CUSTOM',
    color:document.getElementById('char-color').value,
    eyeColor:document.getElementById('char-eyecolor').value,
    behavior:document.getElementById('char-behavior').value,
    speed:parseFloat(document.getElementById('char-speed').value),
    patrolRange:parseInt(document.getElementById('char-range').value),
    scoreValue:parseInt(document.getElementById('char-score').value),
    tileId,
    sprite:`custom_${tileId}`,    // ✅ correct sprite key
    width:14, height:16, gravity:true, hp:1,
  };
  if(_editingTileId) CUSTOM_CHARS=CUSTOM_CHARS.filter(c=>c.tileId!==_editingTileId);
  CUSTOM_CHARS.push(def);
  bakeCustomCharSprite(def);
  TILE_NAMES[def.tileId]  = def.name;
  TILE_COLORS[def.tileId] = def.color;
  TILE_EMOJI[def.tileId]  = '👾';
  saveCustomChars();
  buildPalette(); buildCharList();
  closeCharModal();
}

// ═══════════════════════════════════════════════════════════════════
//  MENU ANIMATION
// ═══════════════════════════════════════════════════════════════════
let _menuRaf = 0;
function animateMenu(){
  cancelAnimationFrame(_menuRaf);
  const mc=document.getElementById('menu-canvas');
  if(!mc) return;
  const mctx=mc.getContext('2d');
  let t=0;
  function frame(){
    mctx.clearRect(0,0,mc.width,mc.height);
    // sky gradient
    const grad=mctx.createLinearGradient(0,0,0,mc.height);
    grad.addColorStop(0,'#0a0a14'); grad.addColorStop(1,'#0d0d1a');
    mctx.fillStyle=grad; mctx.fillRect(0,0,mc.width,mc.height);
    // ground
    mctx.fillStyle='#445588'; mctx.fillRect(0,mc.height-20,mc.width,20);
    mctx.fillStyle='#6677aa'; mctx.fillRect(0,mc.height-20,mc.width,2);
    // platforms
    [[60,75],[180,58],[310,68],[440,55]].forEach(([x,h])=>{
      mctx.fillStyle='#445588'; mctx.fillRect(x,mc.height-h,70,8);
    });
    // trophies float
    [[75,mc.height-85],[195,mc.height-72],[325,mc.height-80]].forEach(([x,y],i)=>{
      const fy=y+Math.sin(t*0.04+i)*4;
      mctx.fillStyle='#ffcc00'; mctx.shadowColor='#ffcc00'; mctx.shadowBlur=8;
      mctx.fillRect(x+2,fy,10,14); mctx.shadowBlur=0;
    });
    // stars
    [[15,12],[60,28],[140,18],[260,10],[350,22],[400,35]].forEach(([x,y],i)=>{
      mctx.globalAlpha=0.3+Math.abs(Math.sin(t*0.03+i))*0.5;
      mctx.fillStyle='#ffffff'; mctx.fillRect(x,y,2,2);
    });
    mctx.globalAlpha=1;
    // scrolling player
    const px2=(t*1.5)%mc.width;
    mctx.fillStyle='#ffcc44'; mctx.fillRect(px2,mc.height-42,10,8);
    mctx.fillStyle='#4488ff'; mctx.fillRect(px2+1,mc.height-34,8,8);
    if(Math.floor(t/8)%2===0){ mctx.fillRect(px2+1,mc.height-26,3,5); mctx.fillRect(px2+6,mc.height-26,3,5); }
    else { mctx.fillRect(px2,mc.height-26,3,5); mctx.fillRect(px2+7,mc.height-26,3,5); }
    // enemy
    const ex2=mc.width-((t*0.8)%mc.width);
    mctx.fillStyle='#44cc44'; mctx.fillRect(ex2,mc.height-40,12,14);
    mctx.fillStyle='#ff0000'; mctx.fillRect(ex2+2,mc.height-36,3,2); mctx.fillRect(ex2+7,mc.height-36,3,2);
    t++; _menuRaf = requestAnimationFrame(frame);
  }
  frame();
}

// ═══════════════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('keydown',e=>{
  G.keys[e.code]=true;
  const playing=G.state==='playing';
  if(playing && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if(['ControlLeft','ControlRight'].includes(e.code)) e.preventDefault();
  if(e.code==='Escape'&&playing){ cancelAnimationFrame(G.animFrame); switchState('menu'); }
  // Cheat codes
  if(playing && e.code==='KeyQ') { G.godMode=!G.godMode; showMsg(G.godMode?'GOD MODE ON':'GOD MODE OFF'); }
  // Phase 2: Roguelite boon selection
  if(playing && ROGUE.isShowingBoons()) {
    if (ROGUE.handleBoonKey(e.key)) { e.preventDefault(); return; }
  }
});
document.addEventListener('keyup',e=>{G.keys[e.code]=false;});

// ── Touch controls ────────────────────────────────────────────────
function bindTouch(){
  const map = {
    'touch-left':    { key:'left'    },
    'touch-right':   { key:'right'   },
    'touch-jump':    { key:'jump'    },
    'touch-shoot':   { key:'shoot'   },
    'touch-grenade': { key:'grenade' },
  };
  for(const [id, cfg] of Object.entries(map)){
    const el = document.getElementById(id); if(!el) continue;
    const press = () => {
      G.touch[cfg.key] = true;
      el.classList.add('pressed');
    };
    const release = () => {
      G.touch[cfg.key] = false;
      el.classList.remove('pressed');
    };
    el.addEventListener('touchstart',  e=>{ e.preventDefault(); press();   }, {passive:false});
    el.addEventListener('touchend',    e=>{ e.preventDefault(); release(); }, {passive:false});
    el.addEventListener('touchcancel', e=>{ e.preventDefault(); release(); }, {passive:false});
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup',   release);
    el.addEventListener('mouseleave',release);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  BOOTSTRAP — load config then init
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
//  APPLY GAME METADATA FROM CONFIG → DOM
//  Called once after CFG is loaded. Updates every place the game
//  name / subtitle / version appears so config is the single source.
// ═══════════════════════════════════════════════════════════════════
function applyGameMeta() {
  const title    = CFG.game?.title    || '▒ ▒ ▒ D A N G E R O U S  G A M E ▒ ▒ ▒';
  const subtitle = CFG.game?.subtitle || '▒ BUILD YOUR OWN GAME ▒';
  const version  = CFG.game?.version  || '1.0';

  // Browser tab
  document.title = title;

  // Menu screen: big heading
  const menuTitle = document.querySelector('.menu-title');
  if (menuTitle) menuTitle.textContent = title;

  // Menu screen: subtitle
  const menuSub = document.querySelector('.menu-sub');
  if (menuSub) menuSub.textContent = subtitle;

  // Footer center tag
  const footerTitle = document.getElementById('footer-title');
  if (footerTitle) footerTitle.textContent = title;

  // Admin link badge (if present)
  const vTag = document.getElementById('version-tag');
  if (vTag) vTag.textContent = `v${version}`;
}

// ═══════════════════════════════════════════════════════════════════
//  FULLSCREEN CONTROLLER
// ═══════════════════════════════════════════════════════════════════
function initFullscreen() {
  const btn     = document.getElementById('btn-fullscreen');
  const icon    = document.getElementById('fs-icon');
  const label   = document.getElementById('fs-label');
  if (!btn) return;

  // Update button appearance to match actual fullscreen state
  function syncBtn() {
    const isFull = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    btn.classList.toggle('is-fullscreen', isFull);
    icon.textContent  = isFull ? '✕' : '⛶';
    label.textContent = isFull ? 'EXIT FULL' : 'FULLSCREEN';
    btn.title = isFull ? 'Exit Fullscreen (Esc)' : 'Toggle Fullscreen (F11)';
  }

  // Request / exit fullscreen
  function toggleFullscreen() {
    const isFull = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (!isFull) {
      // Enter fullscreen on the whole document element
      const el = document.documentElement;
      (el.requestFullscreen     ||
       el.webkitRequestFullscreen ||
       el.mozRequestFullScreen   ||
       el.msRequestFullscreen
      ).call(el);
    } else {
      (document.exitFullscreen     ||
       document.webkitExitFullscreen ||
       document.mozCancelFullScreen  ||
       document.msExitFullscreen
      ).call(document);
    }
  }

  btn.addEventListener('click', toggleFullscreen);

  // Also wire F11 key (browser may intercept it, but we try)
  document.addEventListener('keydown', e => {
    if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  });

  // Keep button in sync when user presses Esc to exit fullscreen
  document.addEventListener('fullscreenchange',       syncBtn);
  document.addEventListener('webkitfullscreenchange', syncBtn);
  document.addEventListener('mozfullscreenchange',    syncBtn);
  document.addEventListener('MSFullscreenChange',     syncBtn);

  syncBtn(); // initial state
}

// ═══════════════════════════════════════════════════════════════════
//  LEADERBOARD  — top 10 high scores saved to localStorage
// ═══════════════════════════════════════════════════════════════════
const LS_LB = 'ms_leaderboard';

// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — FEAT-007: ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════
const LS_ACHV = 'dg_achievements';

const ACHIEVEMENT_DEFS = [
  { id:'first_blood',     name:'FIRST BLOOD',       desc:'Kill your first enemy',                icon:'🩸' },
  { id:'kill_10',         name:'ON A ROLL',          desc:'Kill 10 enemies in one run',           icon:'💀' },
  { id:'kill_50',         name:'WAR MACHINE',        desc:'Kill 50 enemies total',                icon:'☠️' },
  { id:'grenade_multi',   name:'FRAG OUT',           desc:'Kill 3 enemies with one grenade',      icon:'💣' },
  { id:'no_damage_level', name:'GHOST',              desc:'Complete a level without taking damage',icon:'👻' },
  { id:'all_trophies',    name:'COMPLETIONIST',      desc:'Collect all trophies in a level',      icon:'🏆' },
  { id:'jetpack_ace',     name:'TOP GUN',            desc:'Defeat an enemy while jetpacking',     icon:'🚀' },
  { id:'boss_killed',     name:'BOSS SLAYER',        desc:'Defeat the boss',                      icon:'👹' },
  { id:'secret_broken',   name:'SECRET HUNTER',      desc:'Break a secret tile',                  icon:'💥' },
  { id:'secrets_5',       name:'ARCHAEOLOGIST',      desc:'Break 5 secret tiles',                 icon:'🔮' },
  { id:'upgrade_maxed',   name:'FULLY LOADED',       desc:'Max out a weapon upgrade',             icon:'⬆️' },
  { id:'speedrun_level',  name:'SONIC MODE',         desc:'Complete a level in under 30 seconds', icon:'⚡' },
  { id:'daily_complete',  name:'DAILY GRINDER',      desc:'Complete a Daily Challenge',           icon:'📅' },
  { id:'roguelite_win',   name:'PERMADEATH WINNER',  desc:'Win in Roguelite mode',                icon:'💪' },
  { id:'level_5',         name:'VETERAN',            desc:'Reach level 5',                        icon:'🎖️' },
];

const ACHV = (() => {
  let unlocked = {};
  let toastQueue = [];
  let toastTimer = 0;
  let runStats = { kills:0, secretsBroken:0, levelStartTime:0, tookDamageThisLevel:false };

  function load() {
    try { unlocked = JSON.parse(localStorage.getItem(LS_ACHV)||'{}'); } catch(e) { unlocked={}; }
  }
  function save() {
    try { localStorage.setItem(LS_ACHV, JSON.stringify(unlocked)); } catch(e){}
  }
  function unlock(id) {
    if (unlocked[id]) return;
    const def = ACHIEVEMENT_DEFS.find(d=>d.id===id);
    if (!def) return;
    unlocked[id] = Date.now();
    save();
    toastQueue.push(def);
  }
  function emit(event, data={}) {
    if (event === 'enemy_killed') {
      runStats.kills++;
      if (runStats.kills === 1) unlock('first_blood');
      if (runStats.kills >= 10) unlock('kill_10');
      if ((parseInt(localStorage.getItem('dg_total_kills')||'0') + runStats.kills) >= 50) unlock('kill_50');
      if (data.jetpacking) unlock('jetpack_ace');
    }
    if (event === 'grenade_multi' && data.count >= 3) unlock('grenade_multi');
    if (event === 'level_complete') {
      if (!runStats.tookDamageThisLevel) unlock('no_damage_level');
      const elapsed = (Date.now() - runStats.levelStartTime) / 1000;
      if (elapsed < 30) unlock('speedrun_level');
      if (data.levelIdx >= 4) unlock('level_5');
      runStats.tookDamageThisLevel = false;
      runStats.levelStartTime = Date.now();
      // Persist kill total
      const prev = parseInt(localStorage.getItem('dg_total_kills')||'0');
      localStorage.setItem('dg_total_kills', prev + runStats.kills);
    }
    if (event === 'all_trophies') unlock('all_trophies');
    if (event === 'boss_killed') unlock('boss_killed');
    if (event === 'secret_broken') {
      unlock('secret_broken');
      const secretCount = (parseInt(localStorage.getItem('dg_secrets')||'0')) + 1;
      localStorage.setItem('dg_secrets', secretCount);
      if (secretCount >= 5) unlock('secrets_5');
    }
    if (event === 'upgrade_maxed') unlock('upgrade_maxed');
    if (event === 'daily_complete') unlock('daily_complete');
    if (event === 'roguelite_win') unlock('roguelite_win');
    if (event === 'took_damage') runStats.tookDamageThisLevel = true;
    if (event === 'level_start') {
      runStats.levelStartTime = Date.now();
      runStats.tookDamageThisLevel = false;
    }
  }
  function tick() {
    if (toastTimer > 0) { toastTimer--; return; }
    if (toastQueue.length > 0) { toastTimer = 180; }
  }
  function drawToast(ctx) {
    if (toastQueue.length === 0 || toastTimer <= 0) return;
    const def = toastQueue[0];
    if (toastTimer < 20) {
      toastQueue.shift();
      return;
    }
    const alpha = toastTimer > 160 ? (180-toastTimer)/20 : toastTimer < 40 ? toastTimer/40 : 1;
    const w = 220, h = 40, x = CANVAS_W - w - 12, y = 12;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#0a0a1a';
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffcc00';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('ACHIEVEMENT!', x+8, y+12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText(`${def.icon} ${def.name}`, x+8, y+26);
    ctx.fillStyle = '#778899';
    ctx.font = '5px "Press Start 2P", monospace';
    const descWords = def.desc;
    ctx.fillText(descWords.slice(0,30), x+8, y+37);
    ctx.restore();
  }
  function getUnlocked() { return unlocked; }
  function reset() { unlocked = {}; localStorage.removeItem(LS_ACHV); }

  return { load, save, emit, tick, drawToast, getUnlocked, reset, runStats };
})();

// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — FEAT-005: DAILY CHALLENGE MODE
// ═══════════════════════════════════════════════════════════════════
const LS_DAILY = 'dg_daily';

const DAILY = (() => {
  // Simple seeded PRNG (mulberry32)
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }

  function getDailySeed() {
    const key = getTodayKey();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function isDailyPlayed() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_DAILY)||'{}');
      return data.date === getTodayKey();
    } catch(e) { return false; }
  }

  function saveDailyResult(score) {
    try {
      localStorage.setItem(LS_DAILY, JSON.stringify({ date: getTodayKey(), score }));
    } catch(e){}
  }

  function getDailyResult() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_DAILY)||'{}');
      if (data.date === getTodayKey()) return data.score;
    } catch(e){}
    return null;
  }

  function buildDailyLevel() {
    const rng = mulberry32(getDailySeed());
    // Pick a base level randomly
    const baseIdx = Math.floor(rng() * Math.min(LEVELS.length, 10));
    const base = LEVELS[baseIdx];
    const tilesCopy = base.tiles.map(r => [...r]);

    // Shuffle enemy positions within each row (only enemy tiles)
    const enemyIds = [11,20,21,22,23];
    for (let row = 0; row < tilesCopy.length; row++) {
      const enemyPositions = [];
      for (let col = 0; col < tilesCopy[row].length; col++) {
        if (enemyIds.includes(tilesCopy[row][col])) {
          enemyPositions.push({ col, id: tilesCopy[row][col] });
          tilesCopy[row][col] = 0; // clear original position
        }
      }
      if (enemyPositions.length === 0) continue;
      // Shuffle the enemy IDs (what type goes where) using seeded RNG
      const cols = enemyPositions.map(ep => ep.col);
      const ids  = enemyPositions.map(ep => ep.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      // Write shuffled enemies back into the tile map
      cols.forEach((c, i) => { tilesCopy[row][c] = ids[i]; });
    }

    return {
      ...base,
      name: `DAILY ${getTodayKey()} 📅`,
      tiles: tilesCopy,
      isDaily: true,
    };
  }

  let active = false;

  function startDailyChallenge() {
    if (isDailyPlayed()) {
      const prev = getDailyResult();
      showMsg(`DAILY DONE! SCORE: ${String(prev).padStart(7,'0')}`, 200);
      return;
    }
    active = true;
    const dailyLevel = buildDailyLevel();
    G.dailyLevel = dailyLevel;
    G.isDailyRun = true;
    G.level = 0;
    G.score = 0;
    G.lives = CFG ? (CFG.player.startLives || 3) : 3;
    // Reset all player state (same as normal play start)
    G.hasGun = false; G.hasMG = false; G.hasJetpack = false;
    G.isRogueRun = false; G.scoreMultiplier = 1;
    G.rogueArmor = false; G.rogueDoubleJump = false;
    G.weaponUpgrades = { pistol:0, machinegun:0, grenade:0 };
    G.upgradeChipsCollected = 0;
    loadLevel(dailyLevel);
    switchState('playing');
  }

  function checkTick() {
    if (!G.isDailyRun) return;
    // If game ended with win or gameover, save result
    if (G.state === 'gameover' || G.state === 'win') {
      if (active) {
        saveDailyResult(G.score);
        active = false;
        G.isDailyRun = false;
        ACHV.emit('daily_complete');
      }
    }
  }

  return { startDailyChallenge, isDailyPlayed, getDailyResult, getTodayKey, checkTick, get active(){ return active; } };
})();

// ═══════════════════════════════════════════════════════════════════
//  PHASE 2 — FEAT-006: ROGUELITE / PERMADEATH MODE
// ═══════════════════════════════════════════════════════════════════
const LS_ROGUE = 'dg_rogue_boons';

const BOON_DEFS = [
  { id:'speed_up',    name:'OVERDRIVE',      desc:'+20% move speed',       icon:'💨', apply: ()=>{ if(CFG) CFG.player.speed = Math.min((CFG.player.speed||3)*1.2, 6); } },
  { id:'extra_life',  name:'SECOND CHANCE',  desc:'+1 extra life',         icon:'❤️', apply: ()=>{ G.lives = Math.min(G.lives+1, 9); } },
  { id:'fast_shoot',  name:'TRIGGER HAPPY',  desc:'50% faster fire rate',  icon:'🔫', apply: ()=>{ if(CFG && CFG.weapons) CFG.weapons.pistol.fireRate = Math.max((CFG.weapons.pistol.fireRate||12)*0.5, 3); } },
  { id:'more_grenades',name:'GRENADIER',     desc:'+5 grenade capacity',   icon:'💣', apply: ()=>{ if(CFG) CFG.player.grenadeMax = Math.min((CFG.player.grenadeMax||3)+5, 15); } },
  { id:'armor',       name:'HEAVY ARMOR',    desc:'50% reduced damage',    icon:'🛡️', apply: ()=>{ G.rogueArmor = true; } },
  { id:'score_boost', name:'SCORE RUSH',     desc:'2× score multiplier',   icon:'⭐', apply: ()=>{ G.scoreMultiplier = (G.scoreMultiplier||1) * 2; } },
  { id:'double_jump', name:'DOUBLE JUMP',    desc:'Press jump again mid-air',icon:'🦘',apply: ()=>{ G.rogueDoubleJump = true; } },
];

const ROGUE = (() => {
  let active = false;
  let boonsPicked = [];
  let showingBoonSelect = false;
  let boonOptions = [];
  let selectedBoon = 0;
  let rng = Math.random;

  function start() {
    active = true;
    boonsPicked = [];
    showingBoonSelect = false;
    G.isRogueRun = true;
    G.scoreMultiplier = 1;
    G.rogueArmor = false;
    G.rogueDoubleJump = false;
    G.level = 0;
    G.score = 0;
    G.lives = CFG ? CFG.player.lives : 3;
    G.weaponUpgrades = { pistol:0, machinegun:0, grenade:0 };
    // Reload CFG from defaults to reset any prior boon modifications
    loadLevel(LEVELS[0]);
    switchState('playing');
  }

  function offerBoons(onChosen) {
    showingBoonSelect = true;
    // Pick 3 random boons (not already maxed)
    const available = BOON_DEFS.filter(b => !boonsPicked.filter(p=>p===b.id).length >= 2);
    boonOptions = [];
    const pool = [...available].sort(()=>Math.random()-0.5);
    for (let i = 0; i < Math.min(3, pool.length); i++) boonOptions.push(pool[i]);
    selectedBoon = 0;
    G.boonSelectCallback = (idx)=>{
      const b = boonOptions[idx];
      if (b) { boonsPicked.push(b.id); b.apply(); }
      showingBoonSelect = false;
      if (onChosen) onChosen();
    };
  }

  function handleBoonKey(key) {
    if (!showingBoonSelect) return false;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') { selectedBoon = (selectedBoon-1+boonOptions.length)%boonOptions.length; return true; }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') { selectedBoon = (selectedBoon+1)%boonOptions.length; return true; }
    if (key === ' ' || key === 'Enter' || key === 'ArrowUp') {
      if (G.boonSelectCallback) G.boonSelectCallback(selectedBoon);
      return true;
    }
    if (key === '1') { if(G.boonSelectCallback) G.boonSelectCallback(0); return true; }
    if (key === '2') { if(G.boonSelectCallback) G.boonSelectCallback(1); return true; }
    if (key === '3') { if(G.boonSelectCallback) G.boonSelectCallback(2); return true; }
    return false;
  }

  function drawBoonSelect(ctx) {
    if (!showingBoonSelect || boonOptions.length === 0) return;
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Title
    ctx.fillStyle = '#ffcc00';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP! CHOOSE A BOON', CANVAS_W/2, 40);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#556677';
    ctx.fillText('← → TO SELECT   SPACE/ENTER TO CONFIRM   1/2/3 QUICK PICK', CANVAS_W/2, 56);
    // Boon cards
    const cardW = 160, cardH = 90, gap = 20;
    const totalW = boonOptions.length * cardW + (boonOptions.length-1)*gap;
    const startX = (CANVAS_W - totalW) / 2;
    boonOptions.forEach((b, i) => {
      const cx = startX + i*(cardW+gap);
      const cy = CANVAS_H/2 - cardH/2;
      const isSelected = i === selectedBoon;
      ctx.fillStyle = isSelected ? '#141428' : '#0a0a1a';
      ctx.strokeStyle = isSelected ? '#ffcc00' : '#333355';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeRect(cx, cy, cardW, cardH);
      // Number key hint
      ctx.fillStyle = '#445566';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i+1}]`, cx+4, cy+10);
      // Icon
      ctx.font = '22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, cx+cardW/2, cy+36);
      // Name
      ctx.fillStyle = isSelected ? '#ffcc00' : '#aabbcc';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText(b.name, cx+cardW/2, cy+52);
      // Desc (word wrap)
      ctx.fillStyle = '#556677';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText(b.desc, cx+cardW/2, cy+68);
    });
    ctx.textAlign = 'left';
    // Picked boons
    if (boonsPicked.length > 0) {
      ctx.fillStyle = '#334455';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.fillText('ACTIVE BOONS: ' + boonsPicked.map(id=>BOON_DEFS.find(b=>b.id===id)?.icon||'').join(' '), 8, CANVAS_H-12);
    }
  }

  function isShowingBoons() { return showingBoonSelect; }
  function isActive() { return active; }
  function stop() { active = false; G.isRogueRun = false; showingBoonSelect = false; }

  return { start, offerBoons, handleBoonKey, drawBoonSelect, isShowingBoons, isActive, stop };
})();

ACHV.emit('enemy_killed', { jetpacking: G.player })   // bullet + grenade kill
ACHV.emit('grenade_multi', { count: G.enemies.filter(e=>e.dead && e.deadTimer===25).length })            // explodeGrenade
ACHV.emit('all_trophies')                           // trophy case in updateItems
ACHV.emit('level_complete', { levelIdx: G.level })        // door + warp
ACHV.emit('boss_killed')                            // boss death
ACHV.emit('secret_broken')                          // tryBreakTile
ACHV.emit('upgrade_maxed')                          // applyWeaponUpgrade tier 2
ACHV.emit('took_damage')                            // killPlayer
ACHV.emit('level_start')                            // loadLevel
ACHV.emit('daily_complete')                         // DAILY.checkTick
ACHV.emit('roguelite_win')                          // win state handler

function loadLeaderboard(){
  try{ G.leaderboard = JSON.parse(localStorage.getItem(LS_LB)||'[]'); }
  catch(e){ G.leaderboard=[]; }
  if(G.leaderboard.length>0)
    G.hiScore = G.leaderboard[0].score;
  else
    G.hiScore = parseInt(localStorage.getItem('ms_hi')||'0');
}

function saveLeaderboard(){
  localStorage.setItem(LS_LB, JSON.stringify(G.leaderboard));
  if(G.leaderboard.length>0){
    G.hiScore=G.leaderboard[0].score;
    localStorage.setItem('ms_hi', G.hiScore);
  }
}

function isNewHighScore(score){
  if(score<=0) return false;
  if(G.leaderboard.length < 10) return true;
  return score > G.leaderboard[G.leaderboard.length-1].score;
}

function addLeaderboardEntry(name, score){
  const entry = {
    name: (name||'UNKNOWN').toUpperCase().slice(0,8),
    score,
    date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'})
  };
  G.leaderboard.push(entry);
  G.leaderboard.sort((a,b)=>b.score-a.score);
  G.leaderboard = G.leaderboard.slice(0,10);
  saveLeaderboard();
}

// ── Check score → maybe show name-entry modal → then call onContinue
function checkAndShowHighScore(score, onContinue){
  // ── Bug 2 fix: during replay playback, never prompt for name — just continue ──
  if (REPLAY.isPlaying()) { onContinue(); return; }

  // Always update simple hiScore if beaten
  if(score > G.hiScore){ G.hiScore=score; localStorage.setItem('ms_hi',score); }

  if(isNewHighScore(score)){
    showHighScoreEntryModal(score, (name)=>{
      addLeaderboardEntry(name, score);
      onContinue();
    });
  } else {
    onContinue();
  }
}

// ── Name-entry modal ─────────────────────────────────────────────
function showHighScoreEntryModal(score, onSave){
  // Ensure overlay exists
  let ov = document.getElementById('hs-entry-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'hs-entry-modal';
    ov.className = 'hs-modal-overlay';
    ov.innerHTML = `
      <div class="hs-modal-box">
        <div class="hs-modal-title">🏆 NEW HIGH SCORE!</div>
        <div class="hs-modal-score" id="hs-modal-score">0000000</div>
        <div class="hs-modal-msg">CONGRATULATIONS SOLDIER!<br>YOU HAVE SET A NEW RECORD.</div>
        <div class="hs-modal-label">ENTER YOUR NAME:</div>
        <input class="hs-name-input" id="hs-name-input" type="text"
               maxlength="8" placeholder="SOLDIER" autocomplete="off" spellcheck="false">
        <div class="hs-modal-hint">MAX 8 CHARACTERS</div>
        <button class="hs-save-btn" id="hs-save-btn">⬆ SAVE SCORE</button>
      </div>`;
    document.body.appendChild(ov);
  }

  document.getElementById('hs-modal-score').textContent = String(score).padStart(7,'0');
  const inp = document.getElementById('hs-name-input');
  inp.value = '';

  // Show
  ov.classList.add('open');
  setTimeout(()=>inp.focus(), 100);

  // Save handler (set fresh each call to capture correct onSave)
  const btn = document.getElementById('hs-save-btn');
  const handler = ()=>{
    const name = inp.value.trim() || 'SOLDIER';
    ov.classList.remove('open');
    btn.removeEventListener('click', handler);
    inp.removeEventListener('keydown', keyHandler);
    onSave(name);
  };
  const keyHandler = (e)=>{ if(e.key==='Enter') handler(); };
  btn.addEventListener('click', handler);
  inp.addEventListener('keydown', keyHandler, {once: true});
}

// ── Leaderboard screen ───────────────────────────────────────────
function showLeaderboard(){
  loadLeaderboard();
  const tbody = document.getElementById('lb-tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  if(G.leaderboard.length===0){
    const tr=document.createElement('tr');
    tr.innerHTML='<td colspan="4" class="lb-empty">NO SCORES YET — PLAY FIRST!</td>';
    tbody.appendChild(tr);
  } else {
    G.leaderboard.forEach((e,i)=>{
      const tr=document.createElement('tr');
      tr.className = i===0?'lb-gold': i===1?'lb-silver': i===2?'lb-bronze':'';
      tr.innerHTML=`
        <td class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</td>`;
      // Use textContent for user-supplied name to prevent XSS
      const nameTd = document.createElement('td');
      nameTd.className = 'lb-name';
      nameTd.textContent = e.name;
      // Build remaining cells safely
      const scoreTd = document.createElement('td');
      scoreTd.className = 'lb-score';
      scoreTd.textContent = String(e.score).padStart(7,'0');
      const dateTd = document.createElement('td');
      dateTd.className = 'lb-date';
      dateTd.textContent = e.date || '';
      tr.appendChild(nameTd);
      tr.appendChild(scoreTd);
      tr.appendChild(dateTd);
      tbody.appendChild(tr);
    });
  }
  switchState('leaderboard');
}

// ── Phase 2 FEAT-007: Achievements overlay screen ──
function showAchievements() {
  const unlocked = ACHV.getUnlocked();
  // Use an in-game canvas overlay approach — create a modal over the menu
  let overlay = document.getElementById('achv-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'achv-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;overflow-y:auto;font-family:"Press Start 2P",monospace;color:#00ff41;';
    document.body.appendChild(overlay);
  }
  const unlockedCount = Object.keys(unlocked).length;
  overlay.innerHTML = `
    <div style="max-width:700px;margin:0 auto;padding:24px;">
      <div style="font-size:16px;text-shadow:0 0 10px #00ff41;margin-bottom:8px;">🏅 ACHIEVEMENTS</div>
      <div style="font-size:9px;color:#445566;margin-bottom:20px;letter-spacing:2px;">${unlockedCount} / ${ACHIEVEMENT_DEFS.length} UNLOCKED</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:24px;">
        ${ACHIEVEMENT_DEFS.map(def => {
          const done = !!unlocked[def.id];
          return `<div style="border:1px solid ${done?'#00ff41':'#1a1a3a'};background:${done?'#080818':'#050510'};padding:12px;display:flex;gap:10px;align-items:center;">
            <div style="font-size:22px;filter:${done?'none':'grayscale(1) opacity(0.2)'};">${def.icon}</div>
            <div>
              <div style="font-size:7px;color:${done?'#00ff41':'#334455'};margin-bottom:4px;">${def.name}</div>
              <div style="font-size:6px;color:#445566;line-height:1.5;">${def.desc}</div>
              ${done ? `<div style="font-size:5px;color:#334455;margin-top:3px;">${new Date(unlocked[def.id]).toLocaleDateString()}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:12px;">
        <button onclick="document.getElementById('achv-overlay').remove()" style="font-family:inherit;background:#0a0a1a;color:#00ff41;border:1px solid #00ff41;padding:8px 16px;cursor:pointer;font-size:9px;">✕ CLOSE</button>
        <button onclick="if(confirm('RESET ALL ACHIEVEMENTS?')){ACHV.reset();document.getElementById('achv-overlay').remove();}" style="font-family:inherit;background:#0a0a1a;color:#ff2020;border:1px solid #ff2020;padding:8px 16px;cursor:pointer;font-size:9px;">🗑 RESET</button>
      </div>
    </div>`;
  overlay.style.display = 'block';
}

async function bootstrap(){
  // ── Config priority (must match admin.js exactly) ────────────────────
  // 1. localStorage 'ms_admin_cfg'  ← admin.js saves here on Apply Changes
  // 2. game.config.json file        ← original file on disk
  // 3. CONFIG_DEFAULT               ← hard-coded fallback
  const LS_KEY = 'ms_admin_cfg';
  let cfgSource = 'default';

  const lsSaved = localStorage.getItem(LS_KEY);
  if (lsSaved) {
    try {
      CFG = JSON.parse(lsSaved);
      cfgSource = 'localStorage';
    } catch(e) {
      localStorage.removeItem(LS_KEY); // corrupted — discard and fall through
    }
  }

  if (!CFG) {
    try {
      const _ctrl = new AbortController();
      const _tid  = setTimeout(() => _ctrl.abort(), 3000);
      const res = await fetch('game.config.json', { signal: _ctrl.signal });
      clearTimeout(_tid);
      if(res.ok) { CFG = await res.json(); cfgSource = 'file'; }
      else throw new Error('no config');
    } catch(e) {
      CFG = CONFIG_DEFAULT;
    }
  }

  // Apply config to constants
  TILE_SIZE = CFG.game.canvas.tileSize || 32;
  CANVAS_W  = CFG.game.canvas.width   || 800;
  CANVAS_H  = CFG.game.canvas.height  || 320;
  COLS_VIS  = Math.ceil(CANVAS_W/TILE_SIZE);
  ROWS_VIS  = Math.ceil(CANVAS_H/TILE_SIZE);

  // Init canvas
  G.canvas=document.getElementById('gameCanvas');
  G.ctx=G.canvas.getContext('2d');
  G.canvas.width=CANVAS_W; G.canvas.height=CANVAS_H;
  loadLeaderboard();
  G.lives=CFG.player.startLives||3;

  // ── Apply game.title / subtitle / version from config to DOM ──
  applyGameMeta();

  // Show config badge with source indicator
  const sourceLabel = cfgSource==='localStorage' ? '★ admin config' : cfgSource==='file' ? 'file config' : 'default config';
  const badge=document.getElementById('config-badge');
  if(badge) badge.textContent=`v${CFG.game?.version||'1.0'} | ${sourceLabel}`;

  // Wire buttons
  document.getElementById('btn-play').addEventListener('click',()=>{
    G.score=0; G.lives=CFG.player.startLives||3; G.level=0;
    G.hasGun=false; G.hasMG=false; G.hasJetpack=false;
    G.isDailyRun=false; G.isRogueRun=false; G.scoreMultiplier=1; G.rogueArmor=false; G.rogueDoubleJump=false;
    G.weaponUpgrades={pistol:0,machinegun:0}; G.upgradeChipsCollected=0; // Phase 1
    ACHV.emit('level_start');
    loadLevel(0); switchState('playing');
  });
  document.getElementById('btn-editor').addEventListener('click',()=>switchState('editor'));
  const btnLb = document.getElementById('btn-leaderboard');
  if(btnLb) btnLb.addEventListener('click',()=>showLeaderboard());
  const btnLbBack = document.getElementById('btn-lb-back');
  if(btnLbBack) btnLbBack.addEventListener('click',()=>switchState('menu'));
  const btnLbClear = document.getElementById('btn-lb-clear');
  if(btnLbClear) btnLbClear.addEventListener('click',()=>{
    if(!confirm('CLEAR ALL HIGH SCORES?')) return;
    G.leaderboard=[]; saveLeaderboard();
    G.hiScore=0; localStorage.removeItem('ms_hi');
    showLeaderboard();
  });
  document.getElementById('btn-menu').addEventListener('click',()=>switchState('menu'));
  document.getElementById('btn-gomenu').addEventListener('click',()=>switchState('menu'));
  document.getElementById('btn-retry').addEventListener('click',()=>{
    G.score=0; G.lives=CFG.player.startLives||3; G.level=0;
    G.hasGun=false; G.hasMG=false; G.hasJetpack=false;
    G.isDailyRun=false; G.isRogueRun=false; G.scoreMultiplier=1; G.rogueArmor=false; G.rogueDoubleJump=false;
    G.weaponUpgrades={pistol:0,machinegun:0}; G.upgradeChipsCollected=0; // Phase 1
    ACHV.emit('level_start');
    loadLevel(0); switchState('playing');
  });
  document.getElementById('btn-ed-menu').addEventListener('click',()=>switchState('menu'));

  // ── Phase 2 button wiring ──
  ACHV.load();
  const btnDaily = document.getElementById('btn-daily');
  if(btnDaily) btnDaily.addEventListener('click',()=>DAILY.startDailyChallenge());
  const btnRogue = document.getElementById('btn-roguelite');
  if(btnRogue) btnRogue.addEventListener('click',()=>{
    if(!confirm('ROGUELITE MODE: ONE LIFE. NO CONTINUES. BOONS BETWEEN LEVELS.\nReady?')) return;
    ROGUE.start();
  });
  const btnAchv = document.getElementById('btn-achievements');
  if(btnAchv) btnAchv.addEventListener('click', showAchievements);

  document.getElementById('btn-ed-play').addEventListener('click',playTestLevel);
  document.getElementById('btn-ed-export').addEventListener('click',exportLevel);
  document.getElementById('btn-ed-import').addEventListener('click',()=>document.getElementById('ed-import-input').click());
  document.getElementById('ed-import-input').addEventListener('change',importLevel);
  document.getElementById('btn-ed-clear').addEventListener('click',()=>{ ED.map=Array.from({length:ED.mapH},()=>Array(ED.mapW).fill(0)); renderEditor(); });
  document.getElementById('btn-ed-fill').addEventListener('click',()=>{ for(let c=0;c<ED.mapW;c++){ED.map[ED.mapH-1][c]=1;ED.map[ED.mapH-2][c]=1;} renderEditor(); });

  const sel=document.getElementById('ed-level-select');
  LEVELS.forEach((l,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=l.name; sel.appendChild(o); });
  sel.addEventListener('change',e=>{ ED.levelIdx=parseInt(e.target.value); loadEditorLevel(ED.levelIdx); });

  const edWrap=document.getElementById('editor-canvas-wrap');
  edWrap.addEventListener('mousedown',e=>{ ED.painting=true; ED.erasing=e.button===2; editorPaint(e.clientX,e.clientY); });
  edWrap.addEventListener('mousemove',e=>{ if(ED.painting) editorPaint(e.clientX,e.clientY); });
  edWrap.addEventListener('mouseup',()=>ED.painting=false);
  edWrap.addEventListener('mouseleave',()=>ED.painting=false);
  edWrap.addEventListener('contextmenu',e=>{ e.preventDefault(); ED.erasing=true; editorPaint(e.clientX,e.clientY); });

  // Character editor modal
  loadCustomChars();
  document.getElementById('btn-add-char').addEventListener('click',()=>openCharModal(null));
  document.getElementById('char-cancel').addEventListener('click',closeCharModal);
  document.getElementById('char-save').addEventListener('click',saveCharModal);
  ['char-color','char-eyecolor','char-behavior','char-name'].forEach(id=>document.getElementById(id).addEventListener('input',_refreshModalPreview));
  ['char-speed','char-range','char-score'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{_refreshModalLabels();_refreshModalPreview();}));
  document.getElementById('char-modal-bg').addEventListener('click',e=>{ if(e.target===document.getElementById('char-modal-bg')) closeCharModal(); });

  bindTouch();
  initFullscreen();
  animateMenu();

  // ── Phase 4: URL Level Sharing — check hash and auto-start ──
  if (SHARE.checkAndLoadSharedLevel()) {
    // Shared level is now LEVELS[0] — auto-launch it
    G.score = 0; G.lives = CFG.player.startLives || 3; G.level = 0;
    G.hasGun = false; G.hasMG = false; G.hasJetpack = false;
    G.isDailyRun = false; G.isRogueRun = false; G.scoreMultiplier = 1;
    G.rogueArmor = false; G.rogueDoubleJump = false;
    G.weaponUpgrades = { pistol: 0, machinegun: 0 }; G.upgradeChipsCollected = 0;
    loadLevel(0);
    switchState('playing');
    showMsg('SHARED LEVEL LOADED!', 180);
  } else {
    switchState('menu');
  }

  const btnImportLevel = document.getElementById('btn-import-level');
  if (btnImportLevel) {
    const modalBg  = document.getElementById('import-level-modal-bg');
    const inputEl  = document.getElementById('import-level-input');
    const errorEl  = document.getElementById('import-level-error');
    const goBtn    = document.getElementById('import-level-go');
    const cancelBtn= document.getElementById('import-level-cancel');

    btnImportLevel.addEventListener('click', () => {
      inputEl.value = ''; errorEl.textContent = '';
      modalBg.style.display = 'flex';
      inputEl.focus();
    });
    cancelBtn.addEventListener('click', () => { modalBg.style.display = 'none'; });
    modalBg.addEventListener('click', e => { if (e.target === modalBg) modalBg.style.display = 'none'; });

    function tryLoadImport() {
      let raw = inputEl.value.trim();
      // Accept full URL or bare hash or hash without #level=
      const hashMatch = raw.match(/#level=(.+)/);
      if (hashMatch) raw = hashMatch[1];
      // Also strip leading #level= if pasted directly
      if (raw.startsWith('#level=')) raw = raw.slice(7);
      if (!raw) { errorEl.textContent = 'Please paste a level code.'; return; }
      const level = SHARE.decodeLevel(raw);
      if (!level) { errorEl.textContent = '✕ Invalid level code — check your paste.'; return; }
      modalBg.style.display = 'none';
      // Remove any previously prepended shared level
      if (LEVELS[0] && LEVELS[0]._shared) LEVELS.shift();
      LEVELS.unshift({ ...level, _shared: true });
      G.score = 0; G.lives = CFG.player.startLives || 3; G.level = 0;
      G.hasGun = false; G.hasMG = false; G.hasJetpack = false;
      G.isDailyRun = false; G.isRogueRun = false; G.scoreMultiplier = 1;
      G.rogueArmor = false; G.rogueDoubleJump = false;
      G.weaponUpgrades = { pistol: 0, machinegun: 0 }; G.upgradeChipsCollected = 0;
      loadLevel(0); switchState('playing');
      showMsg('SHARED LEVEL LOADED!', 180);
    }
    goBtn.addEventListener('click', tryLoadImport);
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) tryLoadImport(); });
  }

  // ── Phase 4: wire SHARE button in editor ──
  const btnShare = document.getElementById('btn-ed-share');
  if (btnShare) btnShare.addEventListener('click', () => SHARE.shareCurrentEditorLevel());

  // ── Phase 3: wire AI Level Generator button in editor ──
  const btnAiGen = document.getElementById('btn-ed-ai');
  if (btnAiGen) btnAiGen.addEventListener('click', () => AI_GEN.openPromptUI());

  // ── Phase 3: wire Watch Replay button on game-over screen ──
  const btnWatchReplay = document.getElementById('btn-watch-replay');
  if (btnWatchReplay) {
    btnWatchReplay.style.display = 'none'; // hidden until a replay exists
    btnWatchReplay.addEventListener('click', () => {
      REPLAY.startPlayback(() => {
        // After playback ends, return to game-over screen
        cancelAnimationFrame(G.animFrame);
        switchState('gameover');
      });
      switchState('playing');
    });
  }

  // ── Phase 3: wire Replay Export button on game-over screen ──
  const btnExportReplay = document.getElementById('btn-export-replay');
  if (btnExportReplay) {
    btnExportReplay.addEventListener('click', () => {
      const str = REPLAY.getExportString();
      if (!str) { showMsg('NO REPLAY TO EXPORT', 100); return; }
      navigator.clipboard.writeText(str).then(() => {
        // Show feedback on gameover screen (not on canvas)
        const fb = document.getElementById('replay-export-feedback');
        if (fb) { fb.textContent = '✓ COPIED TO CLIPBOARD!'; fb.style.display='block'; setTimeout(()=>fb.style.display='none', 2500); }
        else alert('Replay code copied! Share it with friends.');
      }).catch(() => { prompt('Copy this replay code:', str); });
    });
  }

  // ── WATCH SHARED REPLAY from menu ──────────────────────────────
  const btnWatchShared = document.getElementById('btn-watch-shared-replay');
  if (btnWatchShared) {
    const rModalBg   = document.getElementById('import-replay-modal-bg');
    const rInputEl   = document.getElementById('import-replay-input');
    const rErrorEl   = document.getElementById('import-replay-error');
    const rGoBtn     = document.getElementById('import-replay-go');
    const rCancelBtn = document.getElementById('import-replay-cancel');

    btnWatchShared.addEventListener('click', () => {
      rInputEl.value = ''; rErrorEl.textContent = '';
      rModalBg.style.display = 'flex';
      setTimeout(() => rInputEl.focus(), 60);
    });
    rCancelBtn.addEventListener('click', () => { rModalBg.style.display = 'none'; });
    rModalBg.addEventListener('click', e => { if (e.target === rModalBg) rModalBg.style.display = 'none'; });

    function tryLoadSharedReplay() {
      const raw = rInputEl.value.trim();
      if (!raw) { rErrorEl.textContent = 'Please paste a replay code.'; return; }
      const ok = REPLAY.loadFromString(raw);
      if (!ok) { rErrorEl.textContent = '✕ Invalid replay code — check your paste.'; return; }
      rModalBg.style.display = 'none';
      REPLAY.startPlayback(() => {
        cancelAnimationFrame(G.animFrame);
        switchState('menu');
      });
      switchState('playing');
    }
    rGoBtn.addEventListener('click', tryLoadSharedReplay);
    rInputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) tryLoadSharedReplay(); });
  }

  // ── Phase 3: load saved theme ──
  loadSavedTheme();
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 4 — FEAT-012: URL LEVEL SHARING
//  Encode any level to a URL hash. Open link → level loads instantly.
//  No server, no accounts, no backend. Pure JS.
// ═══════════════════════════════════════════════════════════════════

const SHARE = (() => {
  // ── Tiny LZ-style run-length encoder for tile arrays ──────────────
  // Encodes [0,0,0,1,1,0] → "3×0,2×1,1×0" style, then base64
  function rleEncode(arr) {
    const runs = [];
    let i = 0;
    while (i < arr.length) {
      let v = arr[i], count = 1;
      while (i + count < arr.length && arr[i + count] === v && count < 255) count++;
      runs.push(count, v);
      i += count;
    }
    return runs;
  }

  function rleDecode(runs) {
    const out = [];
    for (let i = 0; i < runs.length; i += 2) out.push(...Array(runs[i]).fill(runs[i + 1]));
    return out;
  }

  function encodeLevel(levelObj) {
    const flat = levelObj.tiles.flat();
    const runs = rleEncode(flat);
    // Pack into Uint8Array → btoa
    const buf = new Uint8Array(runs.length + 8);
    let pos = 0;
    // Header: rows(2), cols(2), runs(4)
    const rows = levelObj.tiles.length, cols = levelObj.tiles[0].length;
    buf[pos++] = rows >> 8; buf[pos++] = rows & 0xff;
    buf[pos++] = cols >> 8; buf[pos++] = cols & 0xff;
    buf[pos++] = runs.length >> 24 & 0xff; buf[pos++] = runs.length >> 16 & 0xff;
    buf[pos++] = runs.length >> 8 & 0xff;  buf[pos++] = runs.length & 0xff;
    for (const v of runs) buf[pos++] = v;
    // btoa needs a binary string
    let bstr = '';
    for (let i = 0; i < buf.length; i++) bstr += String.fromCharCode(buf[i]);
    const b64 = btoa(bstr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // Attach meta as JSON prefix separated by '|'
    const meta = {
      name: levelObj.name || 'SHARED LEVEL',
      bgColor: levelObj.bgColor || '#000011',
      parallaxBg: levelObj.parallaxBg || 'jungle',
      movingPlatforms: levelObj.movingPlatforms || [],
    };
    return btoa(JSON.stringify(meta)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '|' + b64;
  }

  function decodeLevel(hash) {
    try {
      const [metaB64, tilesB64] = hash.split('|');
      if (!metaB64 || !tilesB64) return null;
      const meta = JSON.parse(atob(metaB64.replace(/-/g, '+').replace(/_/g, '/')));
      const bstr = atob(tilesB64.replace(/-/g, '+').replace(/_/g, '/'));
      const buf = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) buf[i] = bstr.charCodeAt(i);
      let pos = 0;
      const rows = (buf[pos++] << 8) | buf[pos++];
      const cols = (buf[pos++] << 8) | buf[pos++];
      const runLen = (buf[pos++] << 24) | (buf[pos++] << 16) | (buf[pos++] << 8) | buf[pos++];
      const runs = Array.from(buf.slice(pos, pos + runLen));
      const flat = rleDecode(runs);
      const tiles = [];
      for (let r = 0; r < rows; r++) tiles.push(flat.slice(r * cols, r * cols + cols));
      return { ...meta, width: cols, height: rows, tiles };
    } catch (e) {
      console.warn('[SHARE] Failed to decode URL level:', e);
      return null;
    }
  }

  function shareCurrentEditorLevel() {
    const levelObj = {
      name: ED.name || 'SHARED LEVEL',
      bgColor: ED.bgColor || '#000011',
      parallaxBg: ED.parallaxBg || 'jungle',
      tiles: ED.map.map(row => [...row]),
      movingPlatforms: ED.movingPlatforms || [],
    };
    const encoded = encodeLevel(levelObj);
    const url = `${location.origin}${location.pathname}#level=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      showMsg('LEVEL LINK COPIED!', 160);
    }).catch(() => {
      // Fallback: prompt
      prompt('Copy this level URL:', url);
    });
  }

  function checkAndLoadSharedLevel() {
    const hash = location.hash;
    if (!hash.startsWith('#level=')) return false;
    const encoded = hash.slice(7);
    const level = decodeLevel(encoded);
    if (!level) {
      console.warn('[SHARE] Could not decode level from URL hash.');
      return false;
    }
    // Prepend the shared level to LEVELS so it's level 0
    LEVELS.unshift({ ...level, _shared: true });
    console.log('[SHARE] Loaded shared level:', level.name);
    return true;
  }

  return { shareCurrentEditorLevel, checkAndLoadSharedLevel, encodeLevel, decodeLevel };
})();

// ═══════════════════════════════════════════════════════════════════
//  PHASE 3 — FEAT-011: VISUAL THEME PACKS
//  5 full palette themes. Swap tiles, bg, CRT tint with one call.
//  Defined here, applied at runtime — no level redesign needed.
// ═══════════════════════════════════════════════════════════════════
const THEMES = {
  default: {
    name: 'DEFAULT',
    icon: '🎮',
    desc: 'Classic military retro',
    bgColor: '#070a0f',
    crtTint: null,
    parallaxBg: 'jungle',
    solid:  ['#445588','#6677aa','#223366'],
    brick:  ['#774422','#995533','#442211'],
    spike:  '#aaaaaa',
    lava:   '#ff3300',
    platform: '#4a6fa5',
    enemyTint: null,
  },
  neon_city: {
    name: 'NEON CITY',
    icon: '🌆',
    desc: 'Cyberpunk skyline',
    bgColor: '#050010',
    crtTint: 'rgba(120,0,255,0.04)',
    parallaxBg: 'factory',
    solid:  ['#1a0a3a','#3a1a6a','#0a0020'],
    brick:  ['#2a0050','#4a00aa','#15002a'],
    spike:  '#ff00ff',
    lava:   '#ff00aa',
    platform: '#cc00ff',
    enemyTint: '#ff00ff44',
  },
  ice_cave: {
    name: 'ICE CAVE',
    icon: '❄️',
    desc: 'Frozen tundra depths',
    bgColor: '#020814',
    crtTint: 'rgba(100,200,255,0.04)',
    parallaxBg: 'factory',
    solid:  ['#0a2a44','#1a4a6a','#051525'],
    brick:  ['#0a3a55','#1a5a80','#052035'],
    spike:  '#aaddff',
    lava:   '#00aaff',
    platform: '#44aadd',
    enemyTint: '#aaddff22',
  },
  desert_ruins: {
    name: 'DESERT RUINS',
    icon: '🏜️',
    desc: 'Ancient crumbling sands',
    bgColor: '#150a00',
    crtTint: 'rgba(255,160,0,0.03)',
    parallaxBg: 'desert',
    solid:  ['#6b4a10','#8b6a30','#3a2800'],
    brick:  ['#7a5515','#aa7a25','#452e00'],
    spike:  '#ddcc88',
    lava:   '#ff8800',
    platform: '#cc9944',
    enemyTint: '#ffcc0022',
  },
  deep_space: {
    name: 'DEEP SPACE',
    icon: '🚀',
    desc: 'Zero-gravity void',
    bgColor: '#000008',
    crtTint: 'rgba(0,255,128,0.03)',
    parallaxBg: 'factory',
    solid:  ['#0a1a2a','#152a3a','#050d18'],
    brick:  ['#0a1520','#152030','#050a12'],
    spike:  '#00ff88',
    lava:   '#ff4400',
    platform: '#00ff88',
    enemyTint: '#00ff8822',
  },
  toxic_swamp: {
    name: 'TOXIC SWAMP',
    icon: '☠️',
    desc: 'Radioactive wasteland',
    bgColor: '#040a00',
    crtTint: 'rgba(100,255,0,0.04)',
    parallaxBg: 'jungle',
    solid:  ['#1a3300','#2a5500','#0a1a00'],
    brick:  ['#224400','#336600','#0f2200'],
    spike:  '#aaff00',
    lava:   '#66ff00',
    platform: '#88cc00',
    enemyTint: '#88ff0022',
  },
};

// Active theme key — persisted to localStorage
let _activeThemeKey = 'default';

function applyTheme(key) {
  const theme = THEMES[key] || THEMES.default;
  _activeThemeKey = key;
  try { localStorage.setItem('dg_theme', key); } catch(e){}

  // Rebuild tile sprites with new colors
  const mkTile = (bg, hi, sh) => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0,0,32,32);
    ctx.fillStyle = hi; ctx.fillRect(0,0,32,2); ctx.fillRect(0,0,2,32);
    ctx.fillStyle = sh; ctx.fillRect(0,30,32,2); ctx.fillRect(30,0,2,32);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for(let y=4;y<32;y+=8) for(let x=4;x<32;x+=8) ctx.fillRect(x,y,2,2);
    return c;
  };
  SPRITES['tile_solid'] = mkTile(...theme.solid);
  SPRITES['tile_brick'] = mkTile(...theme.brick);

  // Update TILE_COLORS for editor palette
  TILE_COLORS[1] = theme.solid[0];
  TILE_COLORS[2] = theme.brick[0];
  TILE_COLORS[3] = theme.spike;
  TILE_COLORS[8] = theme.lava;
  TILE_COLORS[10] = theme.platform;

  // Store tint and bg for renderer to use
  G._themeTint  = theme.crtTint;
  G._themeBg    = theme.bgColor;

  // Apply CSS background and CRT tint immediately
  document.body.style.background = theme.bgColor;

  // Rebuild enemy colors if tint set
  G._themeEnemyTint = theme.enemyTint;

  // Signal editor to re-render if open
  if (G.state === 'editor') { try { renderEditor(); buildPalette(); } catch(e){} }
}

function loadSavedTheme() {
  try {
    const saved = localStorage.getItem('dg_theme');
    if (saved && THEMES[saved]) applyTheme(saved);
  } catch(e){}
}

// ═══════════════════════════════════════════════════════════════════
//  PHASE 3 — FEAT-010: REPLAY RECORDING & PLAYBACK
//  Records key state every frame. Playback re-feeds inputs.
//  Export as base64 string. Share via copy/paste.
// ═══════════════════════════════════════════════════════════════════
const REPLAY = (() => {
  const INPUT_KEYS = ['ArrowLeft','ArrowRight','ArrowUp','Space','ShiftLeft','ShiftRight',
                      'ControlLeft','ControlRight','KeyA','KeyD','KeyW','KeyZ','KeyG','KeyX'];

  // Pack 14 keys as bitmask into a single byte
  function packFrame(keys) {
    let b = 0;
    for (let i = 0; i < INPUT_KEYS.length; i++) {
      if (keys[INPUT_KEYS[i]]) b |= (1 << i);
    }
    return b;
  }

  function unpackFrame(byte) {
    const keys = {};
    for (let i = 0; i < INPUT_KEYS.length; i++) {
      if (byte & (1 << i)) keys[INPUT_KEYS[i]] = true;
    }
    return keys;
  }

  let _recording = false;
  let _playing   = false;
  let _frames    = [];       // recorded: Array of bytes (one per frame)
  let _playhead  = 0;        // current frame index during playback
  let _levelIdx  = 0;        // which level was recorded on
  let _levelSnapshot = null; // level object at recording start

  function startRecording(levelIdx, levelObj) {
    _recording = true;
    _playing   = false;
    _frames    = [];
    _playhead  = 0;
    _levelIdx  = levelIdx;
    // Deep-clone the level so replay can restore it exactly
    _levelSnapshot = JSON.parse(JSON.stringify(levelObj));
    console.log('[REPLAY] Recording started — level:', LEVELS[levelIdx]?.name);
  }

  function recordFrame() {
    if (!_recording) return;
    _frames.push(packFrame(G.keys));
  }

  function stopRecording() {
    if (!_recording) return;
    _recording = false;
    console.log('[REPLAY] Recorded', _frames.length, 'frames');
    try {
      localStorage.setItem('dg_replay', getExportString() || '');
    } catch(e){}
  }

  function hasReplay() {
    return _frames.length > 0 || !!localStorage.getItem('dg_replay');
  }

  // ── Bug 3 fix: safe binary→base64 that handles large arrays ──
  function bytesToBase64(bytes) {
    let bstr = '';
    // Loop avoids "Maximum call stack size exceeded" from spread operator
    for (let i = 0; i < bytes.length; i++) bstr += String.fromCharCode(bytes[i] & 0xff);
    return btoa(bstr);
  }

  function getExportString() {
    // If frames already loaded in memory, encode directly
    if (_frames.length > 0) {
      const header = [_levelIdx & 0xff, (_frames.length >> 8) & 0xff, _frames.length & 0xff];
      return bytesToBase64([...header, ..._frames]);
    }
    // Otherwise try localStorage (frames may have been saved but _frames cleared)
    try {
      const saved = localStorage.getItem('dg_replay');
      if (saved) return saved; // already base64
    } catch(e){}
    return null;
  }

  function loadFromString(str) {
    try {
      const bin = atob(str);
      const bytes = Array.from(bin).map(c => c.charCodeAt(0));
      _levelIdx = bytes[0];
      const len = (bytes[1] << 8) | bytes[2];
      _frames = bytes.slice(3, 3 + len);
      return true;
    } catch(e) { return false; }
  }

  function startPlayback(onDone) {
    if (_frames.length === 0) {
      // Try loading from localStorage
      const saved = localStorage.getItem('dg_replay');
      if (!saved || !loadFromString(saved)) { onDone && onDone(); return; }
    }
    _playing  = true;
    _playhead = 0;

    // Reset game state to start of recorded level
    G.score = 0; G.lives = CFG ? (CFG.player.startLives || 3) : 3; G.level = _levelIdx;
    G.hasGun = false; G.hasMG = false; G.hasJetpack = false;
    G.isDailyRun = false; G.isRogueRun = false; G.scoreMultiplier = 1;
    G.rogueArmor = false; G.rogueDoubleJump = false;
    G.weaponUpgrades = { pistol:0, machinegun:0 }; G.upgradeChipsCollected = 0;
    loadLevel(_levelIdx);

    G._replayOnDone = onDone;
    console.log('[REPLAY] Playback started —', _frames.length, 'frames');
  }

  function playbackFrame() {
    if (!_playing) return false;
    if (_playhead >= _frames.length) {
      _playing = false;
      showMsg('REPLAY ENDED', 120);
      console.log('[REPLAY] Playback complete');
      G._replayOnDone && G._replayOnDone();
      G._replayOnDone = null;
      return false;
    }
    // Inject recorded keys
    const frame = unpackFrame(_frames[_playhead++]);
    // Replace G.keys with recorded state (preserve non-input keys)
    for (const k of INPUT_KEYS) G.keys[k] = !!frame[k];
    return true;
  }

  function stopPlayback() {
    _playing = false;
    _playhead = 0;
  }

  function isRecording() { return _recording; }
  function isPlaying()   { return _playing; }
  function frameCount()  { return _frames.length; }
  function progress()    { return _frames.length > 0 ? _playhead / _frames.length : 0; }

  return {
    startRecording, recordFrame, stopRecording,
    startPlayback, playbackFrame, stopPlayback,
    hasReplay, getExportString, loadFromString,
    isRecording, isPlaying, frameCount, progress,
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  PHASE 3 — FEAT-009: AI LEVEL GENERATOR
//  One Claude API call → valid tile grid → loads in editor instantly.
//  Uses the Anthropic /v1/messages endpoint (no API key needed here).
// ═══════════════════════════════════════════════════════════════════
const AI_GEN = (() => {
  const TILE_REF = `
TILE ID REFERENCE (use ONLY these IDs):
0  = empty air
1  = solid ground / floor
2  = brick wall / platform block
3  = spike (instant kill, place on ground)
8  = lava / hazard (instant kill, place at bottom)
9  = ladder
10 = moving platform
11 = grunt enemy (ground patrol)
12 = player spawn (exactly 1 required)
14 = jetpack pickup
15 = extra life pickup
16 = grenade pickup
17 = machine gun pickup
18 = upgrade chip
20 = heavy enemy (slow, strong)
21 = flyer enemy (airborne patrol)
22 = jumper enemy (bouncing)
23 = sniper enemy (stationary, shoots)
24 = breakable secret brick
4  = trophy collectible (place several for challenge)
5  = key (exactly 1 required)
6  = door / exit (exactly 1 required, needs key+all trophies)
7  = pistol pickup`.trim();

  const RULES = `
CRITICAL RULES:
- Grid must be exactly 10 rows × 50 columns (10 arrays of 50 numbers each)
- Row 9 (last row) must be ALL 1s (solid floor)
- Row 8 must be mostly 1s with some hazards (8) allowed
- Exactly ONE tile 12 (player spawn) — place in row 7 near column 2
- Exactly ONE tile 5 (key) and ONE tile 6 (door/exit)
- At least 3 trophy tiles (4) scattered around
- Surround playable area with walls (tile 2 or 1) at columns 0 and 49
- No enemy tiles in rows 0-1 (top two rows must be mostly empty)
- Enemies (11,20,21,22,23) must be placed above solid ground tiles
- Flyers (21) can be in mid-air rows
- Leave enough open space for the player to navigate
- Background color should match the theme (hex string like "#1a0a2e")`.trim();

  async function generate(prompt, onProgress) {
    onProgress('Connecting to AI...');

    const systemPrompt = `You are a level designer for a retro 2D side-scrolling action game called DANGEROUS GAME.
${TILE_REF}

${RULES}

Your output must be ONLY valid JSON — no explanation, no markdown, no code fences.
The JSON must have this exact structure:
{
  "name": "LEVEL NAME",
  "bgColor": "#hexcolor",
  "tiles": [[...10 arrays of 50 numbers...]]
}`;

    const userPrompt = `Design a level with this theme: ${prompt}

Remember: 10 rows, 50 columns. Return ONLY JSON.`;

    try {
      onProgress('AI is designing your level...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(()=>({error:{message:'Network error'}}));
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      onProgress('Parsing level data...');
      const data = await response.json();
      const rawText = data.content?.find(b => b.type === 'text')?.text || '';

      // Strip any accidental markdown fences
      const cleaned = rawText.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      const levelObj = JSON.parse(cleaned);

      // Validate structure
      if (!levelObj.tiles || !Array.isArray(levelObj.tiles)) throw new Error('Missing tiles array');
      if (levelObj.tiles.length !== 10) throw new Error(`Expected 10 rows, got ${levelObj.tiles.length}`);
      for (let r = 0; r < levelObj.tiles.length; r++) {
        if (!Array.isArray(levelObj.tiles[r])) throw new Error(`Row ${r} is not an array`);
        // Pad or trim to 50 columns
        while (levelObj.tiles[r].length < 50) levelObj.tiles[r].push(0);
        levelObj.tiles[r] = levelObj.tiles[r].slice(0, 50);
      }
      // Ensure solid floor on last row
      levelObj.tiles[9] = levelObj.tiles[9].map(() => 1);

      onProgress('Level ready!');
      return { ok: true, level: levelObj };
    } catch(e) {
      console.error('[AI_GEN]', e);
      return { ok: false, error: e.message };
    }
  }

  // Show the AI generator overlay in the editor
  function openPromptUI() {
    const existing = document.getElementById('ai-gen-overlay');
    if (existing) { existing.style.display = 'flex'; return; }

    const overlay = document.createElement('div');
    overlay.id = 'ai-gen-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:10000;
      display:flex;align-items:center;justify-content:center;
      font-family:'Press Start 2P',monospace;`;

    overlay.innerHTML = `
      <div style="background:#0d1117;border:2px solid #00e5ff;padding:28px;max-width:580px;width:92%;box-sizing:border-box;">
        <div style="color:#00e5ff;font-size:11px;margin-bottom:6px;letter-spacing:1px;">🤖 AI LEVEL GENERATOR</div>
        <div style="color:#556;font-size:7px;margin-bottom:18px;line-height:1.9;">
          Describe your level theme and the AI will build a complete playable level.<br>
          <span style="color:#888">e.g. "lava jungle with flying enemies and a hidden key" or "ice cave with snipers"</span>
        </div>
        <textarea id="ai-prompt-input" placeholder="Describe your level..." style="
          width:100%;height:72px;background:#070a0f;color:#00e5ff;
          border:1px solid #335;padding:10px;font-family:monospace;
          font-size:12px;resize:none;box-sizing:border-box;outline:none;"></textarea>
        <div id="ai-gen-status" style="color:#556;font-size:7px;min-height:16px;margin:10px 0 14px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">
          <button id="ai-gen-cancel" style="background:#111;color:#888;border:1px solid #333;padding:9px 14px;font-family:'Press Start 2P',monospace;font-size:7px;cursor:pointer;">CANCEL</button>
          <button id="ai-gen-submit" style="background:#00e5ff;color:#000;border:none;padding:9px 16px;font-family:'Press Start 2P',monospace;font-size:7px;cursor:pointer;font-weight:bold;">✨ GENERATE LEVEL</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const statusEl = overlay.querySelector('#ai-gen-status');
    const submitBtn = overlay.querySelector('#ai-gen-submit');
    const cancelBtn = overlay.querySelector('#ai-gen-cancel');
    const inputEl  = overlay.querySelector('#ai-prompt-input');

    cancelBtn.addEventListener('click', () => { overlay.style.display = 'none'; });

    submitBtn.addEventListener('click', async () => {
      const prompt = inputEl.value.trim();
      if (!prompt) { statusEl.textContent = 'Please enter a description.'; statusEl.style.color='#ff4444'; return; }
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ GENERATING...';
      statusEl.style.color = '#00e5ff';

      const result = await generate(prompt, msg => {
        statusEl.textContent = msg;
      });

      submitBtn.disabled = false;
      submitBtn.textContent = '✨ GENERATE LEVEL';

      if (!result.ok) {
        statusEl.textContent = '✕ Error: ' + result.error;
        statusEl.style.color = '#ff4444';
        return;
      }

      // Load generated level into editor
      overlay.style.display = 'none';
      const lv = result.level;
      ED.mapH = lv.tiles.length;
      ED.mapW = lv.tiles[0].length;
      ED.map  = lv.tiles.map(r => [...r]);
      ED.canvas.width  = ED.mapW * TILE_SIZE;
      ED.canvas.height = ED.mapH * TILE_SIZE;
      // Store meta for export
      ED._aiName    = lv.name   || 'AI LEVEL';
      ED._aiBgColor = lv.bgColor || '#0a0a12';
      renderEditor();
      showMsg('AI LEVEL LOADED! — PLAY TEST IT', 200);
    });

    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) submitBtn.click(); });
    setTimeout(() => inputEl.focus(), 100);
  }

  return { openPromptUI };
})();

window.addEventListener('load', bootstrap);