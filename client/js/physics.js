'use strict';

const LINE_THICKNESS  = 9;   // px — drawn line physics body width
const DOG_PHYS_RADIUS = 22;  // px — must match DOG_RADIUS in level.js
const BEE_RADIUS      = 8;   // px

const CAT_BEE    = 0x0001;
const CAT_STATIC = 0x0002;   // lines, obstacles, walls
const CAT_DOG    = 0x0004;

const PhysicsEngine = {
  engine:   null,
  world:    null,
  _walls:   [],
  _dogBody: null,

  init(canvasW, canvasH, onCollision) {
    if (this.engine) {
      Matter.World.clear(this.world, false);
      Matter.Engine.clear(this.engine);
    }
    this._dogBody = null;
    this._walls = [];

    this.engine = Matter.Engine.create({ enableSleeping: false });
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.engine.gravity.scale = 0;
    this.world = this.engine.world;

    const T = 80; // wall thickness, extends beyond canvas
    const wallOpts = {
      isStatic: true,
      label: 'wall',
      collisionFilter: { category: CAT_STATIC, mask: CAT_BEE }
    };
    const walls = [
      Matter.Bodies.rectangle(canvasW / 2, -T / 2, canvasW + T * 2, T, wallOpts),
      Matter.Bodies.rectangle(canvasW / 2, canvasH + T / 2, canvasW + T * 2, T, wallOpts),
      Matter.Bodies.rectangle(-T / 2, canvasH / 2, T, canvasH + T * 2, wallOpts),
      Matter.Bodies.rectangle(canvasW + T / 2, canvasH / 2, T, canvasH + T * 2, wallOpts)
    ];
    this._walls = walls;
    Matter.World.add(this.world, walls);

    // Pass the RAW event object — caller iterates event.pairs
    Matter.Events.on(this.engine, 'collisionStart', onCollision);
  },

  step(dtMs) {
    Matter.Engine.update(this.engine, dtMs);
  },

  createDog(x, y) {
    const body = Matter.Bodies.circle(x, y, DOG_PHYS_RADIUS, {
      isStatic: true,
      label: 'dog',
      collisionFilter: { category: CAT_DOG, mask: CAT_BEE }
    });
    this._dogBody = body;
    Matter.World.add(this.world, body);
    return body;
  },

  getDogBody() {
    return this._dogBody;
  },

  createBee(x, y) {
    const body = Matter.Bodies.circle(x, y, BEE_RADIUS, {
      label: 'bee',
      frictionAir: 0.025,
      restitution: 0.55,
      mass: 0.5,
      collisionFilter: { category: CAT_BEE, mask: CAT_STATIC | CAT_DOG | CAT_BEE }
    });
    Matter.World.add(this.world, body);
    return body;
  },

  createObstacle(x, y, w, h) {
    const body = Matter.Bodies.rectangle(x + w / 2, y + h / 2, w, h, {
      isStatic: true,
      label: 'obstacle',
      restitution: 0.45,
      collisionFilter: { category: CAT_STATIC, mask: CAT_BEE }
    });
    Matter.World.add(this.world, body);
    return body;
  },

  createLineBody(points) {
    const bodies = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = dist(a.x, a.y, b.x, b.y);
      if (len < 0.5) continue;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const body = Matter.Bodies.rectangle(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        len + LINE_THICKNESS * 0.6,
        LINE_THICKNESS,
        {
          isStatic: true,
          angle,
          label: 'drawn_line',
          restitution: 0.45,
          collisionFilter: { category: CAT_STATIC, mask: CAT_BEE }
        }
      );
      bodies.push(body);
    }
    Matter.World.add(this.world, bodies);
    return bodies;
  },

  removeBodies(bodies) {
    const arr = Array.isArray(bodies) ? bodies : [bodies];
    // Per-body removal — never pass the array directly to World.remove
    arr.forEach(b => Matter.World.remove(this.world, b));
  },

  clearDynamic() {
    const toRemove = Matter.Composite.allBodies(this.world)
      .filter(b => b.label !== 'wall');
    toRemove.forEach(b => Matter.World.remove(this.world, b));
    this._dogBody = null;
  },

  getStaticBodies() {
    return Matter.Composite.allBodies(this.world)
      .filter(b => b.isStatic && b.label !== 'wall');
  }
};
