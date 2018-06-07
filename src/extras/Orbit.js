import {Vec3} from '../math/Vec3.js';
import {Vec2} from '../math/Vec2.js';
import {Quat} from '../math/Quat.js';

const STATE = {NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4};
const EPS = 0.000001;

export class Orbit {
    // This set of controls performs orbiting, dollying (zooming), and panning.
    // Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
    //
    //    Orbit - left mouse / touch: one-finger move
    //    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
    //    Pan - right mouse, or arrow keys / touch: two-finger move

    constructor(object, domElement = document) {

        this.object = object;

        this.domElement = domElement;

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the object orbits around
        this.target = new Vec3();

        // How far you can dolly in and out (PerspectiveCamera only)
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // How far you can zoom in and out (OrthographicCamera only)
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, must be a sub-interval of the interval [- Math.PI, Math.PI].
        this.minAzimuthAngle = - Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // You must call controls.update() in your animation loop to apply damping
        this.dampingFactor = 0.1;

        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 0.1;

        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.screenSpacePanning = false; // if true, pan in screen-space

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // Mouse buttons
        this.mouseButtons = {ORBIT: 0, ZOOM: 1, PAN: 2};

        //
        // public methods
        //

        this.getPolarAngle = function () {
            return spherical.phi;
        };

        this.getAzimuthalAngle = function () {
            return spherical.theta;
        };

        this.update = function () {
            let offset = new Vec3();
            let lastPosition = new Vec3();
            let lastQuaternion = new Quat();

            return function update() {
                let position = scope.object.position;
                offset.copy(position).subtract(scope.target);

                // angle from z-axis around y-axis
                spherical.radius = offset.length();
                spherical.theta = Math.atan2(offset.x, offset.z); // equator angle around y-up axis
                spherical.phi = Math.acos(Math.min(Math.max(offset.y / spherical.radius, -1), 1)); // polar angle

                if (scope.autoRotate && state === STATE.NONE) {
                    rotateLeft(getAutoRotationAngle());
                }

                spherical.theta += sphericalDelta.theta;
                spherical.phi += sphericalDelta.phi;

                // restrict theta to be between desired limits
                spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

                // restrict phi to be between desired limits
                spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

                // restrict phi to be between EPS and PI-EPS
                spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));
                spherical.radius *= scale;

                // restrict radius to be between desired limits
                spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

                // move target to panned location
                scope.target.add(panOffset);

                // offset.setFromSpherical(spherical);
                let sinPhiRadius = Math.sin(spherical.phi) * spherical.radius;
                offset.x = sinPhiRadius * Math.sin( spherical.theta);
                offset.y = Math.cos(spherical.phi) * spherical.radius;
                offset.z = sinPhiRadius * Math.cos(spherical.theta);

                position.copy(scope.target).add(offset);
                scope.object.lookAt(scope.target);

                sphericalDelta.theta *= (1 - scope.dampingFactor);
                sphericalDelta.phi *= (1 - scope.dampingFactor);
                panOffset.multiply(1 - scope.dampingFactor);

                scale = 1;

                // update condition is:
                // min(camera displacement, camera rotation in radians)^2 > EPS
                // using small-angle approximation cos(x/2) = 1 - x^2 / 8
                if (zoomChanged ||
                    lastPosition.squaredDistance(scope.object.position) > EPS ||
                    8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

                    lastPosition.copy(scope.object.position);
                    lastQuaternion.copy(scope.object.quaternion);
                    zoomChanged = false;
                    return true;
                }
                return false;
            };
        }();

        //
        // internals
        //

        let scope = this;
        let state = STATE.NONE;

        // current position in spherical coordinates
        let spherical = {radius: 1, phi: 0, theta: 0};
        let sphericalDelta = {radius: 1, phi: 0, theta: 0};

        let scale = 1;
        let panOffset = new Vec3();
        let zoomChanged = false;

        let rotateStart = new Vec2();
        let rotateEnd = new Vec2();
        let rotateDelta = new Vec2();

        let panStart = new Vec2();
        let panEnd = new Vec2();
        let panDelta = new Vec2();

        let dollyStart = new Vec2();
        let dollyEnd = new Vec2();
        let dollyDelta = new Vec2();

        function getAutoRotationAngle() {
            return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
        }

        function getZoomScale() {
            return Math.pow(0.95, scope.zoomSpeed);
        }

        function rotateLeft(angle) {
            sphericalDelta.theta -= angle;
        }

        function rotateUp(angle) {
            sphericalDelta.phi -= angle;
        }

        let panLeft = function () {
            let v = new Vec3();
            return function panLeft(distance, m) {
                v.set(m[0], m[1], m[2]);
                v.multiply(-distance);
                panOffset.add(v);
            };
        }();

        let panUp = function () {
            let v = new Vec3();
            return function panUp(distance, m) {
                if (scope.screenSpacePanning === true) {
                    v.set(m[4], m[5], m[6]);
                } else {
                    v.set(m[0], m[1], m[2]);
                    v.cross(scope.object.up, v);
                }
                v.multiply(distance);
                panOffset.add(v);
            };
        }();

        // deltaX and deltaY are in pixels; right and down are positive
        let pan = function () {
            let offset = new Vec3();
            return function pan(deltaX, deltaY) {
                let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
                if (scope.object.type === 'perspective') {
                    let position = scope.object.position;
                    offset.copy(position).subtract(scope.target);
                    let targetDistance = offset.length();

                    // half of the fov is center to top of screen
                    targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

                    // we use only clientHeight here so aspect ratio does not distort speed
                    panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
                    panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
                } else if (scope.object.type === 'orthographic') {
                    panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
                    panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
                } else {
                    scope.enablePan = false;
                }
            };
        }();

        function dolly(dollyScale) {
            if (scope.object.type === 'perspective') {
                scale /= dollyScale;
            } else if (scope.object.type === 'orthographic') {
                // scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
                // scope.object.updateProjectionMatrix();
                // zoomChanged = true;
            } else {
                scope.enableZoom = false;
            }
        }

        //
        // e callbacks - update the object state
        //

        function handleMouseDownRotate(e) {
            rotateStart.set(e.clientX, e.clientY);
        }

        function handleMouseDownDolly(e) {
            dollyStart.set(e.clientX, e.clientY);
        }

        function handleMouseDownPan(e) {
            panStart.set(e.clientX, e.clientY);
        }

        function handleMouseMoveRotate(e) {
            rotateEnd.set(e.clientX, e.clientY);
            rotateDelta.subtract(rotateEnd, rotateStart).multiply(scope.rotateSpeed);
            let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
            rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height
            rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
            rotateStart.copy(rotateEnd);
        }

        function handleMouseMoveDolly(e) {
            dollyEnd.set(e.clientX, e.clientY);
            dollyDelta.subtract(dollyEnd, dollyStart);
            if (dollyDelta.y > 0) {
                dolly(getZoomScale());
            } else if (dollyDelta.y < 0) {
                dolly(1 / getZoomScale());
            }
            dollyStart.copy(dollyEnd);
        }

        function handleMouseMovePan(e) {
            panEnd.set(e.clientX, e.clientY);
            panDelta.subtract(panEnd, panStart).multiply(scope.panSpeed);
            pan(panDelta.x, panDelta.y);
            panStart.copy(panEnd);
        }

        function handleMouseWheel(e) {
            if (e.deltaY < 0) {
                dolly(1 / getZoomScale());
            } else if (e.deltaY > 0) {
                dolly(getZoomScale());
            }
        }

        function handleTouchStartRotate(e) {
            rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
        }

        function handleTouchStartDollyPan(e) {
            if (scope.enableZoom) {
                let dx = e.touches[0].pageX - e.touches[1].pageX;
                let dy = e.touches[0].pageY - e.touches[1].pageY;
                let distance = Math.sqrt(dx * dx + dy * dy);
                dollyStart.set(0, distance);
            }

            if (scope.enablePan) {
                let x = 0.5 * (e.touches[0].pageX + e.touches[1].pageX);
                let y = 0.5 * (e.touches[0].pageY + e.touches[1].pageY);
                panStart.set(x, y);
            }
        }

        function handleTouchMoveRotate(e) {
            rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
            rotateDelta.subtract(rotateEnd, rotateStart).multiply(scope.rotateSpeed);
            let element = scope.domElement === document ? scope.domElement.body : scope.domElement;
            rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
            rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
            rotateStart.copy(rotateEnd);
        }

        function handleTouchMoveDollyPan(e) {
            if (scope.enableZoom) {
                let dx = e.touches[0].pageX - e.touches[1].pageX;
                let dy = e.touches[0].pageY - e.touches[1].pageY;
                let distance = Math.sqrt(dx * dx + dy * dy);
                dollyEnd.set(0, distance);
                dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
                dolly(dollyDelta.y);
                dollyStart.copy(dollyEnd);
            }

            if (scope.enablePan) {
                let x = 0.5 * (e.touches[0].pageX + e.touches[1].pageX);
                let y = 0.5 * (e.touches[0].pageY + e.touches[1].pageY);
                panEnd.set(x, y);
                panDelta.subtract(panEnd, panStart).multiply(scope.panSpeed);
                pan(panDelta.x, panDelta.y);
                panStart.copy(panEnd);
            }
        }

        //
        // e handlers - FSM: listen for es and reset state
        //

        function onMouseDown(e) {
            if (scope.enabled === false) return;
            e.preventDefault();

            switch (e.button) {
                case scope.mouseButtons.ORBIT:
                    if (scope.enableRotate === false) return;
                    handleMouseDownRotate(e);
                    state = STATE.ROTATE;
                    break;
                case scope.mouseButtons.ZOOM:
                    if (scope.enableZoom === false) return;
                    handleMouseDownDolly(e);
                    state = STATE.DOLLY;
                    break;
                case scope.mouseButtons.PAN:
                    if (scope.enablePan === false) return;
                    handleMouseDownPan(e);
                    state = STATE.PAN;
                    break;
            }

            if (state !== STATE.NONE) {
                document.addEventListener('mousemove', onMouseMove, false);
                document.addEventListener('mouseup', onMouseUp, false);
            }
        }

        function onMouseMove(e) {
            if (scope.enabled === false) return;
            e.preventDefault();

            switch (state) {
                case STATE.ROTATE:
                    if (scope.enableRotate === false) return;
                    handleMouseMoveRotate(e);
                    break;
                case STATE.DOLLY:
                    if (scope.enableZoom === false) return;
                    handleMouseMoveDolly(e);
                    break;
                case STATE.PAN:
                    if (scope.enablePan === false) return;
                    handleMouseMovePan(e);
                    break;
            }
        }

        function onMouseUp(e) {
            if (scope.enabled === false) return;
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);

            state = STATE.NONE;
        }

        function onMouseWheel(e) {
            if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return;
            e.preventDefault();
            e.stopPropagation();

            handleMouseWheel(e);
        }

        function onTouchStart(e) {
            if (scope.enabled === false) return;
            e.preventDefault();

            switch (e.touches.length) {
                case 1:	// one-fingered touch: rotate
                    if (scope.enableRotate === false) return;
                    handleTouchStartRotate(e);
                    state = STATE.TOUCH_ROTATE;
                    break;
                case 2:	// two-fingered touch: dolly-pan
                    if (scope.enableZoom === false && scope.enablePan === false) return;
                    handleTouchStartDollyPan(e);
                    state = STATE.TOUCH_DOLLY_PAN;
                    break;
                default:
                    state = STATE.NONE;
            }
        }

        function onTouchMove(e) {
            if (scope.enabled === false) return;
            e.preventDefault();
            e.stopPropagation();

            switch (e.touches.length) {
                case 1: // one-fingered touch: rotate
                    if (scope.enableRotate === false) return;
                    handleTouchMoveRotate(e);
                    break;
                case 2: // two-fingered touch: dolly-pan
                    if (scope.enableZoom === false && scope.enablePan === false) return;
                    handleTouchMoveDollyPan(e);
                    break;
                default:
                    state = STATE.NONE;
            }
        }

        function onTouchEnd(e) {
            if (scope.enabled === false) return;
            state = STATE.NONE;
        }

        function onContextMenu(e) {
            if (scope.enabled === false) return;
            e.preventDefault();
        }

        scope.domElement.addEventListener('contextmenu', onContextMenu, false);
        scope.domElement.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('wheel', onMouseWheel, false);
        scope.domElement.addEventListener('touchstart', onTouchStart, false);
        scope.domElement.addEventListener('touchend', onTouchEnd, false);
        scope.domElement.addEventListener('touchmove', onTouchMove, false);

        this.dispose = function () {
            scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
            scope.domElement.removeEventListener('mousedown', onMouseDown, false);
            window.removeEventListener('wheel', onMouseWheel, false);

            scope.domElement.removeEventListener('touchstart', onTouchStart, false);
            scope.domElement.removeEventListener('touchend', onTouchEnd, false);
            scope.domElement.removeEventListener('touchmove', onTouchMove, false);

            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
        };

        // force an update at start
        this.update();
    };

}