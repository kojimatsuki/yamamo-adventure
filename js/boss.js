// Boss system
const BossManager = {
    boss: null,
    scene: null,
    projectiles: [],
    shieldActive: false,
    shieldTimer: 0,
    attackTimer: 0,
    phase: 1,

    init(scene) {
        this.scene = scene;
        this.boss = null;
        this.projectiles = [];
        this.shieldActive = false;
        this.phase = 1;
    },

    spawn(world) {
        const bossData = this._getBossData(world);
        const mesh = this._createBossMesh(world);
        const spawnPos = gridToWorld(6, 5); // Center of map

        mesh.position.set(spawnPos.x, 0, spawnPos.z);
        this.scene.add(mesh);

        this.boss = {
            world,
            mesh,
            hp: bossData.hp,
            maxHp: bossData.hp,
            speed: bossData.speed,
            position: { x: spawnPos.x, z: spawnPos.z },
            direction: { x: 0, z: 0 },
            alive: true,
            moveTimer: 0,
            attackTimer: 3,
            animTime: 0,
            name: bossData.name,
        };
        this.phase = 1;
        this.shieldActive = false;
        this._setRandomDirection(this.boss);
        return this.boss;
    },

    _getBossData(world) {
        const data = {
            1: { name: '巨大スライム', hp: 3, speed: 1.0 },
            2: { name: 'ファイアゴーレム', hp: 5, speed: 1.2 },
            3: { name: 'アイスドラゴン', hp: 5, speed: 1.5 },
            4: { name: 'メカキング', hp: 7, speed: 1.3 },
            5: { name: '魔王オニヅカ', hp: 10, speed: 2.0 },
        };
        return data[world] || data[1];
    },

    _createBossMesh(world) {
        const group = new THREE.Group();

        switch (world) {
            case 1: {
                // Giant Slime
                const bodyGeo = new THREE.SphereGeometry(0.8, 16, 12);
                bodyGeo.scale(1, 0.7, 1);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x44ee44, emissive: 0x115511, transparent: true, opacity: 0.85 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.5;
                body.castShadow = true;
                group.add(body);
                // Big eyes
                const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
                const pupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
                const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
                [-0.2, 0.2].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.7, 0.55);
                    group.add(eye);
                    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
                    pupil.position.set(x, 0.7, 0.65);
                    group.add(pupil);
                });
                break;
            }
            case 2: {
                // Fire Golem
                const bodyGeo = new THREE.BoxGeometry(0.9, 1.2, 0.7);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x883300, emissive: 0x441100 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.7;
                body.castShadow = true;
                group.add(body);
                const headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.5);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.y = 1.55;
                group.add(head);
                // Fire crown
                const crownGeo = new THREE.ConeGeometry(0.3, 0.4, 6);
                const crownMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff2200 });
                const crown = new THREE.Mesh(crownGeo, crownMat);
                crown.position.y = 2.0;
                group.add(crown);
                // Glowing eyes
                const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff4400 });
                [-0.12, 0.12].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 1.6, 0.22);
                    group.add(eye);
                });
                break;
            }
            case 3: {
                // Ice Dragon
                const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 8);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x6699cc, emissive: 0x224466 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.7;
                body.castShadow = true;
                group.add(body);
                // Head
                const headGeo = new THREE.ConeGeometry(0.3, 0.5, 6);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.set(0, 1.5, 0.2);
                head.rotation.x = -0.3;
                group.add(head);
                // Wings
                const wingGeo = new THREE.PlaneGeometry(0.8, 0.6);
                const wingMat = new THREE.MeshPhongMaterial({ color: 0x88bbee, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
                [-0.5, 0.5].forEach((x, i) => {
                    const wing = new THREE.Mesh(wingGeo, wingMat);
                    wing.position.set(x, 1.0, -0.1);
                    wing.rotation.y = x > 0 ? -0.5 : 0.5;
                    wing.name = i === 0 ? 'lwing' : 'rwing';
                    group.add(wing);
                });
                // Eyes
                const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0x00ccff, emissive: 0x0088aa });
                [-0.1, 0.1].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 1.55, 0.35);
                    group.add(eye);
                });
                break;
            }
            case 4: {
                // Mecha King
                const bodyGeo = new THREE.BoxGeometry(0.9, 1.0, 0.7);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x666688, emissive: 0x222233 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.7;
                body.castShadow = true;
                group.add(body);
                const headGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
                const headMat = new THREE.MeshPhongMaterial({ color: 0x888899 });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 1.4;
                group.add(head);
                // Antenna
                const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
                const antMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xaa0000 });
                const ant = new THREE.Mesh(antGeo, antMat);
                ant.position.y = 1.75;
                group.add(ant);
                // Eyes (visor)
                const visorGeo = new THREE.BoxGeometry(0.4, 0.08, 0.05);
                const visorMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
                const visor = new THREE.Mesh(visorGeo, visorMat);
                visor.position.set(0, 1.42, 0.2);
                group.add(visor);
                // Arms/cannons
                [-0.55, 0.55].forEach(x => {
                    const armGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6);
                    const arm = new THREE.Mesh(armGeo, bodyMat);
                    arm.position.set(x, 0.5, 0);
                    group.add(arm);
                });
                break;
            }
            case 5: {
                // Maou Onizuka
                const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x440066, emissive: 0x220033 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.7;
                body.castShadow = true;
                group.add(body);
                // Head
                const headGeo = new THREE.SphereGeometry(0.28, 10, 8);
                const headMat = new THREE.MeshPhongMaterial({ color: 0x660088, emissive: 0x330044 });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 1.5;
                group.add(head);
                // Horns
                const hornGeo = new THREE.ConeGeometry(0.06, 0.3, 6);
                const hornMat = new THREE.MeshPhongMaterial({ color: 0xffcc00, emissive: 0xaa8800 });
                [-0.2, 0.2].forEach(x => {
                    const horn = new THREE.Mesh(hornGeo, hornMat);
                    horn.position.set(x, 1.8, 0);
                    horn.rotation.z = x > 0 ? -0.3 : 0.3;
                    group.add(horn);
                });
                // Cape
                const capeGeo = new THREE.PlaneGeometry(0.8, 1.0);
                const capeMat = new THREE.MeshPhongMaterial({ color: 0x880000, side: THREE.DoubleSide });
                const cape = new THREE.Mesh(capeGeo, capeMat);
                cape.position.set(0, 0.7, -0.35);
                group.add(cape);
                // Eyes
                const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
                [-0.1, 0.1].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 1.55, 0.22);
                    group.add(eye);
                });
                break;
            }
        }
        return group;
    },

    _setRandomDirection(boss) {
        const dirs = [
            { x: 1, z: 0 }, { x: -1, z: 0 },
            { x: 0, z: 1 }, { x: 0, z: -1 },
        ];
        boss.direction = dirs[Math.floor(Math.random() * dirs.length)];
    },

    update(dt, map, playerPos) {
        if (!this.boss || !this.boss.alive) return;
        const boss = this.boss;
        boss.animTime += dt;
        boss.moveTimer -= dt;
        boss.attackTimer -= dt;

        // Phase check for world 5
        if (boss.world === 5 && boss.hp <= 5 && this.phase === 1) {
            this.phase = 2;
            boss.speed = 3.5;
        }

        // Shield timer for Mecha King
        if (this.shieldActive) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                // Remove shield visual
                const shieldMesh = boss.mesh.getObjectByName('shield');
                if (shieldMesh) boss.mesh.remove(shieldMesh);
            }
        }

        // Movement AI
        this._moveBoss(boss, dt, map, playerPos);

        // Attack AI
        if (boss.attackTimer <= 0) {
            this._bossAttack(boss, map, playerPos);
        }

        // Update projectiles
        this._updateProjectiles(dt, map);

        // Animations
        this._animateBoss(boss);

        boss.mesh.position.set(boss.position.x, 0, boss.position.z);
    },

    _moveBoss(boss, dt, map, playerPos) {
        if (boss.moveTimer <= 0) {
            // Move toward player sometimes, random other times
            if (Math.random() < 0.5 || boss.world === 5) {
                const dx = playerPos.x - boss.position.x;
                const dz = playerPos.z - boss.position.z;
                if (Math.abs(dx) > Math.abs(dz)) {
                    boss.direction = { x: dx > 0 ? 1 : -1, z: 0 };
                } else {
                    boss.direction = { x: 0, z: dz > 0 ? 1 : -1 };
                }
            } else {
                this._setRandomDirection(boss);
            }
            boss.moveTimer = boss.world === 5 && this.phase === 2 ? 0.3 : (1 + Math.random());
        }

        // Teleport for world 5 phase 2
        if (boss.world === 5 && this.phase === 2 && Math.random() < 0.005) {
            const gx = 2 + Math.floor(Math.random() * (GRID_COLS - 4));
            const gz = 2 + Math.floor(Math.random() * (GRID_ROWS - 4));
            if (map.isWalkable(gx, gz)) {
                const pos = gridToWorld(gx, gz);
                boss.position.x = pos.x;
                boss.position.z = pos.z;
            }
        }

        const speed = boss.speed;
        const newX = boss.position.x + boss.direction.x * speed * dt;
        const newZ = boss.position.z + boss.direction.z * speed * dt;

        const margin = 0.5;
        const corners = [
            { x: newX - margin, z: newZ - margin },
            { x: newX + margin, z: newZ - margin },
            { x: newX - margin, z: newZ + margin },
            { x: newX + margin, z: newZ + margin },
        ];
        let canMove = true;
        for (const c of corners) {
            const g = worldToGrid(c.x, c.z);
            if (map.isSolid(g.gx, g.gz)) { canMove = false; break; }
        }
        if (canMove) {
            boss.position.x = newX;
            boss.position.z = newZ;
        } else {
            this._setRandomDirection(boss);
            boss.moveTimer = 0.5;
        }
    },

    _bossAttack(boss, map, playerPos) {
        switch (boss.world) {
            case 1:
                // Giant slime - no special attack
                boss.attackTimer = 3;
                break;
            case 2:
                // Fire Golem - fire breath in a line
                this._fireBreath(boss, playerPos);
                boss.attackTimer = 4;
                break;
            case 3:
                // Ice Dragon - ice breath + freeze tiles
                this._iceBreath(boss, playerPos);
                boss.attackTimer = 3.5;
                break;
            case 4:
                // Mecha King - missile + shield
                if (Math.random() < 0.4 && !this.shieldActive) {
                    this._activateShield(boss);
                    boss.attackTimer = 2;
                } else {
                    this._fireMissile(boss, playerPos);
                    boss.attackTimer = 3;
                }
                break;
            case 5:
                // Maou Onizuka
                if (this.phase === 2) {
                    this._allDirectionBlast(boss);
                    boss.attackTimer = 2.5;
                } else {
                    // Place bomb like player
                    const g = worldToGrid(boss.position.x, boss.position.z);
                    BombManager.placeBomb(g.gx, g.gz, 2, false);
                    boss.attackTimer = 2;
                }
                break;
        }
    },

    _fireBreath(boss, playerPos) {
        const dx = playerPos.x - boss.position.x;
        const dz = playerPos.z - boss.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.1) return;
        const dir = { x: dx / dist, z: dz / dist };

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const geo = new THREE.SphereGeometry(0.2, 6, 6);
                const mat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff2200, transparent: true, opacity: 0.8 });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(boss.position.x, 0.5, boss.position.z);
                this.scene.add(mesh);
                this.projectiles.push({
                    mesh,
                    position: { x: boss.position.x, z: boss.position.z },
                    direction: { ...dir },
                    speed: 5,
                    timer: 3,
                    type: 'fire',
                    damage: true,
                });
            }, i * 100);
        }
    },

    _iceBreath(boss, playerPos) {
        const dx = playerPos.x - boss.position.x;
        const dz = playerPos.z - boss.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.1) return;
        const dir = { x: dx / dist, z: dz / dist };

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const geo = new THREE.SphereGeometry(0.25, 6, 6);
                const mat = new THREE.MeshPhongMaterial({ color: 0x88ccff, emissive: 0x4488cc, transparent: true, opacity: 0.7 });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(boss.position.x, 0.5, boss.position.z);
                this.scene.add(mesh);
                this.projectiles.push({
                    mesh,
                    position: { x: boss.position.x, z: boss.position.z },
                    direction: { x: dir.x + (Math.random() - 0.5) * 0.3, z: dir.z + (Math.random() - 0.5) * 0.3 },
                    speed: 4,
                    timer: 3,
                    type: 'ice',
                    damage: true,
                    slowEffect: true,
                });
            }, i * 150);
        }
    },

    _fireMissile(boss, playerPos) {
        const geo = new THREE.ConeGeometry(0.1, 0.3, 6);
        const mat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x666666 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(boss.position.x, 0.5, boss.position.z);
        mesh.rotation.x = Math.PI / 2;
        this.scene.add(mesh);
        this.projectiles.push({
            mesh,
            position: { x: boss.position.x, z: boss.position.z },
            target: { x: playerPos.x, z: playerPos.z },
            speed: 4,
            timer: 5,
            type: 'missile',
            damage: true,
            homing: true,
        });
    },

    _activateShield(boss) {
        this.shieldActive = true;
        this.shieldTimer = 3;
        const geo = new THREE.SphereGeometry(0.8, 12, 10);
        const mat = new THREE.MeshPhongMaterial({ color: 0x4488ff, emissive: 0x2244aa, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const shield = new THREE.Mesh(geo, mat);
        shield.position.y = 0.7;
        shield.name = 'shield';
        boss.mesh.add(shield);
    },

    _allDirectionBlast(boss) {
        const dirs = 8;
        for (let i = 0; i < dirs; i++) {
            const angle = (Math.PI * 2 / dirs) * i;
            const geo = new THREE.SphereGeometry(0.2, 6, 6);
            const mat = new THREE.MeshPhongMaterial({ color: 0x9900ff, emissive: 0x6600aa, transparent: true, opacity: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(boss.position.x, 0.5, boss.position.z);
            this.scene.add(mesh);
            this.projectiles.push({
                mesh,
                position: { x: boss.position.x, z: boss.position.z },
                direction: { x: Math.cos(angle), z: Math.sin(angle) },
                speed: 4,
                timer: 2.5,
                type: 'dark',
                damage: true,
            });
        }
    },

    _updateProjectiles(dt, map) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.timer -= dt;

            if (p.homing && p.target) {
                // Update target to current player position
                p.target = { x: Player.position.x, z: Player.position.z };
                const dx = p.target.x - p.position.x;
                const dz = p.target.z - p.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > 0.1) {
                    p.direction = { x: dx / dist, z: dz / dist };
                }
            }

            if (p.direction) {
                p.position.x += p.direction.x * p.speed * dt;
                p.position.z += p.direction.z * p.speed * dt;
            }

            p.mesh.position.set(p.position.x, 0.5, p.position.z);

            // Check wall collision for missiles
            const g = worldToGrid(p.position.x, p.position.z);
            if (map.isHard(g.gx, g.gz)) {
                this._removeProjectile(i);
                if (p.type === 'missile') SoundManager.playExplosion();
                continue;
            }

            if (p.timer <= 0) {
                this._removeProjectile(i);
                continue;
            }
        }
    },

    _removeProjectile(index) {
        const p = this.projectiles[index];
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(index, 1);
    },

    _animateBoss(boss) {
        switch (boss.world) {
            case 1:
                // Slime bounce
                if (boss.mesh.children[0]) {
                    boss.mesh.children[0].position.y = 0.5 + Math.abs(Math.sin(boss.animTime * 2)) * 0.2;
                    boss.mesh.children[0].scale.set(
                        1 + Math.sin(boss.animTime * 2) * 0.1,
                        0.7 - Math.sin(boss.animTime * 2) * 0.1,
                        1 + Math.sin(boss.animTime * 2) * 0.1
                    );
                }
                break;
            case 3:
                // Dragon wing flap
                boss.mesh.children.forEach(c => {
                    if (c.name === 'lwing') c.rotation.z = Math.sin(boss.animTime * 3) * 0.3;
                    if (c.name === 'rwing') c.rotation.z = -Math.sin(boss.animTime * 3) * 0.3;
                });
                break;
        }
        // Face direction
        if (boss.direction.x !== 0 || boss.direction.z !== 0) {
            boss.mesh.rotation.y = Math.atan2(boss.direction.x, boss.direction.z);
        }
    },

    damageAt(gx, gz) {
        if (!this.boss || !this.boss.alive) return false;
        if (this.shieldActive) return false;
        const bg = worldToGrid(this.boss.position.x, this.boss.position.z);
        const margin = 1;
        if (Math.abs(bg.gx - gx) <= margin && Math.abs(bg.gz - gz) <= margin) {
            this.boss.hp--;
            if (this.boss.hp <= 0) {
                this.boss.alive = false;
                this.scene.remove(this.boss.mesh);
                SoundManager.playEnemyDeath();
                return true;
            }
        }
        return false;
    },

    checkCollisionWithPlayer(px, pz) {
        if (!this.boss || !this.boss.alive) return false;
        const dx = Math.abs(this.boss.position.x - px);
        const dz = Math.abs(this.boss.position.z - pz);
        if (dx < 0.6 && dz < 0.6) return true;

        // Check projectile collision
        for (const p of this.projectiles) {
            const pdx = Math.abs(p.position.x - px);
            const pdz = Math.abs(p.position.z - pz);
            if (pdx < 0.3 && pdz < 0.3 && p.damage) {
                return p;
            }
        }
        return false;
    },

    isAlive() {
        return this.boss && this.boss.alive;
    },

    clear() {
        if (this.boss && this.boss.mesh) {
            this.scene.remove(this.boss.mesh);
        }
        this.projectiles.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.boss = null;
        this.projectiles = [];
        this.shieldActive = false;
    },
};
