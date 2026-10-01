import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// FIREBASE KONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCDZ3kR-o_x3Cwg3MJpib1vuDIrqv1lddA",
  authDomain: "gaminglounge-d3082.firebaseapp.com",
  projectId: "gaminglounge-d3082",
  storageBucket: "gaminglounge-d3082.firebasestorage.app",
  messagingSenderId: "1028630964839",
  appId: "1:1028630964839:web:5f4df6107fb5c0148342c2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HIER KANNST DU DEN OWNER-NAMEN ÄNDERN:
const OWNER_NAME = "Asllan";

let currentCategory = 'coins';

// SPEICHER-DATENBANK LOGIK
const KEY = 'neonArcade2026';
const defaults = { coins: 0, xp: 0, sound: true, theme: 'neon', scores: {}, unlocked: ['theme-violet'], activeTrail: 'base', playerId: '', playerName: '', lastNameChange: 0 };
let save;
try {
  save = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  save.scores ??= {};
  save.unlocked ??= [];
} catch {
  save = { ...defaults };
}

// EIN ACCOUNT PRO GERÄT (EINDEUTIGE ID)
if (!save.playerId) {
  save.playerId = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
window.save = save;

// AUTOMATISCHES SPEICHERN IN FIREBASE (MERGED PRO GERÄT)
async function savePlayerToFirebase() {
  if (!window.save) return;
  const name = window.save.playerName || "Anonym";
  if (!name || name === "Du") return; 

  try {
    const playerRef = doc(db, "leaderboards", window.save.playerId);
    await setDoc(playerRef, {
      playerId: window.save.playerId,
      playerName: name,
      coins: window.save.coins || 0,
      xp: window.save.xp || 0,
      time: Math.floor((window.save.xp || 0) / 100)
    }, { merge: true });
  } catch (err) {
    console.error("Fehler beim Speichern in Firestore:", err);
  }
}
window.savePlayerToFirebase = savePlayerToFirebase;

// RANGLEISTEN KATEGORIE WECHSELN
function switchCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.lb-tabs button').forEach(b => b.classList.remove('active'));
  let activeBtn = document.getElementById('btn-' + cat);
  if (activeBtn) activeBtn.classList.add('active');

  const headers = { coins: "Münzen", xp: "Erfahrung (XP)", time: "Spielzeit (Std.)" };
  document.getElementById('score-header').innerText = headers[cat];
  loadLeaderboardData(cat);
}
window.switchCategory = switchCategory;

function loadLeaderboardData(category) {
  const tbody = document.getElementById('leaderboardRows');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Lade Rangliste...</td></tr>';

  const scoresRef = collection(db, "leaderboards");
  const q = query(scoresRef, orderBy(category, "desc"), limit(10));

  onSnapshot(q, (snapshot) => {
    tbody.innerHTML = "";

    // 👑 OWNER EINTRAG (#1 RANG)
    let ownerRow = document.createElement('tr');
    ownerRow.classList.add('owner-row');
    let ownerScoreText = "999'999";
    if (category === 'xp') ownerScoreText = "500'000 XP";
    if (category === 'time') ownerScoreText = "250 Std.";

    ownerRow.innerHTML = `
      <td class="rank-1">#1</td>
      <td>${OWNER_NAME} <span class="owner-badge">👑 OWNER</span></td>
      <td class="score-val">${ownerScoreText}</td>
    `;
    tbody.appendChild(ownerRow);

    let rank = 2;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.playerName !== OWNER_NAME) {
        const row = document.createElement('tr');
        let rankClass = rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";
        let scoreDisplay = data[category] || 0;
        if (category === 'xp') scoreDisplay += " XP";
        if (category === 'time') scoreDisplay += " Std.";

        row.innerHTML = `
          <td class="${rankClass}">#${rank}</td>
          <td>${data.playerName || 'Anonym'}</td>
          <td class="score-val">${scoreDisplay}</td>
        `;
        tbody.appendChild(row);
        rank++;
      }
    });

    if (snapshot.empty) {
      let emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="3" style="text-align:center;">Keine Spieler in Firestore gefunden.</td>';
      tbody.appendChild(emptyRow);
    }
  }, (error) => {
    console.error("Firebase Fehler:", error);
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ff6386;">Fehler beim Laden der Live-Daten.</td></tr>';
  });
}

function renderLeaderboard() {
  loadLeaderboardData(currentCategory);
}
window.renderLeaderboard = renderLeaderboard;

// SPIEL-HELFER UND LOGIK
const $ = s => document.querySelector(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const games = [
  ['snake', '🐍', 'Snake Flux', 'Wachse, sammle Energie und bleib im Raster.'],
  ['tetris', '🧩', 'Tetris Pulse', 'Klassischer Line-Clear mit Hold und Rotation.'],
  ['flappy', '🐦', 'Flappy Neon', 'Ein Tap, ein Flügelschlag, kein Fehler.'],
  ['space', '🚀', 'Star Defender', 'Wellen, Laser und ein sauberer Highscore.'],
  ['pong', '🏓', 'Pong Drift', 'Steuere das Paddle gegen eine adaptive KI.'],
  ['2048', '🔢', '2048 Nova', 'Wische Kacheln zusammen bis zur 2048.'],
  ['ttt', '✕', 'Tic-Tac-Toe', 'Spiele lokal oder gegen die KI.'],
  ['memory', '🧠', 'Memory Circuit', 'Finde alle Neon-Paare in Bestzeit.'],
  ['fruit', '🍉', 'Fruit Merge', 'Lass Früchte fallen und fusioniere sie.'],
  ['rhythm', '🎵', 'Beat Reactor', 'Triff die Beats genau im richtigen Moment.']
];

if ((save.scores.pong || 0) > 7) { save.scores.pong = 0; localStorage.setItem(KEY, JSON.stringify(save)); }

function persist() {
  localStorage.setItem(KEY, JSON.stringify(save));
  renderMeta();
  savePlayerToFirebase();
}

function renderMeta() {
  $('#coins').textContent = save.coins;
  $('#xp').textContent = save.xp;
  $('#level').textContent = 1 + Math.floor(save.xp / 1000);
  document.body.className = save.theme === 'neon' ? '' : 'theme-' + save.theme;
  $('#soundBtn').textContent = save.sound ? 'An' : 'Aus';
  $('#themeSelect').value = save.theme;
}

function toast(t) {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.remove('show'), 2300);
}

