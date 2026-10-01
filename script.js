// Beispiel-Datenbank mit Spielern (kann später durch eine echte Datenbank ersetzt werden)
const allPlayers = [
  { username: "ShadowGamer", xp: 4500, coins: 1200 },
  { username: "PixelQueen", xp: 3800, coins: 2100 },
  { username: "ProGamer99", xp: 3200, coins: 850 },
  { username: "ArcadeMaster", xp: 2900, coins: 1500 },
  { username: "Speedrunner", xp: 2700, coins: 900 },
  { username: "RetroKing", xp: 2400, coins: 1100 },
  { username: "CyberKnight", xp: 2100, coins: 400 },
  { username: "GamerGirl", xp: 1900, coins: 950 },
  { username: "PixelArt", xp: 1700, coins: 600 },
  { username: "LevelUp", xp: 1500, coins: 700 },
  { username: "NoobMaster", xp: 1200, coins: 500 },
  { username: "DeinName", xp: 850, coins: 300 } // Beispiel für dich als eingeloggter Spieler
];

// Aktuell eingeloggter Spieler
const currentUser = { username: "DeinName", xp: 850, coins: 300 };

let currentCategory = 'xp'; // Standard: XP

function setCategory(category) {
  currentCategory = category;
  
  // Tab Button Styling
  document.getElementById('tab-xp').classList.toggle('active', category === 'xp');
  document.getElementById('tab-coins').classList.toggle('active', category === 'coins');

  renderLeaderboard();
}

function renderLeaderboard() {
  const listContainer = document.getElementById('leaderboard-list');
  const userRankContainer = document.getElementById('user-rank-card');

  // 1. Sortieren nach gewählter Kategorie (XP oder Münzen)
  const sortedPlayers = [...allPlayers].sort((a, b) => b[currentCategory] - a[currentCategory]);

  // 2. Top 10 rendern
  const top10 = sortedPlayers.slice(0, 10);
  listContainer.innerHTML = '';

  top10.forEach((player, index) => {
    const rank = index + 1;
    let rankBadge = `#${rank}`;
    if (rank === 1) rankBadge = '🥇';
    if (rank === 2) rankBadge = '🥈';
    if (rank === 3) rankBadge = '🥉';

    const row = document.createElement('div');
    row.className = `rank-row rank-${rank}`;
    row.innerHTML = `
      <span class="rank-number">${rankBadge}</span>
      <span class="player-name">${player.username}</span>
      <div class="player-stats">
        <span class="stat-xp">⚡ ${player.xp.toLocaleString()} XP</span>
        <span class="stat-coins">🪙 ${player.coins.toLocaleString()} Münzen</span>
      </div>
    `;
    listContainer.appendChild(row);
  });

  // 3. Rang des eigenen Spielers berechnen
  const userIndex = sortedPlayers.findIndex(p => p.username === currentUser.username);
  const userRank = userIndex + 1;

  if (userRank > 10) {
    // Wenn außerhalb der Top 10 -> Eigene Zeile anzeigen
    userRankContainer.style.display = 'block';
    userRankContainer.innerHTML = `
      <div style="font-size: 0.85rem; color: #a0a5ba; margin-bottom: 4px;">DEINE PLATZIERUNG</div>
      <div class="rank-row" style="background: transparent; padding: 0;">
        <span class="rank-number" style="color: #6366f1;">#${userRank}</span>
        <span class="player-name">${currentUser.username} (Du)</span>
        <div class="player-stats">
          <span class="stat-xp">⚡ ${currentUser.xp.toLocaleString()} XP</span>
          <span class="stat-coins">🪙 ${currentUser.coins.toLocaleString()} Münzen</span>
        </div>
      </div>
    `;
  } else {
    // Wenn bereits in den Top 10 -> Ausblenden
    userRankContainer.style.display = 'none';
  }
}

// Beim Laden der Seite ausführen
document.addEventListener('DOMContentLoaded', () => {
  renderLeaderboard();
});
