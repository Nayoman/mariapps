/* Juice — ayudante de «sensación» para minijuegos en canvas 2D (script plano, window.Juice).
   Partículas, temblor de pantalla, hit-stop, tweens con curvas, textos flotantes, carga de imágenes y fichas redondas.
   Uso típico: const J = Juice.create(); en el bucle: J.update(dt); ctx.save(); ctx.translate(...J.shakeOffset()); dibujar; J.draw(ctx); ctx.restore(); */
(function () {
  'use strict';
  const ease = {
    linear: t => t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inQuad: t => t * t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
    inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  const imgCache = {};
  function loadImage(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    return imgCache[src];
  }
  function create() {
    const parts = [], tweens = [], texts = [];
    let trauma = 0, frozenUntil = 0, now = 0;
    const J = {
      ease, loadImage,
      // ---- partículas: J.burst(x, y, { n, color|colors, speed, life, size, gravity, spread, shape }) ----
      burst(x, y, o) {
        o = o || {}; const n = o.n || 12, colors = o.colors || [o.color || '#fff'];
        for (let i = 0; i < n; i++) {
          const a = (o.angle != null ? o.angle : Math.random() * Math.PI * 2) + (Math.random() - .5) * (o.spread == null ? Math.PI * 2 : o.spread);
          const sp = (o.speed || 220) * (0.4 + Math.random() * 0.8);
          parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life || .7) * (0.6 + Math.random() * 0.6), t: 0, size: (o.size || 6) * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], g: o.gravity == null ? 500 : o.gravity, shape: o.shape || 'square', rot: Math.random() * 6.28, vr: (Math.random() - .5) * 8 });
        }
      },
      // ---- temblor: J.shake(0.4) añade «trauma» (0-1); J.shakeOffset() → [dx, dy] ----
      shake(a) { trauma = Math.min(1, trauma + (a == null ? .3 : a)); },
      shakeOffset(max) { const s = trauma * trauma * (max || 10); return [(Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s]; },
      // ---- hit-stop: J.hitStop(70); en el bucle, si J.frozen() no mover nada ----
      hitStop(ms) { frozenUntil = Math.max(frozenUntil, now + (ms || 60)); },
      frozen() { return now < frozenUntil; },
      // ---- tweens: J.tween({ from, to, dur (s), ease, update(v), done() }) ----
      tween(o) { const t = { t: 0, dur: o.dur || .3, from: o.from == null ? 0 : o.from, to: o.to == null ? 1 : o.to, ease: o.ease || ease.outCubic, update: o.update, done: o.done, delay: o.delay || 0 }; tweens.push(t); return t; },
      // ---- texto flotante: J.text(x, y, '+10', { color, size, rise }) ----
      text(x, y, txt, o) { o = o || {}; texts.push({ x, y, txt, t: 0, life: o.life || .9, color: o.color || '#fff', size: o.size || 22, rise: o.rise == null ? 60 : o.rise, stroke: o.stroke == null ? '#000' : o.stroke }); },
      update(dt) {
        now += dt * 1000;
        trauma = Math.max(0, trauma - dt * 2.2);
        for (let i = tweens.length - 1; i >= 0; i--) {
          const t = tweens[i]; if (t.delay > 0) { t.delay -= dt; continue; } t.t += dt; const k = Math.min(1, t.t / t.dur);
          if (t.update) t.update(t.from + (t.to - t.from) * t.ease(k), k);
          if (k >= 1) { tweens.splice(i, 1); if (t.done) t.done(); }
        }
        if (this.frozen()) return;
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; if (p.t >= p.life) { parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= (1 - dt * 1.5); p.rot += p.vr * dt; }
        for (let i = texts.length - 1; i >= 0; i--) { const x = texts[i]; x.t += dt; if (x.t >= x.life) texts.splice(i, 1); }
      },
      draw(ctx) {
        for (const p of parts) {
          const a = 1 - p.t / p.life; ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.3)); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2 * (0.5 + a * 0.5), 0, 6.283); ctx.fill(); }
          else if (p.shape === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? p.size / 4 : p.size / 2, an = i * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); }
          else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
          ctx.restore();
        }
        for (const x of texts) {
          const k = x.t / x.life, y = x.y - ease.outCubic(k) * x.rise, s = x.size * (k < .2 ? 0.7 + k * 1.5 : 1);
          ctx.save(); ctx.globalAlpha = 1 - Math.max(0, (k - .6) / .4); ctx.font = `900 ${s}px -apple-system, "Segoe UI", Roboto, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (x.stroke) { ctx.lineWidth = 5; ctx.strokeStyle = x.stroke; ctx.strokeText(x.txt, x.x, y); } ctx.fillStyle = x.color; ctx.fillText(x.txt, x.x, y); ctx.restore();
        }
      },
      // ---- ficha redonda: J.token(ctx, img, x, y, r, { ring, squash }) ----
      token(ctx, img, x, y, r, o) {
        o = o || {}; ctx.save(); ctx.translate(x, y); if (o.sx || o.sy) ctx.scale(o.sx || 1, o.sy || 1); if (o.rot) ctx.rotate(o.rot);
        if (img) ctx.drawImage(img, -r, -r, r * 2, r * 2); else { ctx.fillStyle = o.color || '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); }
        if (o.ring) { ctx.lineWidth = o.ring; ctx.strokeStyle = o.ringColor || '#fff'; ctx.beginPath(); ctx.arc(0, 0, r - o.ring / 2, 0, 6.283); ctx.stroke(); }
        ctx.restore();
      },
      count() { return parts.length; },
      reset() { parts.length = 0; tweens.length = 0; texts.length = 0; trauma = 0; frozenUntil = 0; },
    };
    return J;
  }
  window.Juice = { create, ease, loadImage };
})();