function sound(type = 'tap') {
  if (!save.sound || !window.AudioContext) return;
  const c = sound.c || (sound.c = new AudioContext()), o = c.createOscillator(), g = c.createGain();
  o.type = type === 'win' ? 'triangle' : 'square';
  o.frequency.value = type === 'win' ? 720 : type === 'lose' ? 110 : 420;
  g.gain.setValueAtTime(.045, c.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .1);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + .12);
}

function burst(x = innerWidth / 2, y = innerHeight / 2) {
  for (let i = 0; i < 28; i++) {
    let p = document.createElement('i');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = i % 2 ? 'var(--a)' : 'var(--b)';
    p.style.setProperty('--x', (Math.random() * 260 - 130) + 'px');
    p.style.setProperty('--y', (Math.random() * -260 + 40) + 'px');
    $('#particles').append(p);
    setTimeout(() => p.remove(), 1050);
  }
}

// UNBEGRENZT MÜNZEN VERDIENEN
function award(game, score, win = false) {
  if (roundEnded) return;
  roundEnded = true;
  save.wins ??= {};
  let old = save.scores[game] || 0, isNew = score > old, bonus = 0;
  if (isNew) {
    save.scores[game] = score;
    bonus = Math.min(8, 2 + Math.floor(Math.max(0, score) / 300));
  }
  if (win && !save.wins[game]) { save.wins[game] = true; if (!isNew) bonus += 2; }

  if (bonus) {
    save.coins += bonus;
    save.xp += bonus * 2;
    toast(`${isNew ? 'Neuer Bestwert! · ' : ''}+${bonus} Coins`);
    burst();
    sound('win');
  }
  persist();
  renderGames();
  renderShop();
  renderLeaderboard();
}

function scoreText(id) { return save.scores[id] || 0; }

function renderGames() {
  $('#games').innerHTML = games.map(([id, icon, name, desc], i) =>
    `<button class="card" style="--glow:${['#55e6ff', '#bb6cff', '#ffb257', '#ff6d91'][i \% 4]}" onclick="launch('${id}')"><div class="icon">${icon}</div><h3>${name}</h3><p>${desc}</p><footer>BESTWERT <strong>${scoreText(id)}</strong> · SPIELEN →</footer></button>`
  ).join('');
}

const items = [
  ['theme-violet', '🟣 Violett-Theme', 180, 'Häufig', 'Ein ultraviolettes Arcade-Design.'],
  ['theme-mint', '🟢 Mint-Theme', 320, 'Selten', 'Kühler Glow für Nacht-Sessions.'],
  ['theme-amber', '🟠 Amber-Theme', 520, 'Episch', 'Warmer Retro-Future Look.'],
  ['skin-orbit', '🪐 Orbit-Skin', 380, 'Selten', 'Sichtbarer violetter Holo-Look für Canvas-Spiele.'],
  ['skin-prism', '💠 Prisma-Skin', 1000, 'Legendär', 'Spektral-Look und leuchtende Konturen in Canvas-Spiele.'],
  ['trail-prism', '✨ Prism Trail', 600, 'Episch', 'Partikelregen bei neuen Bestwerten.'],
  ['sound-synth', '🔊 Synth-Sounds', 260, 'Häufig', 'Synthesizer-Klicks für Spielaktionen.'],
  ['skin-fruit', '🍇 Fruit Deluxe', 580, 'Episch', 'Leuchtender Spezial-Look für Fruit Merge.'],
  ['crosshair-cyber', '⌖ Cyber-Fadenkreuz', 300, 'Selten', 'Neon-Retikel beim Zielen im Star Defender.'],
  ['crosshair-rose', '✳ Rose-Fadenkreuz', 550, 'Episch', 'Rosafarbenes Präzisions-Retikel im Shooter.'],
  ['crosshair-gold', '✧ Gold-Fadenkreuz', 1000, 'Legendär', 'Goldenes Zielkreuz mit Außenring im Shooter.']
];

function equipped(id) { return id.startsWith('theme-') ? save.theme === id.slice(6) : id.startsWith('skin-') ? save.activeSkin === id : id.startsWith('crosshair-') ? save.activeCrosshair === id : id === 'trail-prism' ? save.activeTrail === id : id === 'sound-synth' ? save.soundStyle === id : false; }

function renderShop() {
  $('#shoplist').innerHTML = items.map(([id, n, c, rarity, d]) => {
    let got = save.unlocked.includes(id), on = got && equipped(id);
    return `<article class="panel shopitem rarity-${rarity.toLowerCase()}"><small>${rarity}</small><h3>${n}</h3><p>${d}</p><button class="buy" ${on ? 'disabled' : ''} onclick="${got ? `equip('${id}')` : `buy('${id}',${c})`}">${on ? 'Ausgerüstet' : got ? 'Ausrüsten' : '◈ ' + c + ' kaufen'}</button></article>`;
  }).join('');
}

function buy(id, c) {
  if (save.unlocked.includes(id)) return equip(id);
  if (save.coins < c) return toast('Dafür fehlen noch Münzen.');
  save.coins -= c;
  save.unlocked.push(id);
  equip(id, true);
}
window.buy = buy;

