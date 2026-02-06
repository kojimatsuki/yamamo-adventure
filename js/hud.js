// HUD management
const HUD = {
    visible: false,

    show() {
        document.getElementById('hud').style.display = 'flex';
        this.visible = true;
    },

    hide() {
        document.getElementById('hud').style.display = 'none';
        this.visible = false;
    },

    updateLives(lives) {
        const el = document.getElementById('hud-lives');
        let str = '';
        for (let i = 0; i < lives; i++) str += '\u2764 ';
        el.textContent = str.trim();
    },

    updateStage(world, stage) {
        document.getElementById('hud-stage').textContent = `W${world}-${stage}`;
    },

    updateTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        document.getElementById('hud-time').textContent = `${m}:${s.toString().padStart(2, '0')}`;
        // Flash red when low
        const el = document.getElementById('hud-time');
        el.style.color = seconds < 30 ? '#ff4444' : '#ffffff';
    },

    updateScore(score) {
        document.getElementById('hud-score').textContent = `${score}pts`;
    },

    updatePowerups(player) {
        const el = document.getElementById('hud-powerups');
        el.innerHTML = '';

        const items = [
            { label: `B${player.maxBombs}`, color: '#4444ff', show: player.maxBombs > 1 },
            { label: `F${player.fireRange}`, color: '#ff4444', show: player.fireRange > 1 },
            { label: 'R', color: '#ffff44', show: player.hasRemote },
            { label: 'P', color: '#ff44ff', show: player.hasPenetrate },
        ];

        items.forEach(item => {
            if (!item.show) return;
            const div = document.createElement('div');
            div.className = 'powerup-icon';
            div.style.background = item.color;
            div.textContent = item.label;
            el.appendChild(div);
        });

        // Show skull debuff
        if (player.skullTimer > 0) {
            const div = document.createElement('div');
            div.className = 'powerup-icon';
            div.style.background = '#884488';
            div.textContent = `X${Math.ceil(player.skullTimer)}`;
            el.appendChild(div);
        }
    },

    showBossHP(hp, maxHp) {
        let bar = document.getElementById('boss-hp-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'boss-hp-bar';
            bar.style.cssText = 'position:absolute;bottom:220px;left:50%;transform:translateX(-50%);width:200px;height:16px;background:rgba(0,0,0,0.5);border:2px solid #fff;border-radius:8px;overflow:hidden;z-index:10;';
            const fill = document.createElement('div');
            fill.id = 'boss-hp-fill';
            fill.style.cssText = 'height:100%;background:linear-gradient(to right, #ff4444, #ff8844);transition:width 0.3s;';
            bar.appendChild(fill);
            document.getElementById('game-container').appendChild(bar);
        }
        bar.style.display = 'block';
        const fill = document.getElementById('boss-hp-fill');
        fill.style.width = `${(hp / maxHp) * 100}%`;
    },

    hideBossHP() {
        const bar = document.getElementById('boss-hp-bar');
        if (bar) bar.style.display = 'none';
    },
};
