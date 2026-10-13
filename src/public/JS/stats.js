/* ===== MIS ESTADISTICAS: apertura + animacion de los aros ===== */
(() => {
    'use strict';

    /* ---------------------------------------------------------------
       CONFIGURACION
       - peak: hasta donde sube el aro (100 = aro completo)
       - riseMs / fallMs: duracion de la subida y de la bajada
       - endPercent: donde se queda el aro al terminar la bajada.
           Hoy es 0 (baja hasta el principio).
           Cuando tengas experiencia, ponelo con el % de XP actual, por ej:
               PesitoStats.config.rings.level.endPercent = () => (xp / xpParaSubir) * 100;
           Puede ser un numero o una funcion (se evalua en cada entrada).
    ---------------------------------------------------------------- */
    const config = {
        peak: 100,
        startDelayMs: 250,
        riseMs: 1400,
        fallMs: 1200,
        rings: {
            level: { endPercent: 100 },
            ratio: { endPercent: 100 }
        }
    };

    const section = document.querySelector('.my-stats');
    if (!section) return;

    const openBtn  = document.getElementById('user-stats');
    const backBtn  = document.getElementById('stats-back-to-menu');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const rings = {};
    section.querySelectorAll('[data-ring]').forEach(el => {
        rings[el.dataset.ring] = el.querySelector('.ring-arc');
    });

    const easeInOutCubic = t => (t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2);
    const easeOutCubic   = t => 1 - (1 - t) ** 3;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    function paint(name, percent) {
        const arc = rings[name];
        if (arc) arc.style.strokeDashoffset = String(100 - clamp(percent, 0, 100));
    }

    function resolveEnd(name) {
        const end = config.rings[name] && config.rings[name].endPercent;
        return clamp(typeof end === 'function' ? Number(end()) : Number(end), 0, 100) || 0;
    }

    /* ---------------- Animacion ---------------- */
    let frame = null;
    let delayTimer = null;

    function stopAnimation() {
        if (frame) cancelAnimationFrame(frame);
        if (delayTimer) clearTimeout(delayTimer);
        frame = delayTimer = null;
    }

    function playAnimation() {
        stopAnimation();
        const names = Object.keys(rings);
        names.forEach(n => paint(n, 0));                      // siempre arranca en 0

        const ends = Object.fromEntries(names.map(n => [n, resolveEnd(n)]));

        if (reduceMotion.matches) {                           // sin animacion: directo al valor final
            names.forEach(n => paint(n, ends[n]));
            return;
        }

        delayTimer = setTimeout(() => {
            const t0 = performance.now();
            const total = config.riseMs + config.fallMs;

            const tick = now => {
                const elapsed = now - t0;

                names.forEach(n => {
                    if (elapsed < config.riseMs) {
                        const p = easeInOutCubic(elapsed / config.riseMs);
                        paint(n, p * config.peak);
                    } else {
                        const p = easeOutCubic(clamp((elapsed - config.riseMs) / config.fallMs, 0, 1));
                        paint(n, config.peak + (ends[n] - config.peak) * p);
                    }
                });

                frame = elapsed < total ? requestAnimationFrame(tick) : null;
            };
            frame = requestAnimationFrame(tick);
        }, config.startDelayMs);
    }

    /* ---------------- Abrir / cerrar ---------------- */
    function open() {
        section.classList.add('is-open');
        section.setAttribute('aria-hidden', 'false');
        playAnimation();
        if (backBtn) backBtn.focus({ preventScroll: true });
    }

    function close() {
        section.classList.remove('is-open');
        section.setAttribute('aria-hidden', 'true');
        stopAnimation();
        if (openBtn) openBtn.focus({ preventScroll: true });
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (backBtn) backBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && section.classList.contains('is-open')) close();
    });

    /* ---------------- Datos ----------------
    Uso: PesitoStats.setData({ level: 99, ratio: 1.01, played: 2, won: 2, lost: 0 })
    ------------------------------------------ */
    function setData(data = {}) {
        const map = {
            level:  v => v,
            ratio:  v => Number(v).toFixed(2),
            played: v => v,
            won:    v => v,
            lost:   v => v
        };
        Object.entries(map).forEach(([key, fmt]) => {
            if (data[key] === undefined) return;
            const el = section.querySelector(`[data-stat="${key}"]`);
            if (el) el.textContent = fmt(data[key]);
        });
    }

    window.PesitoStats = { config, setData, open, close };
})();