function equip(id, newPurchase = false) {
  if (!save.unlocked.includes(id)) return;
  let field = id.startsWith('theme-') ? 'theme' : id.startsWith('skin-') ? 'activeSkin' : id.startsWith('crosshair-') ? 'activeCrosshair' : id === 'trail-prism' ? 'activeTrail' : 'soundStyle';
  save[field] = id.startsWith('theme-') ? id.slice(6) : id;
  toast(newPurchase ? 'Gekauft und ausgerüstet!' : 'Item ausgerüstet.');
  persist();
  renderShop();
}
window.equip = equip;

document.querySelectorAll('.tab').forEach(b => b.onclick = () => showView(b.dataset.view));

function showView(v) {
  if (v !== 'game' && active && $('#game').classList.contains('active')) quitGame(); else stop();
  $('.modal').classList.remove('show');
  document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === v));
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.view === v));
  if (v === 'hub') renderGames();
  if (v === 'shop') renderShop();
  if (v === 'settings') renderMeta();
  if (v === 'leaderboard') renderLeaderboard();
  window.scrollTo(0, 0);
}
window.showView = showView;

function quitGame() { stop(); active = ''; $('#modal').classList.remove('show'); showView('hub'); }

$('#soundBtn').onclick = () => { save.sound = !save.sound; persist(); };
$('#themeSelect').onchange = e => {
  let t = e.target.value;
  if (t !== 'neon' && !save.unlocked.includes('theme-' + t)) {
    toast('Dieses Theme zuerst im Shop freischalten.');
    e.target.value = save.theme;
    return;
  }
  save.theme = t;
  persist();
};
$('#reset').onclick = () => {
  if (confirm('Wirklich alle lokalen Fortschritte löschen?')) {
    save = { ...defaults, scores: {}, unlocked: ['theme-violet'] };
    persist();
    renderGames();
    toast('Fortschritt zurückgesetzt.');
  }
};

// 7-TAGE SPERRE FÜR DEN SPIELERNAME & SOFORTIGES SPEICHERN BEIM BEENDEN DER EINGABE / ENTER
const pInput = $('#playerName');
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function updateNameInputUI() {
  if (!pInput) return;
  pInput.value = save.playerName || '';
  const now = Date.now();
  const timePassed = now - (save.lastNameChange || 0);
  const nameHint = $('#nameChangeHint');

  if (save.playerName && timePassed < SEVEN_DAYS) {
    const daysLeft = Math.ceil((SEVEN_DAYS - timePassed) / (1000 * 60 * 60 * 24));
    pInput.disabled = true;
    pInput.style.opacity = '0.5';
    if (nameHint) nameHint.textContent = `🔒 Namensänderung gesperrt (wieder in ${daysLeft} Tag(en) möglich)`;
  } else {
    pInput.disabled = false;
    pInput.style.opacity = '1';
    if (nameHint) nameHint.textContent = `✏️ Namensänderung frei (Drücke Enter zum Speichern)`;
  }
}

if (pInput) {
  updateNameInputUI();

  const handleNameSave = () => {
    const newName = pInput.value.trim().slice(0, 18);
    if (!newName) {
      pInput.value = save.playerName || '';
      return;
    }
    const now = Date.now();
    const timePassed = now - (save.lastNameChange || 0);

    if (save.playerName && save.playerName !== newName && timePassed < SEVEN_DAYS) {
      const daysLeft = Math.ceil((SEVEN_DAYS - timePassed) / (1000 * 60 * 60 * 24));
      toast(`Namensänderung erst in ${daysLeft} Tag(en) wieder möglich!`);
      pInput.value = save.playerName;
      return;
    }

    if (save.playerName !== newName) {
      save.playerName = newName;
      save.lastNameChange = now;
      toast('Name aktualisiert!');
      persist();
      updateNameInputUI();
      renderLeaderboard();
    }
  };

  pInput.onchange = handleNameSave;
  pInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      pInput.blur();
    }
  };
}

// GAME ENGINES & LOOPS
let active = '', raf = 0, last = 0, roundEnded = false, cleanup = () => { };
function stop() { cancelAnimationFrame(raf); cleanup(); cleanup = () => { }; last = 0; }
function loop(update, draw) { function f(t) { let dt = Math.min(.05, (t - last || t) / 1000); last = t; update(dt); draw(); if (!roundEnded) raf = requestAnimationFrame(f); } raf = requestAnimationFrame(f); }
function canvas(w = 400, h = 520) { $('#gameUI').innerHTML = `<div class="hud" id="hud"></div><canvas width="${w}" height="${h}"></canvas><div class="controls" id="controls"><i class="empty"></i><button data-k="ArrowUp">▲</button><i class="empty"></i><button data-k="ArrowLeft">◀</button><button data-k=" ">●</button><button data-k="ArrowRight">▶</button><i class="empty"></i><button data-k="ArrowDown">▼</button><i class="empty"></i></div>`; let c = $('canvas'), x = c.getContext('2d'); $('#controls').onclick = e => { let k = e.target.dataset.k; if (k) key(k); }; return [c, x]; }
function hud(s) { $('#hud').innerHTML = s; } function key(k) { window.dispatchEvent(new KeyboardEvent('keydown', { key: k })); }
function end(title, text, score, win = false) { if (roundEnded) return; stop(); award(active, score, win); $('#modalTitle').textContent = title; $('#modalText').textContent = text; $('#modal').classList.add('show'); $('#modalRestart').onclick = () => launch(active); }

function launch(id) { stop(); sessionId++; active = id; roundEnded = false; showView('game'); let g = games.find(x => x[0] === id); $('#gameTitle').textContent = g[2]; if (id === 'snake') snake(); else if (id === 'tetris') tetris(); else if (id === 'flappy') flappy(); else if (id === 'space') space(); else if (id === 'pong') pong(); else if (id === '2048') game2048(); else if (id === 'ttt') ttt(); else if (id === 'memory') memory(); else if (id === 'fruit') fruit(); else rhythm(); }
window.launch = launch;

