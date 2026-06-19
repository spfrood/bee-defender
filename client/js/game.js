(function () {
  'use strict';

  const State = Object.freeze({
    START:  'START',
    INTRO:  'INTRO',
    PLAY:   'PLAY',
    WIN:    'WIN',
    LOSE:   'LOSE',
    RESULT: 'RESULT',
    LEADERBOARD: 'LEADERBOARD'
  });

  let state        = State.START;
  let currentLevel = 1;
  let runScore     = 0;     // cumulative score banked from levels cleared this run
  let inkCarryover = 0;     // leftover ink carried into the current round
  let levelConfig  = null;

  // After this level, every Nth bee to spawn is a "bomber"
  const BOMBER_FROM_LEVEL = 5;   // bombers appear once currentLevel > 5
  const BOMBER_EVERY      = 3;   // every 3rd bee that spawns
  const BOMBER_GAP_RADIUS = 40;  // px radius of the hole punched in a barrier

  // Ordinary bees gnaw through a barrier only while it blocks their path to
  // the dog; after EAT_TIME of being blocked they break through and die.
  const EAT_TIME       = 2.5;  // seconds of sustained blocking to break through
  const EAT_REACH      = 8;    // px ahead of the bee a barrier counts as blocking
  const EAT_GAP_RADIUS = 26;   // px radius of the hole a bee eats

  // Play state
  let bees          = [];
  let timeRemaining = 0;
  let inkRemaining  = 0;
  let inkMax        = 0;    // ink the round started with (base + carryover)
  let beesAlive     = 0;
  let spawnQueue    = [];   // [{t}] sorted descending; .pop() yields next
  let elapsed       = 0;
  let spawnIndex    = 0;    // cycles through levelConfig.beeSpawns
  let beesSpawned   = 0;    // count of bees spawned this round (for bomber cadence)
  let pendingExplosions = []; // bomber hits queued during collision callbacks

  // Drawing
  let isDrawing      = false;
  let currentPoints  = [];
  let currentInkUsed = 0;
  let drawnLines     = []; // [{points, bodies}]

  // Particles
  let particles = [];

  // Loop
  let lastFrameTime = null;
  let rafId         = null;
  let lastResult    = null;

  let canvas = null;

  // ---------- Boot ----------

  document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game-canvas');

    const shared = Share.parseShareUrl();
    if (shared.levelNum !== null && shared.seed !== null) {
      currentLevel = shared.levelNum;
      Share.clearShareUrl();
      UI.toast('Challenge accepted! Starting at level ' + currentLevel);
    }

    UI.showStart(onStartPlay);
  });

  function onStartPlay() {
    runScore = 0;       // fresh run
    inkCarryover = 0;   // no ink carried into the first round
    showIntro();
  }

  function showIntro() {
    state = State.INTRO;
    levelConfig = LevelGenerator.generate(currentLevel);
    UI.showIntro(levelConfig, startPlay, inkCarryover);
  }

  // ---------- Play ----------

  function startPlay() {
    state = State.PLAY;

    bees = [];
    particles = [];
    drawnLines = [];
    currentPoints = [];
    currentInkUsed = 0;
    isDrawing = false;
    elapsed = 0;
    spawnIndex = 0;
    beesSpawned = 0;
    beesAlive = 0;
    pendingExplosions = [];

    timeRemaining = levelConfig.survivalTime;
    // Leftover ink from the previous round carries forward
    inkRemaining = levelConfig.inkLimit + inkCarryover;
    inkMax = inkRemaining;

    // Deterministic spawn schedule: first bee at FIRST_SPAWN_DELAY, last bee at
    // survivalTime - POST_SPAWN_BUFFER, the rest spread evenly between.
    const FIRST_SPAWN_DELAY = 2; // seconds before the first bee appears
    const POST_SPAWN_BUFFER = 7; // seconds of survival after the last bee spawns
    const n = levelConfig.beeCount;
    const lastSpawn = levelConfig.survivalTime - POST_SPAWN_BUFFER;
    const interval = n > 1 ? (lastSpawn - FIRST_SPAWN_DELAY) / (n - 1) : 0;
    spawnQueue = [];
    for (let i = 0; i < n; i++) {
      spawnQueue.push({ t: FIRST_SPAWN_DELAY + i * interval });
    }
    spawnQueue.sort((a, b) => b.t - a.t); // descending; pop() gives soonest

    PhysicsEngine.init(CANVAS_W, CANVAS_H, onCollision);
    PhysicsEngine.createDog(levelConfig.dogPos.x, levelConfig.dogPos.y);
    for (const ob of levelConfig.obstacles) {
      PhysicsEngine.createObstacle(ob.x, ob.y, ob.w, ob.h);
    }

    Renderer.init(canvas, CANVAS_W, CANVAS_H, levelConfig);
    InputHandler.init(canvas, {
      onDrawStart: handleDrawStart,
      onDrawMove: handleDrawMove,
      onDrawEnd: handleDrawEnd
    });

    UI.showGame();
    UI.setLevelHUD(currentLevel);
    UI.updateTimer(timeRemaining, levelConfig.survivalTime);
    UI.updateInk(inkRemaining, inkMax);
    UI.updateBeeCount(0, levelConfig.beeCount);
    UI.setDangerLevel(0);

    startLoop();
  }

  // ---------- Main loop ----------

  function startLoop() {
    stopRaf();
    lastFrameTime = null;
    rafId = requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    if (lastFrameTime === null) lastFrameTime = timestamp;
    // Cap dt at 50ms to avoid spiral-of-death on tab resume
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
    lastFrameTime = timestamp;

    if (state === State.PLAY) {
      update(dt);
    }
    render();

    rafId = requestAnimationFrame(loop);
  }

  function update(dt) {
    elapsed += dt;
    timeRemaining = Math.max(0, timeRemaining - dt);

    while (spawnQueue.length > 0 && spawnQueue[spawnQueue.length - 1].t <= elapsed) {
      spawnQueue.pop();
      spawnBee();
    }

    PhysicsEngine.step(dt * 1000);

    // Resolve bomber hits queued during the collision callbacks
    if (pendingExplosions.length > 0) {
      for (const ex of pendingExplosions) explodeBomber(ex.bee, ex.x, ex.y);
      pendingExplosions = [];
    }

    const dogBody = PhysicsEngine.getDogBody();
    const staticBodies = PhysicsEngine.getStaticBodies();
    for (const bee of bees) {
      if (bee.alive) bee.update(dt, dogBody, staticBodies, bees);
    }

    updateEating(dt, dogBody);

    bees = bees.filter(b => b.alive);
    beesAlive = bees.length;

    updateParticles(dt);
    updateDanger();

    UI.updateTimer(timeRemaining, levelConfig.survivalTime);
    UI.updateInk(inkRemaining, inkMax);
    UI.updateBeeCount(beesAlive, levelConfig.beeCount);

    if (state === State.PLAY &&
        (timeRemaining <= 0 || (spawnQueue.length === 0 && beesAlive === 0))) {
      goResult('win');
    }
  }

  function spawnBee() {
    const sp = levelConfig.beeSpawns[spawnIndex % levelConfig.beeSpawns.length];
    spawnIndex++;
    beesSpawned++;
    // After level 5, every 3rd bee is a bomber: it flies to a barrier,
    // explodes, and blows a gap in it.
    const isBomber = currentLevel > BOMBER_FROM_LEVEL && beesSpawned % BOMBER_EVERY === 0;
    const body = PhysicsEngine.createBee(sp.x, sp.y);
    const bee = new Bee(body, levelConfig.beeSpeed, levelConfig.beeForce);
    bee.bomber = isBomber;
    bees.push(bee);
    emitParticles(sp.x, sp.y, isBomber ? '#ff7518' : '#f5c518', isBomber ? 10 : 6);
    UI.updateBeeCount(bees.length, levelConfig.beeCount);
  }

  function onCollision(event) {
    const pairs = event.pairs;
    const dogBody = PhysicsEngine.getDogBody();
    for (let i = 0; i < pairs.length; i++) {
      const { bodyA, bodyB } = pairs[i];

      // Bomber bee hitting a drawn barrier → queue an explosion that punches a
      // gap. Deferred to after the physics step so we don't mutate the world
      // mid-collision.
      const lineBody = bodyA.label === 'drawn_line' ? bodyA
                     : bodyB.label === 'drawn_line' ? bodyB : null;
      const beeBody  = bodyA.label === 'bee' ? bodyA
                     : bodyB.label === 'bee' ? bodyB : null;
      if (lineBody && beeBody) {
        const bomber = bees.find(b =>
          b.body && b.body.id === beeBody.id && b.alive && b.bomber && !b.exploding);
        if (bomber) {
          bomber.exploding = true;
          pendingExplosions.push({ bee: bomber, x: lineBody.position.x, y: lineBody.position.y });
        }
        continue;
      }

      // Any bee reaching the dog → lose
      if (!dogBody) continue;
      const isDogA = bodyA.id === dogBody.id;
      const isDogB = bodyB.id === dogBody.id;
      if (!isDogA && !isDogB) continue;
      const other = isDogA ? bodyB : bodyA;
      const bee = bees.find(b => b.body && b.body.id === other.id && b.alive);
      if (bee) {
        bee.alive = false;
        PhysicsEngine.removeBodies([bee.body]);
        emitParticles(bee.body.position.x, bee.body.position.y, '#ff4444', 12);
        goResult('lose');
        return;
      }
    }
  }

  function explodeBomber(bee, x, y) {
    if (!bee.body) return;
    const bx = bee.body.position.x;
    const by = bee.body.position.y;
    bee.alive = false;
    PhysicsEngine.removeBodies([bee.body]);
    emitParticles(bx, by, '#ff7518', 18);
    emitParticles(x, y, '#ffd54a', 10);
    punchGap(x, y, BOMBER_GAP_RADIUS);
  }

  // Ordinary bees don't seek barriers — they head for the dog. But when a
  // barrier sits directly between a bee and the dog, the bee gnaws at it; once
  // it has been blocked long enough it eats a hole and dies in the process.
  function updateEating(dt, dogBody) {
    if (!dogBody) return;
    let lineBodies = PhysicsEngine.getStaticBodies().filter(b => b.label === 'drawn_line');
    if (lineBodies.length === 0) return;

    for (const bee of bees) {
      if (!bee.alive || bee.bomber || !bee.body) continue;

      const pos = bee.body.position;
      const dir = normalize({ x: dogBody.position.x - pos.x, y: dogBody.position.y - pos.y });
      if (dir.x === 0 && dir.y === 0) { bee.eatProgress = 0; continue; }

      const reach = BEE_RADIUS + EAT_REACH;
      const end = { x: pos.x + dir.x * reach, y: pos.y + dir.y * reach };
      const blocked = Matter.Query.ray(lineBodies, pos, end, BEE_RADIUS * 0.8);

      if (blocked.length === 0) {
        bee.eatProgress = 0;
        continue;
      }

      bee.eatProgress += dt;
      // Sawdust while chewing
      if (Math.random() < dt * 6) {
        emitParticles(pos.x + dir.x * BEE_RADIUS, pos.y + dir.y * BEE_RADIUS, '#caa24a', 1);
      }

      if (bee.eatProgress >= EAT_TIME) {
        const hb = blocked[0].body;
        emitParticles(pos.x, pos.y, '#caa24a', 12);
        punchGap(hb.position.x, hb.position.y, EAT_GAP_RADIUS);
        bee.alive = false;
        PhysicsEngine.removeBodies([bee.body]);
        lineBodies = PhysicsEngine.getStaticBodies().filter(b => b.label === 'drawn_line');
        if (lineBodies.length === 0) return;
      }
    }
  }

  // Remove the part of any barrier within `radius` of (px,py) and rebuild the
  // surviving runs so the physics bodies and the rendered line stay in sync.
  function punchGap(px, py, radius) {
    const next = [];
    for (const line of drawnLines) {
      const hit = line.points.some(p => dist(p.x, p.y, px, py) <= radius);
      if (!hit) { next.push(line); continue; }

      PhysicsEngine.removeBodies(line.bodies);

      let run = [];
      const flush = () => {
        if (run.length >= 2) {
          const pts = run.map(p => ({ x: p.x, y: p.y }));
          next.push({ points: pts, bodies: PhysicsEngine.createLineBody(pts) });
        }
        run = [];
      };
      for (const p of line.points) {
        if (dist(p.x, p.y, px, py) <= radius) flush();
        else run.push(p);
      }
      flush();
    }
    drawnLines = next;
  }

  // ---------- Drawing ----------

  function handleDrawStart(pt) {
    if (state !== State.PLAY || inkRemaining <= 0) return;
    isDrawing = true;
    currentPoints = [pt];
    currentInkUsed = 0;
  }

  function handleDrawMove(pt) {
    if (!isDrawing || state !== State.PLAY) return;
    const prev = currentPoints[currentPoints.length - 1];
    const segLen = dist(prev.x, prev.y, pt.x, pt.y); // 4-arg form!
    if (segLen <= 0) return;

    if (currentInkUsed + segLen > inkRemaining) {
      const available = inkRemaining - currentInkUsed;
      if (available > 0.5) {
        const t = available / segLen;
        currentPoints.push({
          x: lerp(prev.x, pt.x, t),
          y: lerp(prev.y, pt.y, t)
        });
        currentInkUsed += available;
      }
      commitLine();
      isDrawing = false;
      UI.toast('Out of ink!');
      return;
    }

    currentPoints.push(pt);
    currentInkUsed += segLen;
  }

  function handleDrawEnd() {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentPoints.length >= 2) {
      commitLine();
    } else {
      currentPoints = [];
      currentInkUsed = 0;
    }
  }

  function commitLine() {
    if (currentPoints.length >= 2) {
      inkRemaining = Math.max(0, inkRemaining - currentInkUsed);
      const bodies = PhysicsEngine.createLineBody(currentPoints);
      drawnLines.push({ points: [...currentPoints], bodies });
    }
    currentPoints = [];
    currentInkUsed = 0;
    UI.updateInk(inkRemaining, inkMax);
  }

  // ---------- Render ----------

  function render() {
    Renderer.draw({
      bees: bees.filter(b => b.alive),
      drawnLines,
      currentLine: isDrawing ? currentPoints : null,
      particles,
      dogBody: PhysicsEngine.getDogBody(),
      timeRemaining,
      survivalTime: levelConfig ? levelConfig.survivalTime : 1,
      state
    });
  }

  // ---------- Particles ----------

  function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.8 + Math.random() * 0.6,
        radius: 3 + Math.random() * 4,
        color
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= p.decay * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ---------- Danger feedback ----------

  function updateDanger() {
    const dogBody = PhysicsEngine.getDogBody();
    if (!dogBody) {
      UI.setDangerLevel(0);
      return;
    }
    let minDist = Infinity;
    for (const bee of bees) {
      if (!bee.alive || !bee.body) continue;
      const d = dist(
        bee.body.position.x, bee.body.position.y,
        dogBody.position.x, dogBody.position.y
      );
      if (d < minDist) minDist = d;
    }
    const danger = minDist === Infinity
      ? 0
      : clamp(1 - (minDist - 30) / 80, 0, 1);
    UI.setDangerLevel(danger);
  }

  // ---------- Result / navigation ----------

  function goResult(outcome) {
    state = outcome === 'win' ? State.WIN : State.LOSE;
    stopLoop();
    UI.setDangerLevel(0);

    let levelScore = 0;
    if (outcome === 'win') {
      // Score for a level = level number + leftover ink (no time bonus)
      levelScore = currentLevel + Math.floor(inkRemaining);
    }

    lastResult = {
      outcome,
      levelScore,                    // this level's points (0 on a loss)
      score: runScore + levelScore,  // cumulative run total
      level: currentLevel,
      timeRemaining,
      inkRemaining,
      seed: levelConfig.seed,
      username: sessionStorage.getItem('bd_username') || ''
    };

    showResultScreen();
  }

  function showResultScreen() {
    state = State.RESULT;
    UI.showResult(lastResult.outcome, lastResult, {
      onNext: () => {
        runScore += lastResult.levelScore;       // bank the level just cleared
        inkCarryover = lastResult.inkRemaining;  // carry leftover ink forward
        currentLevel += 1;
        showIntro();
      },
      onRetry: () => { showIntro(); },
      onLeaderboard: () => {
        state = State.LEADERBOARD;
        UI.showLeaderboard(
          () => showResultScreen(),
          lastResult.username,
          lastResult.score
        );
      },
      // Submitting a score is only offered after a loss, and it ends the run.
      onSubmitted: () => {
        state = State.LEADERBOARD;
        UI.showLeaderboard(
          startNewGame,
          lastResult.username,
          lastResult.score
        );
      }
    });
  }

  function startNewGame() {
    currentLevel = 1;
    runScore = 0;
    inkCarryover = 0;
    UI.showStart(onStartPlay);
  }

  // ---------- Loop teardown ----------

  function stopRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function stopLoop() {
    stopRaf();
    InputHandler.destroy();
  }
})();
