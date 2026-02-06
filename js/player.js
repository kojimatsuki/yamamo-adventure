// Player character - Yamamo
const Player = {
    mesh: null,
    scene: null,
    position: { x: 0, z: 0 },
    gridPos: { gx: 1, gz: 1 },
    speed: PLAYER_SPEED_DEFAULT,
    maxBombs: PLAYER_INITIAL_BOMBS,
    activeBombs: 0,
    fireRange: PLAYER_INITIAL_FIRE,
    lives: PLAYER_INITIAL_LIVES,
    hasRemote: false,
    hasPenetrate: false,
    alive: true,
    invincible: false,
    invincibleTimer: 0,
    skullTimer: 0,
    moveDir: { x: 0, z: 0 },
    animTime: 0,
    sliding: false,
    slideDir: { x: 0, z: 0 },

    init(scene) {
        this.scene = scene;
        this._createMesh();
    },

    _createMesh() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        this.mesh = new THREE.Group();

        // Body (white gi/torso)
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.5, 8);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.35;
        body.castShadow = true;
        this.mesh.add(body);

        // Head (bald, skin color)
        const headGeo = new THREE.SphereGeometry(0.22, 12, 10);
        const headMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.75;
        head.castShadow = true;
        this.mesh.add(head);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.08, 0.78, 0.18);
        this.mesh.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.08, 0.78, 0.18);
        this.mesh.add(rightEye);

        // Belt (dark)
        const beltGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 8);
        const beltMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = 0.22;
        this.mesh.add(belt);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 6);
        const legMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.12, 0.1, 0);
        this.mesh.add(this.leftLeg);
        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.12, 0.1, 0);
        this.mesh.add(this.rightLeg);

        this.scene.add(this.mesh);
    },

    spawn(gx, gz) {
        const pos = gridToWorld(gx, gz);
        this.position.x = pos.x;
        this.position.z = pos.z;
        this.gridPos = { gx, gz };
        this.mesh.position.set(pos.x, 0, pos.z);
        this.alive = true;
        this.invincible = true;
        this.invincibleTimer = 2.0;
        this.sliding = false;
    },

    reset() {
        this.speed = PLAYER_SPEED_DEFAULT;
        this.maxBombs = PLAYER_INITIAL_BOMBS;
        this.activeBombs = 0;
        this.fireRange = PLAYER_INITIAL_FIRE;
        this.hasRemote = false;
        this.hasPenetrate = false;
        this.skullTimer = 0;
        this.sliding = false;
    },

    fullReset() {
        this.reset();
        this.lives = PLAYER_INITIAL_LIVES;
    },

    update(dt, map, bombs) {
        if (!this.alive) return;

        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
            // Blinking effect
            this.mesh.visible = Math.floor(this.invincibleTimer * 10) % 2 === 0;
        } else {
            this.mesh.visible = true;
        }

        // Skull debuff timer
        if (this.skullTimer > 0) {
            this.skullTimer -= dt;
            if (this.skullTimer <= 0) {
                this.speed = Math.max(this.speed + Math.abs(PLAYER_SPEED_DOWN), PLAYER_SPEED_DEFAULT);
                this.skullTimer = 0;
            }
        }

        // Movement
        const move = Input.getMove();
        let currentSpeed = this.speed;

        // Ice sliding mechanic
        if (this.sliding) {
            move.x = this.slideDir.x;
            move.z = this.slideDir.z;
            currentSpeed = this.speed * 1.5;
        }

        if (move.x !== 0 || move.z !== 0) {
            this.moveDir = { x: move.x, z: move.z };
            const newX = this.position.x + move.x * currentSpeed * dt;
            const newZ = this.position.z + move.z * currentSpeed * dt;

            // Check collision
            const margin = 0.35;
            const canMoveX = this._canMoveTo(newX, this.position.z, margin, map, bombs);
            const canMoveZ = this._canMoveTo(this.position.x, newZ, margin, map, bombs);

            if (canMoveX) {
                this.position.x = newX;
            } else if (this.sliding) {
                this.sliding = false;
                // Snap to grid
                this.position.x = Math.round(this.position.x + Math.floor(GRID_COLS / 2)) - Math.floor(GRID_COLS / 2);
            }
            if (canMoveZ) {
                this.position.z = newZ;
            } else if (this.sliding) {
                this.sliding = false;
                this.position.z = Math.round(this.position.z + Math.floor(GRID_ROWS / 2)) - Math.floor(GRID_ROWS / 2);
            }

            // Walking animation
            this.animTime += dt * 8;
            if (this.leftLeg && this.rightLeg) {
                this.leftLeg.position.z = Math.sin(this.animTime) * 0.08;
                this.rightLeg.position.z = -Math.sin(this.animTime) * 0.08;
            }

            // Face movement direction
            if (move.x !== 0 || move.z !== 0) {
                this.mesh.rotation.y = Math.atan2(move.x, move.z);
            }
        } else {
            // Reset leg position
            if (this.leftLeg && this.rightLeg) {
                this.leftLeg.position.z = 0;
                this.rightLeg.position.z = 0;
            }
        }

        // Update grid position
        const gp = worldToGrid(this.position.x, this.position.z);
        this.gridPos = gp;

        // Update mesh position
        this.mesh.position.set(this.position.x, 0, this.position.z);
    },

    _canMoveTo(x, z, margin, map, bombs) {
        // Check four corners
        const corners = [
            { x: x - margin, z: z - margin },
            { x: x + margin, z: z - margin },
            { x: x - margin, z: z + margin },
            { x: x + margin, z: z + margin },
        ];

        for (const c of corners) {
            const g = worldToGrid(c.x, c.z);
            if (map.isSolid(g.gx, g.gz)) return false;
            // Check bomb collision (can't walk through bombs, but can leave current bomb cell)
            if (bombs) {
                for (const bomb of bombs) {
                    if (bomb.gx === g.gx && bomb.gz === g.gz) {
                        // Allow walking off a bomb you just placed
                        if (bomb.gx === this.gridPos.gx && bomb.gz === this.gridPos.gz) continue;
                        return false;
                    }
                }
            }
        }
        return true;
    },

    die() {
        if (this.invincible || !this.alive) return false;
        this.alive = false;
        this.lives--;
        SoundManager.playDamage();
        return true;
    },

    applyItem(type) {
        switch (type) {
            case ITEM_BOMB_UP:
                this.maxBombs++;
                SoundManager.playItemGet();
                break;
            case ITEM_FIRE_UP:
                this.fireRange++;
                SoundManager.playItemGet();
                break;
            case ITEM_SPEED_UP:
                this.speed += PLAYER_SPEED_UP;
                SoundManager.playItemGet();
                break;
            case ITEM_REMOTE:
                this.hasRemote = true;
                SoundManager.playItemGet();
                break;
            case ITEM_PENETRATE:
                this.hasPenetrate = true;
                SoundManager.playItemGet();
                break;
            case ITEM_ONE_UP:
                this.lives++;
                SoundManager.playOneUp();
                break;
            case ITEM_SKULL:
                this.speed += PLAYER_SPEED_DOWN;
                if (this.speed < 1.0) this.speed = 1.0;
                this.skullTimer = 10.0;
                SoundManager.playSkullGet();
                break;
        }
    },
};
