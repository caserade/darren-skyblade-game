/* CORE: renderer, scene, camera, input (keyboard, mouse, touch, gamepad) and synthesised sound effects.
   Loaded first after the data and asset files. */
'use strict';
const DATA = window.DARREN_DATA,
  TUNE = DATA.player; // everything editable lives in data/game_data.js
const T = THREE,
  PI = Math.PI,
  TAU = PI * 2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const angDiff = (a, b) => {
  let d = (b - a) % TAU;
  if (d > PI) d -= TAU;
  if (d < -PI) d += TAU;
  return d;
};
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
const COARSE = matchMedia('(pointer: coarse)').matches;

const canvas = $('c');
let renderer;
try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  const d = document.createElement('div');
  d.id = 'err';
  d.textContent =
    'This game needs WebGL, and this browser did not provide it. Try a current Chrome, Edge, Firefox or Safari.';
  $('game').appendChild(d);
  throw e;
}
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping; // look.js switches this when post-processing is on
renderer.physicallyCorrectLights = false;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
let pixelRatio = Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 2);
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, 0.1, 600);
function resize() {
  const w = $('game').clientWidth || 800,
    h = $('game').clientHeight || 600;
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 74 : 62;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

/* ---------- game state shell ---------- */
const G = {
  mode: 'title',
  paused: false,
  cine: false,
  enemies: [],
  projs: [],
  rings: [],
  hitstop: 0,
  slow: 0,
  shake: 0,
  time: 0,
  wave: 0,
  waveT: 0,
  stats: { t: 0, maxCombo: 0, perfect: 0, breaks: 0 },
  boss: null,
  endT: 0,
  waves: [],
  gems: [], // part drops on the ground
  pshots: [], // Darren's projectiles
  punch: 0,
  fovKick: 0,
};

/* ---------- settings and unlocks, remembered by the browser ---------- */
function loadJSON(k) {
  try {
    const value = JSON.parse(localStorage.getItem(k) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (_) {
    return {};
  }
}
function saveJSON(k, v) {
  try {
    const text = JSON.stringify(v), previous = localStorage.getItem(k);
    // Keep the pre-repair value once, including malformed saves, before replacing it.
    if (previous !== null && !localStorage.getItem(k + '.recovery')) {
      try { localStorage.setItem(k + '.recovery', previous); } catch (_) {}
    }
    localStorage.setItem(k, text);
    return true;
  } catch (_) { return false; }
}
// Settings menu values: difficulty id, camera sensitivity (1 = normal), invert camera up/down, music and sound 0..100
const SETTINGS = Object.assign(
  { difficulty: 'normal', sens: 1, invertY: false, music: 70, sfx: 70, graphics:'auto', shake:70 },
  loadJSON(DATA.meta.settingsKey),
);
// weapons found so far, the equipped weapon and finished chapters
const UNLOCKS = Object.assign({ weapons: [], weapon: 'emberfang', done: [] }, loadJSON(DATA.meta.unlockKey));
for (const key of ['weapons', 'done'])
  UNLOCKS[key] = Array.isArray(UNLOCKS[key]) ? [...new Set(UNLOCKS[key].filter(x => typeof x === 'string'))] : [];
for (const [key, lo, hi, fallback] of [['sens', 0.3, 2.5, 1], ['music', 0, 100, 70], ['sfx', 0, 100, 70], ['shake', 0, 100, 70]])
  SETTINGS[key] = typeof SETTINGS[key] === 'number' && Number.isFinite(SETTINGS[key]) ? clamp(SETTINGS[key], lo, hi) : fallback;
if (!DATA.difficulty[SETTINGS.difficulty]) SETTINGS.difficulty = 'normal';
// graphics: Automatic (High on computers, Low on phones; drops itself if frames run slow), High detail, Performance.
// Saves from 1.4 stored gfx 'low' as a choice on computers: keep it as Performance.
if (!['auto', 'smooth', 'detail'].includes(SETTINGS.graphics)) SETTINGS.graphics = SETTINGS.gfx === 'low' && !COARSE ? 'smooth' : 'auto';
const gfxFor = mode => (mode === 'detail' ? 'high' : mode === 'smooth' ? 'low' : COARSE ? 'low' : 'high');
SETTINGS.invertY = SETTINGS.invertY === true;
for (const id in DATA.weapons) if (DATA.weapons[id].start && UNLOCKS.weapons.indexOf(id) < 0) UNLOCKS.weapons.push(id);
const DIFF = () => DATA.difficulty[SETTINGS.difficulty] || DATA.difficulty.normal;
function saveSettings() {
  saveJSON(DATA.meta.settingsKey, SETTINGS);
}
function saveUnlocks() {
  saveJSON(DATA.meta.unlockKey, UNLOCKS);
}

/* ---------- input ---------- */
const In = { mx: 0, my: 0, cdx: 0, cdy: 0, held: {}, q: [], camIdle: 9, tmx: 0, tmy: 0 };
const heldSources = new Map();
function press(a, source = 'script') {
  if (!heldSources.has(a)) heldSources.set(a, new Set());
  heldSources.get(a).add(source);
  if (In.q.length < 32) In.q.push(a);
  In.held[a] = true;
}
function release(a, source = 'script') {
  const sources = heldSources.get(a);
  if (sources) sources.delete(source);
  In.held[a] = !!(sources && sources.size);
}
function resetInput() {
  heldSources.clear();
  for (const k in keys) keys[k] = false;
  for (const k in In.held) In.held[k] = false;
  In.q.length = 0;
  In.mx = In.my = In.tmx = In.tmy = In.cdx = In.cdy = 0;
  pad.mx = pad.my = pad.cx = pad.cy = 0;
  padAct.fill(null);
  dragging = false;
  if (window.__game) {
    P.buf = null;
    // Losing focus or opening a menu cancels a held charge; it must not be
    // interpreted as an intentional release attack on the next play frame.
    if (P.st === 'charge') { P.st = 'move'; P.f = 0; }
  }
  dispatchEvent(new Event('gameinputreset'));
}
const KEY = {
  KeyJ: 'light',
  KeyK: 'heavy',
  Space: 'jump',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyL: 'dash',
  KeyQ: 'lock',
  Digit1: 's1',
  Digit2: 's2',
  KeyU: 's1',
  KeyI: 's2',
  KeyF: 'heart',
  KeyR: 'swap',
  KeyV: 'fly',
  KeyT: 'style',
  KeyE: 'use',
  KeyG: 'buddy',
  KeyN: 'map',
  Tab: 'map',
  KeyC: 'down',
  ControlLeft: 'down',
};
const keys = {};
addEventListener('keydown', e => {
  const inMenu = G.mode !== 'play' || G.paused || !$('panel').hidden;
  if (!inMenu && /^(Arrow|Space)/.test(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (!inMenu) keys[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (!$('panel').hidden) { closePanel(); return; }
    togglePause();
    return;
  }
  if (e.code === 'Enter' && inMenu) {
    // Native focused controls handle Enter. Never launch a new game behind a panel.
    if (!$('panel').hidden || e.target.closest?.('button,input,select,a')) return;
    e.preventDefault();
    (!$('contBtn').hidden ? $('contBtn') : $('startBtn')).click();
    return;
  }
  if (inMenu) return;
  const a = KEY[e.code];
  if (a && G.mode === 'play' && !G.paused) {
    press(a, 'key:' + e.code);
    e.preventDefault();
  }
});
addEventListener('keyup', e => {
  keys[e.code] = false;
  const a = KEY[e.code];
  if (a) release(a, 'key:' + e.code);
});
addEventListener('blur', resetInput);

let dragging = false;
const MB = ['light', 'lock', 'heavy'];
canvas.addEventListener('mousedown', e => {
  if (G.mode !== 'play' || G.paused || G.cine) return; // clicks during a conversation are handled by the dialogue
  canvas.focus();
  if (document.pointerLockElement !== canvas) {
    dragging = true;
    try {
      const p = canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }
  const a = MB[e.button];
  if (a) press(a, 'mouse:' + e.button);
  e.preventDefault();
});
addEventListener('mouseup', e => {
  dragging = false;
  const a = MB[e.button];
  if (a) release(a, 'mouse:' + e.button);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas || dragging) {
    In.cdx += e.movementX || 0;
    In.cdy += e.movementY || 0;
  }
});
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && G.mode === 'play' && !G.paused && wasLocked) togglePause();
  wasLocked = document.pointerLockElement === canvas;
});
let wasLocked = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resetInput();
    if (G.mode === 'play' && !G.paused) togglePause();
  }
});

