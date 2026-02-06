// Sound system using Web Audio API
const SoundManager = {
    ctx: null,
    muted: false,
    bgmGain: null,
    seGain: null,
    currentBGM: null,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.3;
            this.bgmGain.connect(this.ctx.destination);
            this.seGain = this.ctx.createGain();
            this.seGain.gain.value = 0.5;
            this.seGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.bgmGain) this.bgmGain.gain.value = this.muted ? 0 : 0.3;
        if (this.seGain) this.seGain.gain.value = this.muted ? 0 : 0.5;
    },

    // Generate a simple tone
    playTone(freq, duration, type, gainNode, detune) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.value = freq;
        if (detune) osc.detune.value = detune;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gainNode || this.seGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    },

    // Sound effects
    playExplosion() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        source.connect(gain);
        gain.connect(this.seGain);
        source.start();
    },

    playBombPlace() {
        this.playTone(150, 0.1, 'sine');
        this.playTone(100, 0.15, 'sine');
    },

    playItemGet() {
        this.playTone(523, 0.1, 'square');
        setTimeout(() => this.playTone(659, 0.1, 'square'), 80);
        setTimeout(() => this.playTone(784, 0.15, 'square'), 160);
    },

    playDamage() {
        this.playTone(200, 0.15, 'sawtooth');
        this.playTone(150, 0.2, 'sawtooth');
    },

    playEnemyDeath() {
        this.playTone(400, 0.1, 'square');
        setTimeout(() => this.playTone(300, 0.1, 'square'), 60);
        setTimeout(() => this.playTone(200, 0.2, 'square'), 120);
    },

    playStageClear() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.2, 'square'), i * 150);
        });
    },

    playGameOver() {
        const notes = [400, 350, 300, 200];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.3, 'sawtooth'), i * 200);
        });
    },

    playMenuSelect() {
        this.playTone(440, 0.05, 'square');
    },

    playMenuConfirm() {
        this.playTone(523, 0.08, 'square');
        setTimeout(() => this.playTone(659, 0.1, 'square'), 60);
    },

    playSkullGet() {
        this.playTone(150, 0.2, 'sawtooth');
        this.playTone(120, 0.3, 'sawtooth');
    },

    playOneUp() {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.12, 'square'), i * 100);
        });
    },

    // BGM - simple looping melody per world
    _bgmInterval: null,
    _bgmPlaying: false,

    stopBGM() {
        this._bgmPlaying = false;
        if (this._bgmInterval) {
            clearInterval(this._bgmInterval);
            this._bgmInterval = null;
        }
    },

    playBGM(world) {
        this.stopBGM();
        if (!this.ctx) return;
        this._bgmPlaying = true;

        const melodies = {
            1: [262, 294, 330, 349, 330, 294, 262, 247, 262, 294, 330, 294, 262, 262, 0, 0],
            2: [220, 0, 262, 220, 0, 196, 220, 0, 262, 294, 262, 220, 196, 220, 0, 0],
            3: [330, 392, 440, 392, 330, 294, 262, 294, 330, 392, 440, 523, 440, 392, 330, 0],
            4: [196, 196, 233, 196, 0, 175, 196, 0, 233, 262, 233, 196, 175, 165, 175, 0],
            5: [165, 196, 220, 196, 165, 147, 131, 147, 165, 196, 220, 262, 220, 196, 165, 0],
        };
        const melody = melodies[world] || melodies[1];
        let noteIndex = 0;
        const tempo = world === 4 ? 150 : 200;

        this._bgmInterval = setInterval(() => {
            if (!this._bgmPlaying) return;
            const freq = melody[noteIndex % melody.length];
            if (freq > 0) {
                this.playTone(freq, tempo / 1000 * 0.8, 'square', this.bgmGain);
            }
            noteIndex++;
        }, tempo);
    },

    playTitleBGM() {
        this.stopBGM();
        if (!this.ctx) return;
        this._bgmPlaying = true;
        const melody = [330, 392, 440, 523, 440, 392, 330, 294, 262, 294, 330, 440, 392, 330, 294, 262];
        let noteIndex = 0;
        this._bgmInterval = setInterval(() => {
            if (!this._bgmPlaying) return;
            const freq = melody[noteIndex % melody.length];
            if (freq > 0) {
                this.playTone(freq, 0.18, 'square', this.bgmGain);
            }
            noteIndex++;
        }, 250);
    },

    playBossIntro() {
        const notes = [131, 0, 131, 0, 131, 165, 196, 220];
        notes.forEach((n, i) => {
            setTimeout(() => {
                if (n > 0) this.playTone(n, 0.25, 'sawtooth');
            }, i * 200);
        });
    },
};
