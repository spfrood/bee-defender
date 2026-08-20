'use strict';

const Renderer = {
  _canvas: null,
  _ctx: null,
  _grassPattern: null,
  _levelConfig: null,
  _w: 0,
  _h: 0,

  init(canvas, width, height, levelConfig) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._levelConfig = levelConfig;
    this._w = width;
    this._h = height;

    // Pre-render grass dot pattern once to an offscreen canvas
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const octx = off.getContext('2d');
    octx.fillStyle = '#2d5c1a';
    octx.fillRect(0, 0, width, height);
    const rng = mulberry32(0xC0FFEE);
    octx.fillStyle = 'rgba(74, 158, 47, 0.35)';
    for (let i = 0; i < 900; i++) {
      const x = rng() * width;
      const y = rng() * height;
      const r = 1 + rng() * 1.6;
      octx.beginPath();
      octx.arc(x, y, r, 0, Math.PI * 2);
      octx.fill();
    }
    octx.fillStyle = 'rgba(26, 46, 15, 0.3)';
    for (let i = 0; i < 400; i++) {
      const x = rng() * width;
      const y = rng() * height;
      octx.beginPath();
      octx.arc(x, y, 1 + rng(), 0, Math.PI * 2);
      octx.fill();
    }
    this._grassPattern = off;
  },

  draw(state) {
    const ctx = this._ctx;
    if (!ctx) return;

    this._drawBackground();

    if (this._levelConfig) {
      for (const obs of this._levelConfig.obstacles) {
        this._drawObstacle(obs);
      }
    }

    for (const line of state.drawnLines) {
      this._drawTripleLine(line.points, 1, line.type);
    }

    if (state.currentLine && state.currentLine.length >= 2) {
      this._drawTripleLine(state.currentLine, 0.8, state.currentInkType);
    }

    if (state.dogBody) {
      this._drawDog(state.dogBody.position, 0, state.bees);
    }

    for (const bee of state.bees) {
      this._drawBee(bee);
    }

    this._drawParticles(state.particles);
  },

  _drawBackground() {
    const ctx = this._ctx;
    ctx.drawImage(this._grassPattern, 0, 0);
    // Vignette
    const g = ctx.createRadialGradient(
      this._w / 2, this._h / 2, this._h * 0.45,
      this._w / 2, this._h / 2, this._h * 0.95
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(10, 20, 5, 0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this._w, this._h);
  },

  _drawObstacle(obs) {
    const ctx = this._ctx;
    const r = Math.min(10, obs.h / 2);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    const g = ctx.createRadialGradient(
      obs.x + obs.w / 2, obs.y + obs.h / 2, 2,
      obs.x + obs.w / 2, obs.y + obs.h / 2, Math.max(obs.w, obs.h) / 1.4
    );
    g.addColorStop(0, '#8a8a82');
    g.addColorStop(1, '#4a4a44');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(obs.x, obs.y, obs.w, obs.h, r);
    } else {
      ctx.rect(obs.x, obs.y, obs.w, obs.h);
    }
    ctx.fill();
    ctx.restore();
  },

  // Triple-layered ink line: shadow → brown base → gold highlight
  _drawTripleLine(points, opacityScale, type = 'black') {
    if (type === 'red') {
      this._drawLine(points, 'rgba(40, 10, 10, 1)', LINE_THICKNESS + 4,
        0.55 * (opacityScale === 1 ? 1 : 0.4 / 0.55));
      this._drawLine(points, '#aa2222', LINE_THICKNESS + 1,
        opacityScale === 1 ? 1 : 0.7);
      this._drawLine(points, '#ff6666', LINE_THICKNESS - 2,
        opacityScale === 1 ? 1 : 0.85);
    } else {
      this._drawLine(points, 'rgba(30, 18, 4, 1)', LINE_THICKNESS + 4,
        0.55 * (opacityScale === 1 ? 1 : 0.4 / 0.55));
      this._drawLine(points, '#a07428', LINE_THICKNESS + 1,
        opacityScale === 1 ? 1 : 0.7);
      this._drawLine(points, '#e8b84a', LINE_THICKNESS - 2,
        opacityScale === 1 ? 1 : 0.85);
    }
  },

  _drawLine(points, color, thickness, alpha = 1) {
    if (!points || points.length < 2) return;
    const ctx = this._ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  },

  _drawDog(pos, shake, bees) {
    const ctx = this._ctx;
    const x = pos.x;
    const y = pos.y;
    const R = DOG_PHYS_RADIUS;

    // Red glow proportional to nearest bee proximity
    let minD = Infinity;
    for (const bee of bees) {
      if (!bee.body) continue;
      const d = dist(x, y, bee.body.position.x, bee.body.position.y);
      if (d < minD) minD = d;
    }
    const danger = clamp(1 - (minD - 30) / 80, 0, 1);

    ctx.save();
    if (danger > 0) {
      ctx.shadowColor = '#cc3333';
      ctx.shadowBlur = 25 * danger;
    }

    // Body oval
    ctx.fillStyle = '#c8832a';
    ctx.beginPath();
    ctx.ellipse(x, y, R, R * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Ears
    ctx.fillStyle = '#9c6420';
    ctx.beginPath();
    ctx.ellipse(x - R * 0.72, y - R * 0.72, R * 0.34, R * 0.46, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + R * 0.72, y - R * 0.72, R * 0.34, R * 0.46, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Muzzle
    ctx.fillStyle = '#e8a855';
    ctx.beginPath();
    ctx.ellipse(x, y + R * 0.32, R * 0.5, R * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - R * 0.34, y - R * 0.18, R * 0.18, 0, Math.PI * 2);
    ctx.arc(x + R * 0.34, y - R * 0.18, R * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1a08';
    ctx.beginPath();
    ctx.arc(x - R * 0.34, y - R * 0.16, R * 0.09, 0, Math.PI * 2);
    ctx.arc(x + R * 0.34, y - R * 0.16, R * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.ellipse(x, y + R * 0.2, R * 0.13, R * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#1a1208';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y + R * 0.32, R * 0.26, 0.25, Math.PI - 0.25);
    ctx.stroke();

    ctx.restore();
  },

  _drawBee(bee) {
    const ctx = this._ctx;
    const pos = bee.body.position;
    const vel = bee.body.velocity;
    const angle = Math.atan2(vel.y, vel.x);

    ctx.save();
    ctx.globalAlpha = Math.min(1, bee.age / 0.4);
    ctx.translate(pos.x, pos.y);

    // Bombers pulse with a red warning glow so they read as a threat
    if (bee.bomber) {
      const pulse = 0.6 + 0.4 * Math.sin(bee.age * 10);
      ctx.save();
      ctx.shadowColor = '#ff3b1f';
      ctx.shadowBlur = 16 * pulse;
      ctx.fillStyle = 'rgba(255, 59, 31, ' + (0.35 * pulse).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(0, 0, BEE_RADIUS * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.rotate(angle);

    const flap = Math.sin(bee.wingAngle) * 0.5 + 0.5;

    // Wings
    ctx.fillStyle = 'rgba(200, 230, 100, 0.55)';
    ctx.save();
    ctx.scale(1, 0.4 + flap * 0.6);
    ctx.beginPath();
    ctx.ellipse(-1, -BEE_RADIUS * 1.1, BEE_RADIUS * 0.7, BEE_RADIUS * 0.95, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-1, BEE_RADIUS * 1.1, BEE_RADIUS * 0.7, BEE_RADIUS * 0.95, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body with amber stripes clipped to the body shape
    const bodyW = BEE_RADIUS * 1.25;
    const bodyH = BEE_RADIUS * 0.85;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#181410';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(-bodyW * 0.35, -bodyH, bodyW * 0.3, bodyH * 2);
    ctx.fillRect(bodyW * 0.25, -bodyH, bodyW * 0.3, bodyH * 2);
    ctx.restore();

    // Stinger
    ctx.fillStyle = '#181410';
    ctx.beginPath();
    ctx.moveTo(-bodyW, -2);
    ctx.lineTo(-bodyW - 4, 0);
    ctx.lineTo(-bodyW, 2);
    ctx.closePath();
    ctx.fill();

    // Antennae
    ctx.strokeStyle = '#181410';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bodyW * 0.7, -2);
    ctx.lineTo(bodyW + 4, -5);
    ctx.moveTo(bodyW * 0.7, 2);
    ctx.lineTo(bodyW + 4, 5);
    ctx.stroke();
    ctx.fillStyle = '#181410';
    ctx.beginPath();
    ctx.arc(bodyW + 4, -5, 1.2, 0, Math.PI * 2);
    ctx.arc(bodyW + 4, 5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  _drawParticles(particles) {
    const ctx = this._ctx;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * Math.max(0.2, p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
};
