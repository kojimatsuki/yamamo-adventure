// Main entry point
(function () {
    'use strict';

    // Prevent iOS Safari bounce
    document.addEventListener('touchmove', (e) => {
        if (e.target === document.body || e.target === document.documentElement) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Init game
    Game.init();

    // Game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap delta time
        lastTime = timestamp;

        Game.update(dt);
        Game.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        requestAnimationFrame(gameLoop);
    });
})();
