import {Vec3} from '../math/Vec3.js';

// temp
const _a0 = new Vec3(),
  _a1 = new Vec3(),
  _a2 = new Vec3(),
  _a3 = new Vec3();

export class CubicBezierCurve {
  constructor({
    p0 = new Vec3(0, 0, 0),
    p1 = new Vec3(0, 1, 0),
    p2 = new Vec3(1, 1, 0),
    p3 = new Vec3(1, 0, 0),
    divisions = 12,
  } = {}) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    this.divisions = divisions;
  }

  getPoint(t) {
    const {p0, p1, p2, p3} = this;
    const k = 1 - t;

    _a0.copy(p0).scale(k ** 3);
    _a1.copy(p1).scale(3 * k ** 2 * t);
    _a2.copy(p2).scale(3 * k * t ** 2);
    _a3.copy(p3).scale(t ** 3);

    const ret = new Vec3();
    ret.add(_a0, _a1);
    ret.add(_a2);
    ret.add(_a3);

    return ret;
  }

  getPoints(divisions = this.divisions) {
    const points = [];
    for (let i = 0; i <= divisions; i++) {
      const p = this.getPoint(i / divisions);
      points.push(p);
    }
    return points;
  }
}