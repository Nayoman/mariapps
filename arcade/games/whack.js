/* whack.js — «Golpea al oni» (mundo Demon Slayer). Tipo «whack-a-mole»: los onis asoman por nueve agujeros y hay
   que tocarlos antes de que se escondan; Nezuko también asoma y a ella NO se le da. Canvas 2D + Juice (partículas,
   temblor, hit-stop, tweens y textos flotantes). Contrato: window.MiniGames.whack.start(container, opts) → { stop() }.
   Script plano, sin librerías nuevas ni red. */
(function () {
  'use strict';
  window.MiniGames = window.MiniGames || {};

  var W = 360;                                                    // ancho lógico; el alto sigue la proporción del contenedor
  var FONT = '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
  var TAU = Math.PI * 2;
  var GAME_SECS = 60, GOAL = 250, COMBO_WINDOW = 1.5, COUNT_STEP = 0.7, YA_SECS = 0.5, END_MS = 1300;
  var HUD_H = 96, STRIP_H = 74;                                   // marcador arriba y tira de Tanjiro abajo
  var LEVELS = [                                                  // cada 15 s: más onis a la vez, menos tiempo fuera y menos espera entre ellos
    { max: 1, hold: 1.2, gap: 0.9 }, { max: 2, hold: 1.0, gap: 0.65 }, { max: 3, hold: 0.85, gap: 0.5 }, { max: 3, hold: 0.72, gap: 0.42 }
  ];
  var IMG = { oni: 'assets/tokens/boss_demon.png', nezuko: 'assets/tokens/ch_nezuko.png', tanjiro: 'assets/tokens/ch_tanjiro.png', bg: '../tablas/assets/img/bg_demonslayer.webp' };
  var PRAISE = ['¡Toma!', '¡Bien!', '¡Genial!', '¡Zas!', '¡Sigue así!'];
  var DEFAULT_THEME = { accent: '#1E6F50', accent2: '#F4A6C8', bg: '#0f0f1a', text: '#fff' };

  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function heartPath(g, x, y, s) {   // corazón centrado en (x, y), «radio» s
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.9); g.closePath();
  }
  function starPath(g, x, y, r) {
    g.beginPath();
    for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath();
  }

  function start(container, opts) {
    opts = opts || {};
    var th = {}, k;
    for (k in DEFAULT_THEME) th[k] = (opts.theme && opts.theme[k]) || DEFAULT_THEME[k];
    var durationMs = opts.durationMs > 0 ? opts.durationMs : 80000;
    var gameSecs = Math.min(GAME_SECS, Math.max(20, Math.floor(durationMs / 1000) - 5));
    function sfx(n) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n); } catch (e) { /* el sonido nunca rompe el juego */ } }
    function buzz(p) { try { if (typeof opts.vibrate === 'function') opts.vibrate(p); } catch (e) { /* idem */ } }
    var J = window.Juice.create(), ease = J.ease;

    // ---------- DOM: raíz y canvas (estilos en línea, nada global) ----------
    var root = document.createElement('div');
    root.className = 'mg-whack-root';
    root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:' + th.bg + ';' +
      'touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';
    var canvas = document.createElement('canvas');
    canvas.className = 'mg-whack-canvas';
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;user-select:none;-webkit-user-select:none;';
    root.appendChild(canvas); container.appendChild(root);
    if (root.clientHeight < 240) root.style.height = Math.round(window.innerHeight * 0.7) + 'px';   // el contenedor no tenía alto
    var ctx = canvas.getContext('2d');
    var layer = document.createElement('canvas'), lctx = layer.getContext('2d');   // fondo + agujeros, prerrenderizado
    var H = 640, SX = 1, SY = 1;

    var img = { oni: null, nezuko: null, tanjiro: null, bg: null };
    Object.keys(IMG).forEach(function (n) { J.loadImage(IMG[n]).then(function (i) { img[n] = i; if (n === 'bg' && !ended) drawStatic(); }); });

    // ---------- celdas (3×3): cada una con su agujero y su ficha ----------
    var cells = [];
    for (k = 0; k < 9; k++) cells.push({ i: k, who: null, st: 'idle', up: 0, sx: 1, sy: 1, t: 0, hold: 1, seq: 0, left: 0, top: 0, cw: 0, chh: 0, cx: 0, hy: 0, rx: 0, ry: 0, r: 0 });
    function layout() {
      var top = HUD_H + 6, bottom = H - STRIP_H - 6, avail = bottom - top;
      var cw = Math.min((W - 20) / 3, avail / 3), chh = Math.min(cw * 1.3, avail / 3);
      var x0 = (W - cw * 3) / 2, y0 = top + (avail - chh * 3) / 2;
      for (var i = 0; i < 9; i++) {
        var c = cells[i], col = i % 3, row = (i - col) / 3;
        c.left = x0 + col * cw; c.top = y0 + row * chh; c.cw = cw; c.chh = chh;
        c.cx = c.left + cw / 2; c.hy = c.top + chh * 0.74; c.rx = cw * 0.41; c.ry = c.rx * 0.42; c.r = cw * 0.35;
      }
    }
    function tokenY(c) { return c.hy + c.r * 1.05 - c.up * c.r * 1.8; }   // up=0 escondido del todo · up=1 asomado tres cuartos

    function resize() {
      var cw = Math.max(1, root.clientWidth), ch = Math.max(1, root.clientHeight), dpr = Math.min(3, window.devicePixelRatio || 1);
      H = Math.round(W * ch / cw);
      canvas.width = layer.width = Math.round(cw * dpr); canvas.height = layer.height = Math.round(ch * dpr);
      SX = canvas.width / W; SY = canvas.height / H;
      layout(); drawStatic();
    }
    function drawStatic() {   // fondo del pueblo con velo oscuro, montículos de hierba y agujeros (parte de atrás)
      var g = lctx; g.setTransform(SX, 0, 0, SY, 0, 0);
      g.fillStyle = th.bg; g.fillRect(0, 0, W, H);
      if (img.bg) { var s = Math.max(W / img.bg.width, H / img.bg.height), dw = img.bg.width * s, dh = img.bg.height * s; g.drawImage(img.bg, (W - dw) / 2, (H - dh) / 2, dw, dh); }
      g.fillStyle = 'rgba(10,8,24,0.5)'; g.fillRect(0, 0, W, H);
      var gr = g.createLinearGradient(0, HUD_H, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.4)');
      g.fillStyle = gr; g.fillRect(0, HUD_H, W, H - HUD_H);
      for (var i = 0; i < 9; i++) {
        var c = cells[i];
        var m = g.createRadialGradient(c.cx, c.hy - c.ry, 2, c.cx, c.hy, c.rx * 1.5); m.addColorStop(0, '#4f8f4a'); m.addColorStop(1, '#25492a');
        g.fillStyle = m; g.beginPath(); g.ellipse(c.cx, c.hy + 3, c.rx * 1.32, c.ry * 1.95, 0, 0, TAU); g.fill();
        var h = g.createRadialGradient(c.cx, c.hy + c.ry * 0.4, 1, c.cx, c.hy, c.rx); h.addColorStop(0, '#050302'); h.addColorStop(0.7, '#17100a'); h.addColorStop(1, '#2c1c10');
        g.fillStyle = h; g.beginPath(); g.ellipse(c.cx, c.hy, c.rx, c.ry, 0, 0, TAU); g.fill();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ---------- estado ----------
    var phase = 'count', phaseT = 0, gameTime = 0, ended = false, wonFlag = false, raf = 0, overTimer = 0, capTimer = 0, ro = null;
    var score = 0, lives = 3, combo = 0, lastHit = -9, escapes = 0, curLevel = 0, spawnT = 0.3, lastCount = 3;
    var flash = 0, scorePulse = 0, comboPulse = 0, heartPulse = 0, bubbleTxt = '¡Dale al oni!', bubbleT = 1;
    var rings = [];

    function addScore(n) { score += n; scorePulse = 1; try { if (opts.onScore) opts.onScore(score); } catch (e) { /* silencio */ } }
    function bubble(t) { bubbleTxt = t; bubbleT = 0; }
    function level() { return LEVELS[Math.min(LEVELS.length - 1, curLevel)]; }
    function activeCount() { var n = 0; for (var i = 0; i < 9; i++) if (cells[i].st !== 'idle' && cells[i].st !== 'hit') n++; return n; }

    // ---------- aparecer, esconderse, aplastar (tweens de Juice con «seq» para ignorar tweens viejos) ----------
    function spawn() {
      var lv = level(), free = [], hasNez = false, i;
      for (i = 0; i < 9; i++) { if (cells[i].st === 'idle') free.push(cells[i]); if (cells[i].who === 'nezuko' && cells[i].st !== 'idle') hasNez = true; }
      if (!free.length || activeCount() >= lv.max) return;
      var c = free[Math.floor(Math.random() * free.length)], nez = gameTime > 4 && !hasNez && Math.random() < 0.2;
      c.who = nez ? 'nezuko' : 'oni'; c.hold = lv.hold * (nez ? 1.3 : 0.85 + Math.random() * 0.4); c.sx = c.sy = 1; c.t = 0;
      rise(c);
      J.burst(c.cx, c.hy, { n: 6, colors: ['#6b4a2b', '#3f6b3a', '#8a6a45'], speed: 110, life: 0.45, size: 5, angle: -Math.PI / 2, spread: 1.4, gravity: 700 });
    }
    function rise(c) {
      var seq = ++c.seq; c.st = 'rise';
      J.tween({ from: 0, to: 1, dur: 0.3, ease: ease.outBack, update: function (v) { if (c.seq === seq) c.up = v; }, done: function () { if (c.seq === seq) { c.st = 'up'; c.t = 0; } } });
    }
    function sink(c, escaped) {
      var seq = ++c.seq, who = c.who; c.st = 'sink';
      J.tween({ from: c.up, to: 0, dur: 0.22, ease: ease.inQuad, update: function (v) { if (c.seq === seq) c.up = v; },
        done: function () { if (c.seq !== seq) return; c.st = 'idle'; c.who = null; if (escaped && who === 'oni' && phase === 'play') escape(c); } });
    }
    function smash(c) {
      var seq = ++c.seq; c.st = 'hit';
      J.tween({ from: 0, to: 1, dur: 0.5, ease: ease.outElastic, update: function (v) { if (c.seq === seq) { c.sx = 1.3 - 0.3 * v; c.sy = 0.7 + 0.3 * v; } } });
      J.tween({ from: c.up, to: 0, dur: 0.35, delay: 0.1, ease: ease.outQuad, update: function (v) { if (c.seq === seq) c.up = v; },
        done: function () { if (c.seq === seq) { c.st = 'idle'; c.who = null; c.sx = c.sy = 1; } } });
    }

    // ---------- toques ----------
    function hitOni(c) {
      var ty = tokenY(c);
      combo = gameTime - lastHit <= COMBO_WINDOW ? Math.min(3, combo + 1) : 1; lastHit = gameTime; escapes = 0;
      var pts = 10 * combo; addScore(pts); comboPulse = 1;
      smash(c);
      J.burst(c.cx, ty, { n: 12, colors: [th.accent2, '#fff', '#c9a7ff', '#ffd54f'], speed: 260, life: 0.6, size: 8, shape: 'star' });
      J.text(c.cx, ty - c.r * 0.6, '+' + pts, { color: combo > 1 ? '#ffd54f' : '#fff', size: combo > 1 ? 30 : 24 });
      J.shake(0.35); J.hitStop(60); sfx('punch'); buzz(30);
      if (combo >= 2 || Math.random() < 0.3) bubble(combo >= 3 ? '¡Combo ×3!' : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    }
    function hitNezuko(c) {
      lives--; combo = 0; flash = 1; heartPulse = 1;
      J.shake(0.7); sfx('wrong'); buzz([60, 40, 60]);
      J.text(Math.max(80, Math.min(W - 80, c.cx)), tokenY(c) - c.r * 0.9, '¡A Nezuko no!', { color: '#ff8da1', size: 22, life: 1.1 });
      bubble('¡A Nezuko no!'); sink(c, false);
      if (lives <= 0) finish();
    }
    function miss(x, y) {
      combo = 0; sfx('pop');
      J.burst(x, y, { n: 5, colors: ['rgba(255,255,255,0.6)'], speed: 90, life: 0.3, size: 4, gravity: 0, shape: 'circle' });
    }
    function escape(c) {
      escapes++;
      if (escapes < 3) { J.text(c.cx, c.hy - c.r, '¡Se escapó!', { color: '#cfd3e6', size: 16, life: 0.8, rise: 30 }); return; }
      escapes = 0; lives--; flash = 1; heartPulse = 1; J.shake(0.5); sfx('boom'); buzz(80);
      J.text(W / 2, HUD_H + 70, '¡Se escaparon 3!', { color: '#ff8da1', size: 26, life: 1.2, rise: 40 });
      bubble('¡Rápido, que se escapan!');
      if (lives <= 0) finish();
    }
    function levelUp() {
      J.text(W / 2, HUD_H + 70, '¡Más rápido!', { color: th.accent2, size: 30, life: 1.3, rise: 40 }); sfx('levelup');
      bubble(curLevel >= 2 ? '¡Tres onis a la vez!' : '¡Vienen más onis!');
    }
    function cellAt(x, y) {
      for (var i = 0; i < 9; i++) { var c = cells[i]; if (x >= c.left && x < c.left + c.cw && y >= c.top && y < c.top + c.chh) return c; }
      return null;
    }
    function onDown(ev) {
      if (ev.cancelable) ev.preventDefault();
      if (phase !== 'play') return;
      var p = ev.touches ? ev.touches[0] : ev, rc = canvas.getBoundingClientRect();
      var x = (p.clientX - rc.left) * W / rc.width, y = (p.clientY - rc.top) * H / rc.height;
      if (rings.length > 8) rings.shift(); rings.push({ x: x, y: y, t: 0 });
      var c = cellAt(x, y);
      if (!c) return;                                               // fuera de la rejilla: nada
      var visible = c.up > 0.3 && (c.st === 'rise' || c.st === 'up' || c.st === 'sink');
      if (visible && c.who === 'oni') hitOni(c);
      else if (visible && c.who === 'nezuko' && c.st !== 'sink') hitNezuko(c);
      else miss(x, y);
    }
    if (window.PointerEvent) canvas.addEventListener('pointerdown', onDown);
    else { canvas.addEventListener('touchstart', onDown, { passive: false }); canvas.addEventListener('mousedown', onDown); }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(root); }

    // ---------- lógica por fotograma ----------
    function update(dt) {
      J.update(dt); phaseT += dt;
      flash = Math.max(0, flash - dt * 2.5); scorePulse = Math.max(0, scorePulse - dt * 4); comboPulse = Math.max(0, comboPulse - dt * 3);
      heartPulse = Math.max(0, heartPulse - dt * 2.5); bubbleT = Math.min(1, bubbleT + dt);
      for (var i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > 0.35) rings.splice(i, 1); }
      if (phase === 'count') {
        var n = 3 - Math.floor(phaseT / COUNT_STEP);
        if (n !== lastCount && n > 0) { lastCount = n; sfx('pop'); }
        if (phaseT >= COUNT_STEP * 3) { phase = 'play'; phaseT = 0; sfx('whoosh'); }
        return;
      }
      if (phase !== 'play') return;
      gameTime += dt;
      var lv = Math.min(LEVELS.length - 1, Math.floor(gameTime / 15));
      if (lv > curLevel) { curLevel = lv; levelUp(); }
      if (!J.frozen()) {                                            // hit-stop: nadie se mueve 60 ms tras un golpe
        spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = level().gap * (0.7 + Math.random() * 0.6); }
        for (i = 0; i < 9; i++) { var c = cells[i]; if (c.st === 'up') { c.t += dt; if (c.t >= c.hold) sink(c, true); } }
      }
      if (combo > 0 && gameTime - lastHit > COMBO_WINDOW) combo = 0;
      if (gameTime >= gameSecs) finish();
    }
    function finish() {
      if (phase === 'over' || ended) return;
      phase = 'over'; phaseT = 0; wonFlag = score >= GOAL;
      for (var i = 0; i < 9; i++) if (cells[i].st !== 'idle') sink(cells[i], false);
      sfx(wonFlag ? 'tada' : 'drum'); buzz(wonFlag ? [80, 50, 120] : 60);
      if (wonFlag) J.burst(W / 2, H * 0.35, { n: 40, colors: [th.accent2, '#ffd54f', '#fff', '#c9a7ff', '#7bc96f'], speed: 380, life: 1.4, size: 9, gravity: 420 });
      overTimer = setTimeout(endNow, END_MS);
    }
    function cleanup() {
      cancelAnimationFrame(raf); clearTimeout(overTimer); clearTimeout(capTimer);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('touchstart', onDown); canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize);
      if (ro) ro.disconnect();
      J.reset();
      if (root.parentNode) root.parentNode.removeChild(root);
    }
    function endNow() {
      if (ended) return;
      ended = true; cleanup();
      try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: score, won: wonFlag }); } catch (e) { /* silencio */ }
    }

    // ---------- dibujo ----------
    function text(str, x, y, size, color, align, stroke) {
      ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
      if (stroke) { ctx.lineWidth = stroke; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeText(str, x, y); }
      ctx.fillStyle = color; ctx.fillText(str, x, y);
    }
    function drawCells(now) {
      for (var i = 0; i < 9; i++) {
        var c = cells[i];
        if (c.st !== 'idle') {
          var ty = tokenY(c) + c.r * (1 - c.sy), nez = c.who === 'nezuko';
          ctx.save(); ctx.beginPath();                                // se ve lo que queda por encima del borde delantero del agujero
          ctx.moveTo(c.left, c.top); ctx.lineTo(c.left + c.cw, c.top); ctx.lineTo(c.left + c.cw, c.hy);
          ctx.ellipse(c.cx, c.hy, c.rx, c.ry, 0, 0, Math.PI); ctx.lineTo(c.left, c.hy); ctx.closePath(); ctx.clip();
          J.token(ctx, nez ? img.nezuko : img.oni, c.cx, ty, c.r, { sx: c.sx, sy: c.sy, rot: c.st === 'up' ? Math.sin(now / 90 + c.i) * 0.06 : 0, color: nez ? '#f4a6c8' : '#7bc96f' });
          ctx.restore();
        }
        ctx.beginPath(); ctx.ellipse(c.cx, c.hy, c.rx, c.ry, 0, 0, Math.PI); ctx.strokeStyle = '#5c9a55'; ctx.lineWidth = 5; ctx.stroke();   // borde delantero de hierba
      }
    }
    function drawRings() {
      for (var i = 0; i < rings.length; i++) {
        var g = rings[i], k = g.t / 0.35;
        ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(g.x, g.y, 10 + 36 * ease.outCubic(k), 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function drawHUD() {
      ctx.fillStyle = 'rgba(8,6,20,0.6)'; roundRect(ctx, 8, 8, W - 16, HUD_H - 14, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.5; ctx.stroke();
      J.token(ctx, img.oni, 36, 38, 18, { color: '#7bc96f' });        // puntos, con el oni de icono
      var sp = 1 + 0.25 * scorePulse; ctx.save(); ctx.translate(62, 38); ctx.scale(sp, sp); text(String(score), 0, 0, 30, '#fff', 'left', 5); ctx.restore();
      var hp = 1 + 0.5 * heartPulse;                                 // corazones
      for (var i = 0; i < 3; i++) {
        heartPath(ctx, W / 2 + 6 + (i - 1) * 32, 38, 12 * (i < lives ? hp : 1));
        ctx.fillStyle = i < lives ? '#ff4d6d' : 'rgba(255,255,255,0.18)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
      }
      if (combo >= 2 && phase === 'play') {                           // pastilla de combo
        var cs = 1 + 0.3 * comboPulse; ctx.save(); ctx.translate(W - 46, 38); ctx.scale(cs, cs);
        ctx.fillStyle = combo >= 3 ? '#ffd54f' : th.accent2; roundRect(ctx, -30, -17, 60, 34, 17); ctx.fill();
        text('×' + combo, 0, 1, 22, '#1a1a2a'); ctx.restore();
      }
      var left = Math.max(0, Math.ceil(gameSecs - gameTime)), bw = W - 104, frac = phase === 'count' ? 1 : Math.max(0, 1 - gameTime / gameSecs);
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; roundRect(ctx, 22, 65, bw, 14, 7); ctx.fill();   // barra de tiempo
      if (frac > 0) { ctx.fillStyle = left <= 10 ? '#ff5c6c' : th.accent2; roundRect(ctx, 22, 65, Math.max(14, bw * frac), 14, 7); ctx.fill(); }
      var ts = left <= 10 && phase === 'play' ? 1 + 0.2 * Math.max(0, 1 - (gameTime % 1) / 0.3) : 1;
      ctx.save(); ctx.translate(W - 24, 72); ctx.scale(ts, ts); text(left + ' s', 0, 0, 20, left <= 10 ? '#ff8da1' : '#fff', 'right', 4); ctx.restore();
    }
    function drawStrip() {
      var y0 = H - STRIP_H + 6, k = 0.75 + 0.25 * ease.outBack(Math.min(1, bubbleT / 0.3));
      J.token(ctx, img.tanjiro, 40, y0 + 32, 27, { color: '#d66' });
      ctx.save(); ctx.translate(82, y0 + 32); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(ctx, 0, -24, W - 94, 48, 16); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, -8); ctx.lineTo(-9, 0); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
      text(bubbleTxt, (W - 94) / 2, 1, 17, '#1a1a2a');
      ctx.restore();
    }
    function drawOverlay() {
      var cy = HUD_H + (H - HUD_H - STRIP_H) / 2;
      if (phase === 'count') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
        var n = Math.max(1, 3 - Math.floor(phaseT / COUNT_STEP)), pulse = 1 + 0.3 * Math.max(0, 1 - (phaseT % COUNT_STEP) / 0.25);
        J.token(ctx, img.tanjiro, W / 2, cy - 130 + Math.sin(phaseT * 5) * 4, 62, { color: '#d66', ring: 5, ringColor: th.accent2 });
        ctx.save(); ctx.translate(W / 2, cy + 5); ctx.scale(pulse, pulse); text(String(n), 0, 0, 96, th.accent2, 'center', 8); ctx.restore();
        text('Golpea al oni', W / 2, cy + 88, 26, '#fff', 'center', 6);
        J.token(ctx, img.nezuko, W / 2 - 92, cy + 128, 20, { color: '#f4a6c8' });
        text('¡A Nezuko no!', W / 2 + 12, cy + 128, 20, th.accent2, 'center', 5);
      } else if (phase === 'play' && gameTime < YA_SECS) {
        var p2 = 1 + 0.35 * Math.max(0, 1 - gameTime / 0.25);
        ctx.save(); ctx.translate(W / 2, cy); ctx.scale(p2, p2); text('¡YA!', 0, 0, 80, th.accent2, 'center', 8); ctx.restore();
      } else if (phase === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, HUD_H, W, H - HUD_H);
        var k = ease.outBack(Math.min(1, phaseT / 0.4));
        ctx.save(); ctx.translate(W / 2, cy - 90); ctx.scale(k, k); text('¡Fin!', 0, 0, 62, '#fff', 'center', 8); ctx.restore();
        text('Puntos: ' + score, W / 2, cy - 22, 30, '#ffd54f', 'center', 6);
        var stars = score >= GOAL * 1.6 ? 3 : score >= GOAL ? 2 : 1;
        for (var i = 0; i < 3; i++) {
          var sk = ease.outBack(Math.max(0, Math.min(1, (phaseT - 0.25 - i * 0.2) / 0.35)));
          ctx.save(); ctx.translate(W / 2 + (i - 1) * 56, cy + 38); ctx.scale(sk, sk); starPath(ctx, 0, 0, 22);
          ctx.fillStyle = i < stars ? '#ffd54f' : 'rgba(255,255,255,0.2)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke(); ctx.restore();
        }
        text(wonFlag ? '¡Oni vencido!' : '¡Casi! La meta son ' + GOAL + ' puntos', W / 2, cy + 96, 20, wonFlag ? th.accent2 : '#fff', 'center', 5);
      }
    }
    function render(now) {
      ctx.setTransform(SX, 0, 0, SY, 0, 0);
      var off = J.shakeOffset(8); ctx.save(); ctx.translate(off[0], off[1]);
      ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, W, H);
      drawCells(now); J.draw(ctx); drawRings(); drawHUD(); drawStrip();
      ctx.restore();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,40,60,' + (flash * 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
      drawOverlay();
    }

    // ---------- bucle ----------
    var last = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      update(dt);
      if (!ended) render(now);
    }
    resize();
    raf = requestAnimationFrame(frame);
    capTimer = setTimeout(finish, durationMs + 60);                  // respaldo si la pestaña se queda en segundo plano
    return { stop: function () { if (ended) return; ended = true; cleanup(); } };
  }

  window.MiniGames.whack = { id: 'whack', title: 'Golpea al oni', world: 'demonslayer', start: start };
})();
