// Input handling for keyboard and touch
const Input = {
    keys: {},
    moveDir: { x: 0, z: 0 },
    bombPressed: false,
    remotePressed: false,
    pausePressed: false,
    touchActive: false,

    // Joystick state
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        touchId: null,
        deadZone: 15,
        maxRadius: 60,
        baseEl: null,
        knobEl: null,
    },

    init() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls setup
        if (isMobile()) {
            this._setupTouch();
        }
    },

    _setupTouch() {
        const touchControls = document.getElementById('touch-controls');
        touchControls.style.display = 'block';

        const joystickZone = document.getElementById('joystick-zone');

        // Create joystick elements
        this.joystick.baseEl = document.createElement('div');
        this.joystick.baseEl.style.cssText = 'position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.3);left:15px;bottom:15px;display:none;';
        joystickZone.appendChild(this.joystick.baseEl);

        this.joystick.knobEl = document.createElement('div');
        this.joystick.knobEl.style.cssText = 'position:absolute;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,0.5);left:35px;top:35px;';
        this.joystick.baseEl.appendChild(this.joystick.knobEl);

        // Joystick touch events
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystick.active = true;
            this.joystick.touchId = touch.identifier;
            this.joystick.startX = touch.clientX;
            this.joystick.startY = touch.clientY;
            this.joystick.currentX = touch.clientX;
            this.joystick.currentY = touch.clientY;
            this.joystick.baseEl.style.display = 'block';
            const rect = joystickZone.getBoundingClientRect();
            this.joystick.baseEl.style.left = (touch.clientX - rect.left - 60) + 'px';
            this.joystick.baseEl.style.bottom = (rect.bottom - touch.clientY - 60) + 'px';
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.joystick.touchId) {
                    this.joystick.currentX = touch.clientX;
                    this.joystick.currentY = touch.clientY;
                    this._updateJoystick();
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.touchId) {
                    this.joystick.active = false;
                    this.joystick.touchId = null;
                    this.joystick.baseEl.style.display = 'none';
                    this.joystick.knobEl.style.left = '35px';
                    this.joystick.knobEl.style.top = '35px';
                    this.moveDir.x = 0;
                    this.moveDir.z = 0;
                }
            }
        };
        joystickZone.addEventListener('touchend', endJoystick, { passive: false });
        joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });

        // Bomb button
        const bombBtn = document.getElementById('bomb-btn');
        bombBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.bombPressed = true;
        }, { passive: false });
        bombBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.bombPressed = false;
        }, { passive: false });

        // Remote detonation: double tap anywhere on the canvas
        let lastTap = 0;
        document.getElementById('game-canvas').addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                this.remotePressed = true;
            }
            lastTap = now;
        }, { passive: true });

        // Pause button
        const pauseBtn = document.getElementById('hud-pause-btn');
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pausePressed = true;
        }, { passive: false });
    },

    _updateJoystick() {
        const dx = this.joystick.currentX - this.joystick.startX;
        const dy = this.joystick.currentY - this.joystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.joystick.deadZone) {
            this.moveDir.x = 0;
            this.moveDir.z = 0;
            this.joystick.knobEl.style.left = '35px';
            this.joystick.knobEl.style.top = '35px';
            return;
        }

        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, this.joystick.maxRadius);
        const nx = Math.cos(angle) * clampedDist;
        const ny = Math.sin(angle) * clampedDist;

        this.joystick.knobEl.style.left = (35 + nx) + 'px';
        this.joystick.knobEl.style.top = (35 + ny) + 'px';

        // Convert to 4-directional movement (dominant axis)
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax > ay) {
            this.moveDir.x = dx > 0 ? 1 : -1;
            this.moveDir.z = 0;
        } else {
            this.moveDir.x = 0;
            this.moveDir.z = dy > 0 ? 1 : -1;
        }
    },

    getMove() {
        let mx = 0, mz = 0;
        // Keyboard
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) mx -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) mx += 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) mz -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) mz += 1;
        // Touch joystick
        if (this.joystick.active) {
            mx += this.moveDir.x;
            mz += this.moveDir.z;
        }
        // Clamp
        mx = clamp(mx, -1, 1);
        mz = clamp(mz, -1, 1);
        return { x: mx, z: mz };
    },

    isBombAction() {
        const pressed = this.keys['Space'] || this.bombPressed;
        if (pressed) {
            this.keys['Space'] = false;
            this.bombPressed = false;
            return true;
        }
        return false;
    },

    isRemoteAction() {
        const pressed = this.keys['KeyR'] || this.remotePressed;
        if (pressed) {
            this.keys['KeyR'] = false;
            this.remotePressed = false;
            return true;
        }
        return false;
    },

    isPauseAction() {
        const pressed = this.keys['Escape'] || this.pausePressed;
        if (pressed) {
            this.keys['Escape'] = false;
            this.pausePressed = false;
            return true;
        }
        return false;
    },

    isAnyKey() {
        return Object.values(this.keys).some(v => v) || this.bombPressed || this.joystick.active;
    },

    reset() {
        this.keys = {};
        this.moveDir = { x: 0, z: 0 };
        this.bombPressed = false;
        this.remotePressed = false;
        this.pausePressed = false;
    }
};