let sessionId = 0, keyHandler = null;
function bind(fn) { if (keyHandler) window.removeEventListener('keydown', keyHandler); const owner = sessionId, ownerGame = active; keyHandler = e => { if (active === ownerGame && sessionId === owner && !roundEnded && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { e.preventDefault(); fn(e.key); } }; window.addEventListener('keydown', keyHandler, { passive: false }); }

// 1. SNAKE
function snake() {
  let [c, x] = canvas(400, 400), n = 20, s = [{ x: 10, y: 10 }], food = { x: 15, y: 15 }, dir = { x: 1, y: 0 }, next = dir, acc = 0, score = 0;
  function spawn() { do { food = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) }; } while (s.some(q => q.x === food.x && q.y === food.y)); }
  bind(k => { let m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (m && m[0] !== -dir.x && m[1] !== -dir.y) next = { x: m[0], y: m[1] }; });
  function step() {
    dir = next; let h = { x: s[0].x + dir.x, y: s[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= n || h.y >= n || s.some(q => q.x === h.x && q.y === h.y)) return end('Signal verloren', `Score: ${score}`, score);
    s.unshift(h);
    if (h.x === food.x && h.y === food.y) { score += 10; spawn(); sound('win'); } else s.pop();
  }
  loop(dt => { acc += dt; while (acc > .145) { acc -= .145; step(); } }, () => {
    x.fillStyle = '#050713'; x.fillRect(0, 0, 400, 400);
    x.fillStyle = '#ff6386'; x.fillRect(food.x * 20 + 3, food.y * 20 + 3, 14, 14);
    s.forEach((q, i) => { x.fillStyle = i ? '#55e6ff' : '#c75cff'; x.fillRect(q.x * 20 + 2, q.y * 20 + 2, 16, 16); });
    hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('snake')}</b>`);
  });
}

// 2. TETRIS
function tetris() {
  let [c, x] = canvas(300, 600), W = 10, H = 20, B = Array.from({ length: H }, () => Array(W).fill(0)),
    sh = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]],
    colors = ['#55e6ff', '#ffe063', '#cb5cff', '#ff8e58', '#5385ff', '#72ffae', '#ff6386'],
    p, newp = () => p = { m: sh[Math.random() * sh.length | 0], x: 3, y: 0, col: colors[Math.random() * colors.length | 0] }, score = 0, acc = 0;
  newp();
  function hit(m = p.m, ox = p.x, oy = p.y) { return m.some((r, y) => r.some((v, z) => v && (ox + z < 0 || ox + z >= W || oy + y >= H || (oy + y >= 0 && B[oy + y][ox + z])))); }
  function drop() {
    p.y++; if (hit()) {
      p.y--; p.m.forEach((r, y) => r.forEach((v, z) => { if (v) B[p.y + y][p.x + z] = p.col; }));
      let lines = 0; B = B.filter(r => { if (r.every(Boolean)) { lines++; return false; } return true; });
      while (B.length < H) B.unshift(Array(W).fill(0));
      if (lines) { score += lines * lines * 100; sound('win'); }
      newp(); if (hit()) end('Matrix voll', `Score: ${score}`, score);
    }
  }
  bind(k => {
    if (k === 'ArrowLeft') { p.x--; if (hit()) p.x++; }
    if (k === 'ArrowRight') { p.x++; if (hit()) p.x--; }
    if (k === 'ArrowDown') drop();
    if (k === 'ArrowUp' || k === ' ') { let old = p.m; p.m = p.m[0].map((_, i) => p.m.map(r => r[i]).reverse()); if (hit()) p.m = old; }
  });
  loop(dt => { acc += dt; let speed = Math.max(.13, .72 - score / 3500); while (acc > speed) { acc -= speed; drop(); } }, () => {
    x.fillStyle = '#060917'; x.fillRect(0, 0, 300, 600);
    x.strokeStyle = 'rgba(85, 230, 255, 0.05)'; x.lineWidth = 1;
    for (let gx = 0; gx <= 300; gx += 30) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, 600); x.stroke(); }
    for (let gy = 0; gy <= 600; gy += 30) { x.beginPath(); x.moveTo(0, gy); x.lineTo(300, gy); x.stroke(); }
    
    x.shadowBlur = 8;
    B.forEach((r, y) => r.forEach((v, z) => {
      if (v) { x.fillStyle = v; x.shadowColor = v; x.fillRect(z * 30 + 1, y * 30 + 1, 28, 28); }
    }));
    
    x.fillStyle = p.col; x.shadowColor = p.col; x.shadowBlur = 12;
    p.m.forEach((r, y) => r.forEach((v, z) => v && x.fillRect((p.x + z) * 30 + 1, (p.y + y) * 30 + 1, 28, 28)));
    x.shadowBlur = 0;
    hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('tetris')}</b>`);
  });
}

