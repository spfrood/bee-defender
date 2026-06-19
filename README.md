# 🐝 Bee Defender

Browser-based physics puzzle: draw ink barriers to protect the dog from swarming bees. Survive the timer to win the level.

- Vanilla HTML/CSS/JS frontend, Matter.js physics (served locally — no CDNs)
- Seeded procedural levels — deterministic and shareable via URL
- Node.js + Express backend with a SQLite (better-sqlite3) leaderboard
- No cookies, no tracking; IPs stored only as salted SHA-256 hashes

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
# open http://localhost:3001
```

## Production

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

The SQLite database is created at `./data/scores.db`.

## API

- `POST /api/score` — `{ username, score, level }`, rate-limited
- `GET /api/leaderboard?limit=20` — top scores, ordered by score
