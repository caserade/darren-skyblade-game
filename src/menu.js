/* MENU: the title screen (Story / Adventure modes and the chapter picker) and the SKYFORGE HANGAR panel:
   Loadout (combat style, R-arm and L-arm weapons, armor), Forge (craft from parts), Parts, Contracts and Map
   (Cloud Utopia), Moves and Settings. Opened from the title screen, the pause menu, the Skyforge (E) or N (map). */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/* ---------- title: game mode and chapter ---------- */
document.querySelectorAll('#modePick .mode').forEach(b =>
  b.addEventListener('click', () => {
    if (G.mode !== 'title' && G.mode !== 'win') return;
    const adv = b.dataset.mode === 'adventure';
    if (adv === isAdventure()) return;
    const id = adv
      ? DATA.adventure.id
      : UNLOCKS.lastChapter && UNLOCKS.lastChapter !== DATA.adventure.id
        ? UNLOCKS.lastChapter
        : DATA.chapters[0].id;
    loadChapter(id);
    UNLOCKS.lastChapter = id;
    saveUnlocks();
    showTitle();
  }),
);
function buildChapterPicker() {
  const box = $('chapPick');
  box.innerHTML = '';
  for (const c of DATA.chapters) {
    const b = document.createElement('button'),
      parts = c.name.split(':'),
      done = UNLOCKS.done.indexOf(c.id) >= 0;
    b.type = 'button';
    b.innerHTML = '<b></b><span></span>';
    b.firstChild.textContent = parts[0] + (done ? ' ✓' : '');
    b.lastChild.textContent = (parts[1] || '').trim();
    b.classList.toggle('on', c.id === CH.id);
    b.setAttribute('aria-pressed', c.id === CH.id);
    b.addEventListener('click', () => {
      if ((G.mode !== 'title' && G.mode !== 'win') || (c.id === CH.id && G.mode === 'title')) return;
      loadChapter(c.id);
      UNLOCKS.lastChapter = c.id;
      saveUnlocks();
      showTitle();
    });
    box.appendChild(b);
  }
}
// called whenever the menu card is shown (title, pause, game over, chapter end)
function menuShown() {
  const title = G.mode === 'title',
    pick = title || G.mode === 'win';
  $('modePick').hidden = !pick;
  document.querySelectorAll('#modePick .mode').forEach(b => {
    const on = (b.dataset.mode === 'adventure') === isAdventure();
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('chapPick').hidden = !pick || isAdventure() || DATA.chapters.length < 2;
  if (pick) buildChapterPicker();
  $('optBtn').hidden = !(title || G.paused || G.mode === 'win' || G.mode === 'over');
  $('quitBtn').hidden = !(G.paused || G.mode === 'over' || G.mode === 'win');
}

/* ---------- the Hangar ---------- */
const TABS = [
  ['loadout', 'Loadout'],
  ['forge', 'Forge'],
  ['parts', 'Parts'],
  ['contracts', 'Contracts'],
  ['map', 'Map'],
  ['moves', 'Moves'],
  ['settings', 'Settings'],
];
let panelTab = 'loadout',
  mapTimer = 0;
function openPanel(tab) {
  panelTab = tab || panelTab;
  $('panel').hidden = false;
  const nav = $('ptabs');
  nav.innerHTML = '';
  for (const [id, name] of TABS) {
    const b = el('button', 'ptab' + (id === panelTab ? ' on' : ''), name);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', id === panelTab);
    b.addEventListener('click', () => openPanel(id));
    nav.appendChild(b);
  }
  clearInterval(mapTimer);
  const box = $('pBody');
  box.innerHTML = '';
  box.scrollTop = 0;
  ({
    loadout: fillLoadout,
    forge: fillForge,
    parts: fillParts,
    contracts: fillContracts,
    map: fillMap,
    moves: fillMoves,
    settings: fillSettings,
  })[panelTab](box);
}
function closePanel() {
  $('panel').hidden = true;
  clearInterval(mapTimer);
}
$('panelClose').addEventListener('click', closePanel);
$('optBtn').addEventListener('click', () => openPanel());
addEventListener(
  'keydown',
  e => {
    if (
      !$('panel').hidden &&
      (e.code === 'Escape' || ((e.code === 'KeyN' || e.code === 'Tab') && panelTab === 'map'))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closePanel();
      if (G.mode === 'play' && G.paused) togglePause();
    }
  },
  true,
);

function section(box, title, note) {
  const s = el('section', 'psec');
  s.appendChild(el('h4', '', title));
  if (note) s.appendChild(el('p', 'hint', note));
  box.appendChild(s);
  return s;
}
function statLine(o) {
  const parts = [];
  if (o.hp) parts.push('+' + o.hp + ' HP');
  if (o.def) parts.push('+' + Math.round(o.def * 100) + '% block');
  if (o.speed) parts.push('+' + Math.round(o.speed * 100) + '% speed');
  if (o.stam) parts.push('+' + Math.round(o.stam * 100) + '% stamina');
  if (o.flight) parts.push('+' + o.flight + ' flight');
  if (o.power) parts.push('+' + Math.round(o.power * 100) + '% damage');
  return parts.join(' · ');
}
function weaponStats(W) {
  const k = W.kind || 'blade';
  if (k !== 'blade') {
    const S = W.shot;
    return `${k.toUpperCase()} · DMG ${S.dmg} · ${S.pierce ? 'PIERCE · ' : ''}${S.splash ? 'SPLASH ' + S.splash + 'm · ' : ''}${Math.round(60 / S.rate)} shots/s`;
  }
  return `BLADE · SPD ${Math.round(W.speed * 100)} · PWR ${Math.round(W.power * 100)} · RCH ${Math.round(W.reach * 100)} · ${(ATK[W.finisher] || {}).label || ''}`;
}
function swatch(color) {
  const s = el('span', 'sw');
  s.style.background = color;
  return s;
}

/* Loadout: style, arms, armor */
function fillLoadout(box) {
  const E = UNLOCKS.equip,
    st = gearStats();
  // combat style
  const s1 = section(
    box,
    'Combat style',
    'Classic: Slash strings with Heavy branches and weapon finishers. Twin Arms: a weapon in each arm, R-arm on Slash, L-arm on Heavy (guns, bows and mortars shoot). Switch in play with T.',
  );
  const seg = el('div', 'seg');
  for (const [id, name] of [
    ['classic', 'Classic Combos'],
    ['twin', 'Twin Arms'],
  ]) {
    const b = el('button', UNLOCKS.style === id ? 'on' : '', name);
    b.type = 'button';
    b.addEventListener('click', () => {
      setStyle(id, false);
      openPanel('loadout');
    });
    seg.appendChild(b);
  }
  s1.appendChild(seg);
  // arms
  const s2 = section(
    box,
    'Arms',
    UNLOCKS.style === 'twin'
      ? 'Pick a weapon for each arm.'
      : 'Classic swings your R-arm blade (or the L-arm one if R holds a gun).',
  );
  for (const side of ['R', 'L']) {
    const row = el('div', 'slot');
    row.appendChild(el('span', 'slab', side + '-ARM'));
    const list = el('div', 'opts');
    if (side === 'L') {
      const b = el('button', 'opt' + (!E.L ? ' on' : ''), 'Empty');
      b.type = 'button';
      b.addEventListener('click', () => {
        setLoadout('L', null);
        openPanel('loadout');
      });
      list.appendChild(b);
    }
    for (const id in WEAPONS) {
      if (UNLOCKS.weapons.indexOf(id) < 0) continue;
      const W = WEAPONS[id],
        b = el('button', 'opt' + (E[side] === id ? ' on' : ''));
      b.type = 'button';
      b.appendChild(swatch(W.color));
      b.appendChild(el('span', '', W.name));
      b.title = weaponStats(W);
      b.addEventListener('click', () => {
        if (side === 'L' && E.R === id) E.R = E.L || 'emberfang';
        if (side === 'R' && E.L === id) E.L = E.R;
        setLoadout(side, id);
        openPanel('loadout');
      });
      list.appendChild(b);
    }
    row.appendChild(list);
    const cur = WEAPONS[E[side]];
    row.appendChild(el('span', 'sinfo', cur ? weaponStats(cur) : 'No weapon: Heavy does Classic heavy moves'));
    s2.appendChild(row);
  }
  // armor
  const s3 = section(box, 'Armor', 'Craft armor in the Forge. Wearing all four pieces of one set gives its set bonus.');
  for (const slot of SLOTS) {
    const row = el('div', 'slot');
    row.appendChild(el('span', 'slab', slot.toUpperCase()));
    const list = el('div', 'opts'),
      none = el('button', 'opt' + (!E[slot] ? ' on' : ''), 'None');
    none.type = 'button';
    none.addEventListener('click', () => {
      setLoadout(slot, null);
      openPanel('loadout');
    });
    list.appendChild(none);
    let any = false;
    for (const id in ARMOR) {
      const a = ARMOR[id];
      if (a.slot !== slot || UNLOCKS.armor.indexOf(id) < 0) continue;
      any = true;
      const b = el('button', 'opt' + (E[slot] === id ? ' on' : ''));
      b.type = 'button';
      b.appendChild(swatch((SETS[a.set] || {}).color || '#ccc'));
      b.appendChild(el('span', '', a.name));
      b.title = statLine(a);
      b.addEventListener('click', () => {
        setLoadout(slot, id);
        openPanel('loadout');
      });
      list.appendChild(b);
    }
    row.appendChild(list);
    const cur = ARMOR[E[slot]];
    row.appendChild(el('span', 'sinfo', cur ? statLine(cur) : any ? '' : 'Nothing crafted for this slot yet'));
    s3.appendChild(row);
  }
  // totals
  const s4 = section(box, 'Darren');
  const grid = el('div', 'readout');
  for (const [k, v] of [
    ['HP', TUNE.maxHp],
    ['BLOCK', Math.round(st.def * 100) + '%'],
    ['SPEED', Math.round((1 + st.speed) * 100) + '%'],
    ['STAMINA', Math.round((1 + st.stam) * 100) + '%'],
    ['FLIGHT', flightMax()],
    ['DAMAGE', Math.round((1 + st.power) * 100) + '%'],
  ]) {
    const c = el('div', 'ro');
    c.appendChild(el('small', '', k));
    c.appendChild(el('b', '', String(v)));
    grid.appendChild(c);
  }
  s4.appendChild(grid);
  if (st.bonus.length) s4.appendChild(el('p', 'bonus', 'Set bonus · ' + st.bonus.join(' · ')));
}

/* Forge: craft weapons and armor from parts */
function recipeChips(r) {
  const w = el('div', 'chips');
  for (const p in r) {
    const have = partCount(p),
      c = el('span', 'chip' + (have >= r[p] ? ' ok' : ''));
    c.appendChild(swatch(PARTS[p].color));
    c.appendChild(el('span', '', PARTS[p].name + ' ' + have + '/' + r[p]));
    w.appendChild(c);
  }
  return w;
}
function forgeCard(id, def, sub) {
  const got = owned(id),
    card = el('div', 'fcard' + (got ? ' got' : canCraft(id) ? ' ready' : ''));
  const head = el('div', 'fhead');
  head.appendChild(swatch(def.color || (SETS[def.set] || {}).color || '#ccc'));
  head.appendChild(el('b', '', def.name));
  head.appendChild(el('span', 'ftag', sub));
  card.appendChild(head);
  if (def.text) card.appendChild(el('p', 'ftext', def.text));
  card.appendChild(el('p', 'fstat', WEAPONS[id] ? weaponStats(def) : statLine(def)));
  if (def.recipe) card.appendChild(recipeChips(def.recipe));
  const b = el(
    'button',
    'craft',
    got ? 'Owned' : canCraft(id) ? 'Forge it' : def.recipe ? 'Need more parts' : 'Found in the story',
  );
  b.type = 'button';
  b.disabled = got || !canCraft(id);
  b.addEventListener('click', () => {
    if (craft(id)) {
      banner('Forged: ' + def.name, ARMOR[id] ? 'Equip it in Loadout' : 'Equip it in Loadout or press R', 130);
      openPanel('forge');
    }
  });
  card.appendChild(b);
  return card;
}
let forgeFilter = 'weapons';
function fillForge(box) {
  const s = section(
    box,
    'Skyforge',
    'Bring parts back from enemies and crystals. Everything you forge is kept for every mode.',
  );
  const seg = el('div', 'seg');
  for (const [id, name] of [
    ['weapons', 'Weapons'],
    ['armor', 'Armor'],
  ]) {
    const b = el('button', forgeFilter === id ? 'on' : '', name);
    b.type = 'button';
    b.addEventListener('click', () => {
      forgeFilter = id;
      openPanel('forge');
    });
    seg.appendChild(b);
  }
  s.appendChild(seg);
  const grid = el('div', 'fgrid');
  if (forgeFilter === 'weapons') {
    for (const id in WEAPONS)
      if (WEAPONS[id].recipe || owned(id))
        grid.appendChild(forgeCard(id, WEAPONS[id], (WEAPONS[id].kind || 'blade').toUpperCase()));
  } else {
    for (const set in SETS) {
      grid.appendChild(el('h5', 'fset', SETS[set].name + ' set · ' + SETS[set].bonusText));
      for (const id in ARMOR)
        if (ARMOR[id].set === set) grid.appendChild(forgeCard(id, ARMOR[id], ARMOR[id].slot.toUpperCase()));
    }
  }
  box.appendChild(grid);
}

/* Parts bag */
function fillParts(box) {
  const s = section(
    box,
    'Parts bag',
    'Beat enemies, break boss crystals and mine resource crystals. Elites always drop a Crown Shard.',
  );
  const grid = el('div', 'pgrid');
  for (const id in PARTS) {
    const p = PARTS[id],
      c = el('div', 'pcell' + (partCount(id) ? '' : ' none'));
    c.appendChild(swatch(p.color));
    const t = el('div');
    t.appendChild(el('b', '', p.name));
    t.appendChild(el('small', '', p.where));
    c.appendChild(t);
    c.appendChild(el('span', 'pn', '×' + partCount(id)));
    grid.appendChild(c);
  }
  s.appendChild(grid);
}

/* Contracts (Cloud Utopia) */
function fillContracts(box) {
  const A = DATA.adventure,
    C = UNLOCKS.contracts;
  const s = section(
    box,
    'Contracts',
    'Take up to three at once. Progress counts in Adventure: Cloud Utopia. Rewards go straight into your parts bag.',
  );
  for (const c of A.contracts) {
    const active = C.active.indexOf(c.id) >= 0,
      done = C.done[c.id] || 0,
      card = el('div', 'ccard' + (active ? ' on' : ''));
    const head = el('div', 'fhead');
    head.appendChild(el('b', '', c.name));
    head.appendChild(el('span', 'danger', '★'.repeat(c.danger) + '☆'.repeat(5 - c.danger)));
    card.appendChild(head);
    card.appendChild(el('p', 'ftext', c.text));
    const goal =
      c.type === 'hunt'
        ? 'Defeat ' +
          c.count +
          ' ' +
          (c.target === 'elite' ? 'Elites' : c.target === 'any' ? 'enemies' : EDEF[c.target].name + 's')
        : c.type === 'harvest'
          ? 'Collect ' + c.count + ' ' + PARTS[c.target].name
          : c.type === 'explore'
            ? c.target === 'any'
              ? 'Light ' + c.count + ' waystones'
              : 'Light the waystone on ' + A.level.islands.find(i => i.id === c.target).name
            : 'Defeat the Titanic Scion';
    card.appendChild(
      el(
        'p',
        'fstat',
        goal +
          (active ? ' · ' + Math.min(c.count, C.prog[c.id] || 0) + '/' + c.count : '') +
          (done ? ' · done ×' + done : ''),
      ),
    );
    const rw = el('div', 'chips');
    for (const p in c.reward) {
      const ch = el('span', 'chip ok');
      ch.appendChild(swatch(PARTS[p].color));
      ch.appendChild(el('span', '', '+' + c.reward[p] + ' ' + PARTS[p].name));
      rw.appendChild(ch);
    }
    card.appendChild(rw);
    const b = el(
      'button',
      'craft',
      active
        ? 'Abandon'
        : contractAvailable(c)
          ? C.active.length >= 3
            ? 'Three already taken'
            : 'Take contract'
          : 'Completed',
    );
    b.type = 'button';
    b.disabled = !active && (!contractAvailable(c) || C.active.length >= 3);
    b.addEventListener('click', () => {
      if (active) abandonContract(c.id);
      else acceptContract(c.id);
      openPanel('contracts');
    });
    card.appendChild(b);
    s.appendChild(card);
  }
}

/* Map (Cloud Utopia) */
function fillMap(box) {
  const s = section(
    box,
    'Cloud Utopia',
    isAdventure() && G.mode === 'play'
      ? 'Click a lit waystone island to fast travel. Gold rings mark where your contracts are. Skyreach Isle has no bridge: fly there.'
      : 'Lit waystones and contract targets. Fast travel works while exploring Cloud Utopia.',
  );
  const cv = el('canvas', 'map');
  s.appendChild(cv);
  const draw = () => drawMap(cv);
  requestAnimationFrame(draw);
  mapTimer = setInterval(draw, 120);
  cv.addEventListener('click', ev => {
    const id = mapClick(cv, ev);
    if (id) fastTravel(id);
  });
  s.appendChild(
    el('p', 'hint', 'Waystones lit: ' + UNLOCKS.way.length + ' / ' + Object.keys(DATA.adventure.waystones).length),
  );
}

/* Moves */
function fillMoves(box) {
  const W = WEAPONS[classicBlade()] || WEAPONS.emberfang;
  for (const [group, ids] of DATA.moveList) {
    const sec = section(box, group);
    for (let id of ids) {
      let label, input, note;
      if (id === 'DIVE') {
        label = 'Meteor Dive';
        input = 'Heavy in the air';
        note = 'Crash down and knock everything over.';
      } else if (id === 'FLY') {
        label = 'Wings';
        input = 'V / D-pad up / Fly';
        note =
          'Hold Jump to climb, C or LT to dive. Uses flight energy; attacks hover in the air. Story islands you have not unlocked are guarded by storm winds.';
      } else {
        if (id === 'FIN') id = W.finisher;
        const A = ATK[id];
        if (!A) continue;
        label = A.label || id;
        input = A.input || '';
        note = [
          A.launch && 'launches',
          A.kd && 'knocks down',
          A.wave && 'shockwave',
          A.spike && 'spikes down',
          A.heal && 'heals you',
          A.multi && 'multi-hit',
          A.shot && 'uses the arm weapon’s shots',
        ]
          .filter(Boolean)
          .join(' · ');
      }
      const r = el('div', 'mv' + (ATK[id] && ATK[id].finisher ? ' fin' : ''));
      r.appendChild(el('b', '', label));
      r.appendChild(el('i', '', input));
      if (note) r.appendChild(el('small', '', note));
      sec.appendChild(r);
    }
  }
  box.appendChild(
    el(
      'p',
      'hint',
      'Mixing different moves raises your Style rank (D to S). Higher ranks fill Dragon Heart faster; getting hit drops a rank. Lock on to a boss (Q) and press Q again to focus a weak spot.',
    ),
  );
}

/* Settings */
function fillSettings(box) {
  const d = section(box, 'Difficulty');
  const seg = el('div', 'seg');
  for (const id in DATA.difficulty) {
    const b = el('button', SETTINGS.difficulty === id ? 'on' : '', DATA.difficulty[id].name);
    b.type = 'button';
    b.addEventListener('click', () => {
      SETTINGS.difficulty = id;
      saveSettings();
      openPanel('settings');
    });
    seg.appendChild(b);
  }
  d.appendChild(seg);
  const D = DIFF();
  d.appendChild(
    el(
      'span',
      'hint',
      `Enemies hit ${Math.round(D.damage * 100)}% as hard, have ${Math.round(D.hp * 100)}% health, and up to ${D.attackers} attack at once.`,
    ),
  );
  const gx = section(
    box,
    'Graphics',
    'High: bloom, filmic colour, dense grass and soft shadows. Low: faster, for phones and older computers. Grass density changes when the next level loads.',
  );
  const gseg = el('div', 'seg');
  for (const [id, name] of [
    ['high', 'High'],
    ['low', 'Low'],
  ]) {
    const b = el('button', SETTINGS.gfx === id ? 'on' : '', name);
    b.type = 'button';
    b.addEventListener('click', () => {
      SETTINGS.gfx = id;
      saveSettings();
      setGfx(id);
      openPanel('settings');
    });
    gseg.appendChild(b);
  }
  gx.appendChild(gseg);
  const s = section(box, 'Camera and sound');
  const slider = (label, key, min, max, step, fmt, apply) => {
    const r = el('div', 'srow'),
      l = el('label'),
      v = el('span', '', fmt(SETTINGS[key])),
      inp = document.createElement('input');
    l.appendChild(el('span', '', label));
    l.appendChild(v);
    inp.type = 'range';
    inp.min = min;
    inp.max = max;
    inp.step = step;
    inp.value = SETTINGS[key];
    inp.setAttribute('aria-label', label);
    inp.addEventListener('input', () => {
      SETTINGS[key] = +inp.value;
      v.textContent = fmt(SETTINGS[key]);
      apply && apply();
      saveSettings();
    });
    r.appendChild(l);
    r.appendChild(inp);
    s.appendChild(r);
  };
  slider('Camera sensitivity', 'sens', 0.3, 2.5, 0.05, v => Math.round(v * 100) + '%');
  const inv = el('label', 'chk'),
    cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!SETTINGS.invertY;
  cb.addEventListener('change', () => {
    SETTINGS.invertY = cb.checked;
    saveSettings();
  });
  inv.appendChild(cb);
  inv.appendChild(el('span', '', 'Invert camera up / down'));
  s.appendChild(inv);
  slider(
    'Music volume',
    'music',
    0,
    100,
    1,
    v => v + '%',
    () => Music.fade(),
  );
  slider(
    'Sound effects volume',
    'sfx',
    0,
    100,
    1,
    v => v + '%',
    () => {
      Snd.setVolume();
      sfx('hit', 2);
    },
  );
}
menuShown();