// 3. FLAPPY
function flappy() {
  let [c, x] = canvas(), y = 250, v = 0, p = [], score = 0, acc = 0, started = false, time = 0;
  function flap() { if (roundEnded) return; started = true; v = -320; sound(); }
  bind(k => { if (k === ' ' || k === 'ArrowUp') flap(); });
  c.addEventListener('pointerdown', flap);
  cleanup = () => { c.removeEventListener('pointerdown', flap); };
  loop(dt => {
    if (!started) return;
    time += dt; v += 900 * dt; y += v * dt; acc += dt;
    if (acc > .14) {
      acc = 0;
      if (!p.length || p.at(-1).x < 225) p.push({ x: 420, gap: 115 + Math.random() * 210, ok: false });
    }
    for (const o of p) {
      o.x -= 165 * dt;
      if (o.x < 95 && o.x + 62 > 66 && (y - 14 < o.gap - 78 || y + 14 > o.gap + 78)) return end('Vogel abgestürzt', `Score: ${score}`, score);
      if (!o.ok && o.x < 66) { o.ok = true; score++; sound('win'); }
    }
    p = p.filter(o => o.x > -70);
    if (y < 0 || y > 520) end('Vogel abgestürzt', `Score: ${score}`, score);
  }, () => {
    let sky = x.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, '#07152f'); sky.addColorStop(.58, '#244e79'); sky.addColorStop(1, '#ff9d70');
    x.fillStyle = sky; x.fillRect(0, 0, 400, 520);
    x.fillStyle = '#ffffff20';
    for (let i = 0; i < 5; i++) {
      let cx = (i * 117 - (time * 18) % 520 + 520) % 520;
      x.beginPath();
      x.ellipse(cx, 70 + i % 3 * 45, 38, 12, 0, 0, Math.PI * 2);
      x.ellipse(cx + 28, 68 + i % 3 * 45, 25, 10, 0, 0, Math.PI * 2);
      x.fill();
    }
    x.fillStyle = '#12334a';
    for (let i = 0; i < 10; i++) {
      let bx = i * 48;
      x.fillRect(bx, 420 - (i % 3) * 14, 30, 100);
      x.fillStyle = '#ffe06355'; x.fillRect(bx + 5, 432 - (i % 3) * 14, 3, 24);
      x.fillStyle = '#12334a';
    }
    for (const o of p) {
      let g = x.createLinearGradient(o.x, 0, o.x + 62, 0);
      g.addColorStop(0, '#168667'); g.addColorStop(.48, '#60ffc0'); g.addColorStop(1, '#147556');
      x.fillStyle = g; x.strokeStyle = '#a7ffdc'; x.lineWidth = 2;
      x.fillRect(o.x, 0, 62, o.gap - 78); x.strokeRect(o.x + 1, 0, 60, o.gap - 78);
      x.fillRect(o.x, o.gap + 78, 62, 520); x.strokeRect(o.x + 1, o.gap + 79, 60, 440 - o.gap);
      x.fillStyle = '#7cffc2';
      x.fillRect(o.x - 7, o.gap - 91, 76, 15); x.strokeRect(o.x - 7, o.gap - 91, 76, 15);
      x.fillRect(o.x - 7, o.gap + 76, 76, 15); x.strokeRect(o.x - 7, o.gap + 76, 76, 15);
      x.fillStyle = '#0a674e';
      for (let by = 28; by < o.gap - 95; by += 34) x.fillRect(o.x + 8, by, 4, 12);
      for (let by = o.gap + 100; by < 510; by += 34) x.fillRect(o.x + 8, by, 4, 12);
    }
    x.fillStyle = '#553b2b'; x.fillRect(0, 495, 400, 25);
    x.fillStyle = '#b48250';
    for (let i = 0; i < 400; i += 24) x.fillRect(i, 495, 12, 3);
    x.save();
    x.translate(80, y);
    x.rotate(clamp(v / 650, -.45, .55));
    x.shadowColor = '#ffcf5a'; x.shadowBlur = 16;
    x.fillStyle = '#f8bd42'; x.beginPath(); x.ellipse(0, 0, 19, 14, 0, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;
    x.fillStyle = '#e99425'; x.beginPath(); x.ellipse(-4, 7, 10, 5, -.3 + Math.sin(time * 16) * .14, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff1ba'; x.beginPath(); x.ellipse(7, -4, 6, 7, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#162035'; x.beginPath(); x.arc(9, -4, 2.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ff704f'; x.beginPath(); x.moveTo(15, 1); x.lineTo(28, 5); x.lineTo(15, 9); x.closePath(); x.fill();
    x.fillStyle = '#e98b29'; x.beginPath(); x.moveTo(-15, 0); x.lineTo(-25, -7); x.lineTo(-22, 4); x.closePath(); x.fill();
    x.restore();
    x.fillStyle = '#fff'; x.font = 'bold 25px system-ui'; x.textAlign = 'center';
    x.fillText(String(score), 200, 48);
    if (!started) {
      x.fillStyle = '#041020b8'; x.fillRect(35, 210, 330, 86);
      x.fillStyle = '#fff'; x.font = 'bold 18px system-ui';
      x.fillText('TIPPE, DAMIT DER VOGEL FLIEGT', 200, 246);
      x.font = '14px system-ui'; x.fillText('Tippen oder Leertaste', 200, 273);
    }
    hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('flappy')}</b>`);
  });
}

// 4. STAR DEFENDER
function space() {
  let [c, x] = canvas(), px = 200, shots = [], enemies = [], powerups = [], explosions = [],
    acc = 0, shootCooldown = 0, boostTimer = 0, baseLives = 10, baseHitFlash = 0, score = 0;

  function shoot() {
    if (shootCooldown > 0) return;
    shots.push({ x: px, y: 455 });
    sound();
    shootCooldown = boostTimer > 0 ? 0.12 : 0.25;
  }

  bind(k => {
    if (k === 'ArrowLeft') px -= 28;
    if (k === 'ArrowRight') px += 28;
    if (k === ' ' || k === 'ArrowUp') shoot();
  });
  c.onpointermove = e => { let r = c.getBoundingClientRect(); px = clamp((e.clientX - r.left) * 400 / r.width, 15, 385); };
  c.onpointerdown = shoot;
  cleanup = () => { c.onpointermove = null; c.onpointerdown = null; };

  loop(dt => {
    px = clamp(px, 15, 385);
    if (shootCooldown > 0) shootCooldown -= dt;
    if (boostTimer > 0) boostTimer -= dt;
    if (baseHitFlash > 0) baseHitFlash -= dt;

    acc += dt;
    let spawnRate = Math.max(0.75, 1.6 - Math.floor(score / 100) * 0.1);
    if (acc > spawnRate) {
      acc = 0;
      if (enemies.length < 6) {
        enemies.push({ x: 20 + Math.random() * 350, y: -25, v: 50 + score * 0.3 });
      }
    }

    shots.forEach(q => q.y -= 420 * dt);
    enemies.forEach(q => q.y += q.v * dt);
    powerups.forEach(p => p.y += 80 * dt);

    for (let i = explosions.length - 1; i >= 0; i--) {
      let ex = explosions[i]; ex.y += ex.vy * dt; ex.x += ex.vx * dt; ex.life -= dt * 2.5;
      if (ex.life <= 0) explosions.splice(i, 1);
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      let p = powerups[i];
      if (Math.hypot(p.x - px, p.y - 480) < 25) {
        if (p.type === 'speed') { boostTimer = 10; toast("2× Schussgeschwindigkeit! (10s)"); }
        else if (p.type === 'life') { baseLives = Math.min(10, baseLives + 1); toast("+1 Base-Leben erhalten!"); }
        sound('win');
        powerups.splice(i, 1);
      } else if (p.y > 520) powerups.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      if (e.y > 470) {
        baseLives--;
        baseHitFlash = 0.35;
        sound('lose');
        enemies.splice(i, 1);
        if (baseLives <= 0) return end('Base Zerstört', `Welle beendet bei ${score} Punkten.`, score);
        continue;
      }

      for (let j = shots.length - 1; j >= 0; j--) {
        if (Math.abs(shots[j].x - e.x) < 20 && Math.abs(shots[j].y - e.y) < 24) {
          for (let k = 0; k < 6; k++) {
            explosions.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 1, c: k % 2 ? '#ff6386' : '#ffe063' });
          }
          
          let r = Math.random();
          if (r < 0.03) powerups.push({ x: e.x, y: e.y, type: 'life' });
          else if (r < 0.18) powerups.push({ x: e.x, y: e.y, type: 'speed' });

          enemies.splice(i, 1);
          shots.splice(j, 1);
          score += 10;
          sound('win');
          break;
        }
      }
    }

    shots = shots.filter(q => q.y > -10);
    enemies = enemies.filter(q => q.y < 540);
  }, () => {
    x.fillStyle = '#030511'; x.fillRect(0, 0, 400, 520);
    x.fillStyle = '#fff'; for (let i = 0; i < 38; i++) x.fillRect((i * 71) % 400, (i * 113) % 520, 1, 1);

    if (baseLives <= 3) {
      x.fillStyle = 'rgba(255, 99, 134, ' + (0.15 + Math.sin(Date.now() / 200) * 0.1) + ')';
      x.fillRect(0, 460, 400, 60);
    }
    if (baseHitFlash > 0) {
      x.fillStyle = 'rgba(255, 99, 134, ' + (baseHitFlash * 2) + ')';
      x.fillRect(0, 0, 400, 520);
    }

    x.fillStyle = boostTimer > 0 ? '#55e6ff' : '#162c59';
    x.beginPath(); x.moveTo(px, 458); x.lineTo(px - 24, 496); x.lineTo(px - 10, 488); x.lineTo(px, 500); x.lineTo(px + 10, 488); x.lineTo(px + 24, 496); x.closePath(); x.fill();
    x.strokeStyle = '#55e6ff'; x.lineWidth = 2; x.shadowColor = '#55e6ff'; x.shadowBlur = boostTimer > 0 ? 18 : 8; x.stroke(); x.shadowBlur = 0;

    x.fillStyle = boostTimer > 0 ? '#72ffae' : '#ffe063';
    shots.forEach(q => x.fillRect(q.x - 2, q.y, 4, 12));

    powerups.forEach(p => {
      x.beginPath(); x.arc(p.x, p.y, 9, 0, Math.PI * 2);
      x.fillStyle = p.type === 'life' ? '#72ffae' : '#55e6ff';
      x.shadowColor = x.fillStyle; x.shadowBlur = 10; x.fill(); x.shadowBlur = 0;
      x.fillStyle = '#000'; x.font = 'bold 10px system-ui'; x.textAlign = 'center';
      x.fillText(p.type === 'life' ? '❤️' : '⚡', p.x, p.y + 3);
    });

    explosions.forEach(ex => {
      x.fillStyle = ex.c; x.globalAlpha = ex.life;
      x.fillRect(ex.x, ex.y, 3, 3);
      x.globalAlpha = 1;
    });

    x.fillStyle = '#ff6386';
    enemies.forEach(q => {
      x.beginPath(); x.moveTo(q.x, q.y - 12); x.lineTo(q.x + 16, q.y); x.lineTo(q.x + 11, q.y + 12); x.lineTo(q.x - 11, q.y + 12); x.lineTo(q.x - 16, q.y); x.closePath(); x.fill();
    });

    let boostText = boostTimer > 0 ? ` · ⚡ <b>${Math.ceil(boostTimer)}s</b>` : '';
    hud(`BASE: <b>${'❤️'.repeat(baseLives)}</b> (${baseLives}/10) · SCORE <b>${score}</b>${boostText}`);
  });
}

// 5. PONG
function pong() {
  $('#gameUI`').innerHTML = `
    <div class="mode-select-box" id="pongModeSelect">
      <h3 style="color:var(--a); margin-bottom:10px;">Spielmodus wählen</h3>
      <button class="mode-btn" id="btnVsAI">🤖 Gegen KI</button>
      <button class="mode-btn" id="btnVs1v1">🎮 1 gegen 1 (Lokal)</button>
    </div>
  `;

  $('#btnVsAI').onclick = () => startPongGame(false);
  $('#btnVs1v1').onclick = () => startPongGame(true);

  function startPongGame(isMultiplayer) {
    let [c, x] = canvas(), py = 220, ai = 220, b = { x: 200, y: 260, vx: -230, vy: 145 }, player = 0, opponent = 0;

    function serve(toPlayer) { b = { x: 200, y: 260, vx: toPlayer ? -230 : 230, vy: (Math.random() - .5) * 210 }; }
    function point(who) {
      if (who === 'player') player++; else opponent++;
      sound(who === 'player' ? 'win' : 'lose');
      if (player >= 7 || opponent >= 7) {
        let won = player > opponent;
        end(won ? 'Match gewonnen!' : 'Match verloren', `${player} : ${opponent} · bis 7 Punkte`, player, won);
        return;
      }
      serve(who === 'player');
    }

    bind(k => {
      if (k === 'ArrowUp') py -= 38;
      if (k === 'ArrowDown') py += 38;
      if (isMultiplayer) {
        if (k === 'w' || k === 'W') ai -= 38;
        if (k === 's' || k === 'S') ai += 38;
      }
    });

    c.onpointermove = e => {
      let r = c.getBoundingClientRect();
      py = (e.clientY - r.top) * 520 / r.height - 40;
    };
    cleanup = () => c.onpointermove = null;

    loop(dt => {
      py = clamp(py, 0, 440);

      if (!isMultiplayer) {
        let targetY = b.y - 40 + (b.vx > 0 ? (b.vy * 0.15) : 0);
        ai = clamp(ai + (targetY - ai) * dt * 5.2, 0, 440);
      } else {
        ai = clamp(ai, 0, 440);
      }

      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < 6) { b.y = 6; b.vy = Math.abs(b.vy); }
      if (b.y > 514) { b.y = 514; b.vy = -Math.abs(b.vy); }

      if (b.x < 26 && b.y >= py && b.y <= py + 80) {
        b.x = 26; b.vx = Math.abs(b.vx) * 1.04;
        b.vy += (b.y - (py + 40)) * 2.2;
        sound();
      }
      if (b.x > 374 && b.y >= ai && b.y <= ai + 80) {
        b.x = 374; b.vx = -Math.abs(b.vx) * 1.04;
        b.vy += (b.y - (ai + 40)) * 2.2;
        sound();
      }

      if (b.x < -10) point('opponent');
      if (b.x > 410) point('player');
    }, () => {
      x.fillStyle = '#030511'; x.fillRect(0, 0, 400, 520);
      x.strokeStyle = '#ffffff15'; x.lineWidth = 2; x.setLineDash([8, 8]);
      x.beginPath(); x.moveTo(200, 0); x.lineTo(200, 520); x.stroke(); x.setLineDash([]);
      
      x.fillStyle = '#55e6ff'; x.fillRect(12, py, 12, 80);
      x.fillStyle = '#ff6386'; x.fillRect(376, ai, 12, 80);
      
      x.fillStyle = '#ffe063'; x.beginPath(); x.arc(b.x, b.y, 7, 0, Math.PI * 2); x.fill();
      hud(`SPIELER <b>${player}</b> · GEGNER <b>${opponent}</b>`);
    });
  }
}

// 6. 2048 NOVA
function game2048() {
  let [c, x] = canvas(400, 400), B = Array(4).fill(0).map(() => Array(4).fill(0)), score = 0;
  function add() {
    let empty = [];
    B.forEach((r, y) => r.forEach((v, x) => { if (!v) empty.push({ x, y }); }));
    if (!empty.length) return;
    let p = empty[Math.random() * empty.length | 0];
    B[p.y][p.x] = Math.random() < 0.9 ? 2 : 4;
  }
  add(); add();
  function slide(row) {
    let arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr[i + 1] = 0; i++; }
    }
    arr = arr.filter(v => v);
    while (arr.length < 4) arr.push(0);
    return arr;
  }
  function move(dir) {
    let changed = false;
    if (dir === 'ArrowLeft' || dir === 'ArrowRight') {
      B = B.map(row => {
        let original = [...row];
        let r = dir === 'ArrowRight' ? row.slice().reverse() : row;
        r = slide(r);
        if (dir === 'ArrowRight') r.reverse();
        if (original.some((v, i) => v !== r[i])) changed = true;
        return r;
      });
    } else {
      for (let col = 0; col < 4; col++) {
        let column = [B[0][col], B[1][col], B[2][col], B[3][col]];
        let original = [...column];
        if (dir === 'ArrowDown') column.reverse();
        column = slide(column);
        if (dir === 'ArrowDown') column.reverse();
        for (let row = 0; row < 4; row++) {
          if (B[row][col] !== column[row]) changed = true;
          B[row][col] = column[row];
        }
      }
    }
    if (changed) { add(); sound(); }
  }
  bind(k => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) { move(k); } });
  loop(() => {}, () => {
    x.fillStyle = '#050816'; x.fillRect(0, 0, 400, 400);
    B.forEach((r, y) => r.forEach((v, X) => {
      x.fillStyle = v ? '#132247' : '#0b1227';
      x.fillRect(X * 95 + 15, y * 95 + 15, 85, 85);
      if (v) {
        x.fillStyle = '#fff'; x.font = 'bold 24px system-ui'; x.textAlign = 'center';
        x.fillText(v, X * 95 + 57, y * 95 + 67);
      }
    }));
    hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('2048')}</b>`);
  });
}

