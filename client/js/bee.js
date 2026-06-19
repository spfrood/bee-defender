'use strict';

const SEP_RADIUS = 32; // px — separation steering radius
const LOOK_DIST  = 52; // px — obstacle avoidance look-ahead

class Bee {
  constructor(body, speed, force) {
    this.body      = body;
    this.alive     = true;   // use this.alive — NOT this.dead
    this.speed     = speed;
    this.force     = force;
    this.wingAngle = Math.random() * Math.PI * 2;
    this.wingSpeed = 0.25 + Math.random() * 0.1;
    this.age       = 0;      // seconds since spawn (for fade-in)
    this.bomber    = false;  // set true for barrier-busting bees (level > 5)
    this.exploding = false;  // queued to detonate this frame
    this.eatProgress = 0;    // seconds spent gnawing a barrier that blocks it
  }

  update(dt, dogBody, staticBodies, allBees) {
    if (!this.alive || !this.body) return;

    const pos = this.body.position;
    let fx = 0;
    let fy = 0;

    // 1. Seek a target. Bombers home in on the nearest drawn barrier so they
    // can detonate against it; if none exists yet they fall back to the dog.
    let seekTarget = dogBody ? dogBody.position : null;
    let seekScale = 1;
    if (this.bomber && staticBodies) {
      let best = Infinity;
      let barrier = null;
      for (let i = 0; i < staticBodies.length; i++) {
        const b = staticBodies[i];
        if (b.label !== 'drawn_line') continue;
        const d = dist(pos.x, pos.y, b.position.x, b.position.y);
        if (d < best) { best = d; barrier = b; }
      }
      if (barrier) {
        seekTarget = barrier.position;
        seekScale = 1.4; // charge the barrier a little harder
      }
    }
    if (seekTarget) {
      const toward = normalize({
        x: seekTarget.x - pos.x,
        y: seekTarget.y - pos.y
      });
      fx += toward.x * this.force * seekScale;
      fy += toward.y * this.force * seekScale;
    }

    // 2. Separation from other bees
    if (allBees) {
      for (let i = 0; i < allBees.length; i++) {
        const other = allBees[i];
        if (other === this || !other.alive || !other.body) continue;
        const op = other.body.position;
        const d = dist(pos.x, pos.y, op.x, op.y);
        if (d > 0 && d < SEP_RADIUS) {
          const repulsion = (SEP_RADIUS - d) / SEP_RADIUS;
          const away = normalize({ x: pos.x - op.x, y: pos.y - op.y });
          fx += away.x * repulsion * this.force * 0.5;
          fy += away.y * repulsion * this.force * 0.5;
        }
      }
    }

    // 3. Obstacle avoidance via ray cast ahead of velocity.
    // Bombers skip this — they're meant to ram straight into a barrier.
    const vel = this.body.velocity;
    const velN = normalize({ x: vel.x, y: vel.y });
    if (!this.bomber && (velN.x !== 0 || velN.y !== 0) && staticBodies && staticBodies.length) {
      const ahead = {
        x: pos.x + velN.x * LOOK_DIST,
        y: pos.y + velN.y * LOOK_DIST
      };
      const hits = Matter.Query.ray(staticBodies, pos, ahead, BEE_RADIUS);
      if (hits.length > 0) {
        const perp = normalize({ x: -vel.y, y: vel.x });
        fx += perp.x * this.force * 1.5;
        fy += perp.y * this.force * 1.5;
      }
    }

    // 4. Organic noise — Lissajous-like wandering
    fx += Math.sin(this.age * 3.7) * this.force * 0.3;
    fy += Math.cos(this.age * 2.9) * this.force * 0.3;

    Matter.Body.applyForce(this.body, pos, { x: fx, y: fy });

    // Clamp velocity to max speed
    const v = this.body.velocity;
    const spd = Math.sqrt(v.x * v.x + v.y * v.y);
    if (spd > this.speed) {
      Matter.Body.setVelocity(this.body, {
        x: (v.x / spd) * this.speed,
        y: (v.y / spd) * this.speed
      });
    }

    this.wingAngle += this.wingSpeed;
    this.age += dt;
  }
}