/* touch */
let touchOn = false;
function enableTouch() {
  if (touchOn) return;
  touchOn = true;
  $('touch').hidden = false;
  document.body.classList.add('touch');
  $('skills').hidden = true;
  $('pauseBtn').style.right = '124px';
}
addEventListener(
  'pointerdown',
  e => {
    if (e.pointerType === 'touch') enableTouch();
  },
  true,
);
(function () {
  const sz = $('stickZone'),
    cz = $('camZone'),
    stick = $('stick'),
    knob = $('knob');
  let sid = null,
    ox = 0,
    oy = 0,
    cid = null,
    lx = 0,
    ly = 0;
  sz.addEventListener('pointerdown', e => {
    if (sid !== null || G.mode !== 'play' || G.paused || G.cine) return;
    sid = e.pointerId;
    ox = e.clientX;
    oy = e.clientY;
    const r = sz.getBoundingClientRect();
    stick.style.left = ox - r.left + 'px';
    stick.style.top = oy - r.top + 'px';
    stick.style.bottom = 'auto';
    try {
      sz.setPointerCapture(sid);
    } catch (_) {}
  });
  sz.addEventListener('pointermove', e => {
    if (e.pointerId !== sid) return;
    let dx = (e.clientX - ox) / 46,
      dy = (e.clientY - oy) / 46;
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    In.tmx = dx;
    In.tmy = dy;
    knob.style.transform = `translate(${dx * 30}px,${dy * 30}px)`;
  });
  const sEnd = e => {
    if (e.pointerId !== sid) return;
    sid = null;
    In.tmx = In.tmy = 0;
    knob.style.transform = '';
  };
  sz.addEventListener('pointerup', sEnd);
  sz.addEventListener('pointercancel', sEnd);
  sz.addEventListener('lostpointercapture', sEnd);
  cz.addEventListener('pointerdown', e => {
    if (cid !== null || G.mode !== 'play' || G.paused || G.cine) return;
    cid = e.pointerId;
    lx = e.clientX;
    ly = e.clientY;
    try {
      cz.setPointerCapture(cid);
    } catch (_) {}
  });
  cz.addEventListener('pointermove', e => {
    if (e.pointerId !== cid) return;
    In.cdx += (e.clientX - lx) * 2.2;
    In.cdy += (e.clientY - ly) * 2.2;
    lx = e.clientX;
    ly = e.clientY;
  });
  const cEnd = e => {
    if (e.pointerId === cid) cid = null;
  };
  cz.addEventListener('pointerup', cEnd);
  cz.addEventListener('pointercancel', cEnd);
  cz.addEventListener('lostpointercapture', cEnd);
  addEventListener('gameinputreset', () => {
    sid = cid = null;
    knob.style.transform = '';
    document.querySelectorAll('.tb.dn').forEach(b => b.classList.remove('dn'));
  });
  document.querySelectorAll('.tb').forEach(b => {
    const a = b.dataset.a;
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      b.classList.add('dn');
      if (G.mode === 'play' && !G.paused) press(a, 'touch:' + a);
      try {
        b.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    const up = () => {
      b.classList.remove('dn');
      release(a, 'touch:' + a);
    };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
})();

/* gamepad */
const pad = { mx: 0, my: 0, cx: 0, cy: 0 },
  padPrev = [],
  padAct = [];
function pollPad() {
  let gp = null;
  try {
    const l = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of l)
      if (g && g.connected) {
        gp = g;
        break;
      }
  } catch (_) {}
  if (!gp) {
    pad.mx = pad.my = pad.cx = pad.cy = 0;
    padAct.forEach((a, i) => { if (a) release(a, 'pad:' + i); });
    padAct.length = padPrev.length = 0;
    return;
  }
  const dz = v => (!Number.isFinite(v) || Math.abs(v) < 0.2 ? 0 : clamp(v, -1, 1)),
    b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  pad.mx = dz(gp.axes[0]);
  pad.my = dz(gp.axes[1]);
  pad.cx = dz(gp.axes[2]);
  pad.cy = dz(gp.axes[3]);
  const lb = b(4);
  const map = [
    [0, 'jump'],
    [1, 'dash'],
    [7, 'dash'],
    [2, lb ? 's1' : 'light'],
    [3, lb ? 's2' : 'heavy'],
    [11, 'lock'],
    [5, lb ? 'heart' : null],
    [9, 'pause'],
    [15, 'swap'],
    [12, 'fly'],
    [14, 'style'],
    [13, 'use'],
    [8, 'map'],
    [10, 'buddy'],
    [6, 'down'],
  ];
  for (const [i, a] of map) {
    const now = b(i);
    if (now && !padPrev[i]) {
      if (a === 'pause') togglePause();
      else if (G.mode !== 'play' || G.paused || !$('panel').hidden) {
        if (window.navigatePadMenu) navigatePadMenu(i);
      } else if (a) {
        press(a, 'pad:' + i);
        padAct[i] = a;
      }
    }
    if (!now && padPrev[i] && padAct[i]) {
      release(padAct[i], 'pad:' + i);
      padAct[i] = null;
    }
    padPrev[i] = now;
  }
}
function readMove() {
  let x = pad.mx + In.tmx,
    y = pad.my + In.tmy;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;
  const l = Math.hypot(x, y);
  if (l > 1) {
    x /= l;
    y /= l;
  }
  In.mx = x;
  In.my = y;
}

/* ---------- audio (synthesised) ---------- */
const Snd = {
  ctx: null,
  nb: null,
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      const n = this.ctx.sampleRate * 0.5;
      this.nb = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.nb.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.5 * (SETTINGS.sfx / 70);
      this.out.connect(this.ctx.destination);
    } catch (_) {
      this.ctx = null;
    }
  },
  setVolume() {
    if (this.out) this.out.gain.value = 0.5 * (SETTINGS.sfx / 70);
  },
  tone(f, d, type, v, f2) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + d + 0.02);
  },
  noise(d, v, f1, f2, q) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime,
      s = c.createBufferSource(),
      fl = c.createBiquadFilter(),
      g = c.createGain();
    s.buffer = this.nb;
    fl.type = 'bandpass';
    fl.Q.value = q || 1.2;
    fl.frequency.setValueAtTime(f1, t);
    fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(fl);
    fl.connect(g);
    g.connect(this.out);
    s.start(t);
    s.stop(t + d + 0.02);
  },
};
function sfx(n, p) {
  if (!Snd.ctx) return;
  p = p || 0;
  switch (n) {
    case 'swing':
      Snd.noise(0.13, 0.22, 700 + p * 180, 3200 + p * 300, 1.5);
      break;
    case 'hit':
      Snd.noise(0.09, 0.35, 2400, 500, 0.8);
      Snd.tone(190 + p * 25, 0.08, 'square', 0.12, 90);
      break;
    case 'heavy':
      Snd.noise(0.2, 0.45, 1800, 200, 0.7);
      Snd.tone(120, 0.18, 'square', 0.2, 50);
      break;
    case 'dash':
      Snd.noise(0.22, 0.25, 400, 2600, 0.9);
      break;
    case 'jump':
      Snd.tone(320, 0.12, 'sine', 0.14, 620);
      break;
    case 'perfect':
      Snd.tone(880, 0.25, 'sine', 0.2);
      Snd.tone(1320, 0.35, 'sine', 0.16);
      break;
    case 'hurt':
      Snd.tone(260, 0.2, 'sawtooth', 0.18, 110);
      break;
    case 'clang':
      Snd.tone(1400, 0.12, 'triangle', 0.2, 900);
      break;
    case 'slam':
      Snd.tone(70, 0.5, 'sine', 0.5, 30);
      Snd.noise(0.4, 0.4, 600, 80, 0.6);
      break;
    case 'break':
      Snd.tone(1800, 0.3, 'triangle', 0.22, 500);
      Snd.noise(0.3, 0.3, 5000, 1500, 2);
      break;
    case 'heart':
      Snd.tone(220, 0.6, 'sawtooth', 0.16, 880);
      Snd.tone(440, 0.7, 'sine', 0.2, 1320);
      break;
    case 'fire':
      Snd.noise(0.5, 0.3, 300, 1400, 0.6);
      break;
    case 'pop':
      Snd.tone(500, 0.12, 'sine', 0.15, 180);
      break;
    case 'rank':
      Snd.tone(660 + p * 110, 0.12, 'triangle', 0.16, 990 + p * 110);
      Snd.tone(990 + p * 110, 0.2, 'sine', 0.12);
      break;
    case 'pickup':
      Snd.tone(784, 0.1, 'triangle', 0.16);
      setTimeout(() => Snd.tone(1175, 0.18, 'triangle', 0.14), 70);
      break;
    case 'roar':
      Snd.tone(90, 0.9, 'sawtooth', 0.22, 45);
      Snd.noise(0.9, 0.35, 300, 90, 0.5);
      break;
    case 'bark':
      Snd.tone(620, 0.07, 'square', 0.08, 380);
      setTimeout(() => Snd.tone(640, 0.08, 'square', 0.07, 400), 110);
      break;
    case 'snow':
      Snd.noise(0.25, 0.3, 3000, 900, 1.2);
      break;
    case 'dig':
      Snd.noise(0.3, 0.25, 260, 120, 0.8);
      break;
    case 'gem':
      Snd.tone(1320 + Math.random() * 200, 0.08, 'sine', 0.08);
      break;
    case 'craft':
      Snd.tone(392, 0.15, 'square', 0.12);
      setTimeout(() => Snd.tone(784, 0.12, 'square', 0.1), 90);
      setTimeout(() => Snd.tone(1175, 0.3, 'triangle', 0.14), 180);
      Snd.noise(0.25, 0.25, 3000, 500, 1);
      break;
    case 'shot':
      if (p === 0) Snd.tone(700, 0.06, 'square', 0.06, 300);
      else if (p === 1) Snd.noise(0.15, 0.2, 2500, 6000, 2);
      else Snd.tone(180, 0.18, 'sine', 0.2, 90);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Snd.tone(f, 0.4, 'triangle', 0.2), i * 130));
      break;
  }
}
