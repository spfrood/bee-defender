'use strict';

const LevelGenerator = (() => {

  const DOG_RADIUS = 22; // must match DOG_PHYS_RADIUS in physics.js

  const HINTS_BEGINNER = [
    'Draw a full circle around the dog to keep bees out.',
    'Short, closed barriers are stronger than long open ones.',
    'Watch the edges — bees can come from any side.'
  ];

  // Apostrophes only in double-quoted strings (see design doc bug 1)
  const HINTS_INTERMEDIATE = [
    "A barrier doesn't need to be perfect — angles deflect bees away.",
    'Angle your walls so bees slide off instead of piling up.',
    "Don't waste ink on corners the bees never reach.",
    'Use rocks as free walls — connect your lines to them.'
  ];

  const HINTS_ADVANCED = [
    'Fast bees overshoot — funnel them past the dog with diagonals.',
    'A tight circle costs about 140px of ink. Spend the rest wisely.',
    'Spiral walls trap bees longer than straight ones.'
  ];

  function pickHint(N, rng) {
    let pool;
    if (N <= 3) pool = HINTS_BEGINNER;
    else if (N <= 7) pool = HINTS_INTERMEDIATE;
    else pool = HINTS_ADVANCED;
    return pool[(N - 1) % pool.length];
  }

  function generate(N) {
    const seed = hashLevelSeed('level-' + N);
    const rng = mulberry32(seed);

    const beeCount      = clamp(2 + Math.floor((N - 1) * 0.8), 2, 16);
    // Round length scales only with the number of bees: 2s before the first
    // bee + 1s per bee of spawn window + 7s after the last bee = beeCount + 9.
    const survivalTime  = beeCount + 9;
    const inkLimit      = clamp(600 - (N - 1) * 16, 170, 600);
    const obstacleCount = Math.floor((N - 1) / 3);
    const beeSpeed      = clamp(1.0 + (N - 1) * 0.12, 1.0, 3.2);
    const beeForce      = beeSpeed * 0.00012;

    // Dog in the central 40% zone
    const dogPos = {
      x: CANVAS_W * (0.3 + rng() * 0.4),
      y: CANVAS_H * (0.3 + rng() * 0.4)
    };

    // Obstacles: min 130px from dog, min 60px from edges
    const obstacles = [];
    let attempts = 0;
    while (obstacles.length < obstacleCount && attempts < 200) {
      attempts++;
      const w = 40 + rng() * 60;
      const h = 20 + rng() * 30;
      const x = 60 + rng() * (CANVAS_W - 120 - w);
      const y = 60 + rng() * (CANVAS_H - 120 - h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      if (dist(cx, cy, dogPos.x, dogPos.y) < 130 + Math.max(w, h) / 2) continue;
      obstacles.push({ x, y, w, h });
    }

    // Spawn points along all four edges, slight inward offset
    const INSET = 14;
    const spawnCount = Math.max(4, Math.ceil(beeCount * 0.75));
    const beeSpawns = [];
    for (let i = 0; i < spawnCount; i++) {
      const edge = i % 4;
      const t = 0.15 + rng() * 0.7; // avoid exact corners
      let x, y;
      if (edge === 0)      { x = CANVAS_W * t;       y = INSET; }              // top
      else if (edge === 1) { x = CANVAS_W - INSET;   y = CANVAS_H * t; }       // right
      else if (edge === 2) { x = CANVAS_W * t;       y = CANVAS_H - INSET; }   // bottom
      else                 { x = INSET;              y = CANVAS_H * t; }       // left
      beeSpawns.push({ x, y });
    }

    return {
      levelNum: N,
      seed,
      beeCount,
      survivalTime,
      inkLimit,
      obstacleCount,
      beeSpeed,
      beeForce,
      dogPos,
      obstacles,
      beeSpawns,
      hint: pickHint(N, rng)
    };
  }

  return { generate };
})();
