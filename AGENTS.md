# AI Agent Instructions for Bee Defender

Welcome! If you are an AI assistant working on the Bee Defender codebase, please adhere to the following rules and guidelines to ensure consistency and prevent regressions.

## 1. Core Constraints & Conventions

- **No Build Tools**: The frontend is built with pure Vanilla HTML, CSS, and JS. Do not introduce Webpack, Vite, Babel, TypeScript, or any other build steps for the frontend.
- **Module Pattern**: The frontend code relies on Immediately Invoked Function Expressions (IIFE) assigned to the global `window` object (e.g., `window.PhysicsEngine = ...`). Do not convert these to ES Modules (`import`/`export`) or CommonJS unless explicitly requested to refactor the entire app.
- **No External CDNs**: All frontend dependencies (like `matter-js`) must be served locally. Do not add `<script src="https://cdn...">` tags to `index.html`.
  - To add a dependency: `npm install <package>`, then add an Express route in `server.js` to serve the minified build file from `node_modules`, and add a `<script>` tag referencing your local route in `index.html`.

## 2. Architecture & File Locations

- **`/client/js/`**: Contains all the frontend logic.
  - `game.js`: The main game loop and state machine (START, INTRO, PLAY, WIN, LOSE, etc.).
  - `physics.js`: Wrapper around Matter.js handling physics bodies and the physics world.
  - `renderer.js`: Handles all Canvas 2D drawing operations.
  - `ui.js`: DOM manipulation for overlay screens and HUD.
  - `level.js`: Procedural level generation logic.
  - `bee.js`, `input.js`, `utils.js`, `leaderboard.js`, `share.js`: Supporting modules.
- **`/server/`**: Contains the Node.js backend.
  - `server.js`: Main Express entrypoint.
  - `routes/scores.js`: API endpoints for the leaderboard.
- **`/database/`**: Contains SQLite interaction logic.
  - `db.js`: Initializes and handles queries for `better-sqlite3`.

## 3. Working with Game Logic

- **Separation of Concerns**: Keep physics updates in `physics.js`, visual rendering in `renderer.js`, and game state logic in `game.js`.
- **Canvas Rendering**: Changes to the visual presentation (colors, particle effects, UI drawn on canvas) generally require editing `renderer.js` and sometimes `game.js` (for managing particle state).
- **Physics**: Changes to hitboxes, collisions, or physics behaviors (like bee gnawing or bomber explosions) should happen in `game.js` (event handlers) or `physics.js` (engine setup).

## 4. Testing Changes

- To run the application, ensure you run `npm install` followed by `npm start`.
- Access the game at `http://localhost:3001`.
- For backend or game logic changes, ensure you test the full loop: Play a level -> Win -> Play Level 2 -> Lose -> Submit Score -> View Leaderboard.
- Watch the server logs for any unhandled exceptions during play.

## 5. Modifying Dependencies

- Do not alter the existing dependencies unless necessary for security or bug fixes.
- For new backend features, prefer standard library (like `crypto` for hashing) over new dependencies where practical.

---

## Git workflow & safety (applies to every agent and every human)

These rules are identical across all of this owner's active repos. The full
reference lives outside this repo, in `~/GIT-WORKFLOW.md` on the dev box.

### The invariant

**GitHub `main` is the single source of truth.** Every writer reads from and
writes to GitHub. Never assume a local checkout is current — always pull first;
another agent may have moved `main` since you last looked.

### Branch and PR flow

- **Never commit directly to `main`.** Every change goes on a branch and lands
  through a pull request, no matter how small or who is making it.
- Branch naming: `feat/…`, `fix/…`, `docs/…`, `chore/…` plus a short slug
  (`feat/red-ink-reservoir`, not `feature-red-ink-17588214011985568848`).
- **One logical change per commit.** Do not bundle unrelated work — a commit
  touching scoring, timing, and enemy behaviour at once cannot be reviewed or
  reverted. Split it.
- Commit subject: imperative mood, ≤72 characters, no trailing period
  ("Add red ink reservoir", not "Added red ink reservoir.").
- PRs squash-merge, so the PR title becomes the commit on `main` — write it as
  the commit message you want to keep.

### Never commit secrets or PII

This is a hard rule with no exceptions.

- **No credentials**: API keys, tokens, passwords, private keys, connection
  strings. They belong in `.env` (gitignored) or in deploy-only config.
- **No personal information**: real email addresses, phone numbers, street
  addresses, or any end-user data. Role addresses on the project's own domain
  (`support@…`, `noreply@…`) are fine; personal mailboxes are not.
- A `gitleaks` check runs on every PR and will fail the build. On the dev box a
  pre-commit hook blocks it earlier. If you hit a false positive, add a trailing
  `gitleaks:allow` comment on the line or a fingerprint to `.gitleaksignore` —
  never disable the check itself.

### Never touch runtime state or deploy config

- Anything gitignored is runtime state that lives only on the server —
  databases, `data/`, `.env`, uploads, salts. Do not add, move, or "clean up"
  these paths.
- Do not edit PM2 configs, nginx configs, systemd units, or port numbers. The
  deploy environment is managed outside this repo.
- Do not change the port an app listens on, or add a build step to a project
  that deliberately has none.

### Before you finish

- Ensure the app still starts and the primary flow works (see the testing
  section above for this project's specifics).
- Leave the working tree clean — no stray scratch files, no commented-out
  debris, no `console.log` left from debugging.
