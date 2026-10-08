/* volley.js — «Remate de Hinata» (mundo Haikyuu!!). Juego de ritmo: Kageyama coloca el balón en un arco hacia el ARO
   y hay que TOCAR justo cuando pasa por él; un anillo que se cierra sobre el aro avisa del momento. A veces Kuroo bloquea
   una mitad de la pantalla: se toca en la otra (flecha). Canvas 2D + Juice.
   Contrato: window.MiniGames.volley.start(container, opts) → { stop() }. Script plano, sin módulos ni red. */
(function () {
  'use strict';
  window.MiniGames = window.MiniGames || {};
  var TAU = Math.PI * 2, FONT = '-apple-system, "Segoe UI", Roboto, sans-serif';
  var TOK = 'assets/tokens/', BG = '../tablas/assets/img/bg_haikyuu.webp';
  var TARGET = 500, PLAY_SECS = 60, COUNT_SECS = 3.1, END_SECS = 1.3, PERFECT = 0.07, GOOD = 0.16, RING_R = 26, GRAV = 1500;

  function start(container, opts) {
    opts = opts || {};
    var th = { accent: '#F26A1B', accent2: '#111', bg: '#1a1a1f', text: '#fff' }, k, i;
    if (opts.theme) for (k in opts.theme) if (opts.theme[k]) th[k] = opts.theme[k];
    var durationMs = opts.durationMs > 0 ? opts.durationMs : 80000;
    var playSecs = Math.min(PLAY_SECS, Math.max(15, durationMs / 1000 - COUNT_SECS - END_SECS));
    function sfx(n) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n); } catch (e) { /* el sonido nunca rompe el juego */ } }
    function buzz(p) { try { if (typeof opts.vibrate === 'function') opts.vibrate(p); } catch (e) { /* idem */ } }
    var J = Juice.create(), E = J.ease;

    // ---------- DOM: fondo con velo (CSS, fuera del bucle) + canvas transparente encima ----------
    var root = document.createElement('div');
    root.className = 'mg-volley-root';
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:' + th.bg + ';color:' + th.text + ';font-family:' + FONT +
      ';touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';
    var bgEl = document.createElement('div');
    bgEl.style.cssText = 'position:absolute;inset:-14px;will-change:transform;background:linear-gradient(rgba(14,10,24,.64),rgba(14,10,24,.55) 45%,rgba(14,10,24,.7)),url(' + BG + ') center/cover no-repeat;';
    var canvas = document.createElement('canvas');
    canvas.className = 'mg-volley-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none;';
    root.appendChild(bgEl); root.appendChild(canvas); container.appendChild(root);
    if (root.clientHeight < 240) root.style.height = Math.round((window.innerHeight || 780) * 0.7) + 'px';   // el contenedor no tenía alto
    var ctx = canvas.getContext('2d'), W = 390, H = 780, dpr = 1;

    // ---------- geometría (relativa al tamaño del contenedor) ----------
    var FLOOR = 0, NET_X = 0, NET_TOP = 0, RING = { x: 0, y: 0 }, HANDS = { x: 0, y: 0 };
    var KAG = { x: 0, y: 0, sx: 1, sy: 1 }, HIN = { x: 0, y0: 0, y: 0, sx: 1, sy: 1 }, KUR = { on: false, leaving: false, done: false, side: 1, x: 0, y: 0, s: 1 };
    function resize() {
      W = Math.max(200, root.clientWidth || window.innerWidth || 390); H = Math.max(240, root.clientHeight || 780);
      dpr = Math.min(3, window.devicePixelRatio || 1); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      FLOOR = H * 0.72; NET_X = W * 0.6; NET_TOP = H * 0.4;
      RING.x = W * 0.46; RING.y = NET_TOP - 58;
      KAG.x = W * 0.15; KAG.y = FLOOR - 42; HANDS.x = KAG.x; HANDS.y = KAG.y - 54;
      HIN.x = W * 0.35; HIN.y0 = FLOOR - 46; HIN.y = HIN.y0;
      KUR.x = KUR.side > 0 ? W * 0.78 : W * 0.22;
    }
    var IMG = { hin: null, kag: null, kur: null };
    J.loadImage(TOK + 'ch_hinata.png').then(function (im) { IMG.hin = im; });
    J.loadImage(TOK + 'ch_kageyama.png').then(function (im) { IMG.kag = im; });
    J.loadImage(TOK + 'boss_kuroo.png').then(function (im) { IMG.kur = im; });

    // ---------- estado ----------
    var phase = 'count', t = 0, pt = 0, now = 0, score = 0, hearts = 3, ended = false, wonFlag = false;
    var ball = { state: 'idle', t: 0, T: 1.5, x: 0, y: 0, vx: 0, vy: 0, g: 0, spin: 0 }, tossT = 1.5, nextToss = 0, rallies = 0, hits = 0, combo = 0, mult = 1;
    var BT = [], btH = 0, btN = 0, rip = [];   // estela del remate (anillo) y ondas del toque (pool)
    for (i = 0; i < 8; i++) BT.push({ x: 0, y: 0 });
    for (i = 0; i < 4; i++) rip.push({ on: false, x: 0, y: 0, t: 0 });
    var comboMult = 0, comboT = 9, flash = 0, heartPop = 0, countIdx = -1, raf = 0, last = 0, endTimer = 0, capTimer = 0, ro = null, bgShaken = false;

    function addScore(n) { score += n; try { if (typeof opts.onScore === 'function') opts.onScore(score); } catch (e) { /* nada */ } }
    function tossPos(u, o) {   // arco del pase: llega al aro justo en su punto más alto (u = 1) y luego sigue cayendo
      o.x = HANDS.x + (RING.x - HANDS.x) * u; o.y = HANDS.y - (HANDS.y - RING.y) * (2 * u - u * u);
    }

    // ---------- animaciones de los personajes ----------
    function jump(p) {   // Hinata: sube con estirón, cae y aplasta al aterrizar
      var h = (HIN.y0 - (RING.y + 30)) * p;
      J.tween({ from: 0, to: 1, dur: 0.16, ease: E.outCubic, update: function (v) { HIN.y = HIN.y0 - h * v; } });
      J.tween({ from: 1, to: 0, dur: 0.34, delay: 0.16, ease: E.inQuad, update: function (v) { HIN.y = HIN.y0 - h * v; }, done: land });
      J.tween({ from: 0, to: 1, dur: 0.3, ease: E.outCubic, update: function (v) { HIN.sx = 0.78 + 0.22 * v; HIN.sy = 1.28 - 0.28 * v; } });
    }
    function land() { J.tween({ from: 0, to: 1, dur: 0.22, ease: E.outBack, update: function (v) { HIN.sx = 1.3 - 0.3 * v; HIN.sy = 0.72 + 0.28 * v; } }); }
    function hop() { if (HIN.y < HIN.y0 - 2) return; jump(0.25); sfx('pop'); }
    function kagPop() { J.tween({ from: 0, to: 1, dur: 0.35, ease: E.outBack, update: function (v) { KAG.sx = 1.2 - 0.2 * v; KAG.sy = 0.8 + 0.2 * v; } }); }
    function kurooIn() {
      KUR.on = true; KUR.leaving = false; KUR.done = false; KUR.side = Math.random() < 0.5 ? -1 : 1; KUR.x = KUR.side > 0 ? W * 0.78 : W * 0.22; KUR.y = H * 0.2; KUR.s = 0.01;
      sfx('roar'); J.tween({ from: 0.01, to: 1, dur: 0.4, ease: E.outBack, update: function (v) { KUR.s = v; } });   // aparece en su sitio (sin pasar por el marcador)
    }
    function kurooOut() {
      if (!KUR.on || KUR.leaving) return; KUR.leaving = true;
      J.tween({ from: KUR.s, to: 0.01, dur: 0.25, ease: E.inQuad, update: function (v) { KUR.s = v; }, done: function () { KUR.on = false; KUR.leaving = false; } });
    }
    function ripple(x, y) { for (var j = 0; j < 4; j++) if (!rip[j].on) { rip[j].on = true; rip[j].x = x; rip[j].y = y; rip[j].t = 0; return; } }

    // ---------- rally ----------
    function newToss() {
      ball.state = 'toss'; ball.t = 0; ball.T = tossT; ball.x = HANDS.x; ball.y = HANDS.y; ball.spin = 0; btN = 0; rallies++;
      sfx('whoosh'); kagPop();
      if (rallies > 4 && !KUR.on && Math.random() < 0.38) kurooIn();   // Kuroo bloquea una mitad de la pantalla
    }
    function endRally() { ball.state = 'idle'; nextToss = pt + 0.75; kurooOut(); }
    function hit(perfect) {
      hits++; combo++;
      var nm = combo >= 6 ? 3 : combo >= 3 ? 2 : 1, pts = (perfect ? 30 : 15) * nm;
      addScore(pts); kurooOut();   // si estaba Kuroo, se le ha esquivado: se va ya
      ball.state = 'spiked'; ball.x = RING.x; ball.y = RING.y; ball.vx = perfect ? 700 : 560; btN = 0;
      // remate con efecto: pasa por encima de la cinta (con margen) y bota dentro del campo rival, sea cual sea el tamaño
      var tn = (NET_X + 32 - RING.x) / ball.vx, tl = (W * (perfect ? 0.92 : 0.95) - RING.x) / ball.vx, A = NET_TOP - 24 - RING.y, B = FLOOR - 14 - RING.y;
      ball.g = Math.max(GRAV, Math.min(20000, 2 * (A * tl - B * tn) / (tn * tl * (tn - tl)))); ball.vy = (B - ball.g * tl * tl / 2) / tl;
      jump(perfect ? 1 : 0.85);
      J.text(RING.x, RING.y - 64, perfect ? '¡PERFECTO!' : '¡Bien!', { color: perfect ? th.accent : '#fff', size: perfect ? 40 : 30, life: 1, rise: 50 });
      J.text(Math.min(W - 60, RING.x + 80), RING.y - 16, '+' + pts, { color: '#ffe566', size: 26 });
      J.burst(RING.x, RING.y, { n: perfect ? 16 : 8, colors: [th.accent, '#ffd27a', '#fff'], speed: perfect ? 330 : 220, life: 0.6, size: 8, gravity: 700, shape: perfect ? 'star' : 'square' });
      if (perfect) { J.hitStop(60); J.shake(0.6); buzz(40); } else { J.shake(0.3); buzz(20); }
      sfx(perfect ? 'spike' : 'punch');
      if (nm > mult) { comboMult = nm; comboT = 0; sfx('tada'); }
      mult = nm;
      if (hits % 5 === 0) tossT = Math.max(0.85, tossT * 0.92);   // cada 5 remates el pase va un poco más rápido
    }
    function fail(msg, kind, sub) {
      hearts--; combo = 0; mult = 1; heartPop = 0.45; flash = 1; J.shake(0.4); sfx('wrong'); buzz([40, 30, 40]);
      J.text(W / 2, H * 0.3, msg, { color: '#ff8a98', size: 32, life: 1.1, rise: 36 });
      if (sub) J.text(W / 2, H * 0.3 + 34, sub, { color: '#fff', size: 19, life: 1.1, rise: 36 });
      if (kind === 'block') {   // Kuroo lo para: el balón rebota hacia atrás
        ball.state = 'blocked'; ball.x = RING.x + 20; ball.y = RING.y; ball.vx = -420; ball.vy = -160; jump(0.6);
        KUR.done = true; J.tween({ from: 0, to: 1, dur: 0.4, ease: E.outBack, update: function (v) { KUR.s = 1.35 - 0.35 * v; } });
      } else { ball.state = 'drop'; if (kind === 'air') jump(0.7); }   // el balón sigue su arco y cae
      if (hearts <= 0) finish();
    }
    function onTap(x, y) {
      if (phase !== 'play') return;
      ripple(x, y);
      if (ball.state !== 'toss') { hop(); return; }
      var u = ball.t / ball.T, delta = ball.t - ball.T, ad = Math.abs(delta);
      if (u < 0.45) { hop(); return; }   // salto de calentamiento mientras el balón aún sube: sin castigo
      if (KUR.on && !KUR.leaving && ((x < W / 2) === (KUR.side < 0))) { fail('¡Bloqueado!', 'block'); return; }
      if (ad <= PERFECT) hit(true); else if (ad <= GOOD) hit(false); else fail('¡Casi!', 'air', delta < 0 ? '¡Un poco pronto!' : '¡Un poco tarde!');
    }

    // ---------- actualización ----------
    function update(dt) {
      J.update(dt); t += dt; var j;
      flash = Math.max(0, flash - dt * 2.5); heartPop = Math.max(0, heartPop - dt); comboT += dt;
      for (j = 0; j < 4; j++) if (rip[j].on) { rip[j].t += dt; if (rip[j].t > 0.4) rip[j].on = false; }
      if (phase === 'count') {
        var ci = Math.min(3, (t / 0.78) | 0);
        if (ci !== countIdx) { countIdx = ci; sfx(ci < 3 ? 'ding' : 'levelup'); }
        if (t >= COUNT_SECS) { phase = 'play'; t = 0; pt = 0; nextToss = 0.6; }
        return;
      }
      if (phase !== 'play') return;
      pt += dt;
      if (pt >= playSecs) { finish(); return; }
      if (J.frozen()) return;   // hit-stop: nada se mueve
      if (ball.state === 'idle') { if (pt >= nextToss) newToss(); return; }
      ball.spin += dt * 5;
      if (ball.state === 'toss' || ball.state === 'drop') {
        ball.t += dt; tossPos(ball.t / ball.T, ball);
        if (ball.state === 'toss' && ball.t > ball.T + GOOD) { fail('¡Casi!', 'late'); if (phase !== 'play') return; }
        if (ball.y > FLOOR - 14) { J.burst(ball.x, FLOOR - 6, { n: 6, colors: ['#d9c3a5'], speed: 120, life: 0.4, size: 5, gravity: 400, angle: -Math.PI / 2, spread: 1.6 }); endRally(); }
      } else {   // remate o bloqueo: vuelo libre
        ball.vy += (ball.state === 'spiked' ? ball.g : GRAV) * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.state === 'spiked') { BT[btH].x = ball.x; BT[btH].y = ball.y; btH = (btH + 1) % 8; if (btN < 8) btN++; }
        if (ball.y > FLOOR - 14 || ball.x > W + 40 || ball.x < -40) {
          if (ball.x > -20 && ball.x < W + 20) J.burst(ball.x, FLOOR - 6, { n: 8, colors: ['#d9c3a5', '#fff'], speed: 160, life: 0.4, size: 5, gravity: 400, angle: -Math.PI / 2, spread: 1.6 });
          endRally();
        }
      }
    }
    function finish() {
      if (phase === 'over' || ended) return;
      phase = 'over'; t = 0; wonFlag = score >= TARGET; kurooOut();   // sin pistas de Kuroo detrás del «¡Fin!»
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
    function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
    function shadow(x, rx, h) { ctx.fillStyle = 'rgba(0,0,0,' + (0.3 * Math.max(0.15, 1 - h / 300)).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(x, FLOOR + 4, rx * Math.max(0.4, 1 - h / 500), rx * 0.26, 0, 0, TAU); ctx.fill(); }
    function drawCourt() {
      ctx.fillStyle = 'rgba(255,170,90,.12)'; ctx.fillRect(0, FLOOR, W, H - FLOOR);   // suelo
      ctx.fillStyle = th.accent; ctx.fillRect(0, FLOOR, W, 4);                       // línea de banda
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(NET_X - 1, FLOOR + 4, 2, H - FLOOR);
      ctx.fillStyle = '#cfd3da'; ctx.fillRect(NET_X - 4, NET_TOP - 10, 8, FLOOR - NET_TOP + 10);   // poste
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(NET_X - 15, NET_TOP, 30, 112);        // malla
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath();
      for (var y = NET_TOP + 11; y < NET_TOP + 112; y += 11) { ctx.moveTo(NET_X - 15, y); ctx.lineTo(NET_X + 15, y); }
      ctx.moveTo(NET_X - 8, NET_TOP); ctx.lineTo(NET_X - 8, NET_TOP + 112); ctx.moveTo(NET_X + 8, NET_TOP); ctx.lineTo(NET_X + 8, NET_TOP + 112);
      ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(NET_X - 16, NET_TOP - 4, 32, 8);                      // cinta
    }
    function drawRing() {
      var pulse = 0.5 + 0.5 * Math.sin(now / 120);
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(242,106,27,' + (0.16 + 0.14 * pulse).toFixed(3) + ')'; circle(RING.x, RING.y, RING_R + 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,120,.14)'; circle(RING.x, RING.y, RING_R); ctx.fill();
      ctx.lineWidth = 7; ctx.strokeStyle = th.accent; circle(RING.x, RING.y, RING_R); ctx.stroke();
      if (ball.state !== 'toss') return;
      var u = Math.min(1, ball.t / ball.T);   // anillo que se cierra: al tocar el aro es el momento
      if (Math.abs(ball.t - ball.T) <= GOOD) { ctx.fillStyle = 'rgba(80,255,140,.4)'; circle(RING.x, RING.y, RING_R + 4); ctx.fill(); }
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.75 * u).toFixed(3) + ')'; circle(RING.x, RING.y, RING_R + (1 - u) * 140); ctx.stroke();
      if (rallies <= 2) txt('¡Toca cuando llegue al aro!', RING.x, RING.y - 54, 18, '#fff');
    }
    function drawBall() {
      if (ball.state === 'idle') return;
      var j, p, f;
      for (j = 0; j < btN; j++) {   // estela del remate
        p = BT[(btH - btN + j + 8) % 8]; f = (j + 1) / btN;
        ctx.fillStyle = 'rgba(242,106,27,' + (f * 0.5).toFixed(3) + ')'; circle(p.x, p.y, 15 * f); ctx.fill();
      }
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.spin);
      ctx.fillStyle = '#fff'; circle(0, 0, 15); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#2b6cb0'; ctx.beginPath(); ctx.arc(0, 0, 10, 0.3, 2.3); ctx.stroke();
      ctx.strokeStyle = th.accent; ctx.beginPath(); ctx.arc(0, 0, 10, 2.9, 5.2); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.25)'; circle(0, 0, 14); ctx.stroke();
      ctx.restore();
    }
    function drawKuroo() {
      var half = KUR.side > 0 ? W / 2 : 0, fx = KUR.side > 0 ? W * 0.25 : W * 0.75, by = H * 0.19 + Math.sin(now / 150) * 8;
      if (!KUR.done) {   // pistas (mitad roja, flecha, rótulos) solo mientras hay que decidir; se encienden/apagan con Kuroo
        ctx.globalAlpha = Math.max(0, Math.min(1, KUR.s));
        ctx.fillStyle = 'rgba(255,40,70,.16)'; ctx.fillRect(half, 86, W / 2, FLOOR - 86);   // mitad bloqueada
        ctx.save(); ctx.translate(fx, by); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-16, -46); ctx.lineTo(16, -46); ctx.lineTo(16, -6); ctx.lineTo(38, -6); ctx.lineTo(0, 40); ctx.lineTo(-38, -6); ctx.lineTo(-16, -6); ctx.closePath();
        ctx.stroke(); ctx.fill(); ctx.restore();   // flecha grande que bota en la mitad libre
        txt('¡Toca aquí!', fx, H * 0.19 + 72, 24, '#fff');
        txt('¡BLOQUEO!', KUR.x, KUR.y + 66, 20, '#ff8a98');
        ctx.globalAlpha = 1;
      }
      J.token(ctx, IMG.kur, KUR.x, KUR.y, 44, { sx: KUR.s, sy: KUR.s, color: '#c1272d', ring: 5, ringColor: '#ff3b5c' });
    }
    function drawHUD() {
      rr(W / 2 - 70, 12, 140, 48, 24); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
      txt(String(score), W / 2, 36, 32, '#fff', 'center', false);
      if (mult > 1) { rr(W / 2 - 128, 20, 50, 32, 16); ctx.fillStyle = th.accent; ctx.fill(); txt('×' + mult, W / 2 - 103, 36, 20, '#fff', 'center', false); }
      var s = 1 + heartPop * 1.1, j;
      ctx.save(); ctx.translate(W - 54, 36); ctx.scale(s, s);
      for (j = 0; j < 3; j++) heart(j * 30 - 30, 0, 11, j < hearts);   // se pierden por la derecha
      ctx.restore();
      var f = phase === 'count' ? 1 : Math.max(0, 1 - pt / playSecs), bw = W - 24;   // barra de tiempo
      rr(12, 70, bw, 10, 5); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
      if (f > 0) { rr(12, 70, Math.max(10, bw * f), 10, 5); ctx.fillStyle = f < 0.17 ? (((now / 250) | 0) % 2 ? '#ff5262' : '#ffb3bb') : th.accent; ctx.fill(); }
    }
    function drawCombo() {
      var s = E.outBack(Math.min(1, comboT / 0.3)), a = comboT > 0.7 ? 1 - (comboT - 0.7) / 0.3 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.translate(W / 2, H * 0.24); ctx.scale(s, s); txt('¡COMBO ×' + comboMult + '!', 0, 0, 46, '#ffe566'); ctx.restore();
    }
    function drawCount() {
      ctx.fillStyle = 'rgba(8,6,20,.5)'; ctx.fillRect(-20, -20, W + 40, H + 40);
      var lt = t - countIdx * 0.78, s = E.outBack(Math.min(1, lt / 0.35)), bob = Math.sin(t * 5) * 6;
      J.token(ctx, IMG.hin, W / 2, H * 0.33 + bob, 66, { color: '#f2a65a', ring: 5, ringColor: th.accent });
      ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(s, s); txt(countIdx < 3 ? String(3 - countIdx) : '¡YA!', 0, 0, countIdx < 3 ? 120 : 84, th.accent); ctx.restore();
      txt('Toca cuando el balón pase por el aro', W / 2, H * 0.8, 19, '#fff');
      txt('Si Kuroo bloquea, toca en el otro lado', W / 2, H * 0.85, 17, '#ffb3bb');
    }
    function drawOver() {
      ctx.fillStyle = 'rgba(8,6,20,.62)'; ctx.fillRect(-20, -20, W + 40, H + 40);
      var s = E.outBack(Math.min(1, t / 0.4));
      ctx.save(); ctx.translate(W / 2, H * 0.38); ctx.scale(s, s); txt('¡Fin!', 0, 0, 72, th.accent); ctx.restore();
      txt('Puntos: ' + score, W / 2, H * 0.5, 34, '#fff');
      txt(wonFlag ? '¡Remate ganador!' : hearts <= 0 ? '¡Otra vez!' : '¡Buen intento!', W / 2, H * 0.58, 24, wonFlag ? '#ffd27a' : '#fff');
      txt('Meta: ' + TARGET + ' puntos', W / 2, H * 0.64, 18, 'rgba(255,255,255,.75)');
    }
    function render() {
      var so = J.shakeOffset(9), sx = so[0], sy = so[1], j;
      if (sx || sy) { bgEl.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)'; bgShaken = true; }
      else if (bgShaken) { bgEl.style.transform = ''; bgShaken = false; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
      drawCourt();
      if (KUR.on) drawKuroo();
      shadow(KAG.x, 36, 0); shadow(HIN.x, 40, HIN.y0 - HIN.y);
      if (ball.state !== 'idle') shadow(ball.x, 16, FLOOR - ball.y);
      J.token(ctx, IMG.kag, KAG.x, KAG.y, 40, { sx: KAG.sx, sy: KAG.sy, color: '#1b2a44', ring: 4, ringColor: th.accent });
      drawRing();
      J.token(ctx, IMG.hin, HIN.x, HIN.y, 44, { sx: HIN.sx, sy: HIN.sy, color: '#f2a65a', ring: 4, ringColor: th.accent });
      drawBall(); J.draw(ctx);
      for (j = 0; j < 4; j++) if (rip[j].on) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - rip[j].t / 0.4).toFixed(3) + ')'; circle(rip[j].x, rip[j].y, 18 + rip[j].t * 160); ctx.stroke(); }
      if (comboT < 1) drawCombo();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,30,60,' + (0.35 * flash).toFixed(3) + ')'; ctx.fillRect(-20, -20, W + 40, H + 40); }
      drawHUD();
      if (phase === 'count') drawCount(); else if (phase === 'over') drawOver();
    }

    // ---------- entrada: un toque en cualquier sitio (pointerdown); espacio/intro en escritorio ----------
    function prevent(e) { e.preventDefault(); }
    function onDown(e) {
      if (!e.isPrimary) return;
      e.preventDefault(); var r = canvas.getBoundingClientRect();
      onTap((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height);
    }
    function onKey(e) { if (!e.repeat && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp')) { e.preventDefault(); onTap(W / 2, H / 2); } }
    function onTouch(e) { e.preventDefault(); }   // sin scroll ni zoom de la página
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('touchstart', onTouch, { passive: false }); canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('contextmenu', prevent);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(root); }

    function cleanup() {
      cancelAnimationFrame(raf); clearTimeout(endTimer); clearTimeout(capTimer);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('touchstart', onTouch); canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('contextmenu', prevent);
      window.removeEventListener('keydown', onKey);
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

  window.MiniGames.volley = { id: 'volley', title: 'Remate de Hinata', world: 'haikyuu', start: start };
})();