// 7. TIC-TAC-TOE
function ttt() {
  $('#gameUI').innerHTML = `<div class="ttt-grid" id="tttGrid"></div>`;
  let board = Array(9).fill(''), turn = 'X', gameOver = false;
  const grid = $('#tttGrid');
  grid.style.cssText = 'display:grid; grid-template-columns:repeat(3, 100px); gap:10px; justify-content:center; padding:50px;';
  
  function checkWin() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.includes('') ? null : 'Tie';
  }

  function render() {
    grid.innerHTML = board.map((v, i) => `<button style="width:100px; height:100px; font-size:36px; background:#122044; color:${v==='X'?'#55e6ff':'#ff6386'}; border:none; border-radius:12px; cursor:pointer;" data-i="${i}">${v}</button>`).join('');
  }
  grid.onclick = e => {
    let i = e.target.dataset.i;
    if (i !== undefined && !board[i] && !gameOver) {
      board[i] = turn; sound();
      let res = checkWin();
      if (res) {
        gameOver = true;
        if (res === 'Tie') end('Unentschieden', 'Keine Züge mehr.', 50, true);
        else end(`Spieler ${res} gewinnt!`, 'Toll gespielt!', 100, true);
      } else {
        turn = turn === 'X' ? 'O' : 'X';
      }
      render();
    }
  };
  render();
  hud(`TIC-TAC-TOE · AM ZUG: <b>${turn}</b>`);
}

