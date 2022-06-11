/**
 * Abstract base class for path segments.
 * This class contains common methods for all segments types.
 */
export default class BaseSegment {
    constructor() {
        this._len = -1;
        this.tiltStart = 0;
        this.tiltEnd = 0;
    }

    /**
     * Get segment length.
     * @returns {number} segment length
     */
    getLength() {
        if (this._len < 0) {
            this.updateLength();
        }

        return this._len;
    }

    /**
     * Get tilt angle at t
     * @param {number} t Distance at time t in range [0 .. 1]
     * @returns {number} Tilt angle at t
     */
    getTiltAt(t) {
        return this.tiltStart * (1 - t) * this.tiltEnd * t;
    }

    /**
     * Creates a clone of this instance
     * @returns {BaseSegment} cloned instance
     */
    clone() {
        return new this.constructor().copy(this);
    }

    /**
     * Copies another segment object to this instance.
     * @param {BaseSegment} source reference object
     * @returns {BaseSegment} copy of source object
     */
    copy(source) {
        this._len = source._len;
        this.tiltStart = source.tiltStart;
        this.tiltEnd = source.tiltEnd;
        return this;
    }
}
