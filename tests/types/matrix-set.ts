import { Mat3, type Mat3Tuple } from '../../types/math/Mat3.js';
import { Mat4, type Mat4Tuple } from '../../types/math/Mat4.js';

const matrix3 = new Mat3();
const tuple3: Mat3Tuple = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const copied3: Mat3 = matrix3.set(new Mat3()).set(tuple3);
copied3.set(...tuple3);

const matrix4 = new Mat4();
const tuple4: Mat4Tuple = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const copied4: Mat4 = matrix4.set(new Mat4()).set(tuple4);
copied4.set(...tuple4);

// Scalar calls still require all matrix components.
// @ts-expect-error A single scalar is not a complete 3x3 matrix.
matrix3.set(1);
// @ts-expect-error A single scalar is not a complete 4x4 matrix.
matrix4.set(1);
// @ts-expect-error A matrix cannot be followed by scalar components.
matrix3.set(new Mat3(), 2, 3, 4, 5, 6, 7, 8, 9);
// @ts-expect-error A matrix cannot be followed by scalar components.
matrix4.set(new Mat4(), 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
