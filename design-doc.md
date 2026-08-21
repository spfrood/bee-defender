# Bee Defender — Game Design & Implementation Document

**Purpose:** This document is a complete specification for Claude Code to rebuild the Bee Defender browser game from scratch. Every architectural decision, algorithm, constant, and cross-file contract is defined here. Follow it exactly — do not substitute libraries, invent missing pieces, or simplify implementations.

  

## Table of Contents

1.  [Project Overview](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#1-project-overview)
2.  [Tech Stack & Constraints](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#2-tech-stack--constraints)
3.  [File Structure](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#3-file-structure)
4.  [Visual Design System](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#4-visual-design-system)
5.  [Backend](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#5-backend)
6.  [Database](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#6-database)
7.  [Client Architecture](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#7-client-architecture)
8.  [Module Specifications](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#8-module-specifications)
      
      - [utils.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#81-utilsjs)
      - [level.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#82-leveljs)
      - [physics.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#83-physicsjs)
      - [bee.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#84-beejs)
      - [input.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#85-inputjs)
      - [renderer.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#86-rendererjs)
      - [leaderboard.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#87-leaderboardjs)
      - [share.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#88-sharejs)
      - [ui.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#89-uijs)
      - [game.js](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#810-gamejs)
9.  [Game State Machine](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#9-game-state-machine)
10. [Procedural Level Generation](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#10-procedural-level-generation)
11. [Physics Design](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#11-physics-design)
12. [Bee AI & Steering](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#12-bee-ai--steering)
13. [Scoring Formula](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#13-scoring-formula)
14. [Cross-File Contracts](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#14-cross-file-contracts)
15. [API Reference](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#15-api-reference)
16. [HTML Structure](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#16-html-structure)
17. [Setup & Deployment](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#17-setup--deployment)
18. [Known Issues & Required Fixes](https://docs.google.com/document/d/1pZ49-lXq-fyRYWu3NPE34UoMDL6U1Il7Cu1Dzgyy6bA/edit#18-known-issues--required-fixes)

  

## 1\. Project Overview

**Name:** Bee Defender  
**Genre:** Browser-based physics puzzle  
**Core loop:** The player draws ink lines on a canvas to create barriers. Bees spawn from the edges and use steering AI to navigate toward a dog in the center. If a bee touches the dog, the player loses. Surviving the full timer wins the level.

  

**Key differentiators:**

  

  - Fully self-hosted (no CDNs, no external analytics)
  - Seeded procedural level generation (levels are deterministic and shareable via URL)
  - Matter.js physics served locally from node\_modules
  - SQLite leaderboard — no auth required, username only

  

## 2\. Tech Stack & Constraints

|  |  |  |
| :-: | :-: | :-: |
| \*\*Layer\*\* | \*\*Technology\*\* | \*\*Notes\*\* |
| Frontend | Vanilla HTML/CSS/JS (ES6+) | No frameworks |
| Physics | Matter.js | Served from local node\\\_modules, NOT a CDN |
| Backend | Node.js + Express |   |
| Database | SQLite via better-sqlite3 | Requires build-essential to compile |
| Deployment | VPS or Node host | No serverless; SQLite is file-based |

  

**Hard constraints — never break these:**

  

  - No cookies (use sessionStorage for username only)
  - No external CDNs (serve Matter.js from /lib/matter.min.js, mapped to node\_modules/matter-js/build/matter.min.js by the Express server)
  - No tracking scripts, no analytics, no fingerprinting
  - IP stored only as SHA-256 hash with server-side salt — never returned in API responses
  - better-sqlite3 requires npm install on a machine with python3 and build-essential installed

  

## 3\. File Structure

bee-defender/

  

├── package.json

  

├── database/

  

│   └── db.js                  \# SQLite init, WAL mode, schema

  

├── server/

  

│   ├── server.js              \# Express app, CSP headers, static serving

  

│   └── routes/

  

│       └── scores.js          \# POST /api/score, GET /api/leaderboard

  

└── client/

  

    ├── index.html             \# Single HTML file, all screens

  

    ├── css/

  

    │   └── style.css

  

    └── js/

  

        ├── utils.js           \# Pure utility functions, RNG

  

        ├── level.js           \# Procedural level generator

  

        ├── physics.js         \# Matter.js wrapper (PhysicsEngine object)

  

        ├── bee.js             \# Bee class with steering AI

  

        ├── input.js           \# InputHandler (mouse + touch)

  

        ├── renderer.js        \# Renderer object, all canvas drawing

  

        ├── leaderboard.js     \# Leaderboard API calls + DOM rendering

  

        ├── share.js           \# URL encoding/decoding, Web Share API

  

        ├── ui.js              \# Screen state machine, HUD, toast

  

        └── game.js            \# Main loop, state machine, orchestration

  

## 4\. Visual Design System

### Color Palette

:root {

  

  --bg-deep:       \#1a2e0f;   /\* Page background — deep forest green \*/

  

  --bg-canvas:     \#2d5c1a;   /\* Game canvas background \*/

  

  --bg-panel:      \#0f1f09;   /\* HUD panels, overlays \*/

  

  --accent-amber:  \#f5c518;   /\* Primary accent — gold/amber \*/

  

  --accent-green:  \#4a9e2f;   /\* Secondary accent — mid green \*/

  

  --text-primary:  \#e8d5a3;   /\* Warm parchment white \*/

  

  --text-muted:    \#8fa870;   /\* Muted green-grey \*/

  

  --danger:        \#cc3333;   /\* Red for danger/loss states \*/

  

  --border:        \#3a6b20;   /\* Subtle green border \*/

  

}

### Typography

  - **Display / titles:** Georgia, 'Times New Roman', serif — used for level titles, score displays, result screens
  - **UI / body:** 'Trebuchet MS', Tahoma, sans-serif — used for HUD, buttons, leaderboard

### Canvas Drawing Style

  - **Drawn lines:** Triple-layered render: dark shadow (\#1e1204 at 55% alpha, +4px thick) → brown base (\#a07428, +1px thick) → gold highlight (\#e8b84a, -2px thick). All using quadratic bezier smoothing through midpoints.
  - **Current (in-progress) line:** Same triple layer but at reduced opacity (shadow 40%, base 70%, highlight 85%)
  - **Dog:** Canvas 2D art — warm brown oval body, rounded ears, white eye circles with dark pupils, black nose, curved smile. Danger proximity adds red glow via shadowColor.
  - **Bees:** Black oval body with amber stripes (drawn with globalCompositeOperation: 'source-atop'), translucent yellow-green wings with sine-animated flap, stinger, antennae.
  - **Obstacles:** Rounded rectangles styled as rocks, with radial gradient fill (mid-grey center → dark edge), subtle shadow.
  - **Background:** Offscreen canvas pre-rendered grass dot pattern; vignette overlay applied each frame.
  - **Danger pulse:** Red overlay on canvas at --danger-alpha CSS variable, applied when bees are close to the dog.
  - **Particles:** Circle bursts on bee spawn (gold) and bee-dog collision (red).

### Screen Layout

Five screens, only one visible at a time (CSS class active on .screen):

  

  - \#screen-start — title, play button
  - \#screen-intro — level stats (bee count, time, ink, hint), begin button
  - \#screen-game — canvas + HUD
  - \#screen-result — outcome title, score, buttons, score submission form
  - \#screen-leaderboard — table, back button

### HUD (overlaid on \#screen-game)

\[ Level N \]   \[ Timer ██████░░ 23s \]   \[ Ink ████░░░ 340px \]   \[ ð 2/5 \]

  

  - Timer bar: green → amber → red as time runs out
  - Ink bar: amber → red when below 20% remaining
  - Bee count: shows alive/total

  

## 5\. Backend

### package.json

{

  

  "name": "bee-defender",

  

  "version": "1.0.0",

  

  "scripts": {

  

    "start": "node server/server.js",

  

    "dev": "nodemon server/server.js"

  

  },

  

  "dependencies": {

  

    "better-sqlite3": "^9.4.3",

  

    "cors": "^2.8.5",

  

    "express": "^4.18.2",

  

    "express-rate-limit": "^7.1.5",

  

    "helmet": "^7.1.0",

  

    "matter-js": "^0.19.0"

  

  },

  

  "devDependencies": {

  

    "nodemon": "^3.0.2"

  

  }

  

}

### server/server.js

  - Express app on PORT env var, default 3000
  - Helmet with custom CSP: default-src 'self', script-src 'self' 'unsafe-inline', style-src 'self' 'unsafe-inline', img-src 'self' data:, connect-src 'self' — no external sources permitted
  - Static route: GET /lib/matter.min.js → serve node\_modules/matter-js/build/matter.min.js
  - Static files: express.static('client') for all other / paths
  - API routes: /api → ./routes/scores
  - SPA fallback: \* → client/index.html

### server/routes/scores.js

**POST** **/api/score**

  

  - Rate limit: 10 requests per 15 minutes per IP
  - Body: { username: string, score: number, level: number }
  - Validation:
      
      - username: 1–20 chars, must match /^\[A-Za-z0-9 \_-\]+$/
      - score: integer, 0–9,999,999
      - level: integer, 1–10,000
  - IP hashing: crypto.createHash('sha256').update(ip + SALT).digest('hex') where SALT is a hardcoded server-side secret string
  - On success: insert to DB, return { rank, username, score, level }
  - On validation failure: 400 with { error: string }

  

**GET** **/api/leaderboard**

  

  - Rate limit: 60 requests per minute per IP
  - Query param: limit (integer, 1–100, default 20)
  - Returns: array of { rank, username, score, level, date }
  - Ordered by score DESC

  

## 6\. Database

### database/db.js

  - Opens SQLite at ./data/scores.db (create directory if needed)
  - WAL mode: db.pragma('journal\_mode = WAL')
  - Schema:

  

CREATE TABLE IF NOT EXISTS scores (

  

  id          INTEGER PRIMARY KEY AUTOINCREMENT,

  

  username    TEXT    NOT NULL,

  

  score       INTEGER NOT NULL,

  

  level       INTEGER NOT NULL,

  

  ip\_hash     TEXT    NOT NULL,

  

  created\_at  DATETIME DEFAULT CURRENT\_TIMESTAMP

  

);

  

CREATE INDEX IF NOT EXISTS idx\_score ON scores (score DESC);

  

CREATE INDEX IF NOT EXISTS idx\_created ON scores (created\_at DESC);

  

  - Export db object (the better-sqlite3 instance) for use in routes

  

## 7\. Client Architecture

Scripts load in this exact order in index.html:

  

\<script src="/lib/matter.min.js"\>\</script\>

  

\<script\>/\* inline: CANVAS\_W=800, CANVAS\_H=600 constants \*/\</script\>

  

\<script src="/js/utils.js"\>\</script\>

  

\<script src="/js/level.js"\>\</script\>

  

\<script src="/js/physics.js"\>\</script\>

  

\<script src="/js/bee.js"\>\</script\>

  

\<script src="/js/input.js"\>\</script\>

  

\<script src="/js/renderer.js"\>\</script\>

  

\<script src="/js/leaderboard.js"\>\</script\>

  

\<script src="/js/share.js"\>\</script\>

  

\<script src="/js/ui.js"\>\</script\>

  

\<script src="/js/game.js"\>\</script\>

  

The inline script sets two globals used by multiple modules:

  

const CANVAS\_W = 800;

  

const CANVAS\_H = 600;

  

All modules are **immediately-invoked or object literals** — no ES module import/export. They communicate via globals (PhysicsEngine, Renderer, InputHandler, LevelGenerator, Bee, UI, Leaderboard, Share, and utility functions).

  

## 8\. Module Specifications

### 8.1 utils.js

Global functions — no wrapper object.

  

// Seeded pseudo-random number generator (Mulberry32 algorithm)

  

// Returns a function that yields floats in \[0, 1)

  

function mulberry32(seed) { ... }

  

// FNV-1a hash — converts a string seed to a uint32

  

function hashLevelSeed(str) { ... }

  

// Math helpers

  

function clamp(v, min, max) { ... }          // clamp v between min and max

  

function lerp(a, b, t) { ... }               // linear interpolation

  

function dist(ax, ay, bx, by) { ... }        // Euclidean distance (4 numeric args)

  

function dist2(ax, ay, bx, by) { ... }       // squared distance

  

function normalize(vec) { ... }              // { x, y } → unit vector object (returns {x, y})

  

function polylineLength(points) { ... }      // sum of segment lengths along \[{x,y}\] array

  

// Formatting

  

function formatTime(seconds) { ... }         // → "1:23" string

  

function lerpColor(hexA, hexB, t) { ... }    // interpolate between two hex colors → hex string

  

// DOM safety

  

function escapeHtml(str) { ... }             // escape \< \> & " '

  

**Critical signatures:**

  

  - dist(ax, ay, bx, by) — takes **four numbers**, not two objects
  - normalize(vec) — takes a {x, y} **object**, returns a {x, y} object
  - mulberry32(seed) — takes a **uint32 seed integer**, returns a **function** that yields floats

  

### 8.2 level.js

Single export: LevelGenerator object with one method.

  

const LevelGenerator = {

  

  generate(N) { ... }

  

};

  

**LevelGenerator.generate(N)** returns a levelConfig object:

  

{

  

  levelNum:      N,

  

  seed:          uint32,          // derived from N via hashLevelSeed

  

  beeCount:      integer,         // how many bees total this level

  

  survivalTime:  float,           // seconds player must survive

  

  inkLimit:      float,           // total pixels of ink available

  

  obstacleCount: integer,         // number of rock obstacles

  

  spawnInterval: float,           // seconds between bee spawns

  

  beeSpeed:      float,           // max bee speed (pixels/sec equivalent)

  

  beeForce:      float,           // seek force magnitude applied per frame

  

  dogPos:        { x, y },        // dog center position

  

  obstacles:     \[{ x, y, w, h }\],// obstacle rectangles

  

  beeSpawns:     \[{ x, y }\],      // spawn points along canvas edges

  

  hint:          string           // tip shown on level intro screen

  

}

  

**Scaling formulas** (N = level number, 1-indexed):

  

const beeCount      = clamp(2 + Math.floor((N - 1) \* 0.8),  2,   16);

  

const survivalTime  = 12 + (N - 1) \* 2.2;                        // seconds

  

const inkLimit      = clamp(600 - (N - 1) \* 16,             170, 600); // pixels

  

const obstacleCount = Math.floor((N - 1) / 3);

  

const spawnInterval = clamp(3.2 - (N - 1) \* 0.12,           0.7, 3.2); // seconds

  

const beeSpeed      = clamp(1.0 + (N - 1) \* 0.12,           1.0, 3.2); // multiplier

  

const beeForce      = beeSpeed \* 0.00012;                            // Matter.js force

  

**Solvability guarantee:** inkLimit \>= 170px. The minimum enclosure around the dog (radius 22px) requires 2π × 22 ≈ 138px, so 170px always allows a complete circle with margin.

  

**Dog placement:** Random position in the central 40% zone of the canvas (x: 30%–70%, y: 30%–70%), generated from the level's seeded RNG.

  

**Obstacle placement:** Each obstacle is placed using the seeded RNG, minimum 130px from dog center, minimum 60px from canvas edges. Obstacles are rectangles 40–100px wide, 20–50px tall.

  

**Bee spawn points:** Generated along all four canvas edges at intervals, with slight inward offset (so bees start just inside the canvas). At least 4 spawn points per level; more for higher bee counts.

  

**Seed derivation:** seed = hashLevelSeed('level-' + N) — same level number always produces the same layout.

  

**Hints:** Rotate through a difficulty-tiered hint pool:

  

  - Levels 1–3: beginner tips about drawing barriers
  - Levels 4–7: intermediate tips about angling and ink efficiency
  - Levels 8+: advanced tips about speed and geometry

  

**Constants used internally:**

  

const DOG\_RADIUS = 22; // must match DOG\_PHYS\_RADIUS in physics.js

  

### 8.3 physics.js

Global object: PhysicsEngine

  

**Constants (module-level globals, also used by bee.js):**

  

const LINE\_THICKNESS  = 9;   // px — drawn line physics body width

  

const DOG\_PHYS\_RADIUS = 22;  // px — must match DOG\_RADIUS in level.js

  

const BEE\_RADIUS      = 8;   // px

  

const CAT\_BEE    = 0x0001;   // collision category bitmask

  

const CAT\_STATIC = 0x0002;   // lines, obstacles, walls

  

const CAT\_DOG    = 0x0004;

  

**Object structure:**

  

const PhysicsEngine = {

  

  engine:   null,   // Matter.Engine instance

  

  world:    null,   // Matter.World reference

  

  \_walls:   \[\],     // perimeter wall bodies

  

  \_dogBody: null,   // stored dog body reference

  

  init(canvasW, canvasH, onCollision) { ... },

  

  step(dtMs) { ... },

  

  createDog(x, y) { ... },        // stores body in \_dogBody, returns it

  

  getDogBody() { ... },           // returns this.\_dogBody

  

  createBee(x, y) { ... },

  

  createObstacle(x, y, w, h) { ... },

  

  createLineBody(points) { ... }, // \[{x,y}\] → array of bodies

  

  removeBodies(bodies) { ... },   // single body or array, uses per-body World.remove

  

  clearDynamic() { ... },         // removes all non-wall bodies, nulls \_dogBody

  

  getStaticBodies() { ... },      // returns world.bodies where isStatic && label \!== 'wall'

  

};

  

**init(canvasW, canvasH, onCollision)****:**

  

  - If engine already exists: World.clear then Engine.clear
  - Set \_dogBody = null
  - Create engine with gravity: { x:0, y:0, scale:0 } (zero gravity), enableSleeping: false
  - Create 4 perimeter walls (thickness 80px, extend beyond canvas), set isStatic:true, category CAT\_STATIC, mask CAT\_BEE
  - Register collisionStart event: **pass the raw Matter.js event object to** **onCollision** — onCollision(event) — so the caller can iterate event.pairs\[\]

  

**createDog(x, y)****:**

  

  - Matter.Bodies.circle(x, y, DOG\_PHYS\_RADIUS, { isStatic:true, label:'dog', collisionFilter: { category: CAT\_DOG, mask: CAT\_BEE } })
  - Store in this.\_dogBody
  - Add to world, return body

  

**createBee(x, y)****:**

  

  - Matter.Bodies.circle(x, y, BEE\_RADIUS, { label:'bee', frictionAir:0.025, restitution:0.55, mass:0.5, collisionFilter: { category: CAT\_BEE, mask: CAT\_STATIC|CAT\_DOG|CAT\_BEE } })

  

**createLineBody(points)****:**

  

  - For each consecutive pair of points, create a Matter.Bodies.rectangle centered at their midpoint, rotated to the angle between them, width = segment length + LINE\_THICKNESS \* 0.6 (overlap cap to close corners), height = LINE\_THICKNESS
  - isStatic:true, label:'drawn\_line', category CAT\_STATIC, mask CAT\_BEE
  - Add all bodies to world, return array

  

**removeBodies(bodies)****:**

  

  - Accepts single body or array
  - Always iterate: arr.forEach(b =\> Matter.World.remove(this.world, b))
  - Do NOT pass array directly to World.remove — causes issues in some Matter.js versions

  

**clearDynamic()****:**

  

  - Filter world bodies where label \!== 'wall'
  - Remove each individually
  - Set this.\_dogBody = null

  

### 8.4 bee.js

Class: Bee

  

class Bee {

  

  constructor(body, speed, force) {

  

    this.body      = body;    // Matter.js body

  

    this.alive     = true;    // use this.alive — NOT this.dead

  

    this.speed     = speed;   // max speed scalar

  

    this.force     = force;   // seek force magnitude

  

    this.wingAngle = Math.random() \* Math.PI \* 2;

  

    this.wingSpeed = 0.25 + Math.random() \* 0.1;

  

    this.age       = 0;       // seconds since spawn (for fade-in)

  

  }

  

  update(dt, dogBody, staticBodies) { ... }

  

}

  

**update(dt, dogBody, staticBodies)** applies four steering behaviors as force impulses:

  

1.  **Seek** — vector toward dogBody.position, normalized × this.force
2.  **Separation** — for each other bee within SEP\_RADIUS = 32px, apply repulsion force proportional to 1/distance
3.  **Obstacle avoidance** — cast Matter.Query.ray(staticBodies, pos, lookAhead, BEE\_RADIUS) where lookAhead is LOOK\_DIST = 52px ahead in velocity direction. If hit, apply perpendicular force.
4.  **Organic noise** — low-amplitude random jitter using Math.sin(age \* 3.7) and Math.cos(age \* 2.9) scaled to \~0.3× seek force

  

After applying forces, clamp velocity magnitude to this.speed using Matter.Body.setVelocity.

  

Update this.wingAngle += this.wingSpeed each frame. Increment this.age += dt.

  

**Note:** update() receives individual bee reference. Separation requires access to the bees array — pass it as a parameter or have game.js call a method that accepts it. See game.js spec for how this is called.

  

### 8.5 input.js

Global object: InputHandler

  

const InputHandler = {

  

  init(canvas, callbacks) { ... },

  

  destroy() { ... }

  

};

  

**init(canvas, { onDrawStart, onDrawMove, onDrawEnd })****:**

  

  - Attach mousedown, mousemove, mouseup, mouseleave on canvas
  - Attach touchstart, touchmove, touchend, touchcancel on canvas (with preventDefault() on touch events)
  - Convert all events to canvas-space coordinates by accounting for canvas.getBoundingClientRect() and the ratio between the canvas's CSS display size and its internal resolution (CANVAS\_W / rect.width, CANVAS\_H / rect.height)
  - Throttle onDrawMove calls: only fire if the new point is \>= MIN\_POINT\_DIST = 4.5 pixels from the last emitted point
  - Store all listener references for clean removal in destroy()

  

**destroy()****:**

  

  - Remove all previously attached event listeners

  

**Coordinate conversion formula:**

  

const rect = canvas.getBoundingClientRect();

  

const scaleX = CANVAS\_W / rect.width;

  

const scaleY = CANVAS\_H / rect.height;

  

const x = (clientX - rect.left) \* scaleX;

  

const y = (clientY - rect.top)  \* scaleY;

  

### 8.6 renderer.js

Global object: Renderer

  

const Renderer = {

  

  \_canvas: null,

  

  \_ctx: null,

  

  \_grassPattern: null,   // offscreen canvas, pre-rendered once

  

  \_levelConfig: null,

  

  init(canvas, width, height, levelConfig) { ... },

  

  draw(state) { ... },

  

  // Private helpers:

  

  \_drawBackground() { ... },

  

  \_drawObstacle(obs) { ... },

  

  \_drawLine(points, color, thickness, alpha) { ... },

  

  \_drawDog(pos, shake, bees) { ... },

  

  \_drawBee(bee) { ... },

  

  \_drawParticles(particles) { ... },

  

};

  

**init(canvas, width, height, levelConfig)****:**

  

  - Store canvas, get 2D context, store levelConfig
  - Pre-render grass pattern to offscreen canvas (small repeating dot grid)

  

**draw(state)** where state is:

  

{

  

  bees:         Bee\[\],       // only alive bees

  

  drawnLines:   \[{points, body}\]\[\],

  

  currentLine:  {x,y}\[\]|null,

  

  particles:    particle\[\],

  

  dogBody:      Matter.Body|null,

  

  timeRemaining: float,

  

  survivalTime:  float,

  

  state:         string      // current game state string

  

}

  

**Draw order (back to front):**

  

1.  Background (grass pattern + vignette)
2.  Obstacles
3.  Drawn lines (finalized)
4.  Current line (in-progress, semi-transparent)
5.  Dog
6.  Bees
7.  Particles

  

**\_drawLine(points, color, thickness, alpha = 1)****:**

  

  - Use quadratic bezier smoothing: for each segment, draw through midpoints
  - ctx.beginPath(), moveTo(points\[0\]), then for each subsequent point, use quadraticCurveTo(prev, midpoint)
  - ctx.strokeStyle, ctx.lineWidth = thickness, ctx.lineCap = 'round', ctx.lineJoin = 'round'
  - Apply alpha via ctx.globalAlpha

  

**\_drawDog(pos, shake, bees)****:**

  

  - Center at pos.x, pos.y (from dogBody.position)
  - Compute nearest bee distance; apply red glow (ctx.shadowColor, ctx.shadowBlur) proportional to proximity
  - Draw: body oval, two ear circles (above and to sides), white eye circles, dark pupils, black oval nose, arc smile
  - Colors: body \#c8832a, ears slightly darker, muzzle \#e8a855

  

**\_drawBee(bee)****:**

  

  - Position from bee.body.position, angle from bee.body.velocity direction
  - Wings: two ellipses, color rgba(200, 230, 100, 0.55), y-scale animated via Math.sin(bee.wingAngle) \* 0.5 + 0.5
  - Body: black oval; amber stripes using globalCompositeOperation = 'source-atop' clipped to body shape
  - Stinger: small triangle at rear
  - Antennae: two thin lines from head with small circles at tips
  - Fade-in: globalAlpha = Math.min(1, bee.age / 0.4) for first 0.4 seconds

  

### 8.7 leaderboard.js

IIFE returning object: const Leaderboard = (() =\> { ... })()

  

{

  

  submitScore(username, score, level): Promise\<{rank}|null\>,

  

  fetchScores(limit = 20): Promise\<entry\[\]\>,

  

  render(highlightUsername, highlightScore): Promise\<void\>

  

}

  

**submitScore****:** POST to /api/score, returns parsed JSON or null on any error.

  

**fetchScores****:** GET /api/leaderboard?limit=N, returns array or \[\] on error.

  

**render(highlightUsername, highlightScore)****:**

  

  - Gets \#leaderboard-body tbody and \#leaderboard-loading element
  - Show loading, fetch, hide loading
  - For each entry, create \<tr\> with rank (medal emoji for top 3: ð¥ð¥ð¥, else \#N), escaped username, score (.toLocaleString()), short date
  - Add class my-score to the row matching highlightUsername + highlightScore

  

### 8.8 share.js

IIFE returning object: const Share = (() =\> { ... })()

  

{

  

  buildShareUrl(seed, levelNum, score): string,

  

  parseShareUrl(): { levelNum: number|null, seed: number|null },

  

  clearShareUrl(): void,

  

  shareResult(seed, levelNum, score, username): Promise\<{method}\>

  

}

  

**buildShareUrl****:** Creates URL with ?level=N\&seed=SEED params on current window.location.

  

**parseShareUrl****:** Reads URLSearchParams from window.location.search, validates both values are positive finite integers.

  

**clearShareUrl****:** window.history.replaceState({}, '', url) with search cleared.

  

**shareResult****:**

  

1.  Try navigator.share({ title, text, url }) — if AbortError, return { method: 'cancelled' }
2.  Try navigator.clipboard.writeText(text + '\\n' + url) — return { method: 'clipboard' }
3.  Return { method: 'manual', url, text } — caller shows it in UI

  

### 8.9 ui.js

IIFE returning object: const UI = (() =\> { ... })()

  

**Screen IDs:** screen-start, screen-intro, screen-game, screen-result, screen-leaderboard

  

**showScreen(id)****:** Toggle active class — only the matching screen gets it.

  

**Button rewiring pattern:** Always clone the button before attaching a listener to avoid duplicate listeners from previous game rounds:

  

function \_rewire(id, cb) {

  

  if (\!cb) return;

  

  const el = document.getElementById(id);

  

  const fresh = el.cloneNode(true);

  

  el.parentNode.replaceChild(fresh, el);

  

  fresh.addEventListener('click', cb, { once: true });

  

}

  

**showStart(onPlay)****:** showScreen('screen-start'), rewire \#btn-play.

  

**showIntro(levelConfig, onBegin)****:** showScreen('screen-intro'), populate \#intro-level-num, \#intro-bees, \#intro-time, \#intro-ink, \#intro-hint, rewire \#btn-begin.

  

**showResult(outcome, data, cbs)****:**

  

  - outcome: 'win' or 'lose'
  - data: { score, level, timeRemaining, inkRemaining, seed, username }
  - cbs: { onNext, onRetry, onLeaderboard } (share is handled internally)
  - Show/hide \#btn-next based on outcome
  - Rewire \#btn-next, \#btn-retry, \#btn-leaderboard, \#btn-share
  - \#btn-share handler: call Share.shareResult(...), show toast based on result method
  - Show \#score-submit-form: pre-fill \#username-input from sessionStorage.getItem('bd\_username'), rewire \#btn-submit-score to call Leaderboard.submitScore, validate username with /^\[A-Za-z0-9 \_-\]{1,20}$/, store to sessionStorage on success

  

**showGame()****:** showScreen('screen-game').

  

**showLeaderboard(onBack, highlightUsername, highlightScore)****:** showScreen('screen-leaderboard'), call Leaderboard.render(...), rewire \#btn-leaderboard-back.

  

**HUD updates:**

  

updateTimer(remaining, total)    // updates \#timer-bar-fill width + color + \#timer-value text

  

updateInk(remaining, total)      // updates \#ink-bar-fill width + color + \#ink-value text

  

updateBeeCount(alive, total)     // updates \#bee-count text

  

setLevelHUD(levelNum)            // updates \#hud-level text

  

setDangerLevel(level)            // 0–1 float; sets CSS var + toggles .danger class on canvas

  

**Toast:**

  

toast(msg, durationMs = 2800)    // shows \#toast with .show class, auto-hides

  

Only one toast at a time. Clear previous timeout before setting new one.

  

### 8.10 game.js

Wrapped in an IIFE (function() { 'use strict'; ... })(). Initializes on DOMContentLoaded.

  

**State enum:**

  

const State = Object.freeze({

  

  START:  'START',

  

  INTRO:  'INTRO',

  

  PLAY:   'PLAY',

  

  WIN:    'WIN',

  

  LOSE:   'LOSE',

  

  RESULT: 'RESULT',

  

  LEADERBOARD: 'LEADERBOARD'

  

});

  

**Module-level variables:**

  

let state          = State.START;

  

let currentLevel   = 1;

  

let levelConfig    = null;

  

// Play state

  

let bees           = \[\];         // Bee instances (only alive)

  

let timeRemaining  = 0;

  

let inkRemaining   = 0;

  

let beesAlive      = 0;

  

let spawnQueue     = \[\];         // \[{t: float}\] sorted descending by t, .pop() to get next

  

let elapsed        = 0;         // seconds since play started

  

// Drawing

  

let isDrawing      = false;

  

let currentPoints  = \[\];        // \[{x,y}\] for the in-progress stroke

  

let currentInkUsed = 0;         // pixels consumed in current stroke

  

let drawnLines     = \[\];        // \[{points: \[{x,y}\], body: Body\[\]}\]

  

// Particles

  

let particles = \[\];

  

// Loop

  

let lastFrameTime = null;

  

let rafId         = null;

  

let lastResult    = null;       // stored for leaderboard back-navigation

  

**Boot sequence:**

  

1.  Check Share.parseShareUrl() — if valid levelNum and seed exist, set currentLevel = levelNum, call Share.clearShareUrl(), show toast
2.  Call UI.showStart(onStartPlay)

  

**startPlay()****:**

  

1.  Reset all play-state variables
2.  timeRemaining = levelConfig.survivalTime
3.  inkRemaining = levelConfig.inkLimit
4.  Build spawnQueue: for each bee i (0 to beeCount-1), calculate t = i \* spawnInterval + jitter where jitter is (rng() - 0.5) \* spawnInterval \* 0.3. Sort descending so .pop() yields the next-to-spawn.
      
      - RNG: mulberry32(levelConfig.seed ^ 0xDEADBEEF) — separate RNG from level layout
5.  PhysicsEngine.init(CANVAS\_W, CANVAS\_H, onCollision)
6.  PhysicsEngine.createDog(levelConfig.dogPos.x, levelConfig.dogPos.y)
7.  Create each obstacle: PhysicsEngine.createObstacle(ob.x, ob.y, ob.w, ob.h)
8.  Renderer.init(canvas, CANVAS\_W, CANVAS\_H, levelConfig)
9.  InputHandler.init(canvas, { onDrawStart, onDrawMove, onDrawEnd })
10. UI.showGame(), UI.setLevelHUD(currentLevel), update all HUD elements
11. startLoop()

  

**loop(timestamp)** (RAF callback):

  

  - Compute dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05) (cap at 50ms to avoid spiral-of-death on tab resume)
  - If state === State.PLAY: call update(dt)
  - Always call render()
  - Schedule next frame

  

**update(dt)****:**

  

1.  elapsed += dt, timeRemaining = Math.max(0, timeRemaining - dt)
2.  **Spawn bees:** while spawnQueue.length \> 0 && spawnQueue\[spawnQueue.length - 1\].t \<= elapsed, pop and call spawnBee()
3.  PhysicsEngine.step(dt \* 1000) — convert seconds to ms for Matter.js
4.  Update each alive bee: bee.update(dt, dogBody, staticBodies) — pass PhysicsEngine.getDogBody() and PhysicsEngine.getStaticBodies()
5.  Filter dead bees: bees = bees.filter(b =\> b.alive)
6.  beesAlive = bees.filter(b =\> b.alive).length
7.  Update particles
8.  Update danger feedback
9.  Update HUD
10. **Win check:** if timeRemaining \<= 0 OR (spawnQueue.length === 0 && beesAlive === 0) → goResult('win')

  

**spawnBee()****:**

  

  - Get spawn point: cycle through levelConfig.beeSpawns by index
  - PhysicsEngine.createBee(sp.x, sp.y) → body
  - new Bee(body, levelConfig.beeSpeed, levelConfig.beeForce) → push to bees
  - emitParticles(sp.x, sp.y, '\#f5c518', 6) (gold burst)
  - Update HUD bee count

  

**onCollision(event)** (called by PhysicsEngine with raw Matter.js event):

  

function onCollision(event) {

  

  const pairs = event.pairs;

  

  const dogBody = PhysicsEngine.getDogBody();

  

  if (\!dogBody) return;

  

  for (let i = 0; i \< pairs.length; i++) {

  

    const { bodyA, bodyB } = pairs\[i\];

  

    const isDogA = bodyA.id === dogBody.id;

  

    const isDogB = bodyB.id === dogBody.id;

  

    if (\!isDogA && \!isDogB) continue;

  

    const other = isDogA ? bodyB : bodyA;

  

    const bee = bees.find(b =\> b.body && b.body.id === other.id && b.alive);

  

    if (bee) {

  

      bee.alive = false;

  

      PhysicsEngine.removeBodies(\[bee.body\]);

  

      emitParticles(bee.body.position.x, bee.body.position.y, '\#ff4444', 12);

  

      goResult('lose');

  

      return;

  

    }

  

  }

  

}

  

**Drawing handlers:**

  

handleDrawStart(pt):

  

  - Guard: state \!== State.PLAY or inkRemaining \<= 0 → return
  - isDrawing = true, currentPoints = \[pt\], currentInkUsed = 0

  

handleDrawMove(pt):

  

  - Guard: \!isDrawing || state \!== State.PLAY
  - segLen = dist(prev.x, prev.y, pt.x, pt.y) (4-arg form\!)
  - If currentInkUsed + segLen \> inkRemaining: clip point to remaining ink, push clipped point, call commitLine(), set isDrawing = false, show toast "Out of ink\!"
  - Otherwise: push point, currentInkUsed += segLen

  

handleDrawEnd():

  

  - If \!isDrawing: return
  - isDrawing = false
  - If currentPoints.length \>= 2: commitLine()
  - Else: reset currentPoints and currentInkUsed

  

commitLine():

  

  - inkRemaining = Math.max(0, inkRemaining - currentInkUsed)
  - body = PhysicsEngine.createLineBody(currentPoints) → array of bodies
  - Push { points: \[...currentPoints\], body } to drawnLines
  - Reset currentPoints, currentInkUsed
  - Update HUD ink

  

**render()****:**

  

function render() {

  

  Renderer.draw({

  

    bees: bees.filter(b =\> b.alive),

  

    drawnLines,

  

    currentLine: isDrawing ? currentPoints : null,

  

    particles,

  

    dogBody: PhysicsEngine.getDogBody(),

  

    timeRemaining,

  

    survivalTime: levelConfig ? levelConfig.survivalTime : 1,

  

    state

  

  });

  

}

  

**Particles:**

  

function emitParticles(x, y, color, count) {

  

  for (let i = 0; i \< count; i++) {

  

    const angle = Math.random() \* Math.PI \* 2;

  

    const speed = 40 + Math.random() \* 80;

  

    particles.push({

  

      x, y,

  

      vx: Math.cos(angle) \* speed,

  

      vy: Math.sin(angle) \* speed,

  

      life: 1.0,

  

      decay: 0.8 + Math.random() \* 0.6,

  

      radius: 3 + Math.random() \* 4,

  

      color

  

    });

  

  }

  

}

  

function updateParticles(dt) {

  

  for (let i = particles.length - 1; i \>= 0; i--) {

  

    const p = particles\[i\];

  

    p.x += p.vx \* dt;

  

    p.y += p.vy \* dt;

  

    p.vx \*= 0.92;

  

    p.vy \*= 0.92;

  

    p.life -= p.decay \* dt;

  

    if (p.life \<= 0) particles.splice(i, 1);

  

  }

  

}

  

**Danger feedback:**

  

  - Find minimum distance from any alive bee to dog
  - danger = clamp(1 - (minDist - 30) / 80, 0, 1)
  - Call UI.setDangerLevel(danger)

  

**stopLoop()****:** Cancel RAF, call InputHandler.destroy().

  

## 9\. Game State Machine

         ┌────────────┐

  

    boot │            │ onPlay

  

    ────►│   START    │────────────────────────────┐

  

         │            │                            │

  

         └────────────┘                            ▼

  

                                           ┌────────────┐

  

         ┌────────────┐  onBegin           │            │

  

         │   RESULT   │◄──────────────────►│   INTRO    │

  

         │            │  onRetry / onNext  │            │

  

         └─────┬──────┘                    └─────┬──────┘

  

               │                                 │ onBegin

  

               │ onLeaderboard                   ▼

  

               ▼                          ┌────────────┐

  

         ┌────────────┐                   │            │

  

         │ LEADERBOARD│                   │    PLAY    │

  

         │            │                   │            │

  

         └─────┬──────┘                   └─────┬──────┘

  

               │ onBack                          │

  

               └─────────────────────────────────┤

  

                                          win or lose

  

                                                 │

  

                                          ┌──────▼─────┐

  

                                          │   RESULT   │

  

                                          └────────────┘

  

## 10\. Procedural Level Generation

### Design Goals

1.  Level N is always identical (same dog position, same obstacles, same spawn points)
2.  Difficulty scales smoothly — no cliff edges
3.  All levels are solvable (inkLimit ≥ 170px)

### Seed Chain

levelSeed  = hashLevelSeed('level-' + N)    // layout RNG seed

  

spawnSeed  = levelSeed XOR 0xDEADBEEF       // separate RNG for spawn timing jitter

### Scaling Curves

|  |  |  |  |  |  |
| :-: | :-: | :-: | :-: | :-: | :-: |
| \*\*Property\*\* | \*\*Level 1\*\* | \*\*Level 5\*\* | \*\*Level 10\*\* | \*\*Level 20\*\* | \*\*Cap\*\* |
| Bees | 2 | 5 | 9 | 16 | 16 |
| Survival (s) | 12 | 20.8 | 31.8 | 53.8 | — |
| Ink (px) | 600 | 536 | 456 | 296 | 170 |
| Obstacles | 0 | 1 | 3 | 6 | — |
| Spawn interval (s) | 3.2 | 2.72 | 2.12 | 0.92 | 0.7 |
| Bee speed | 1.0 | 1.48 | 2.08 | 3.28 | 3.2 |

### Solvability Check

  - inkLimit \>= 170 is enforced by clamp(..., 170, 600) — this is the mathematical minimum for an enclosure
  - Spawn points are always on edges, so bees always enter from outside
  - Dog is always in the central 40% zone with clear space

  

## 11\. Physics Design

### Why Matter.js

  - Stable rigid body collisions without custom impulse resolution
  - Matter.Query.ray available for bee avoidance raycasting
  - Lightweight enough for 16+ simultaneous bodies at 60fps

### Key Settings

  - Zero gravity: bees move horizontally only, driven by forces
  - frictionAir: 0.025 on bees: causes natural deceleration, makes steering feel organic
  - restitution: 0.55 on bees, 0.45 on lines: bees bounce off barriers with slight energy loss
  - enableSleeping: false: bees must always be active

### Line Body Construction

Each drawn stroke becomes N−1 static rectangle bodies (one per segment). Rectangles overlap at their ends by LINE\_THICKNESS \* 0.6 to close corner gaps. This avoids tunnelling through acute-angle joints.

### Collision Categories

CAT\_BEE    (0x0001) collides with: CAT\_STATIC, CAT\_DOG, CAT\_BEE

  

CAT\_STATIC (0x0002) collides with: CAT\_BEE

  

CAT\_DOG    (0x0004) collides with: CAT\_BEE

  

Walls are CAT\_STATIC. This prevents the dog and walls from interfering with each other, and prevents drawn lines from affecting the dog body.

  

## 12\. Bee AI & Steering

Four force behaviors applied each frame (additive):

### 1\. Seek

const towardDog = normalize({ x: dog.x - pos.x, y: dog.y - pos.y });

  

applyForce({ x: towardDog.x \* this.force, y: towardDog.y \* this.force });

### 2\. Separation

const SEP\_RADIUS = 32;

  

// For each other alive bee within SEP\_RADIUS:

  

const d = dist(...);

  

const repulsion = (SEP\_RADIUS - d) / SEP\_RADIUS;

  

applyForce(awayVector \* repulsion \* this.force \* 0.5);

  

Prevents bee clumping; creates swarm-like spread.

### 3\. Obstacle Avoidance

const LOOK\_DIST = 52;

  

const ahead = { x: pos.x + vel.x \* LOOK\_DIST, y: pos.y + vel.y \* LOOK\_DIST };

  

const hits = Matter.Query.ray(staticBodies, pos, ahead, BEE\_RADIUS);

  

if (hits.length \> 0) {

  

  const perpendicular = { x: -vel.y, y: vel.x }; // rotate 90°

  

  applyForce(normalize(perpendicular) \* this.force \* 1.5);

  

}

### 4\. Organic Noise

const noiseX = Math.sin(this.age \* 3.7) \* this.force \* 0.3;

  

const noiseY = Math.cos(this.age \* 2.9) \* this.force \* 0.3;

  

applyForce({ x: noiseX, y: noiseY });

  

Different frequencies for X and Y gives Lissajous-like wandering.

### Velocity Clamping

After all forces applied by Matter.js engine step, clamp to max speed:

  

const vel = this.body.velocity;

  

const spd = Math.sqrt(vel.x\*vel.x + vel.y\*vel.y);

  

if (spd \> this.speed) {

  

  Matter.Body.setVelocity(this.body, {

  

    x: (vel.x / spd) \* this.speed,

  

    y: (vel.y / spd) \* this.speed

  

  });

  

}

  

## 13\. Scoring Formula

score = (levelNum × 1000) + floor(timeRemaining × 50) + floor(inkRemaining × 0.5)

  

|  |  |  |
| :-: | :-: | :-: |
| \*\*Component\*\* | \*\*Max contribution\*\* | \*\*Notes\*\* |
| Level bonus | unbounded | 1000 per level reached |
| Time bonus | \\\~2750 at level 1 | 50 pts/second remaining |
| Ink bonus | 300 | 0.5 pts/pixel remaining |

  

Score is only recorded on **win**. Lose states do not submit.

  

## 14\. Cross-File Contracts

These constants and behaviors must be consistent across files. Any discrepancy causes bugs.

  

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| \*\*Constant\*\* | \*\*Value\*\* | \*\*Defined in\*\* | \*\*Used in\*\* |
| CANVAS\\\_W | 800 | index.html inline script | game.js, physics.js, renderer.js |
| CANVAS\\\_H | 600 | index.html inline script | game.js, physics.js, renderer.js |
| DOG\\\_PHYS\\\_RADIUS | 22 | physics.js | level.js (DOG\\\_RADIUS), renderer.js |
| BEE\\\_RADIUS | 8 | physics.js | renderer.js |
| LINE\\\_THICKNESS | 9 | physics.js | renderer.js |
| CAT\\\_BEE/STATIC/DOG | 0x0001/0x0002/0x0004 | physics.js | (internal) |

  

**Function signature contracts:**

  

|  |  |  |
| :-: | :-: | :-: |
| \*\*Function\*\* | \*\*Signature\*\* | \*\*Wrong call to avoid\*\* |
| dist | dist(ax, ay, bx, by) | dist(ptA, ptB) ← breaks |
| normalize | normalize({x, y}) → {x, y} | normalize(x, y) ← breaks |
| mulberry32 | mulberry32(seed) → () =\\\> float | forgetting to call the returned fn |
| onCollision | onCollision(event) with event.pairs | onCollision(bodyA, bodyB) ← mismatch |
| bee.alive | boolean true/false | bee.dead ← wrong property name |

  

**Bee alive property:** The Bee class uses this.alive = true. Setting it false marks the bee as dead. Game.js must use bee.alive = false, never bee.dead = true.

  

**Collision event signature:** PhysicsEngine passes the raw Matter.js event to onCollision. The callback must iterate event.pairs — it does NOT receive individual bodies as arguments.

  

## 15\. API Reference

### POST /api/score

Request:

  

{

  

  "username": "Player1",

  

  "score": 5432,

  

  "level": 4

  

}

  

Response (200):

  

{

  

  "rank": 12,

  

  "username": "Player1",

  

  "score": 5432,

  

  "level": 4

  

}

  

Errors:

  

  - 400 — validation failure: { "error": "Invalid username" }
  - 429 — rate limited

### GET /api/leaderboard?limit=20

Response (200):

  

\[

  

  { "rank": 1, "username": "TopBee", "score": 18450, "level": 15, "date": "2024-03-01T..." },

  

  { "rank": 2, "username": "Player1", "score": 12300, "level": 10, "date": "2024-03-02T..." }

  

\]

  

## 16\. HTML Structure

Single index.html. Key IDs that JS depends on:

  

\#screen-start

  

  \#btn-play

  

\#screen-intro

  

  \#intro-level-num

  

  \#intro-bees

  

  \#intro-time

  

  \#intro-ink

  

  \#intro-hint

  

  \#btn-begin

  

\#screen-game

  

  \#game-canvas              ← \<canvas\> element, 800×600 internal resolution

  

  \#hud-level

  

  \#timer-bar-fill

  

  \#timer-value

  

  \#ink-bar-fill

  

  \#ink-value

  

  \#bee-count

  

\#screen-result

  

  \#result-title

  

  \#result-score

  

  \#result-message

  

  \#btn-next                 ← hidden on lose

  

  \#btn-retry

  

  \#btn-leaderboard

  

  \#btn-share

  

  \#score-submit-form

  

    \#username-input

  

    \#btn-submit-score

  

\#screen-leaderboard

  

  \#leaderboard-loading

  

  \#leaderboard-body         ← \<tbody\> inside \<table\>

  

  \#btn-leaderboard-back

  

\#toast                      ← fixed position notification

  

**Canvas element:**

  

\<canvas id="game-canvas" width="800" height="600"\>\</canvas\>

  

The canvas always has width="800" height="600" as HTML attributes (internal resolution). CSS scales it to fit the viewport. Input handler corrects for this scaling via getBoundingClientRect().

  

## 17\. Setup & Deployment

### Local Development

**Requirements:** Node.js 18+, Python 3, build-essential (for better-sqlite3 native compilation)

  

\# On Ubuntu/Debian

  

sudo apt install -y build-essential python3

  

cd bee-defender

  

npm install

  

node server/server.js

  

\# Open http://localhost:3000

  

**Dev with auto-reload:**

  

npm run dev   \# uses nodemon

  

**If better-sqlite3 fails to build:**

  

sudo apt install -y build-essential python3-dev

  

npm rebuild better-sqlite3

### Production (VPS)

npm install --production

  

NODE\_ENV=production PORT=3000 node server/server.js

  

**Nginx reverse proxy:**

  

server {

  

  listen 80;

  

  server\_name yourdomain.com;

  

  location / {

  

    proxy\_pass http://localhost:3000;

  

    proxy\_http\_version 1.1;

  

    proxy\_set\_header Upgrade $http\_upgrade;

  

    proxy\_set\_header Connection 'upgrade';

  

    proxy\_set\_header Host $host;

  

    proxy\_set\_header X-Real-IP $remote\_addr;

  

    proxy\_cache\_bypass $http\_upgrade;

  

  }

  

}

  

**Process manager:**

  

npm install -g pm2

  

pm2 start server/server.js --name bee-defender

  

pm2 save

  

pm2 startup

  

**Data directory:** SQLite file is created at ./data/scores.db. Ensure this path is writable and backed up.

### Privacy Notes

  - No cookies of any kind are set
  - Username stored in sessionStorage (tab-scoped, never sent until user submits)
  - IPs stored only as SHA-256 hash with server-side salt — the plaintext IP is never written anywhere
  - No external scripts, fonts, or images are loaded
  - CSP headers block all external resource loading

  

## 18\. Known Issues & Required Fixes

The following bugs were identified during the original build and must be addressed during the rebuild. Do not repeat them.

### Bug 1: Unescaped apostrophe in level.js hint string

**Location:** level.js, hint pool for levels 4–7  
**Fix:** All single-quoted JS strings containing apostrophes must either use template literals, escaped \\', or be converted to double-quoted strings.

  

// WRONG — syntax error

  

'A barrier doesn't need to be perfect'

  

// CORRECT

  

"A barrier doesn't need to be perfect"

### Bug 2: getDogBody() missing from physics.js

**Fix:** PhysicsEngine must have \_dogBody: null as a property, set it in createDog(), reset it in init() and clearDynamic(), and expose getDogBody() { return this.\_dogBody; }.

### Bug 3: Collision callback signature mismatch

**Fix:** PhysicsEngine.init() must pass the **raw event object** to onCollision:

  

// CORRECT

  

Matter.Events.on(this.engine, 'collisionStart', onCollision);

  

// WRONG — game.js expects event.pairs, not individual bodies

  

Matter.Events.on(this.engine, 'collisionStart', event =\> {

  

  for (const pair of event.pairs) onCollision(pair.bodyA, pair.bodyB);

  

});

### Bug 4: removeBodies passing array to World.remove

**Fix:** Always use per-body removal:

  

// CORRECT

  

arr.forEach(b =\> Matter.World.remove(this.world, b));

  

// WRONG — breaks in some Matter.js versions

  

Matter.World.remove(this.world, arr);

### Bug 5: dist() called with point objects

**Fix:** dist takes four numbers. All call sites must unpack:

  

// CORRECT

  

dist(prev.x, prev.y, pt.x, pt.y)

  

// WRONG

  

dist(prev, pt)

### Bug 6: bee.dead vs bee.alive

**Fix:** The Bee class uses this.alive. All code in game.js must use bee.alive = false to kill a bee, and filter with b.alive. Never use bee.dead.

### Bug 7: clearDynamic() not resetting \_dogBody

**Fix:** clearDynamic() must set this.\_dogBody = null after removing all bodies.

  

  

*End of design document. Implement every file completely — no placeholders, no stub fun