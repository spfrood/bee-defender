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
  }

  update(dt, dogBody, staticBodies, allBees) {
    if (!this.alive || !this.body) return;

    const pos = this.body.position;
    let fx = 0;
    let fy = 0;

    // 1. Seek the dog
    if (dogBody) {
      const towardDog = normalize({
        x: dogBody.position.x - pos.x,
        y: dogBody.position.y - pos.y
      });
      fx += towardDog.x * this.force;
      fy += towardDog.y * this.force;
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

    // 3. Obstacle avoidance via ray cast ahead of velocity
    const vel = this.body.velocity;
    const velN = normalize({ x: vel.x, y: vel.y });
    if ((velN.x !== 0 || velN.y !== 0) && staticBodies && staticBodies.length) {
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
