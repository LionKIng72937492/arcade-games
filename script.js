import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, limit, doc, setDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";// FIREBASE KONFIGURATION
const firebaseConfig = {
apiKey: "AIzaSyCDZ3kR-o_x3Cwg3MJpib1vuDIrqv1lddA",
authDomain: "gaminglounge-d3082.firebaseapp.com",
projectId: "gaminglounge-d3082",
storageBucket: "gaminglounge-d3082.firebasestorage.app",
messagingSenderId: "1028630964839",
appId: "1:1028630964839:web:5f4df6107fb5c0148342c2"
};const app = initializeApp(firebaseConfig);
const db = getFirestore(app);// HIER KANNST DU DEN OWNER-NAMEN ÄNDERN:
const OWNER_NAME = "LionKIng72937492";let currentCategory = 'coins';// SPEICHER-DATENBANK LOGIK
const KEY = 'neonArcade2026';
const defaults = { coins: 0, xp: 0, sound: true, theme: 'neon', scores: {}, unlocked: ['theme-violet'], activeTrail: 'base', playerId: '', playerName: '', lastNameChange: 0 };
let save;
try {
save = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
save.scores ??= {};
save.unlocked ??= [];
} catch {
save = { ...defaults };
}// EIN ACCOUNT PRO GERÄT (EINDEUTIGE ID)
if (!save.playerId) {
save.playerId = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
window.save = save;// AUTOMATISCHES SPEICHERN IN FIREBASE (MERGED PRO GERÄT)
async function savePlayerToFirebase() {
if (!window.save) return;
const name = window.save.playerName || "Anonym";
if (!name || name === "Du") return;try {
const playerRef = doc(db, "leaderboards", window.save.playerId);
await setDoc(playerRef, {
playerId: window.save.playerId,
playerName: name,
coins: window.save.coins || 0,
xp: window.save.xp || 0,
time: Math.floor((window.save.xp || 0) / 100),
lastNameChange: window.save.lastNameChange || 0
}, { merge: true });
} catch (err) {
console.error("Fehler beim Speichern in Firestore:", err);
}
}
window.savePlayerToFirebase = savePlayerToFirebase;// RANGLEISTE KATEGORIE WECHSELN
function switchCategory(cat) {
currentCategory = cat;
document.querySelectorAll('.lb-tabs button').forEach(b => b.classList.remove('active'));
let activeBtn = document.getElementById('btn-' + cat);
if (activeBtn) activeBtn.classList.add('active');const headers = { coins: "Münzen", xp: "Erfahrung (XP)", time: "Spielzeit (Std.)" };
document.getElementById('score-header').innerText = headers[cat];
loadLeaderboardData(cat);
}
window.switchCategory = switchCategory;function loadLeaderboardData(category) {
const tbody = document.getElementById('leaderboardRows');
if (!tbody) return;
tbody.innerHTML = 'Lade Rangliste...';const scoresRef = collection(db, "leaderboards");
const q = query(scoresRef, orderBy(category, "desc"), limit(10));onSnapshot(q, (snapshot) => {
tbody.innerHTML = "";// 👑 OWNER EINTRAG (#1 RANG)
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
tbody.innerHTML = 'Fehler beim Laden der Live-Daten.';
});
}function renderLeaderboard() {
loadLeaderboardData(currentCategory);
}
window.renderLeaderboard = renderLeaderboard;// SPIEL-HELFER UND LOGIK
const $ = s => document.querySelector(s);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));const games = [
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
];if ((save.scores.pong || 0) > 7) { save.scores.pong = 0; localStorage.setItem(KEY, JSON.stringify(save)); }function persist() {
localStorage.setItem(KEY, JSON.stringify(save));
renderMeta();
savePlayerToFirebase();
}function renderMeta() {
$('#coins').textContent = save.coins;
$('#xp').textContent = save.xp;
$('#level').textContent = 1 + Math.floor(save.xp / 1000);
document.body.className = save.theme === 'neon' ? '' : 'theme-' + save.theme;
$('#soundBtn').textContent = save.sound ? 'An' : 'Aus';
$('#themeSelect').value = save.theme;// Überprüfen, ob das Owner Panel angezeigt werden soll (Nur wenn der Spieler-Name exakt dem Owner entspricht)
checkOwnerPanelVisibility();
}function checkOwnerPanelVisibility() {
let ownerContainer = $('#ownerPanelContainer');
if (!ownerContainer) {
// Falls das Panel noch nicht existiert, im Settings-Bereich (oder dem aktiven DOM) erstellen
const settingsView = $('#settings');
if (settingsView) {
ownerContainer = document.createElement('div');
ownerContainer.id = 'ownerPanelContainer';
settingsView.appendChild(ownerContainer);
}
}if (ownerContainer) {
if (save.playerName && save.playerName.toLowerCase() === OWNER_NAME.toLowerCase()) {
ownerContainer.style.display = 'block';
ownerContainer.innerHTML = <div class="panel" style="margin-top:20px; border:2px solid #ffb257; background:rgba(255,178,87,0.05);"> <h3 style="color:#ffb257; margin-bottom:10px;">👑 Owner Admin Panel</h3> <p class="muted" style="font-size:13px; margin-bottom:12px;">Verwalte Spieler-Statistiken in Echtzeit.</p> <div style="display:flex; flex-direction:column; gap:10px;"> <input type="text" id="opTargetName" placeholder="Exakter Spielername" style="padding:8px; background:#070d1f; border:1px solid #32447a; color:#fff; border-radius:6px;"> <div style="display:flex; gap:10px;"> <select id="opStatType" style="flex:1; padding:8px; background:#070d1f; border:1px solid #32447a; color:#fff; border-radius:6px;"> <option value="coins">Münzen hinzufügen</option> <option value="xp">XP hinzufügen</option> <option value="time">Spielzeit (Std.) hinzufügen</option> </select> <input type="number" id="opAmount" value="100" style="width:90px; padding:8px; background:#070d1f; border:1px solid #32447a; color:#fff; border-radius:6px;"> </div> <button class="buy" style="background:#ffb257; color:#000; font-weight:bold; padding:10px; cursor:pointer;" onclick="executeOwnerAction()">Statistik zuweisen</button> </div> </div>;
} else {
ownerContainer.style.display = 'none';
}
}
}// OWNER AKTION AUSFÜHREN
async function executeOwnerAction() {
if (!save.playerName || save.playerName.toLowerCase() !== OWNER_NAME.toLowerCase()) {
return toast('Keine Berechtigung!');
}const targetName = $('#opTargetName').value.trim();
const statType = $('#opStatType').value;
const amount = parseInt($('#opAmount').value) || 0;if (!targetName) {
return toast('Bitte einen Spielernamen eingeben.');
}try {
const scoresRef = collection(db, "leaderboards");
const q = query(scoresRef, where("playerName", "==", targetName));
const querySnapshot = await getDocs(q);if (querySnapshot.empty) {
  return toast(`Spieler "${targetName}" nicht in Firebase gefunden.`);
}

let targetDoc = null;
querySnapshot.forEach(docSnap => {
  targetDoc = docSnap;
});

if (targetDoc) {
  const data = targetDoc.data();
  let docRef = doc(db, "leaderboards", targetDoc.id);
  
  let updateData = {};
  if (statType === 'coins') {
    updateData.coins = (data.coins || 0) + amount;
  } else if (statType === 'xp') {
    updateData.xp = (data.xp || 0) + amount;
  } else if (statType === 'time') {
    updateData.time = (data.time || 0) + amount;
  }

  await setDoc(docRef, updateData, { merge: true });
  toast(`Erfolgreich ${amount} an ${targetName} (${statType}) vergeben!`);
  $('#opTargetName').value = '';
  renderLeaderboard();
}
} catch (err) {
console.error("Owner Action Fehler:", err);
toast('Fehler beim Aktualisieren der Spielerdaten.');
}
}
window.executeOwnerAction = executeOwnerAction;function toast(t) {
const e = $('#toast');
e.textContent = t;
e.classList.add('show');
clearTimeout(toast.t);
toast.t = setTimeout(() => e.classList.remove('show'), 2300);
}function sound(type = 'tap') {
if (!save.sound || !window.AudioContext) return;
const c = sound.c || (sound.c = new AudioContext()), o = c.createOscillator(), g = c.createGain();
o.type = type === 'win' ? 'triangle' : 'square';
o.frequency.value = type === 'win' ? 720 : type === 'lose' ? 110 : 420;
g.gain.setValueAtTime(.045, c.currentTime);
g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .1);
o.connect(g).connect(c.destination);
o.start();
o.stop(c.currentTime + .12);
}function burst(x = innerWidth / 2, y = innerHeight / 2) {
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
}// UNBEGRENZT MÜNZEN VERDIENEN
function award(game, score, win = false) {
if (roundEnded) return;
roundEnded = true;
save.wins ??= {};
let old = save.scores[game] || 0, isNew = score > old, bonus = 0;
if (isNew) {
save.scores[game] = score;
bonus = Math.min(8, 2 + Math.floor(Math.max(0, score) / 300));
}
if (win && !save.wins[game]) { save.wins[game] = true; if (!isNew) bonus += 2; }if (bonus) {
save.coins += bonus;
save.xp += bonus * 2;
toast(${isNew ? 'Neuer Bestwert! · ' : ''}+${bonus} Coins);
burst();
sound('win');
}
persist();
renderGames();
renderShop();
renderLeaderboard();
}function scoreText(id) { return save.scores[id] || 0; }function renderGames() {
$('#games').innerHTML = games.map(([id, icon, name, desc], i) =>
<button class="card" style="--glow:${['#55e6ff', '#bb6cff', '#ffb257', '#ff6d91'][i % 4]}" onclick="launch('${id}')"><div class="icon">${icon}</div><h3>${name}</h3><p>${desc}</p><footer>BESTWERT <strong>${scoreText(id)}</strong> · SPIELEN →</footer></button>
).join('');
}const items = [
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
];function equipped(id) { return id.startsWith('theme-') ? save.theme === id.slice(6) : id.startsWith('skin-') ? save.activeSkin === id : id.startsWith('crosshair-') ? save.activeCrosshair === id : id === 'trail-prism' ? save.activeTrail === id : id === 'sound-synth' ? save.soundStyle === id : false; }function renderShop() {
$('#shoplist').innerHTML = items.map(([id, n, c, rarity, d]) => {
let got = save.unlocked.includes(id), on = got && equipped(id);
return `<article class="panel shopitem rarity-${rarity.toLowerCase()}"><small>${rarity}</small><h3>${n}</h3><p>${d}</p><button class="buy" ${on ? 'disabled' : ''} onclick="${got ? `equip('${id}'):buy('${id}',${c})}">${on ? 'Ausgerüstet' : got ? 'Ausrüsten' : '◈ ' + c + ' kaufen'}</button></article>;
}).join('');
}function buy(id, c) {
if (save.unlocked.includes(id)) return equip(id);
if (save.coins < c) return toast('Dafür fehlen noch Münzen.');
save.coins -= c;
save.unlocked.push(id);
equip(id, true);
}
window.buy = buy;function equip(id, newPurchase = false) {
if (!save.unlocked.includes(id)) return;
let field = id.startsWith('theme-') ? 'theme' : id.startsWith('skin-') ? 'activeSkin' : id.startsWith('crosshair-') ? 'activeCrosshair' : id === 'trail-prism' ? 'activeTrail' : 'soundStyle';
save[field] = id.startsWith('theme-') ? id.slice(6) : id;
toast(newPurchase ? 'Gekauft und ausgerüstet!' : 'Item ausgerüstet.');
persist();
renderShop();
}
window.equip = equip;document.querySelectorAll('.tab').forEach(b => b.onclick = () => showView(b.dataset.view));function showView(v) {
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
window.showView = showView;function quitGame() { stop(); active = ''; $('#modal').classList.remove('show'); showView('hub'); }$('#soundBtn').onclick = () => { save.sound = !save.sound; persist(); };
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
};// 7-TAGE SPERRE, 50-MÜNZEN GEBÜHR & EINZIGARTIGKEIT FÜR DEN SPIELERNAME
const pInput = $('#playerName');
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;function updateNameInputUI() {
if (!pInput) return;
pInput.value = save.playerName || '';
const now = Date.now();
const timePassed = now - (save.lastNameChange || 0);
const nameHint = $('#nameChangeHint');if (save.playerName && timePassed < SEVEN_DAYS) {
const daysLeft = Math.ceil((SEVEN_DAYS - timePassed) / (1000 * 60 * 60 * 24));
if (nameHint) nameHint.textContent = 🔒 Namensänderung kostet 50 Coins (erste gratis, wieder frei in ${daysLeft} Tag(en));
} else {
if (nameHint) nameHint.textContent = ✏️ Namensänderung frei oder 50 Coins (Drücke Enter zum Speichern);
}
}if (pInput) {
updateNameInputUI();const handleNameSave = async () => {
let newName = pInput.value.trim().slice(0, 18);
if (!newName || newName === save.playerName) {
pInput.value = save.playerName || '';
return;
}if (newName.toLowerCase() === OWNER_NAME.toLowerCase() && save.playerId !== 'owner_override_pc') {
  // Optional: Du kannst hier auch prüfen ob es der Admin-PC ist, aber über den Namen allein reicht es oft schon.
}

try {
  const scoresRef = collection(db, "leaderboards");
  const q = query(scoresRef, where("playerName", "==", newName));
  const querySnapshot = await getDocs(q);

  let nameTaken = false;
  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== save.playerId) {
      nameTaken = true;
    }
  });

  if (nameTaken && newName.toLowerCase() !== OWNER_NAME.toLowerCase()) {
    toast('Name ist bereits vergeben!');
    pInput.value = save.playerName || '';
    return;
  }

  const now = Date.now();
  const timePassed = now - (save.lastNameChange || 0);

  if (save.playerName && timePassed < SEVEN_DAYS) {
    if (save.coins < 50) {
      toast('Zu wenig Coins! Namenswechsel kostet 50 Coins.');
      pInput.value = save.playerName;
      return;
    }
    save.coins -= 50;
    toast('50 Coins für Namensänderung bezahlt!');
  }

  save.playerName = newName;
  save.lastNameChange = now;
  toast('Name erfolgreich gespeichert!');
  persist();
  updateNameInputUI();
  renderLeaderboard();
  checkOwnerPanelVisibility();

} catch (err) {
  console.error("Fehler bei Namensprüfung:", err);
  toast('Fehler beim Prüfen des Namens.');
  pInput.value = save.playerName || '';
}
};pInput.onchange = handleNameSave;
pInput.onkeydown = (e) => {
if (e.key === 'Enter') {
pInput.blur();
}
};
}// GAME ENGINES & LOOPS
let active = '', raf = 0, last = 0, roundEnded = false, cleanup = () => { };
function stop() { cancelAnimationFrame(raf); cleanup(); cleanup = () => { }; last = 0; }
function loop(update, draw) { function f(t) { let dt = Math.min(.05, (t - last || t) / 1000); last = t; update(dt); draw(); if (!roundEnded) raf = requestAnimationFrame(f); } raf = requestAnimationFrame(f); }
function canvas(w = 400, h = 520) { $('#gameUI').innerHTML = <div class="hud" id="hud"></div><canvas width="${w}" height="${h}"></canvas><div class="controls" id="controls"><i class="empty"></i><button data-k="ArrowUp">▲</button><i class="empty"></i><button data-k="ArrowLeft">◀</button><button data-k=" ">●</button><button data-k="ArrowRight">▶</button><i class="empty"></i><button data-k="ArrowDown">▼</button><i class="empty"></i></div>; let c = $('canvas'), x = c.getContext('2d'); $('#controls').onclick = e => { let k = e.target.dataset.k; if (k) key(k); }; return [c, x]; }
function hud(s) { $('#hud').innerHTML = s; } function key(k) { window.dispatchEvent(new KeyboardEvent('keydown', { key: k })); }
function end(title, text, score, win = false) { if (roundEnded) return; stop(); award(active, score, win); $('#modalTitle').textContent = title; $('#modalText').textContent = text; $('#modal').classList.add('show'); $('#modalRestart').onclick = () => launch(active); }function launch(id) { stop(); sessionId++; active = id; roundEnded = false; showView('game'); let g = games.find(x => x[0] === id); $('#gameTitle').textContent = g[2]; if (id === 'snake') snake(); else if (id === 'tetris') tetris(); else if (id === 'flappy') flappy(); else if (id === 'space') space(); else if (id === 'pong') pong(); else if (id === '2048') game2048(); else if (id === 'ttt') ttt(); else if (id === 'memory') memory(); else if (id === 'fruit') fruit(); else rhythm(); }
window.launch = launch;let sessionId = 0, keyHandler = null;
function bind(fn) { if (keyHandler) window.removeEventListener('keydown', keyHandler); const owner = sessionId, ownerGame = active; keyHandler = e => { if (active === ownerGame && sessionId === owner && !roundEnded && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) { e.preventDefault(); fn(e.key); } }; window.addEventListener('keydown', keyHandler, { passive: false }); }// 1. SNAKE
function snake() {
let [c, x] = canvas(400, 400), n = 20, s = [{ x: 10, y: 10 }], food = { x: 15, y: 15 }, dir = { x: 1, y: 0 }, next = dir, acc = 0, score = 0;
function spawn() { do { food = { x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n) }; } while (s.some(q => q.x === food.x && q.y === food.y)); }
bind(k => { let m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (m && m[0] !== -dir.x && m[1] !== -dir.y) next = { x: m[0], y: m[1] }; });
function step() {
dir = next; let h = { x: s[0].x + dir.x, y: s[0].y + dir.y };
if (h.x < 0 || h.y < 0 || h.x >= n || h.y >= n || s.some(q => q.x === h.x && q.y === h.y)) return end('Signal verloren', Score: ${score}, score);
s.unshift(h);
if (h.x === food.x && h.y === food.y) { score += 10; spawn(); sound('win'); } else s.pop();
}
loop(dt => { acc += dt; while (acc > .145) { acc -= .145; step(); } }, () => {
x.fillStyle = '#050713'; x.fillRect(0, 0, 400, 400);
x.fillStyle = '#ff6386'; x.fillRect(food.x * 20 + 3, food.y * 20 + 3, 14, 14);
s.forEach((q, i) => { x.fillStyle = i ? '#55e6ff' : '#c75cff'; x.fillRect(q.x * 20 + 2, q.y * 20 + 2, 16, 16); });
hud(SCORE <b>${score}</b> · BEST <b>${scoreText('snake')}</b>);
});
}// 2. TETRIS
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
newp(); if (hit()) end('Matrix voll', Score: ${score}, score);
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
for (let gy = 0; gy <= 600; gy += 30) { x.beginPath(); x.moveTo(0, gy); x.lineTo(300, gy); x.stroke(); }x.shadowBlur = 8;
B.forEach((r, y) => r.forEach((v, z) => {
  if (v) { x.fillStyle = v; x.shadowColor = v; x.fillRect(z * 30 + 1, y * 30 + 1, 28, 28); }
}));

