/* slash.js — «Corta demonios» (mundo Demon Slayer). Tipo Fruit Ninja: los onis saltan desde abajo y se cortan
   deslizando el dedo (estela de katana «respiración del agua»). A Nezuko NO se la corta. Canvas 2D + Juice.
   Contrato: window.MiniGames.slash.start(container, opts) → { stop() }. Script plano, sin módulos ni red. */
(function () {
  'use strict';
  window.MiniGames = window.MiniGames || {};
  var TAU = Math.PI * 2, FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';
  var TOK = 'assets/tokens/', BG = '../tablas/assets/img/bg_demonslayer.webp';
  var TARGET = 300, PLAY_SECS = 60, COUNT_SECS = 3.1, END_SECS = 1.3, GRAV = 720, R = 46, PAD = 10;
  var TRAIL_N = 14, TRAIL_MS = 220, POOL = 26, COMBO_WINDOW = 1.5;
  var KINDS = [   // tres onis tintados (verde, morado, rojo) + Nezuko (índice 3)
    { fill: 'rgba(70,230,120,.40)', ring: '#3ee882', parts: ['#3ee882', '#c8ffdc', '#8fe9ff'] },
    { fill: 'rgba(160,80,255,.52)', ring: '#b47cff', parts: ['#b47cff', '#e6d4ff', '#8fe9ff'] },
    { fill: 'rgba(255,60,70,.52)', ring: '#ff5262', parts: ['#ff5262', '#ffc9ce', '#8fe9ff'] },
    { fill: null, ring: '#ff9ecb', parts: ['#ff9ecb', '#ffe0ee'] }];

  function start(container, opts) {
    opts = opts || {};
    var th = { accent: '#1E6F50', accent2: '#F4A6C8', bg: '#0f0f1a', text: '#fff' }, k, i;
    if (opts.theme) for (k in opts.theme) if (opts.theme[k]) th[k] = opts.theme[k];
    var durationMs = opts.durationMs > 0 ? opts.durationMs : 80000;
    var playSecs = Math.min(PLAY_SECS, Math.max(15, durationMs / 1000 - COUNT_SECS - END_SECS));
    function sfx(n) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n); } catch (e) { /* el sonido nunca rompe el juego */ } }
    function buzz(p) { try { if (typeof opts.vibrate === 'function') opts.vibrate(p); } catch (e) { /* idem */ } }
    var J = Juice.create(), E = J.ease;

    // ---------- DOM: fondo con velo (CSS, fuera del bucle) + canvas transparente encima ----------
    var root = document.createElement('div');
    root.className = 'mg-slash-root';
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:' + th.bg + ';color:' + th.text + ';font-family:' + FONT +
      ';touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';
    var bgEl = document.createElement('div');
    bgEl.style.cssText = 'position:absolute;inset:-14px;will-change:transform;background:linear-gradient(rgba(10,6,30,.62),rgba(10,6,30,.38) 45%,rgba(10,6,30,.74)),url(' + BG + ') center/cover no-repeat;';
    var canvas = document.createElement('canvas');
    canvas.className = 'mg-slash-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none;';
    root.appendChild(bgEl); root.appendChild(canvas); container.appendChild(root);
    if (root.clientHeight < 240) root.style.height = Math.round((window.innerHeight || 780) * 0.7) + 'px';   // el contenedor no tenía alto
    var ctx = canvas.getContext('2d'), W = 390, H = 780, dpr = 1;
    function resize() {
      W = Math.max(200, root.clientWidth || window.innerWidth || 390); H = Math.max(240, root.clientHeight || 780);
      dpr = Math.min(3, window.devicePixelRatio || 1); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }

    // ---------- fichas: se tintan UNA vez (ficha + círculo de color semitransparente + aro); nada por fotograma ----------
    var IMG = { kinds: [null, null, null, null], tan: null };
    function tint(im, kd) {
      var c = document.createElement('canvas'), g = c.getContext('2d'), S = 256; c.width = c.height = S;
      g.drawImage(im, 0, 0, S, S);
      if (kd.fill) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = kd.fill; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over'; }
      g.lineWidth = 16; g.strokeStyle = kd.ring; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 8, 0, TAU); g.stroke();
      return c;
    }
    J.loadImage(TOK + 'boss_demon.png').then(function (im) { if (!im || ended) return; for (var j = 0; j < 3; j++) IMG.kinds[j] = tint(im, KINDS[j]); });
    J.loadImage(TOK + 'ch_nezuko.png').then(function (im) { if (im && !ended) IMG.kinds[3] = tint(im, KINDS[3]); });
    J.loadImage(TOK + 'ch_tanjiro.png').then(function (im) { IMG.tan = im; });

    // ---------- pools (nada se crea durante la partida) ----------
    var toks = [], halves = [], tr = [], trN = 0;
    for (i = 0; i < POOL; i++) {
      toks.push({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, g: GRAV, rot: 0, vr: 0 });
      halves.push({ on: false, kind: 0, x: 0, y: 0, vx: 0, vy: 0, rot0: 0, spin: 0, vr: 0, ang: 0, side: 1, t: 0 });
    }
    for (i = 0; i < TRAIL_N; i++) tr.push({ x: 0, y: 0, t: 0 });
    var NX = new Float32Array(TRAIL_N), NY = new Float32Array(TRAIL_N), WD = new Float32Array(TRAIL_N);
    function free(list) { for (var j = 0; j < list.length; j++) if (!list[j].on) return list[j]; return null; }

    // ---------- estado ----------
    var phase = 'count', t = 0, pt = 0, now = 0, score = 0, hearts = 3, wave = 0, ended = false, wonFlag = false;
    var nextSpawn = 0, rain = 0, rainT = 0, rains = 0, nezAlive = false, strokeCuts = 0, lastCut = -9, comboMult = 0, comboT = 9;
    var flash = 0, heartPop = 0, cuts = 0, countIdx = -1, raf = 0, last = 0, endTimer = 0, capTimer = 0, ro = null, bgShaken = false;
    var stroking = false, pid = null, lx = 0, ly = 0, rect = null;

    function addScore(n) { score += n; try { if (typeof opts.onScore === 'function') opts.onScore(score); } catch (e) { /* nada */ } }
    function clampX(x) { return Math.max(70, Math.min(W - 70, x)); }

    // ---------- aparición: parábolas desde abajo; cada oleada (10 s) más onis y más rápidos ----------
    function spawn(kind, x) {
      var o = free(toks); if (!o) return;
      var s = Math.min(1.5, 1 + wave * 0.08);   // mismo arco, menos tiempo en el aire
      o.on = true; o.kind = kind; o.x = x != null ? x : R + 24 + Math.random() * (W - 2 * R - 48); o.y = H + R + 10;
      var apexY = Math.max(86, H * (0.17 + Math.random() * 0.28) - wave * 6);
      o.g = GRAV * s * s; o.vy = -Math.sqrt(2 * o.g * (o.y - apexY)); o.vx = ((W / 2 - o.x) / W * 170 + (Math.random() - 0.5) * 100) * s;
      o.rot = (Math.random() - 0.5) * 0.8; o.vr = (Math.random() - 0.5) * 2.4;
      if (kind === 3) nezAlive = true;
    }
    function spawnGroup() {
      var n = 1 + (wave >= 1 && Math.random() < 0.35 ? 1 : 0) + (wave >= 3 && Math.random() < 0.35 ? 1 : 0), j;
      for (j = 0; j < n; j++) spawn((Math.random() * 3) | 0);
      if (pt > 4 && !nezAlive && Math.random() < 0.2) spawn(3);
      nextSpawn = pt + Math.max(0.5, 1.3 - wave * 0.14) * (0.75 + Math.random() * 0.5);
    }

    // ---------- corte ----------
    function segDist2(ax, ay, bx, by, px, py) {   // distancia² de un punto al segmento del dedo
      var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
      var x = ax + dx * u - px, y = ay + dy * u - py; return x * x + y * y;
    }
    function sweep(ax, ay, bx, by) {
      var rr2 = (R + PAD) * (R + PAD), j, o;
      for (j = 0; j < POOL; j++) { o = toks[j]; if (o.on && segDist2(ax, ay, bx, by, o.x, o.y) <= rr2) { cut(o, Math.atan2(by - ay, bx - ax)); if (phase !== 'play') return; } }
    }
    function cut(o, ang) {
      o.on = false;
      if (o.kind === 3) {   // ¡A Nezuko no!
        nezAlive = false; J.burst(o.x, o.y, { n: 12, colors: KINDS[3].parts, shape: 'circle', speed: 170, gravity: 300 });
        loseHeart('¡A Nezuko no!', o.x, o.y - 24); return;
      }
      var nx = -Math.sin(ang), ny = Math.cos(ang), s, h;
      for (s = -1; s <= 1; s += 2) {   // dos mitades que se separan girando y cayendo
        h = free(halves); if (!h) break;
        h.on = true; h.kind = o.kind; h.x = o.x; h.y = o.y; h.rot0 = o.rot; h.spin = 0; h.ang = ang; h.side = s; h.t = 0;
        h.vx = o.vx * 0.5 + nx * 160 * s; h.vy = Math.min(o.vy, 0) * 0.35 - 110 + ny * 160 * s; h.vr = o.vr + s * 3.8;
      }
      if (pt - lastCut > COMBO_WINDOW) strokeCuts = 0;
      lastCut = pt; strokeCuts++; cuts++;
      var mult = Math.min(5, strokeCuts), pts = 10 * mult;
      addScore(pts);
      J.text(clampX(o.x), o.y - 34, '+' + pts, { color: mult > 1 ? '#ffe566' : '#fff', size: mult > 1 ? 30 : 24, rise: 70 });
      J.burst(o.x, o.y, { n: 14, colors: KINDS[o.kind].parts, speed: 290, life: 0.6, size: 8, gravity: 650 });
      J.hitStop(60); J.shake(mult > 1 ? 0.55 : 0.42); buzz(mult > 1 ? 30 : 15);
      sfx(strokeCuts % 2 ? 'slash' : 'whoosh');   // dos sonidos alternos: el corte suena con variación
      if (mult >= 2) { comboMult = mult; comboT = 0; if (mult <= 3) sfx('tada'); }
    }
    function loseHeart(msg, x, y) {
      hearts--; heartPop = 0.45; flash = 1; J.shake(0.5); sfx('wrong'); buzz([40, 30, 40]);
      J.text(clampX(x), y, msg, { color: '#ff8a98', size: 28, life: 1.1, rise: 36 });
      if (hearts <= 0) finish();
    }

    // ---------- actualización ----------
    function update(dt) {
      J.update(dt); t += dt;
      flash = Math.max(0, flash - dt * 2.5); heartPop = Math.max(0, heartPop - dt); comboT += dt;
      while (trN && now - tr[0].t > TRAIL_MS) trShift();
      if (phase === 'count') {
        var ci = Math.min(3, (t / 0.78) | 0);
        if (ci !== countIdx) { countIdx = ci; sfx(ci < 3 ? 'drum' : 'roar'); }
        if (t >= COUNT_SECS) { phase = 'play'; t = 0; pt = 0; nextSpawn = 0.5; }
        return;
      }
      if (phase !== 'play') return;
      pt += dt; wave = (pt / 10) | 0;
      if (pt >= playSecs) { finish(); return; }
      if (rains < 2 && pt >= 30 + rains * 20) {   // lluvia de 6 onis seguidos a los 30 s (y a los 50 s)
        rains++; rain = 6; rainT = 0; nextSpawn = pt + 2.2; sfx('wind');
        J.text(W / 2, H * 0.3, '¡Lluvia de onis!', { color: '#ffe566', size: 36, life: 1.4, rise: 30 });
      }
      if (rain > 0) { rainT -= dt; if (rainT <= 0) { spawn((Math.random() * 3) | 0, R + 24 + (6 - rain) * (W - 2 * R - 48) / 5); rain--; rainT = 0.14; } }
      else if (pt >= nextSpawn) spawnGroup();
      if (J.frozen()) return;   // hit-stop: nada se mueve
      var j, o;
      for (j = 0; j < POOL; j++) {
        o = toks[j]; if (!o.on) continue;
        o.vy += o.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
        if ((o.x < R && o.vx < 0) || (o.x > W - R && o.vx > 0)) o.vx = -o.vx * 0.8;
        if (o.y > H + R + 30 && o.vy > 0) {
          o.on = false;
          if (o.kind === 3) nezAlive = false; else { loseHeart('¡Se escapó!', o.x, H - 80); if (phase !== 'play') return; }
        }
      }
      for (j = 0; j < POOL; j++) {
        o = halves[j]; if (!o.on) continue;
        o.t += dt; if (o.t > 0.95) { o.on = false; continue; }
        o.vy += GRAV * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.spin += o.vr * dt;
      }
    }
    function finish() {
      if (phase === 'over' || ended) return;
      phase = 'over'; t = 0; wonFlag = score >= TARGET; stroking = false; pid = null;
      sfx(wonFlag ? 'win' : hearts <= 0 ? 'lose' : 'ding'); if (wonFlag) buzz([60, 40, 60]);
      clearTimeout(capTimer); endTimer = setTimeout(endNow, END_SECS * 1000);
    }
    function endNow() {
      if (ended) return;
      ended = true; cleanup();
      try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: score, won: wonFlag }); } catch (e) { /* nada */ }
    }

    // ---------- dibujo ----------
    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function txt(s, x, y, size, color, align, stroke) {
      ctx.font = '900 ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
      if (stroke !== false) { ctx.lineWidth = Math.max(3, size / 7); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(s, x, y); }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }
    function heart(x, y, r, on) {
      ctx.beginPath(); ctx.moveTo(x, y + r);
      ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.4, x, y - r * 0.5);
      ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.5, y - r * 0.1, x, y + r);
      ctx.fillStyle = on ? '#ff3b5c' : 'rgba(255,255,255,.22)'; ctx.fill();
    }
    function drawHalf(h) {   // la ficha dibujada con clip en su mitad (plano del corte = dirección del dedo)
      var img = IMG.kinds[h.kind], a = h.t > 0.55 ? 1 - (h.t - 0.55) / 0.4 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(h.x, h.y); ctx.rotate(h.spin + h.ang);
      ctx.beginPath(); ctx.rect(-R - 6, h.side > 0 ? 0 : -R - 6, 2 * R + 12, R + 6); ctx.clip();
      ctx.rotate(h.rot0 - h.ang);
      if (img) ctx.drawImage(img, -R, -R, 2 * R, 2 * R); else { ctx.fillStyle = KINDS[h.kind].ring; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    function trShift() { var o = tr[0], j; for (j = 1; j < trN; j++) tr[j - 1] = tr[j]; tr[trN - 1] = o; trN--; }
    function addPoint(x, y) {
      var o, j; if (trN < TRAIL_N) o = tr[trN++]; else { o = tr[0]; for (j = 1; j < TRAIL_N; j++) tr[j - 1] = tr[j]; tr[TRAIL_N - 1] = o; }
      o.x = x; o.y = y; o.t = performance.now();
    }
    function drawTrail() {   // cinta con ancho decreciente hacia la cola: halo agua + filo blanco (sin shadowBlur)
      if (trN < 2) return;
      var j, p, q, dx, dy, l, pass, m;
      for (j = 0; j < trN; j++) {
        p = tr[Math.max(0, j - 1)]; q = tr[Math.min(trN - 1, j + 1)]; dx = q.x - p.x; dy = q.y - p.y; l = Math.sqrt(dx * dx + dy * dy);
        if (l > 0.01) { NX[j] = -dy / l; NY[j] = dx / l; } else if (j > 0) { NX[j] = NX[j - 1]; NY[j] = NY[j - 1]; } else { NX[j] = 0; NY[j] = 1; }
        WD[j] = (2 + 16 * j / (trN - 1)) * Math.sqrt(1 - Math.min(1, (now - tr[j].t) / TRAIL_MS));
      }
      for (pass = 0; pass < 2; pass++) {
        m = pass ? 0.5 : 1.1;
        ctx.beginPath();
        for (j = 0; j < trN; j++) ctx.lineTo(tr[j].x + NX[j] * WD[j] * m, tr[j].y + NY[j] * WD[j] * m);
        for (j = trN - 1; j >= 0; j--) ctx.lineTo(tr[j].x - NX[j] * WD[j] * m, tr[j].y - NY[j] * WD[j] * m);
        ctx.closePath(); ctx.fillStyle = pass ? 'rgba(240,252,255,.95)' : 'rgba(90,215,255,.32)'; ctx.fill();
        p = tr[trN - 1]; ctx.beginPath(); ctx.arc(p.x, p.y, WD[trN - 1] * m, 0, TAU); ctx.fill();
      }
    }
    function drawHUD() {
      rr(12, 12, 124, 44, 22); ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fill();
      txt(String(score), 74, 35, 28, th.accent2, 'center', false);
      var s = 1 + heartPop * 1.1, j;
      ctx.save(); ctx.translate(W - 54, 34); ctx.scale(s, s);
      for (j = 0; j < 3; j++) heart(j * 30 - 30, 0, 11, j < hearts);   // se pierden por la derecha
      ctx.restore();
      var f = phase === 'count' ? 1 : Math.max(0, 1 - pt / playSecs), bw = W - 24;   // barra de tiempo
      rr(12, 66, bw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fill();
      if (f > 0) { rr(12, 66, Math.max(10, bw * f), 10, 5); ctx.fillStyle = f < 0.17 ? (((now / 250) | 0) % 2 ? '#ff5262' : '#ffb3bb') : th.accent2; ctx.fill(); }
    }
    function drawCombo() {
      var s = E.outBack(Math.min(1, comboT / 0.3)), a = comboT > 0.7 ? 1 - (comboT - 0.7) / 0.3 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(W / 2, H * 0.3); ctx.scale(s, s); txt('¡COMBO ×' + comboMult + '!', 0, 0, 46, '#ffe566'); ctx.restore();
    }
    function drawCount() {
      ctx.fillStyle = 'rgba(8,6,24,.5)'; ctx.fillRect(-20, -20, W + 40, H + 40);
      var lt = t - countIdx * 0.78, s = E.outBack(Math.min(1, lt / 0.35)), bob = Math.sin(t * 5) * 6;
      J.token(ctx, IMG.tan, W / 2, H * 0.33 + bob, 66, { color: '#2f8f6f', ring: 5, ringColor: '#8fe9ff' });
      ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(s, s); txt(countIdx < 3 ? String(3 - countIdx) : '¡YA!', 0, 0, countIdx < 3 ? 120 : 84, th.accent2); ctx.restore();
      txt('Desliza el dedo para cortar onis', W / 2, H * 0.7, 20, '#fff');
      J.token(ctx, IMG.kinds[3], W / 2 - 112, H * 0.76, 20, { color: '#ff9ecb' });
      txt('¡A Nezuko no!', W / 2 + 16, H * 0.76, 22, '#ffb3d6');
    }
    function drawOver() {
      ctx.fillStyle = 'rgba(8,6,24,.62)'; ctx.fillRect(-20, -20, W + 40, H + 40);
      var s = E.outBack(Math.min(1, t / 0.4));
      ctx.save(); ctx.translate(W / 2, H * 0.38); ctx.scale(s, s); txt('¡Fin!', 0, 0, 72, th.accent2); ctx.restore();
      txt('Puntos: ' + score, W / 2, H * 0.5, 34, '#fff');
      txt(wonFlag ? '¡Pilar del agua!' : hearts <= 0 ? '¡Otra vez!' : '¡Buen intento!', W / 2, H * 0.58, 24, wonFlag ? '#8fe9ff' : '#fff');
      txt('Meta: ' + TARGET + ' puntos', W / 2, H * 0.64, 18, 'rgba(255,255,255,.75)');
    }
    function render() {
      var so = J.shakeOffset(9), sx = so[0], sy = so[1], j, o;
      if (sx || sy) { bgEl.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)'; bgShaken = true; }
      else if (bgShaken) { bgEl.style.transform = ''; bgShaken = false; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
      for (j = 0; j < POOL; j++) { o = halves[j]; if (o.on) drawHalf(o); }
      ctx.fillStyle = 'rgba(0,0,0,.28)';   // sombra suave bajo cada ficha (un círculo, sin shadowBlur)
      for (j = 0; j < POOL; j++) { o = toks[j]; if (o.on) { ctx.beginPath(); ctx.arc(o.x + 4, o.y + 7, R, 0, TAU); ctx.fill(); } }
      for (j = 0; j < POOL; j++) { o = toks[j]; if (o.on) J.token(ctx, IMG.kinds[o.kind], o.x, o.y, R, { rot: o.rot, color: KINDS[o.kind].ring }); }
      J.draw(ctx); drawTrail();
      if (comboT < 1) drawCombo();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,30,60,' + (0.35 * flash).toFixed(3) + ')'; ctx.fillRect(-20, -20, W + 40, H + 40); }
      drawHUD();
      if (phase === 'count') drawCount(); else if (phase === 'over') drawOver();
      else if (pt < 5 && !cuts) txt('¡Desliza para cortar!', W / 2, H - 56, 24, '#fff');
    }

    // ---------- entrada: un dedo (pointer events), el corte es el segmento entre dos posiciones seguidas ----------
    function prevent(e) { e.preventDefault(); }
    function onDown(e) {
      if (phase === 'over' || (pid !== null && e.pointerId !== pid)) return;
      e.preventDefault(); pid = e.pointerId; try { canvas.setPointerCapture(pid); } catch (err) { /* nada */ }
      rect = canvas.getBoundingClientRect(); stroking = true; strokeCuts = 0; trN = 0;
      lx = (e.clientX - rect.left) * W / rect.width; ly = (e.clientY - rect.top) * H / rect.height; addPoint(lx, ly);
    }
    function onMove(e) {
      if (!stroking || e.pointerId !== pid) return;
      e.preventDefault();
      var x = (e.clientX - rect.left) * W / rect.width, y = (e.clientY - rect.top) * H / rect.height;
      if (phase === 'play') sweep(lx, ly, x, y);
      addPoint(x, y); lx = x; ly = y;
    }
    function onUp(e) { if (e.pointerId !== pid) return; stroking = false; pid = null; }
    function onTouch(e) { e.preventDefault(); }   // sin scroll ni zoom de la página
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('touchstart', onTouch, { passive: false }); canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('contextmenu', prevent);
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(root); }

    function cleanup() {
      cancelAnimationFrame(raf); clearTimeout(endTimer); clearTimeout(capTimer);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('touchstart', onTouch); canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('contextmenu', prevent);
      window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize);
      if (ro) ro.disconnect();
      J.reset(); if (root.parentNode) root.parentNode.removeChild(root);
    }

    // ---------- bucle ----------
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      now = ts; var dt = last ? Math.min(0.05, Math.max(0, (ts - last) / 1000)) : 0; last = ts;
      update(dt); if (!ended) render();
    }
    resize();
    raf = requestAnimationFrame(frame);
    capTimer = setTimeout(finish, durationMs + 500);   // respaldo si la pestaña se queda en segundo plano
    return { stop: function () { if (ended) return; ended = true; cleanup(); } };   // si llega antes del fin, NO se llama a onEnd
  }

  window.MiniGames.slash = { id: 'slash', title: 'Corta demonios', world: 'demonslayer', start: start };
})();