// 8. MEMORY
function memory() {
  let [c, x] = canvas(400, 400), icons = ['⭐', '🚀', '💎', '🔥', '⚡', '🪐', '🔮', '✨'],
      cards = [...icons, ...icons].sort(() => Math.random() - .5).map((icon, id) => ({ id, icon, flipped: false, matched: false })),
      selected = [], matches = 0, moves = 0;

  c.onclick = e => {
    let r = c.getBoundingClientRect(), cx = (e.clientX - r.left) * 400 / r.width, cy = (e.clientY - r.top) * 400 / r.height;
    let col = Math.floor(cx / 100), row = Math.floor(cy / 100), idx = row * 4 + col;
    let card = cards[idx];
    if (card && !card.flipped && !card.matched && selected.length < 2) {
      card.flipped = true; selected.push(card); sound();
      if (selected.length === 2) {
        moves++;
        if (selected[0].icon === selected[1].icon) {
          selected[0].matched = selected[1].matched = true; matches++; selected = []; sound('win');
          if (matches === icons.length) end('Memory gelöst!', `Geschafft in ${moves} Zügen!`, Math.max(10, 300 - moves * 10), true);
        } else {
          setTimeout(() => { selected[0].flipped = selected[1].flipped = false; selected = []; }, 700);
        }
      }
    }
  };
  cleanup = () => { c.onclick = null; };
  loop(() => {}, () => {
    x.fillStyle = '#050816'; x.fillRect(0, 0, 400, 400);
    cards.forEach((card, i) => {
      let col = i % 4, row = Math.floor(i / 4);
      x.fillStyle = card.flipped || card.matched ? '#162852' : '#0b132b';
      x.fillRect(col * 100 + 6, row * 100 + 6, 88, 88);
      if (card.flipped || card.matched) {
        x.font = '36px system-ui'; x.textAlign = 'center';
        x.fillText(card.icon, col * 100 + 50, row * 100 + 60);
      }
    });
    hud(`ZÜGE <b>${moves}</b> · PAARE <b>${matches}/${icons.length}</b>`);
  });
}

