'use strict';

const Leaderboard = (() => {

  async function submitScore(username, score, level) {
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score, level })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  async function fetchScores(limit = 20) {
    try {
      const res = await fetch('/api/leaderboard?limit=' + encodeURIComponent(limit));
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  async function render(highlightUsername, highlightScore) {
    const tbody = document.getElementById('leaderboard-body');
    const loading = document.getElementById('leaderboard-loading');

    loading.style.display = 'block';
    tbody.innerHTML = '';

    const entries = await fetchScores(20);

    loading.style.display = 'none';

    if (entries.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5">No scores yet — be the first!</td>';
      tbody.appendChild(tr);
      return;
    }

    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

    for (const entry of entries) {
      const tr = document.createElement('tr');
      const rankLabel = entry.rank <= 3 ? medals[entry.rank - 1] : '#' + entry.rank;
      let dateStr = '';
      if (entry.date) {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
      }
      tr.innerHTML =
        '<td>' + rankLabel + '</td>' +
        '<td>' + escapeHtml(entry.username) + '</td>' +
        '<td>' + Number(entry.score).toLocaleString() + '</td>' +
        '<td>' + Number(entry.level) + '</td>' +
        '<td>' + escapeHtml(dateStr) + '</td>';
      if (
        highlightUsername &&
        entry.username === highlightUsername &&
        entry.score === highlightScore
      ) {
        tr.classList.add('my-score');
      }
      tbody.appendChild(tr);
    }
  }

  return { submitScore, fetchScores, render };
})();
