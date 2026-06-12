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
  let levelConfig  = null;

  // Play state
  let bees          = [];
  let timeRemaining = 0;
  let inkRemaining  = 0;
  let beesAlive     = 0;
  let spawnQueue    = [];   // [{t}] sorted descending; .pop() yields next
  let elapsed       = 0;
  let spawnIndex    = 0;    // cycles through levelConfig.beeSpawns

  // Drawing
  let isDrawing      = false;
  let currentPoints  = [];
  let currentInkUsed = 0;
  let drawnLines     = []; // [{points, body}]

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
    showIntro();
  }

  function showIntro() {
    state = State.INTRO;
    levelConfig = LevelGenerator.generate(currentLevel);
    UI.showIntro(levelConfig, startPlay);
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
    beesAlive = 0;

    timeRemaining = levelConfig.survivalTime;
    inkRemaining = levelConfig.inkLimit;

    // Spawn timing uses its own RNG, separate from layout RNG
    const rng = mulberry32((levelConfig.seed ^ 0xDEADBEEF) >>> 0);
    spawnQueue = [];
    for (let i = 0; i < levelConfig.beeCount; i++) {
      const jitter = (rng() - 0.5) * levelConfig.spawnInterval * 0.3;
      spawnQueue.push({ t: Math.max(0, i * levelConfig.spawnInterval + jitter) });
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
    UI.updateInk(inkRemaining, levelConfig.inkLimit);
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

    const dogBody = PhysicsEngine.getDogBody();
    const staticBodies = PhysicsEngine.getStaticBodies();
    for (const bee of bees) {
      if (bee.alive) bee.update(dt, dogBody, staticBodies, bees);
    }

    bees = bees.filter(b => b.alive);
    beesAlive = bees.length;

    updateParticles(dt);
    updateDanger();

    UI.updateTimer(timeRemaining, levelConfig.survivalTime);
    UI.updateInk(inkRemaining, levelConfig.inkLimit);
    UI.updateBeeCount(beesAlive, levelConfig.beeCount);

    if (state === State.PLAY &&
        (timeRemaining <= 0 || (spawnQueue.length === 0 && beesAlive === 0))) {
      goResult('win');
    }
  }

  function spawnBee() {
    const sp = levelConfig.beeSpawns[spawnIndex % levelConfig.beeSpawns.length];
    spawnIndex++;
    const body = PhysicsEngine.createBee(sp.x, sp.y);
    bees.push(new Bee(body, levelConfig.beeSpeed, levelConfig.beeForce));
    emitParticles(sp.x, sp.y, '#f5c518', 6);
    UI.updateBeeCount(bees.length, levelConfig.beeCount);
  }

  function onCollision(event) {
    const pairs = event.pairs;
    const dogBody = PhysicsEngine.getDogBody();
    if (!dogBody) return;
    for (let i = 0; i < pairs.length; i++) {
      const { bodyA, bodyB } = pairs[i];
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
      const body = PhysicsEngine.createLineBody(currentPoints);
      drawnLines.push({ points: [...currentPoints], body });
    }
    currentPoints = [];
    currentInkUsed = 0;
    UI.updateInk(inkRemaining, levelConfig.inkLimit);
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

    let score = 0;
    if (outcome === 'win') {
      score = currentLevel * 1000 +
        Math.floor(timeRemaining * 50) +
        Math.floor(inkRemaining * 0.5);
    }

    lastResult = {
      outcome,
      score,
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
      onNext: () => { currentLevel += 1; showIntro(); },
      onRetry: () => { showIntro(); },
      onLeaderboard: () => {
        state = State.LEADERBOARD;
        UI.showLeaderboard(
          () => showResultScreen(),
          lastResult.username,
          lastResult.score
        );
      }
    });
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