// 9. FRUIT MERGE
function fruit() {
  let [c, x] = canvas(400, 520), fruits = [{ r: 14, col: '#ff6386' }, { r: 20, col: '#ff9d70' }, { r: 28, col: '#ffe063' }, { r: 38, col: '#72ffae' }, { r: 48, col: '#55e6ff' }],
      list = [], dropX = 200, score = 0, currentType = 0;

  bind(k => {
    if (k === 'ArrowLeft') dropX = Math.max(20, dropX - 15);
    if (k === 'ArrowRight') dropX = Math.min(380, dropX + 15);
    if (k === ' ' || k === 'ArrowDown') {
      list.push({ x: dropX, y: 50, r: fruits[currentType].r, type: currentType, vy: 0 });
      currentType = Math.floor(Math.random() * 3);
      sound();
    }
  });
  loop(dt => {
    list.forEach(f => {
      f.vy += 400 * dt; f.y += f.vy * dt;
      if (f.y > 520 - f.r) { f.y = 520 - f.r; f.vy = 0; }
    });
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        let f1 = list[i], f2 = list[j];
        if (Math.hypot(f1.x - f2.x, f1.y - f2.y) < f1.r + f2.r && f1.type === f2.type && f1.type < fruits.length - 1) {
          f1.type++; f1.r = fruits[f1.type].r; score += (f1.type + 1) * 10;
          list.splice(j, 1); sound('win'); break;
        }
      }
    }
    if (list.some(f => f.y < 80 && f.vy === 0)) end('Box voll!', `Score: ${score}`, score);
  }, () => {
    x.fillStyle = '#050714'; x.fillRect(0, 0, 400, 520);
    x.fillStyle = fruits[currentType].col; x.beginPath(); x.arc(dropX, 40, fruits[currentType].r, 0, Math.PI * 2); x.fill();
    list.forEach(f => {
      x.fillStyle = fruits[f.type].col; x.beginPath(); x.arc(f.x, f.y, f.r, 0, Math.PI * 2); x.fill();
    });
    hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('fruit')}</b>`);
  });
}

// 10. BEAT REACTOR
function rhythm() {
  let [c, x] = canvas(400, 520), notes = [], score = 0, time = 0, acc = 0;
  bind(k => {
    if (k === ' ') {
      let idx = notes.findIndex(n => Math.abs(n.y - 420) < 30);
      if (idx !== -1) {
        notes.splice(idx, 1); score += 50; sound('win'); burst(200, 420);
      } else {
        score = Math.max(0, score - 20); sound('lose');
      }
    }
  });
  loop(dt => {
    time += dt; acc += dt;
    if (acc > 0.8) {
      acc = 0; notes.push({ y: 0, lane: Math.floor(Math.random() * 3) });
    }
    notes.forEach(n => n.y += 220 * dt);
    notes = notes.filter(n => {
      if (n.y > 540) { score = Math.max(0, score - 10); return false; }
      return true;
    });
    if (score >= 1000) end('Perfekter Beat!', 'Du hast den Rhythmus gemeistert!', score, true);
  }, () => {
    x.fillStyle = '#050714'; x.fillRect(0, 0, 400, 520);
    x.strokeStyle = '#55e6ff55'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, 420); x.lineTo(400, 420); x.stroke();
    notes.forEach(n => {
      x.fillStyle = '#cb5cff'; x.beginPath(); x.arc(200 + (n.lane - 1) * 70, n.y, 16, 0, Math.PI * 2); x.fill();
    });
    hud(`SCORE <b>${score}</b> · ZIEL <b>1000</b>`);
  });
}

// 🔥 HIER WIRD RENDERGAMES BEIM START AUFGERUFEN, DAMIT ALLES SOFORT ANZEIGT WIRD:
renderGames();
