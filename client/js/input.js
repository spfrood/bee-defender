'use strict';

const InputHandler = {
  _canvas: null,
  _listeners: [],
  _lastPoint: null,
  _active: false,

  MIN_POINT_DIST: 4.5,

  init(canvas, { onDrawStart, onDrawMove, onDrawEnd }) {
    this.destroy();
    this._canvas = canvas;
    this._lastPoint = null;
    this._active = false;

    const toCanvas = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const start = (clientX, clientY) => {
      const pt = toCanvas(clientX, clientY);
      this._active = true;
      this._lastPoint = pt;
      onDrawStart(pt);
    };

    const move = (clientX, clientY) => {
      if (!this._active) return;
      const pt = toCanvas(clientX, clientY);
      const last = this._lastPoint;
      if (last && dist(last.x, last.y, pt.x, pt.y) < this.MIN_POINT_DIST) return;
      this._lastPoint = pt;
      onDrawMove(pt);
    };

    const end = () => {
      if (!this._active) return;
      this._active = false;
      this._lastPoint = null;
      onDrawEnd();
    };

    const handlers = [
      ['mousedown', e => start(e.clientX, e.clientY)],
      ['mousemove', e => move(e.clientX, e.clientY)],
      ['mouseup', () => end()],
      ['mouseleave', () => end()],
      ['touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        if (t) start(t.clientX, t.clientY);
      }],
      ['touchmove', e => {
        e.preventDefault();
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY);
      }],
      ['touchend', e => { e.preventDefault(); end(); }],
      ['touchcancel', e => { e.preventDefault(); end(); }]
    ];

    handlers.forEach(([type, fn]) => {
      const opts = type.startsWith('touch') ? { passive: false } : undefined;
      canvas.addEventListener(type, fn, opts);
      this._listeners.push([type, fn, opts]);
    });
  },

  destroy() {
    if (this._canvas) {
      this._listeners.forEach(([type, fn, opts]) => {
        this._canvas.removeEventListener(type, fn, opts);
      });
    }
    this._listeners = [];
    this._canvas = null;
    this._active = false;
    this._lastPoint = null;
  }
};