x.fillStyle = p.col; x.shadowColor = p.col; x.shadowBlur = 12;
p.m.forEach((r, y) => r.forEach((v, z) => v && x.fillRect((p.x + z) * 30 + 1, (p.y + y) * 30 + 1, 28, 28)));
x.shadowBlur = 0;
hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('tetris')}</b>`);
});
}function flappy() { let [c, x] = canvas(), y = 250, v = 0, p = [], score = 0, acc = 0, started = false, time = 0; function flap() { if (roundEnded) return; started = true; v = -320; sound(); } bind(k => { if (k === ' ' || k === 'ArrowUp') flap(); }); c.addEventListener('pointerdown', flap); cleanup = () => { c.removeEventListener('pointerdown', flap); }; loop(dt => { if (!started) return; time += dt; v += 900 * dt; y += v * dt; acc += dt; if (acc > .14) { acc = 0; if (!p.length || p.at(-1).x < 225) p.push({ x: 420, gap: 115 + Math.random() * 210, ok: false }); } for (const o of p) { o.x -= 165 * dt; if (o.x < 95 && o.x + 62 > 66 && (y - 14 < o.gap - 78 || y + 14 > o.gap + 78)) return end('Vogel abgestürzt', Score: ${score}, score); if (!o.ok && o.x < 66) { o.ok = true; score++; sound('win'); } } p = p.filter(o => o.x > -70); if (y < 0 || y > 520) end('Vogel abgestürzt', Score: ${score}, score); }, () => { let sky = x.createLinearGradient(0, 0, 0, 520); sky.addColorStop(0, '#07152f'); sky.addColorStop(.58, '#244e79'); sky.addColorStop(1, '#ff9d70'); x.fillStyle = sky; x.fillRect(0, 0, 400, 520); x.fillStyle = '#ffffff20'; for (let i = 0; i < 5; i++) { let cx = (i * 117 - (time * 18) % 520 + 520) % 520; x.beginPath(); x.ellipse(cx, 70 + i % 3 * 45, 38, 12, 0, 0, Math.PI * 2); x.ellipse(cx + 28, 68 + i % 3 * 45, 25, 10, 0, 0, Math.PI * 2); x.fill(); } x.fillStyle = '#12334a'; for (let i = 0; i < 10; i++) { let bx = i * 48; x.fillRect(bx, 420 - (i % 3) * 14, 30, 100); x.fillStyle = '#ffe06355'; x.fillRect(bx + 5, 432 - (i % 3) * 14, 3, 24); x.fillStyle = '#12334a'; } for (const o of p) { let g = x.createLinearGradient(o.x, 0, o.x + 62, 0); g.addColorStop(0, '#168667'); g.addColorStop(.48, '#60ffc0'); g.addColorStop(1, '#147556'); x.fillStyle = g; x.strokeStyle = '#a7ffdc'; x.lineWidth = 2; x.fillRect(o.x, 0, 62, o.gap - 78); x.strokeRect(o.x + 1, 0, 60, o.gap - 78); x.fillRect(o.x, o.gap + 78, 62, 520); x.strokeRect(o.x + 1, o.gap + 79, 60, 440 - o.gap); x.fillStyle = '#7cffc2'; x.fillRect(o.x - 7, o.gap - 91, 76, 15); x.strokeStyle = '#b5ffe0'; x.strokeRect(o.x - 7, o.gap - 91, 76, 15); x.fillRect(o.x - 7, o.gap + 76, 76, 15); x.strokeRect(o.x - 7, o.gap + 76, 76, 15); x.fillStyle = '#0a674e'; for (let by = 28; by < o.gap - 95; by += 34) x.fillRect(o.x + 8, by, 4, 12); for (let by = o.gap + 100; by < 510; by += 34) x.fillRect(o.x + 8, by, 4, 12); } x.fillStyle = '#553b2b'; x.fillRect(0, 495, 400, 25); x.fillStyle = '#b48250'; for (let i = 0; i < 400; i += 24) x.fillRect(i, 495, 12, 3); x.save(); x.translate(80, y); x.rotate(clamp(v / 650, -.45, .55)); x.shadowColor = '#ffcf5a'; x.shadowBlur = 16; x.fillStyle = '#f8bd42'; x.beginPath(); x.ellipse(0, 0, 19, 14, 0, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0; x.fillStyle = '#e99425'; x.beginPath(); x.ellipse(-4, 7, 10, 5, -.3 + Math.sin(time * 16) * .14, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff1ba'; x.beginPath(); x.ellipse(7, -4, 6, 7, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#162035'; x.beginPath(); x.arc(9, -4, 2.2, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ff704f'; x.beginPath(); x.moveTo(15, 1); x.lineTo(28, 5); x.lineTo(15, 9); x.closePath(); x.fill(); x.fillStyle = '#e98b29'; x.beginPath(); x.moveTo(-15, 0); x.lineTo(-25, -7); x.lineTo(-22, 4); x.closePath(); x.fill(); x.restore(); x.fillStyle = '#fff'; x.font = 'bold 25px system-ui'; x.textAlign = 'center'; x.fillText(String(score), 200, 48); if (!started) { x.fillStyle = '#041020b8'; x.fillRect(35, 210, 330, 86); x.fillStyle = '#fff'; x.font = 'bold 18px system-ui'; x.fillText('TIPPE, DAMIT DER VOGEL FLIEGT', 200, 246); x.font = '14px system-ui'; x.fillText('Tippen oder Leertaste', 200, 273); } hud(SCORE <b>${score}</b> · BEST <b>${scoreText('flappy')}</b>); }); }// 3. STAR DEFENDER
function space() {
let [c, x] = canvas(), px = 200, shots = [], enemies = [], powerups = [], explosions = [],
acc = 0, shootCooldown = 0, boostTimer = 0, baseLives = 10, baseHitFlash = 0, score = 0;function shoot() {
if (shootCooldown > 0) return;
shots.push({ x: px, y: 455 });
sound();
shootCooldown = boostTimer > 0 ? 0.12 : 0.25;
}bind(k => {
if (k === 'ArrowLeft') px -= 28;
if (k === 'ArrowRight') px += 28;
if (k === ' ' || k === 'ArrowUp') shoot();
});
c.onpointermove = e => { let r = c.getBoundingClientRect(); px = clamp((e.clientX - r.left) * 400 / r.width, 15, 385); };
c.onpointerdown = shoot;
cleanup = () => { c.onpointermove = null; c.onpointerdown = null; };loop(dt => {
px = clamp(px, 15, 385);
if (shootCooldown > 0) shootCooldown -= dt;
if (boostTimer > 0) boostTimer -= dt;
if (baseHitFlash > 0) baseHitFlash -= dt;acc += dt;
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
x.fillStyle = '#fff'; for (let i = 0; i < 38; i++) x.fillRect((i * 71) % 400, (i * 113) % 520, 1, 1);if (baseLives <= 3) {
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
}// 4. PONG
function pong() {
$('#gameUI').innerHTML = <div class="mode-select-box" id="pongModeSelect"> <h3 style="color:var(--a); margin-bottom:10px;">Spielmodus wählen</h3> <button class="mode-btn" id="btnVsAI">🤖 Gegen KI</button> <button class="mode-btn" id="btnVs1v1">🎮 1 gegen 1 (Lokal)</button> </div>;$('#btnVsAI').onclick = () => startPongGame(false);
$('#btnVs1v1').onclick = () => startPongGame(true);function startPongGame(isMultiplayer) {
let [c, x] = canvas(), py = 220, ai = 220, b = { x: 200, y: 260, vx: -230, vy: 145 }, player = 0, opponent = 0;function serve(toPlayer) { b = { x: 200, y: 260, vx: toPlayer ? -230 : 230, vy: (Math.random() - .5) * 210 }; }
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

  if (b.vx < 0 && b.x <= 28 && b.y >= py - 8 && b.y <= py + 88) {
    b.x = 28; b.vx = Math.min(410, Math.abs(b.vx) * 1.05); b.vy += (b.y - (py + 40)) * .85;
  }
  if (b.vx > 0 && b.x >= 365 && b.y >= ai - 8 && b.y <= ai + 88) {
    b.x = 365; b.vx = -Math.min(410, Math.abs(b.vx) * 1.05); b.vy += (b.y - (ai + 40)) * .85;
  }
  if (b.x < 0) point('opponent'); else if (b.x > 405) point('player');
}, () => {
  x.fillStyle = '#050713'; x.fillRect(0, 0, 400, 520);
  x.fillStyle = '#263a6e'; for (let y = 0; y < 520; y += 24) x.fillRect(198, y, 4, 14);
  x.fillStyle = '#55e6ff'; x.fillRect(12, py, 10, 80);
  x.fillStyle = '#cb5cff'; x.fillRect(378, ai, 10, 80);
  x.fillStyle = '#ffe063'; x.shadowBlur = 18; x.shadowColor = '#ffe063'; x.fillRect(b.x, b.y, 10, 10); x.shadowBlur = 0;
  hud(`SPIELER 1 <b>${player}</b> : <b>${opponent}</b> ${isMultiplayer ? 'SPIELER 2' : 'KI'} · BIS 7`);
});
}
}function game2048() { let b = Array.from({ length: 4 }, () => Array(4).fill(0)), score = 0; function add() { let z = []; b.forEach((r, y) => r.forEach((v, x) => !v && z.push([y, x]))); if (z.length) { let [y, x] = z[Math.random() * z.length | 0]; b[y][x] = Math.random() < .9 ? 2 : 4; } } function slide(a) { let q = a.filter(Boolean), out = []; for (let i = 0; i < q.length; i++) { if (q[i] === q[i + 1]) { let v = q[i] * 2; out.push(v); score += v; i++; } else out.push(q[i]); } return out.concat(Array(4 - out.length).fill(0)); } function stuck() { return b.every((r, y) => r.every((v, x) => v && (x === 3 || v !== r[x + 1]) && (y === 3 || v !== b[y + 1][x]))); } function move(k) { let old = JSON.stringify(b); if (k === 'ArrowLeft') b = b.map(slide); if (k === 'ArrowRight') b = b.map(r => slide(r.reverse()).reverse()); if (k === 'ArrowUp' || k === 'ArrowDown') { for (let x = 0; x < 4; x++) { let col = b.map(r => r[x]); if (k === 'ArrowDown') col.reverse(); col = slide(col); if (k === 'ArrowDown') col.reverse(); col.forEach((v, y) => b[y][x] = v); } } if (old !== JSON.stringify(b)) { add(); sound(); render(); if (b.flat().includes(2048)) end('2048 erreicht!', Score: ${score}, score, true); else if (b.flat().every(Boolean) && stuck()) end('Keine Züge mehr', Score: ${score}, score); } else if (b.flat().every(Boolean) && stuck()) end('Keine Züge mehr', Score: ${score}, score); } function render() { $('#gameUI').innerHTML = <div class="hud">SCORE <b>${score}</b> · BEST <b>${scoreText('2048')}</b></div><div class="board b4" id="b2048"></div><p class="muted" style="text-align:center">Wische oder nutze die Pfeiltasten.</p>; let colors = { 2: '#1d356a', 4: '#254b82', 8: '#3268a5', 16: '#8354c3', 32: '#b454b0', 64: '#dc597e', 128: '#e88853', 256: '#edb94f', 512: '#eff06a', 1024: '#a6f47b', 2048: '#69ffd2' }; let grid = $('#b2048'); grid.innerHTML = b.flat().map(v => <div class="tile" style="background:${v ? colors[v] || '#fff' : 'var(--tile)'};color:${v ? '#071125' : 'inherit'}">${v || ''}</div>).join(''); } add(); add(); render(); bind(move); }// TIC-TAC-TOE
function ttt() {
$('#gameUI').innerHTML = <div class="mode-select-box" id="tttModeSelect"> <h3 style="color:var(--a); margin-bottom:10px;">Spielmodus wählen</h3> <button class="mode-btn" id="btnTttAI">🤖 Gegen KI</button> <button class="mode-btn" id="btnTtt1v1">🎮 1 gegen 1 (Lokal)</button> </div>;$('#btnTttAI').onclick = () => startTTTGame(false);
$('#btnTtt1v1').onclick = () => startTTTGame(true);function startTTTGame(isMultiplayer) {
let b = Array(9).fill(''), turn = 'X', score = 0;function win(p) {
  return [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]].some(c => c.every(i => p[i] === turn));
}

function ai() {
  let empty = b.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  if (!empty.length) return;
  let pick = empty[Math.random() * empty.length | 0];
  b[pick] = 'O';
  if (win(b)) { render(); end('KI gewinnt', `Match beendet.`, score); return; }
  if (b.every(Boolean)) { render(); end('Unentschieden', `Kein Sieger.`, score); return; }
  turn = 'X';
  render();
}

function click(i) {
  if (b[i] || roundEnded) return;
  if (!isMultiplayer && turn !== 'X') return;

  b[i] = turn;
  sound();

  if (win(b)) {
    score = 100; render();
    let winnerName = isMultiplayer ? `Spieler (${turn})` : (turn === 'X' ? 'Du' : 'KI');
    end(`${winnerName} gewinnt!`, `Match beendet.`, score, turn === 'X' || isMultiplayer);
    return;
  }
  if (b.every(Boolean)) { render(); end('Unentschieden', `Kein Sieger.`, score); return; }

  turn = turn === 'X' ? 'O' : 'X';
  render();

  if (!isMultiplayer && turn === 'O') {
    setTimeout(ai, 300);
  }
}

function render() {
  let modeTitle = isMultiplayer ? 'SPIELER (X) vs SPIELER (O)' : 'SPIELER (X) vs KI (O)';
  $('#gameUI').innerHTML = `<div class="hud">${modeTitle} · ZUG: <b>${turn}</b> · BEST <b>${scoreText('ttt')}</b></div><div class="board ttt">${b.map((v, i) => `<button class="${v.toLowerCase()}" onclick="tttClick(${i})">${v}</button>`).join('')}</div>`;
  window.tttClick = click;
}
render();
}
}function memory() { let icons = ['⚡', '🔥', '💎', '🚀', '🎮', '🎲', '🎯', '👾'], cards = [...icons, ...icons].sort(() => Math.random() - .5), open = [], matched = [], moves = 0; function click(i) { if (open.length >= 2 || open.includes(i) || matched.includes(i) || roundEnded) return; open.push(i); sound(); render(); if (open.length === 2) { moves++; let [a, b] = open; if (cards[a] === cards[b]) { matched.push(a, b); open = []; sound('win'); render(); if (matched.length === cards.length) { let score = Math.max(10, 200 - moves * 10); end('Geschafft!', Gefunden in ${moves} Zügen., score, true); } } else setTimeout(() => { open = []; render(); }, 800); } } function render() { $('#gameUI').innerHTML = `<div class="hud">ZÜGE <b>${moves}</b> · BEST <b>${scoreText('memory')}</b></div><div class="board memory">${cards.map((c, i) => `<button class="${open.includes(i) || matched.includes(i) ? 'open' : ''}" onclick="memClick(${i})">${open.includes(i) || matched.includes(i) ? c : ''}).join('')}</div>; window.memClick = click; } render(); }// 5. FRUIT MERGE
function fruit() {
let [c, x] = canvas(360, 520), fruits = [], score = 0, cooldown = 0,
dropper = { x: 180 }, consecutiveSameCount = 0, lastType = -1;const types = [
{ r: 14, c: '#ff6386', sides: 0, label: '●' },
{ r: 20, c: '#55e6ff', sides: 0, label: '●' },
{ r: 28, c: '#ffe063', sides: 4, label: '■' },
{ r: 36, c: '#72ffae', sides: 5, label: '⬟' },
{ r: 45, c: '#cb5cff', sides: 6, label: '⬢' },
{ r: 56, c: '#ff9d70', sides: 8, label: '⯁' },
{ r: 68, c: '#75ffbe', sides: 0, label: '👑' }
];function getNextType() {
let rolled = Math.floor(Math.random() * 3);
if (rolled === lastType) {
consecutiveSameCount++;
if (consecutiveSameCount >= 3) {
rolled = 2;
consecutiveSameCount = 0;
}
} else {
consecutiveSameCount = 1;
lastType = rolled;
}
return rolled;
}let nextType = getNextType();function drop() {
if (cooldown > 0 || roundEnded) return;
fruits.push({ x: dropper.x, y: 70, vx: 0, vy: 120, type: nextType });
sound();
cooldown = 1.3;
nextType = getNextType();
}bind(k => { if (k === ' ' || k === 'ArrowDown') drop(); });
c.onpointermove = e => { let r = c.getBoundingClientRect(); dropper.x = clamp((e.clientX - r.left) * 360 / r.width, 45, 315); };
c.onpointerdown = drop;
cleanup = () => { c.onpointermove = null; c.onpointerdown = null; };loop(dt => {
if (cooldown > 0) cooldown -= dt;fruits.forEach(f => {
  f.vy += 380 * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.vx *= 0.96;

  let r = types[f.type].r;
  if (f.x < 35 + r) { f.x = 35 + r; f.vx = Math.abs(f.vx) * 0.3; }
  if (f.x > 325 - r) { f.x = 325 - r; f.vx = -Math.abs(f.vx) * 0.3; }
  if (f.y > 480 - r) { f.y = 480 - r; f.vy = 0; f.vx *= 0.8; }
});

for (let i = 0; i < fruits.length; i++) {
  for (let j = i + 1; j < fruits.length; j++) {
    let a = fruits[i], b = fruits[j], dx = b.x - a.x, dy = b.y - a.y,
      dist = Math.hypot(dx, dy), minDist = types[a.type].r + types[b.type].r;

    if (dist < minDist) {
      if (a.type === b.type && a.type < types.length - 1) {
        a.type++; score += (a.type + 1) * 15;
        a.vx = (a.vx + b.vx) * 0.5; a.vy = (a.vy + b.vy) * 0.5;
        fruits.splice(j, 1);
        sound('win');
        break;
      } else {
        let overlap = minDist - dist;
        let nx = dx / (dist || 1), ny = dy / (dist || 1);
        a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
      }
    }
  }
}

let overflow = fruits.some(f => f.y - types[f.type].r < 100 && Math.abs(f.vy) < 10);
if (overflow && cooldown <= 0) return end('Glas überfüllt!', `Score: ${score}`, score);
}, () => {
x.fillStyle = '#050713'; x.fillRect(0, 0, 360, 520);x.strokeStyle = 'rgba(123, 198, 255, 0.4)'; x.lineWidth = 4;
x.strokeRect(30, 90, 300, 400);
x.fillStyle = 'rgba(18, 24, 51, 0.35)'; x.fillRect(30, 90, 300, 400);

x.strokeStyle = 'rgba(255, 255, 255, 0.6)'; x.lineWidth = 2; x.setLineDash([6, 6]);
x.beginPath(); x.moveTo(30, 110); x.lineTo(330, 110); x.stroke(); x.setLineDash([]);

fruits.forEach(f => {
  let t = types[f.type];
  x.fillStyle = t.c; x.shadowColor = t.c; x.shadowBlur = 10;
  
  if (t.sides === 0) {
    x.beginPath(); x.arc(f.x, f.y, t.r, 0, Math.PI * 2); x.fill();
  } else {
    x.beginPath();
    for (let s = 0; s < t.sides; s++) {
      let a = (s * Math.PI * 2) / t.sides;
      let px = f.x + t.r * Math.cos(a), py = f.y + t.r * Math.sin(a);
      s === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.closePath(); x.fill();
  }
  x.shadowBlur = 0;
  x.fillStyle = '#000'; x.font = 'bold 12px system-ui'; x.textAlign = 'center';
  x.fillText(t.label, f.x, f.y + 4);
});

let previewType = types[nextType];
x.fillStyle = previewType.c; x.globalAlpha = cooldown > 0 ? 0.3 : 0.85;
x.beginPath(); x.arc(dropper.x, 50, previewType.r * 0.7, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;

let cooldownText = cooldown > 0 ? ` · ⏳ <b>${cooldown.toFixed(1)}s</b>` : '';
hud(`SCORE <b>${score}</b> · BEST <b>${scoreText('fruit')}</b>${cooldownText}`);
});
}// 6. BEAT REAKTOR
function rhythm() {
let [c, x] = canvas(360, 500), notes = [], score = 0, acc = 0, lives = 5,
feedbackText = '', feedbackTimer = 0, feedbackColor = '#55e6ff';function triggerHit(isKeyTrigger = true) {
let hitIndex = notes.findIndex(n => Math.abs(n.y - 420) < 45);if (hitIndex !== -1) {
  let diff = Math.abs(notes[hitIndex].y - 420);
  if (diff <= 14) {
    score += 30;
    feedbackText = 'PERFEKT!';
    feedbackColor = '#ffe063';
    burst(innerWidth / 2, innerHeight / 2 - 20);
    sound('win');
  } else {
    score += 15;
    feedbackText = 'GUT!';
    feedbackColor = '#72ffae';
    sound();
  }
  feedbackTimer = 0.6;
  notes.splice(hitIndex, 1);
} else if (isKeyTrigger) {
  lives--;
  feedbackText = 'FEHLER!';
  feedbackColor = '#ff6386';
  feedbackTimer = 0.6;
  sound('lose');
  if (lives <= 0) return end('Keine Herzen mehr', `Score: ${score}`, score);
}
}bind(k => { if (k === ' ' || k === 'ArrowDown') triggerHit(true); });loop(dt => {
acc += dt;
if (feedbackTimer > 0) feedbackTimer -= dt;if (acc > 0.75) {
  acc = 0;
  notes.push({ y: 0 });
}

notes.forEach(n => n.y += 230 * dt);

for (let i = notes.length - 1; i >= 0; i--) {
  if (notes[i].y > 465) {
    notes.splice(i, 1);
    lives--;
    feedbackText = 'VERPASST!';
    feedbackColor = '#ff6386';
    feedbackTimer = 0.6;
    sound('lose');
    if (lives <= 0) return end('Keine Herzen mehr', `Score: ${score}`, score);
  }
}
}, () => {
x.fillStyle = '#050713'; x.fillRect(0, 0, 360, 500);x.fillStyle = 'rgba(22, 40, 88, 0.8)'; x.fillRect(0, 405, 360, 30);
x.strokeStyle = '#55e6ff'; x.lineWidth = 2; x.shadowColor = '#55e6ff'; x.shadowBlur = 10;
x.strokeRect(0, 405, 360, 30); x.shadowBlur = 0;

x.fillStyle = '#55e6ff';
notes.forEach(n => {
  x.shadowColor = '#55e6ff'; x.shadowBlur = 8;
  x.fillRect(130, n.y, 100, 16);
});
x.shadowBlur = 0;

if (feedbackTimer > 0) {
  x.fillStyle = feedbackColor; x.font = 'bold 22px system-ui'; x.textAlign = 'center';
  x.shadowColor = feedbackColor; x.shadowBlur = 12;
  x.fillText(feedbackText, 180, 465);
  x.shadowBlur = 0;
}

hud(`HERZEN: <b>${'❤️'.repeat(lives)}</b> (${lives}/5) · SCORE <b>${score}</b>`);
});
}renderMeta();
renderGames();
