// Visual effects system
const Effects = {
    particles: [],
    shakeAmount: 0,
    shakeTimer: 0,
    scene: null,
    camera: null,
    cameraOrigPos: null,
    overlays: [],

    init(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.cameraOrigPos = camera.position.clone();
        this.particles = [];
        this.overlays = [];
    },

    update(dt) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.timer -= dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.vy -= 5 * dt; // gravity
            const t = 1 - (p.timer / p.maxTimer);
            p.mesh.material.opacity = 1 - t;
            p.mesh.scale.setScalar(1 - t * 0.5);
            if (p.timer <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }

        // Screen shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const intensity = this.shakeAmount * (this.shakeTimer / 0.3);
            this.camera.position.x = this.cameraOrigPos.x + (Math.random() - 0.5) * intensity;
            this.camera.position.y = this.cameraOrigPos.y + (Math.random() - 0.5) * intensity;
        } else {
            this.camera.position.x = this.cameraOrigPos.x;
            this.camera.position.y = this.cameraOrigPos.y;
        }

        // Overlays
        for (let i = this.overlays.length - 1; i >= 0; i--) {
            const o = this.overlays[i];
            o.timer -= dt;
            if (o.onUpdate) o.onUpdate(o, dt);
            if (o.timer <= 0) {
                this.scene.remove(o.mesh);
                this.overlays.splice(i, 1);
            }
        }
    },

    spawnExplosionParticles(x, y, z, count, color) {
        for (let i = 0; i < (count || 15); i++) {
            const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const mat = new THREE.MeshPhongMaterial({
                color: color || 0xff6600,
                emissive: color ? new THREE.Color(color).multiplyScalar(0.5) : 0xff3300,
                transparent: true,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            const maxTimer = 0.5 + Math.random() * 0.5;
            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 5,
                vy: 2 + Math.random() * 4,
                vz: (Math.random() - 0.5) * 5,
                timer: maxTimer,
                maxTimer,
            });
        }
    },

    spawnItemParticles(x, y, z, color) {
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const mat = new THREE.MeshPhongMaterial({
                color: color || 0xffff00,
                emissive: 0xaaaa00,
                transparent: true,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            const angle = (Math.PI * 2 / 8) * i;
            const maxTimer = 0.6;
            this.particles.push({
                mesh,
                vx: Math.cos(angle) * 2,
                vy: 1 + Math.random() * 2,
                vz: Math.sin(angle) * 2,
                timer: maxTimer,
                maxTimer,
            });
        }
    },

    spawnDeathParticles(x, y, z, color) {
        this.spawnExplosionParticles(x, y + 0.5, z, 20, color);
    },

    screenShake(amount, duration) {
        this.shakeAmount = amount || 0.3;
        this.shakeTimer = duration || 0.3;
        this.cameraOrigPos = this.camera.position.clone();
    },

    showBossIntro(bossName, callback) {
        // Dark overlay
        const overlayGeo = new THREE.PlaneGeometry(30, 20);
        const overlayMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const overlay = new THREE.Mesh(overlayGeo, overlayMat);
        overlay.position.set(0, 5, 0);
        overlay.lookAt(this.camera.position);
        this.scene.add(overlay);

        // Boss name text
        const nameSprite = create3DText(bossName, 1.5, 0xff4444);
        nameSprite.position.set(0, 6, 0);
        nameSprite.lookAt(this.camera.position);
        nameSprite.visible = false;
        this.scene.add(nameSprite);

        let phase = 0;
        const overlay2 = {
            mesh: overlay,
            timer: 4,
            onUpdate: (o, dt) => {
                const elapsed = 4 - o.timer;
                if (elapsed < 1) {
                    // Fade in dark
                    overlayMat.opacity = elapsed * 0.7;
                } else if (elapsed < 2.5) {
                    overlayMat.opacity = 0.7;
                    nameSprite.visible = true;
                    // Pulse
                    const s = 1 + Math.sin(elapsed * 4) * 0.1;
                    nameSprite.scale.setScalar(s);
                } else {
                    // Fade out
                    overlayMat.opacity = 0.7 * (1 - (elapsed - 2.5) / 1.5);
                    nameSprite.visible = elapsed < 3.5;
                }
                if (o.timer <= 0) {
                    this.scene.remove(nameSprite);
                    if (callback) callback();
                }
            },
        };
        this.overlays.push(overlay2);
        SoundManager.playBossIntro();
    },

    clear() {
        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.overlays.forEach(o => {
            this.scene.remove(o.mesh);
        });
        this.particles = [];
        this.overlays = [];
        this.shakeTimer = 0;
    },

    updateCameraOrigPos() {
        this.cameraOrigPos = this.camera.position.clone();
    },
};
