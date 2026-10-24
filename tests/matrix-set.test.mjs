import assert from 'node:assert/strict';
import test from 'node:test';
import { Mat3 } from '../src/math/Mat3.js';
import { Mat4 } from '../src/math/Mat4.js';

for (const [Matrix, size] of [[Mat3, 9], [Mat4, 16]]) {
    test(`${Matrix.name}.set accepts a tuple, a matrix and scalar components`, () => {
        const values = Array.from({ length: size }, (_, index) => index + 1);
        const target = new Matrix();
        assert.equal(target.set(values), target);
        assert.deepEqual([...target], values);

        const source = new Matrix(...values);
        assert.equal(target.identity().set(source), target);
        assert.deepEqual([...target], values);
        source[0] = -1;
        assert.equal(target[0], 1, 'set copies the values rather than retaining the source');

        assert.equal(target.identity().set(...values), target);
        assert.deepEqual([...target], values);
    });
}
