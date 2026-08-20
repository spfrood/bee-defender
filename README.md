# 🐝 Bee Defender

Browser-based physics puzzle: draw ink barriers to protect the dog from swarming bees. Survive the timer to win the level.

- Vanilla HTML/CSS/JS frontend, Matter.js physics (served locally — no CDNs)
- Seeded procedural levels — deterministic and shareable via URL
- Node.js + Express backend with a SQLite (better-sqlite3) leaderboard
- No cookies, no tracking; IPs stored only as salted SHA-256 hashes

## Game Design & Features

- **Ink Types**:
  - **Black Ink**: Acts as a physical barrier.
  - **Red Ink**: Burns bees upon contact, sacrificing the barrier section.
- **Bee Types**:
  - **Normal Bees**: Gnaw through barriers over time.
  - **Bomber Bees**: Explode and blow a gap in barriers upon impact (appears in later levels).
- **Progression**: Clear levels and carry over unused ink to the next level. Score is based on level number and unused ink!

## Architecture

- **Frontend**: Vanilla HTML/CSS/JS with Matter.js for physics. Uses the IIFE module pattern. No build tools (Webpack, Vite, etc.) are used.
- **Backend**: Node.js with Express, providing an API and serving static files.
- **Database**: SQLite (better-sqlite3) for storing leaderboard data.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
# open http://localhost:3001

# For development with nodemon:
npm run dev
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
