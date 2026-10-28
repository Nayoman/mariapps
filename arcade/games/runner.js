/* runner.js — «Deku corre» (My Hero Academia), con KAPLAY 3001. Deku corre solo: toca para saltar y otra vez en el aire = doble salto
   (One For All). Robots y rocas de 1 o 2 alturas, muros de doble salto, monedas en arco (+5). Puntos = metros; meta 600 m; 3 corazones.
   Física y obstáculos del primer runner. Textos y formas se pintan UNA vez en canvas 2D como sprites (la caché global de fuentes de
   KAPLAY se rompe al cambiar de partida) y las partículas van en pool propio (las de KAPLAY 3001.0.12 no reinician su reloj al reusarse). */
(function () {
'use strict';
window.MiniGames = window.MiniGames || {};
var FONT = '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif', PI = Math.PI, TAU = PI * 2;
var sin = Math.sin, cos = Math.cos, min = Math.min, max = Math.max, abs = Math.abs, floor = Math.floor, rand = Math.random;
var SRC = { bg: '../ciencias/assets/img/bg_mha.webp', deku: 'assets/tokens/st_deku.png', am: 'assets/tokens/st_allmight.png' };
var GOAL = 600, GRAV = 2400, JUMP = 880, JUMP2 = 780, SPEED0 = 260, ACCEL = 3.6, SPEED_MAX = 520, MPX = 1 / 30;
var DX = 112, DR = 24, TOK = 70, STEP = 0.7, END_MS = 1500;
var TYPES = { rock: [62, 44], bot1: [50, 58], bot2: [50, 104], wall: [44, 190] };   // ancho y alto del cuerpo que choca

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function rnd(a, b) { return a + rand() * (b - a); }
function lin(g, x0, y0, x1, y1, st) { var gr = g.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]); return gr; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
function dot(g, x, y, r, c) { g.fillStyle = c; circ(g, x, y, r); g.fill(); }
function oval(g, x, y, rx, ry, a, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }
function line(g, c, w, pts) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); for (var i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); }
function box(g, x, y, w, h, r, fill, edge) { rr(g, x, y, w, h, r); g.fillStyle = fill; g.fill(); if (edge) { g.lineWidth = 3; g.strokeStyle = edge; g.stroke(); } }
function heartPath(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.4);
  g.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.9); g.closePath();
}
function starPath(g, x, y, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var q = i % 2 ? r * 0.45 : r, a = -PI / 2 + i * PI / 5; g.lineTo(x + cos(a) * q, y + sin(a) * q); } g.closePath(); }
function circleRect(cx, cy, r, x0, y0, x1, y1) { var dx = cx - clamp(cx, x0, x1), dy = cy - clamp(cy, y0, y1); return dx * dx + dy * dy < r * r; }

function start(container, opts) {
  opts = opts || {};
  var bgc = (opts.theme && opts.theme.bg) || '#101a12', i;
  var durationMs = opts.durationMs > 0 ? opts.durationMs : 80000, playSecs = clamp(durationMs / 1000 - 5, 30, 100);
  function sfx(n) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n); } catch (e) { /* nunca rompe el juego */ } }
  function buzz(p) { try { if (typeof opts.vibrate === 'function') opts.vibrate(p); } catch (e) { /* idem */ } }

  // ---------- DOM + motor (tamaño lógico = tamaño CSS del contenedor: 1:1 y nítido) ----------
  var root = document.createElement('div'), canvas = document.createElement('canvas');
  root.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:' + bgc + ';touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;';
  root.appendChild(canvas); container.appendChild(root);
  if (root.clientHeight < 240) root.style.height = Math.round((window.innerHeight || 780) * 0.7) + 'px';   // el contenedor no tenía alto
  var cw = root.clientWidth || 390, ch = root.clientHeight || 780;
  var W = Math.round(clamp(min(cw, ch * 0.75), 300, 900)), H = Math.round(clamp(min(ch, cw * 2.4), 500, 1400)), pd = min(2, window.devicePixelRatio || 1), k;
  var GROUND = Math.round(H * 0.775), GY = GROUND - 35, ND = Math.ceil((W + 120) / 90);   // borde de la pista y centro de Deku cuando pisa
  try {
    k = window.kaplay({ canvas: canvas, root: root, width: W, height: H, letterbox: true, touchToMouse: true, global: false, background: bgc,
      pixelDensity: pd, texFilter: 'linear', debug: false, loadingScreen: false });
  } catch (e) { if (root.parentNode) root.parentNode.removeChild(root); throw e; }
  canvas.style.display = 'block';
  var cleaned = false;
  k.onCleanup(() => {   // corre al final del fotograma siguiente a k.quit()
    if (cleaned) return; cleaned = true;
    try { if (k._k && k._k.k === k) k._k.k = null; } catch (e) { /* sin aviso «already initialized» en la partida siguiente */ }
    try { var pr = k.audioCtx && k.audioCtx.close(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) { /* KAPLAY abre un AudioContext por partida y no lo cierra */ }
  });
  var C = h => k.Color.fromHex(h), EB = k.easings.easeOutBack, EC = k.easings.easeOutCubic, EIB = k.easings.easeInBack;
  var WHITE = C('#ffffff'), GOLD = C('#ffd54f'), RED = C('#ff3b5c'), BLACK = C('#000000'), GREEN = C('#7CFC00'), DUST = C('#e6efe6');
  function fx(n, cols, v, life, s, g, sq, ang, spr) { return { n: n, cols: cols, v: v, life: life, s: s, g: g, sq: sq, ang: ang, spr: spr }; }
  var FX = {   // n, colores, velocidad, vida, tamaño, gravedad, cuadradas, ángulo, apertura
    dust: fx(7, [DUST, C('#a9bba9')], 120, 0.45, 11, -60, 0, -2.2, 1.4), trail: fx(1, [DUST, C('#c9d6c9')], 60, 0.35, 8, -40, 0, -2.6, 0.8),
    ofa: fx(18, [GREEN, C('#d9ffb0'), C('#2BA84A'), WHITE], 330, 0.6, 9, 300, 1), coin: fx(13, [GOLD, WHITE, C('#ff9f1c')], 250, 0.6, 9, 380, 1),
    hurt: fx(15, [WHITE, RED, C('#ffb3c1')], 260, 0.6, 9, 520), rubble: fx(10, [C('#9aa3b2'), C('#5b6372'), DUST], 220, 0.6, 9, 700, 1, -1.57, 2),
    party: fx(44, [GOLD, WHITE, GREEN, C('#5ce1ff'), C('#ff5c8a')], 380, 1.3, 10, 420, 1)
  };

  // ---------- Sprites pintados en canvas 2D ----------
  var SZ = {}, ADV = {}, img = {}, meas = document.createElement('canvas').getContext('2d');
  function paint(name, w, h, fn) {
    var c = document.createElement('canvas'), g;
    c.width = max(1, Math.ceil(w * pd)); c.height = max(1, Math.ceil(h * pd));
    g = c.getContext('2d'); g.scale(pd, pd); g.lineJoin = 'round'; g.lineCap = 'round'; fn(g, w, h);
    k.loadSprite(name, c, { singular: true }); SZ[name] = [w, h];
  }
  function tw(str, size) { meas.font = '900 ' + size + 'px ' + FONT; return meas.measureText(str).width; }
  function txt(g, str, x, y, size, c, al) { g.font = '900 ' + size + 'px ' + FONT; g.textAlign = al || 'center'; g.textBaseline = 'middle'; g.fillStyle = c; g.fillText(str, x, y); }
  var gold = (g, h) => lin(g, 0, h * 0.18, 0, h * 0.86, [0, '#fff6b8', 0.5, '#ffd54f', 1, '#ff9a1a']);
  var green = (g, h) => lin(g, 0, h * 0.18, 0, h * 0.86, [0, '#e9ffd0', 0.5, '#8ef05a', 1, '#2BA84A']);
  function label(name, str, size, fill) {
    var sw = max(4, Math.round(size / 6.5)), w = Math.ceil(tw(str, size) + sw + 10), h = Math.ceil(size * 1.3 + sw);
    paint(name, w, h, g => {
      g.font = '900 ' + size + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = sw; g.strokeStyle = 'rgba(8,12,30,.78)'; g.strokeText(str, w / 2, h / 2 + size * 0.05);
      g.fillStyle = typeof fill === 'function' ? fill(g, h) : fill; g.fillText(str, w / 2, h / 2 + size * 0.05);
    });
  }
  function token(name, im, d, fb) {   // la sombra solo se pinta aquí, nunca en el bucle
    paint(name, d + 14, d + 14, (g, w) => {
      g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 7; g.shadowOffsetY = 3; dot(g, w / 2, w / 2, d / 2 - 1, '#fff'); g.restore();
      if (im) { g.imageSmoothingQuality = 'high'; g.drawImage(im, w / 2 - d / 2, w / 2 - d / 2, d, d); } else dot(g, w / 2, w / 2, d / 2 - 4, fb);
    });
  }
  function bubble(name, str, col) {   // bocadillo blanco con el pico a la derecha
    var bw = Math.ceil(tw(str, 19)) + 30;
    paint(name, bw + 12, 50, g => {
      rr(g, 2, 2, bw, 40, 18); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.moveTo(bw - 22, 38); g.lineTo(bw + 10, 48); g.lineTo(bw - 6, 30); g.fill();
      txt(g, str, bw / 2 + 2, 23, 19, col);
    });
  }
  function robot(g, x0, y0, w, h, eye) {   // cuerpo de robot: metal redondeado, pantalla oscura y dos ojos que brillan
    box(g, x0, y0, w, h, 12, lin(g, 0, y0, 0, y0 + h, [0, '#dbe2ec', 1, '#7c879a']), '#3f4a5a');
    box(g, x0 + 7, y0 + 8, w - 14, 24, 8, '#26303d');
    [-9, 9].forEach(d => { dot(g, x0 + w / 2 + d, y0 + 20, 6, eye); dot(g, x0 + w / 2 + d + 2, y0 + 18, 2.2, '#fff'); });
  }
  function feet(g, x0, y, w) { box(g, x0 + 5, y, 13, 8, 3, '#3f4a5a'); box(g, x0 + w - 18, y, 13, 8, 3, '#3f4a5a'); }
  function paintAll() {
    var MG = 14, j;
    paint('bg', W + MG * 2, H + MG * 2, (g, w, h) => {   // + velo; el margen tapa los bordes al temblar
      if (img.bg) { var s = max(w / img.bg.width, h / img.bg.height), dw = img.bg.width * s, dh = img.bg.height * s; g.drawImage(img.bg, (w - dw) / 2, (h - dh) / 2, dw, dh); }
      else { g.fillStyle = lin(g, 0, 0, 0, h, [0, '#0b1230', 1, '#1d3d6b']); g.fillRect(0, 0, w, h); }
      g.fillStyle = 'rgba(5,10,18,.42)'; g.fillRect(0, 0, w, h);
    });
    paint('shade', W, 128, (g, w, h) => { g.fillStyle = lin(g, 0, 0, 0, h, [0, 'rgba(2,8,6,.6)', 1, 'rgba(2,8,6,0)']); g.fillRect(0, 0, w, h); });
    paint('track', W + MG * 2, H - GROUND + MG, (g, w, h) => {   // pista: degradado verde, borde amarillo y franja más oscura
      g.fillStyle = lin(g, 0, 0, 0, h, [0, '#38b85a', 0.25, '#23853f', 1, '#0b2d16']); g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, 74, w, 22);
      g.fillStyle = '#ffd54f'; g.fillRect(0, 0, w, 6); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 1, w, 2);
    });
    paint('rock', 66, 48, g => {   // roca gris con ojos dormilones
      var gr = g.createRadialGradient(24, 14, 4, 33, 26, 40); gr.addColorStop(0, '#b9c0ca'); gr.addColorStop(1, '#5b626d');
      box(g, 2, 4, 62, 44, 18, gr, '#3d434c');
      line(g, 'rgba(40,44,52,.5)', 2, [11, 15, 17, 21, 14, 29]); line(g, 'rgba(40,44,52,.5)', 2, [53, 33, 47, 38]);
      oval(g, 24, 25, 6.5, 7.5, 0, '#fff'); oval(g, 42, 25, 6.5, 7.5, 0, '#fff'); dot(g, 25, 28, 3.2, '#1d2230'); dot(g, 43, 28, 3.2, '#1d2230');
      g.fillStyle = '#8a919c'; g.fillRect(16, 16, 17, 8); g.fillRect(34, 16, 17, 8); line(g, '#3d434c', 2, [16, 24, 33, 24]); line(g, '#3d434c', 2, [34, 24, 51, 24]);
      line(g, '#3d434c', 2.5, [28, 37, 38, 36]);
    });
    paint('bot1', 56, 78, g => {   // robot de 1 altura
      line(g, '#3f4a5a', 4, [28, 7, 28, 22]); dot(g, 28, 7, 5, '#ff4d4d'); robot(g, 3, 20, 50, 52, '#5ce1ff'); feet(g, 3, 70, 50);
      dot(g, 14, 60, 3, '#ffd54f'); dot(g, 42, 60, 3, '#7CFC00');
    });
    paint('bot2', 56, 124, g => {   // robot de 2 alturas: cabeza enfadada sobre un cuerpo con luces
      line(g, '#3f4a5a', 4, [28, 7, 28, 22]); dot(g, 28, 7, 5, '#ffd54f');
      box(g, 6, 62, 44, 54, 10, lin(g, 0, 62, 0, 116, [0, '#b9c3d1', 1, '#6c778a']), '#3f4a5a');
      ['#7CFC00', '#ffd54f', '#ff5c5c'].forEach((c, n) => dot(g, 17 + n * 11, 78, 4, c));
      for (j = 0; j < 3; j++) line(g, 'rgba(40,50,64,.55)', 2.5, [15, 92 + j * 7, 41, 92 + j * 7]);
      robot(g, 3, 20, 50, 46, '#ff5c5c'); line(g, '#3f4a5a', 3, [12, 27, 24, 31]); line(g, '#3f4a5a', 3, [44, 27, 32, 31]); feet(g, 3, 116, 50);
    });
    paint('wall', 50, 200, g => {   // muro de hormigón con franja de peligro: pide doble salto
      var y;
      box(g, 3, 10, 44, 190, 6, lin(g, 3, 0, 47, 0, [0, '#646d7c', 0.5, '#9ba4b3', 1, '#555d6b']));
      for (y = 52; y < 200; y += 22) { line(g, 'rgba(40,46,56,.45)', 2, [5, y, 45, y]); line(g, 'rgba(40,46,56,.45)', 2, [y % 44 ? 18 : 32, y, y % 44 ? 18 : 32, y + 22]); }
      g.save(); rr(g, 3, 10, 44, 30, 6); g.clip(); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 50, 42);
      g.fillStyle = '#1d2230'; for (y = -40; y < 60; y += 16) { g.beginPath(); g.moveTo(y, 40); g.lineTo(y + 8, 40); g.lineTo(y + 38, 10); g.lineTo(y + 30, 10); g.fill(); }
      g.restore(); rr(g, 3, 10, 44, 190, 6); g.lineWidth = 3; g.strokeStyle = '#3a404c'; g.stroke();
    });
    paint('coin', 38, 38, g => {
      var gr = g.createRadialGradient(14, 13, 2, 19, 19, 18); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.5, '#ffcc33'); gr.addColorStop(1, '#e0950f');
      dot(g, 19, 19, 17, gr); g.lineWidth = 2.5; g.strokeStyle = '#a8690a'; g.stroke();
      circ(g, 19, 19, 12.5); g.lineWidth = 1.5; g.strokeStyle = 'rgba(168,105,10,.6)'; g.stroke();
      txt(g, '฿', 19, 20, 19, '#8a5a00'); oval(g, 13, 10, 5, 2.6, -0.6, 'rgba(255,255,255,.7)');
    });
    [['h1', '#ff3b5c', '#fff'], ['h0', 'rgba(255,255,255,.2)', 'rgba(255,255,255,.45)']].forEach(p => paint(p[0], 32, 30, g => {
      heartPath(g, 16, 16, 12.5); g.fillStyle = p[1]; g.fill(); g.lineWidth = 2.5; g.strokeStyle = p[2]; g.stroke(); if (p[0] == 'h1') oval(g, 10, 11, 3.5, 2.2, -0.6, 'rgba(255,255,255,.55)');
    }));
    [['star', '#ffd54f', 'rgba(80,40,0,.55)'], ['star0', 'rgba(0,0,0,.4)', 'rgba(255,255,255,.7)']].forEach(s => paint(s[0], 50, 48, g => {
      starPath(g, 25, 25, 22); g.fillStyle = s[1]; g.fill(); g.lineWidth = 3; g.strokeStyle = s[2]; g.stroke();
    }));
    paint('card', 300, 280, (g, w, h) => { rr(g, 3, 3, w - 6, h - 6, 26); g.fillStyle = 'rgba(8,30,18,.93)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffd54f'; g.stroke(); });
    [['meta', 'Meta ' + GOAL + ' m', 'rgba(0,0,0,.45)', '#fff'], ['metaOk', '¡Meta!', '#ffd54f', '#3a2400']].forEach(p => {
      var w = Math.ceil(tw(p[1], 16)) + 44;
      paint(p[0], w, 34, g => {
        rr(g, 1, 1, w - 2, 32, 16); g.fillStyle = p[2]; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.3)'; g.stroke();
        starPath(g, 18, 17, 8); g.fillStyle = '#ffd23f'; g.fill(); g.strokeStyle = 'rgba(80,40,0,.5)'; g.stroke(); txt(g, p[1], 31, 18, 16, p[3], 'left');
      });
    });
    bubble('bubble', '¡Plus Ultra!', '#1d5fd6');
    token('deku', img.deku, TOK, '#2BA84A'); token('dekuBig', img.deku, 130, '#2BA84A'); token('am', img.am, 74, '#1d5fd6');
    [['title', 'Deku corre', 32, green], ['hint', 'Toca para saltar', 25, '#fff'], ['hint2', 'Dos toques = doble salto', 19, '#c9ffb0'],
      ['n3', '3', 120, gold], ['n2', '2', 120, gold], ['n1', '1', 120, gold], ['nYa', '¡YA!', 96, gold], ['p5', '+5', 32, gold], ['tCasi', '¡Casi!', 30, '#ffd1dc'],
      ['tDos', '¡2 saltos!', 18, gold], ['tMeta', '¡Meta conseguida!', 30, gold], ['tFin', '¡Fin!', 74, gold], ['tTiempo', '¡Tiempo!', 62, gold],
      ['lblM', 'METROS', 17, '#eef2f8'], ['mWin', '¡Plus Ultra!', 26, green], ['mLose', '¡Casi! La meta son ' + GOAL + ' m', 20, '#fff']].forEach(L => label(L[0], L[1], L[2], L[3]));
    for (j = 1; j <= 12; j++) label('hm' + j, '¡' + j * 100 + ' m!', 40, gold);
    for (j = 0; j < 10; j++) { ADV['d' + j] = tw(String(j), 60); label('d' + j, String(j), 60, '#fff'); }
    label('mU', 'm', 38, '#fff'); ADV.mU = tw('m', 38) + 8;
  }

  function spr(name, x, y, o) {
    var z = SZ[name]; if (!z) return;
    o = o || {}; var s = o.s == null ? 1 : o.s;
    k.drawSprite({ sprite: name, pos: k.vec2(x, y), width: z[0] * s * (o.sx || 1), height: z[1] * s * (o.sy || 1), anchor: o.an || 'center',
      opacity: o.a == null ? 1 : o.a, angle: o.r || 0, color: o.c });
  }
  function drawNum(str, x, y, s, col, suf) {   // dígitos centrados en x (con «m» detrás si se pide)
    var j, t = suf ? ADV[suf] * s : 0, d; for (j = 0; j < str.length; j++) t += ADV['d' + str[j]] * s;
    x -= t / 2; for (j = 0; j < str.length; j++) { d = 'd' + str[j]; spr(d, x + ADV[d] * s / 2, y, { s: s, c: col }); x += ADV[d] * s; }
    if (suf) spr(suf, x + ADV[suf] * s / 2 + 2, y + 6 * s, { s: s, c: col });
  }

  // ---------- Estado ----------
  var phase = 'load', phaseT = 0, cIdx = -1, ended = false, wonFlag = false, byTime = false, endTimer = 0, capTimer = 0;
  var hearts = 3, meters = 0, shownM = 0, lastH = 0, speed = SPEED0, travel = 0, nextAt = 420, playT = 0, yaT = 9, invuln = 0, freeze = 0, trailT = 0, scroll = 0;
  var flash = 0, numPop = 0, heartPop = 0, metaPop = 0, metaDone = false, amT = -9, hop = 0, glow = 0, buffer = 0;
  var deku = { y: 0, vy: 0, sx: 1, sy: 1, a: 1, ang: 0 }, grounded = true, jumps = 0, dekuTw = null;
  var OBS = [], COINS = [], PP = [], TX = [], RINGS = [], LINES = [];
  for (i = 0; i < 160; i++) PP.push({ on: false });
  for (i = 0; i < 10; i++) TX.push({ on: false });
  for (i = 0; i < 6; i++) { RINGS.push({ on: false }); LINES.push({ x: rnd(0, 500), y: rnd(H * 0.16, GROUND - 40), l: 60 }); }
  function free(list) { for (var j = 0; j < list.length; j++) if (!list[j].on) return list[j]; return null; }
  function burst(x, y, o) {
    for (var j = 0, n = 0; j < PP.length && n < o.n; j++) {
      var p = PP[j]; if (p.on) continue;
      var a = (o.ang == null ? rand() * TAU : o.ang) + (rand() - 0.5) * (o.spr == null ? TAU : o.spr), v = o.v * (0.45 + rand() * 0.75);
      p.on = true; p.x = x; p.y = y; p.vx = cos(a) * v; p.vy = sin(a) * v; p.g = o.g; p.t = 0; p.life = o.life * (0.6 + rand() * 0.6);
      p.s = o.s * (0.6 + rand() * 0.8); p.c = o.cols[n % o.cols.length]; p.sq = !!o.sq; p.r = rand() * 360; p.vr = (rand() - 0.5) * 720; n++;
    }
  }
  function text(n, x, y, life, rise) { var q = free(TX); if (q) { q.on = true; q.n = n; q.x = x; q.y = y; q.t = 0; q.life = life || 0.9; q.rise = rise == null ? 60 : rise; } }
  function ring(x, y, c, r) { var q = free(RINGS); if (q) { q.on = true; q.x = x; q.y = y; q.t = 0; q.c = c; q.r = r; } }
  function addMeters(n) { var m = floor(meters += n); if (m !== shownM) { shownM = m; try { if (typeof opts.onScore === 'function') opts.onScore(m); } catch (e) { /* silencio */ } } }

  // ---------- Saltos, obstáculos y monedas ----------
  function squash(sx, sy) {   // estirar/aplastar y volver con rebote
    if (dekuTw) dekuTw.cancel();
    dekuTw = k.tween(0, 1, 0.32, v => { deku.sx = sx + (1 - sx) * v; deku.sy = sy + (1 - sy) * v; }, EB);
  }
  function jump() {
    if (grounded) { grounded = false; jumps = 1; deku.vy = -JUMP; sfx('whoosh'); squash(0.8, 1.25); burst(DX - 10, GROUND - 4, FX.dust); }
    else if (jumps === 1) {   // doble salto: chispas verdes de One For All
      jumps = 2; deku.vy = -JUMP2 + min(0, deku.vy) * 0.35; sfx('punch'); buzz(20); squash(0.82, 1.22);
      burst(DX, deku.y + 10, FX.ofa); ring(DX, deku.y, GREEN, 54); glow = 1;
    } else buffer = 0.15;   // toque justo antes de aterrizar: salta al tocar suelo
  }
  function tap() {
    if (ended) return;
    if (phase === 'count') hop = 1; else if (phase === 'play' && freeze <= 0) jump();
  }
  function coin(x, y) { var q = free(COINS); if (!q) { q = {}; COINS.push(q); } q.on = true; q.x = x; q.y = y; q.ph = rnd(0, 6); }
  function spawn() {
    var x = W + 60, u = rand(), type, o, s;
    if (meters > 40 && u < 0.16) { for (s = 0; s < 4; s++) coin(x + s * 44, GY - 4); nextAt = 260 + speed * 0.4; return; }   // fila de monedas a ras de suelo
    u = rand(); type = meters > 120 && u < 0.18 ? 'wall' : meters > 60 && u < 0.45 ? 'bot2' : u < 0.72 ? 'bot1' : 'rock';
    o = free(OBS); if (!o) { o = {}; OBS.push(o); }
    o.on = true; o.type = type; o.w = TYPES[type][0]; o.h = TYPES[type][1]; o.x = x; o.hit = false; o.y = 0; o.r = 0; o.a = 1;
    if (type !== 'wall' && type !== 'bot2' && meters > 15 && rand() < 0.45) [103, 147, 161, 147, 103].forEach((hh, n) => coin(x + (n - 2) * speed * 0.11, GY - hh));   // arco = la parábola del salto
    nextAt = max(320, speed * rnd(1.05, 1.55)) + (type === 'wall' ? 110 : 0);
  }
  function hit(o) {
    hearts--; invuln = 1.2; freeze = 0.07; flash = 1; heartPop = 1; k.shake(8); sfx('wrong'); buzz([60, 40, 60]);
    o.hit = true; o.vy = -420; burst(o.x, GROUND - o.h / 2, FX.rubble); burst(DX, deku.y, FX.hurt);   // el obstáculo sale volando
    text('tCasi', DX + 30, deku.y - 56, 1.1, 40);
    if (hearts <= 0) finish(false);
  }
  function milestone(n) {
    if (n * 100 >= GOAL && !metaDone) { metaDone = true; metaPop = 1; wonFlag = true; sfx('tada'); buzz([40, 30, 40]); text('tMeta', W / 2, H * 0.3, 1.6, 30); burst(W / 2, 70, FX.party); }
    else { text('hm' + n, W / 2, H * 0.4, 1.2, 40); sfx('levelup'); }
    numPop = 1; if (n === 3) amT = -0.7;   // All Might saluda al pasar 300 m
  }

  // ---------- Bucle ----------
  function update() {
    var dt = min(0.05, k.dt()), t = k.time(), j, p, c, sp;
    phaseT += dt; yaT += dt; flash = max(0, flash - dt * 2.6); numPop = max(0, numPop - dt * 3); heartPop = max(0, heartPop - dt * 2.5);
    metaPop = max(0, metaPop - dt * 2); hop = max(0, hop - dt * 4); glow = max(0, glow - dt * 2.2); buffer = max(0, buffer - dt);
    for (j = 0; j < PP.length; j++) { p = PP[j]; if (!p.on) continue; if ((p.t += dt) >= p.life) { p.on = false; continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.r += p.vr * dt; }
    for (j = 0; j < TX.length; j++) if (TX[j].on && (TX[j].t += dt) >= TX[j].life) TX[j].on = false;
    for (j = 0; j < RINGS.length; j++) if (RINGS[j].on && (RINGS[j].t += dt) >= 0.4) RINGS[j].on = false;
    if (amT > -9) { var was = amT; amT += dt; if (was < 0 && amT >= 0) sfx('tada'); if (amT > 3.3) amT = -9; }
    sp = phase === 'play' && freeze <= 0 ? speed : phase === 'count' ? SPEED0 * 0.5 : 0;
    scroll += sp * dt;
    for (j = 0; j < LINES.length; j++) { c = LINES[j]; c.x -= sp * 2.2 * dt; if (c.x < -100) { c.x = W + rnd(0, 300); c.y = rnd(H * 0.16, GROUND - 40); c.l = rnd(40, 90); } }
    if (grounded) { deku.y = GY - abs(sin(t * 13)) * (sp ? 6 : 3); deku.ang = sin(t * 13) * 4; }   // trote
    if (phase === 'count') {
      j = min(3, floor(phaseT / STEP));
      if (j !== cIdx) { cIdx = j; sfx(j < 3 ? 'drum' : 'whoosh'); if (j === 3) { phase = 'play'; playT = 0; yaT = 0; } }
      return;
    }
    if (phase !== 'play') return;
    if (freeze > 0) { freeze -= dt; return; }   // hit-stop
    playT += dt; speed = min(SPEED_MAX, speed + ACCEL * dt); addMeters(speed * dt * MPX);
    if (floor(meters / 100) > lastH) { lastH = floor(meters / 100); milestone(lastH); }
    if (invuln > 0) { invuln -= dt; deku.a = floor(invuln * 14) % 2 ? 0.35 : 1; if (invuln <= 0) deku.a = 1; }
    if (!grounded) {
      deku.vy += GRAV * dt; deku.y += deku.vy * dt; deku.ang = clamp(deku.vy * 0.02, -14, 18);
      if (deku.y >= GY) {   // aterriza: aplastar + polvo (y salto guardado si tocó justo antes)
        deku.y = GY; deku.vy = 0; grounded = true; jumps = 0; squash(1.25, 0.72); burst(DX - 8, GROUND - 4, FX.dust);
        if (buffer > 0) { buffer = 0; jump(); }
      }
    } else if ((trailT -= dt) <= 0) { trailT = 0.09; burst(DX - 18, GROUND - 6, FX.trail); }
    if ((travel += speed * dt) >= nextAt) { travel = 0; spawn(); }
    for (j = 0; j < OBS.length; j++) {
      p = OBS[j]; if (!p.on) continue;
      if (p.hit) { p.x -= (speed + 80) * dt; p.vy += 1500 * dt; p.y += p.vy * dt; p.r -= 380 * dt; if ((p.a -= dt * 1.8) <= 0) p.on = false; continue; }
      p.x -= speed * dt; if (p.x < -80) { p.on = false; continue; }
      if (invuln <= 0 && circleRect(DX, deku.y, DR, p.x - p.w / 2 + 7, GROUND - p.h + 7, p.x + p.w / 2 - 7, GROUND)) { hit(p); if (phase !== 'play') return; }
    }
    for (j = 0; j < COINS.length; j++) {
      c = COINS[j]; if (!c.on) continue;
      c.x -= speed * dt; if (c.x < -30) { c.on = false; continue; }
      var dx = c.x - DX, dy = c.y - deku.y;
      if (dx * dx + dy * dy < (DR + 18) * (DR + 18)) { c.on = false; addMeters(5); text('p5', c.x, c.y - 28); burst(c.x, c.y, FX.coin); ring(c.x, c.y, GOLD, 40); sfx('coin'); buzz(15); }
    }
    if (playT >= playSecs) finish(true);
  }
  function finish(time) {
    if (phase === 'over' || ended) return;
    phase = 'over'; phaseT = 0; byTime = time; wonFlag = meters >= GOAL; clearTimeout(capTimer);
    sfx(wonFlag ? 'tada' : 'drum'); buzz(wonFlag ? [80, 50, 120] : 60);
    if (wonFlag) burst(W / 2, H * 0.32, FX.party);
    endTimer = setTimeout(endNow, END_MS);
  }
  function endNow() {
    if (ended) return;
    ended = true; cleanup();
    try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: floor(meters), won: wonFlag }); } catch (e) { /* silencio */ }
  }
  function cleanup() {
    clearTimeout(endTimer); clearTimeout(capTimer);
    try { k.quit(); } catch (e) { /* ya parado */ }
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  // ---------- Dibujo por fotograma ----------
  function drawWorld() {
    var t = k.time(), j, p, c, u, h, sl = clamp((speed - 330) / 150, 0, 1);
    spr('bg', W / 2, H / 2);
    if (sl > 0) for (j = 0; j < LINES.length; j++) { c = LINES[j]; k.drawRect({ pos: k.vec2(c.x, c.y), width: c.l, height: 3, radius: 1.5, color: WHITE, opacity: 0.22 * sl }); }   // rayas de velocidad
    spr('track', W / 2, GROUND - 3, { an: 'top' });
    for (j = 0; j < ND * 2; j++) {   // rayas de la pista que corren (la de abajo más lenta = profundidad)
      h = j < ND; u = h ? 1 : 0.6; c = (((j % ND) * 90 - scroll * u) % (ND * 90) + ND * 90) % (ND * 90) - 60;
      k.drawRect({ pos: k.vec2(c, GROUND + (h ? 52 : 112)), width: h ? 46 : 30, height: h ? 7 : 5, radius: 3, color: WHITE, opacity: h ? 0.7 : 0.35 });
    }
    for (j = 0; j < OBS.length; j++) {
      p = OBS[j]; if (!p.on) continue;
      spr(p.type, p.x, GROUND + 2 - SZ[p.type][1] / 2 + p.y, { r: p.r, a: p.a });
      if (p.type === 'wall' && !p.hit) spr('tDos', p.x, GROUND - p.h - 18 + sin(t * 6) * 3);
    }
    for (j = 0; j < COINS.length; j++) { c = COINS[j]; if (c.on) spr('coin', c.x, c.y + sin(t * 4 + c.ph) * 4, { sx: max(0.15, abs(cos(t * 4 + c.ph))) }); }
    h = clamp((GY - deku.y) / 320, 0, 1);   // sombra en el suelo: más pequeña cuanto más alto salta
    k.drawEllipse({ pos: k.vec2(DX, GROUND + 3), radiusX: 26 * (1 - h * 0.6), radiusY: 6 * (1 - h * 0.6), color: BLACK, opacity: 0.32 * (1 - h * 0.7) });
    if (glow > 0) k.drawCircle({ pos: k.vec2(DX, deku.y), radius: 46 + 10 * (1 - glow), color: GREEN, opacity: 0.35 * glow });
    spr('deku', DX, deku.y, { sx: deku.sx, sy: deku.sy, r: deku.ang, a: deku.a });
    for (j = 0; j < RINGS.length; j++) {
      c = RINGS[j]; if (!c.on) continue; u = c.t / 0.4;
      k.drawCircle({ pos: k.vec2(c.x, c.y), radius: 14 + c.r * EC(u), fill: false, outline: { width: 6 - 5 * u, color: c.c }, opacity: 1 - u });
    }
    for (j = 0; j < PP.length; j++) {
      p = PP[j]; if (!p.on) continue; u = min(1, (1 - p.t / p.life) * 1.4);
      if (p.sq) k.drawRect({ pos: k.vec2(p.x, p.y), width: p.s, height: p.s * 0.7, anchor: 'center', angle: p.r, color: p.c, opacity: u });
      else k.drawCircle({ pos: k.vec2(p.x, p.y), radius: p.s / 2 * (0.5 + 0.5 * u), color: p.c, opacity: u });
    }
    for (j = 0; j < TX.length; j++) {
      c = TX[j]; if (!c.on) continue; u = c.t / c.life;
      spr(c.n, clamp(c.x, 80, W - 80), c.y - EC(u) * c.rise, { s: u < 0.18 ? 0.55 + 0.45 * EB(u / 0.18) : 1, a: u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1 });
    }
  }
  function dim(a) { k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: BLACK, opacity: a }); }
  function drawHud() {
    var j, s, x, y, lt;
    spr('shade', W / 2, 0, { an: 'top' });
    for (j = 0; j < 3; j++) spr(j < hearts ? 'h1' : 'h0', 28 + j * 35, 32, { s: j === hearts ? 1 + heartPop * 0.7 : 1 });
    drawNum(String(floor(meters)), W / 2, 58, 0.9 + 0.3 * numPop * numPop, null, 'mU');
    spr(metaDone ? 'metaOk' : 'meta', W - 12, 32, { an: 'right', s: 1 + 0.4 * metaPop });
    if (amT >= 0) {   // All Might entra por la derecha, saluda y se va
      lt = amT; x = lt < 0.5 ? W + 60 - 122 * EB(lt / 0.5) : lt < 2.8 ? W - 62 : W - 62 + 122 * EIB(min(1, (lt - 2.8) / 0.4));
      y = H * 0.21 + sin(lt * 5) * 5;
      spr('am', x, y, { r: sin(lt * 9) * 10 });
      if (lt > 0.35 && lt < 2.95) spr('bubble', x - 44, y + 4, { an: 'right', s: max(0.05, lt < 0.65 ? EB((lt - 0.35) / 0.3) : lt > 2.75 ? (2.95 - lt) / 0.2 : 1) });
    }
    if (flash > 0) k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: RED, opacity: flash * 0.32 });
    if (phase === 'count') {
      dim(0.45); j = min(2, floor(phaseT / STEP));
      spr('title', W / 2, H * 0.15);
      spr('dekuBig', W / 2, H * 0.31 + sin(phaseT * 5) * 6 - hop * 18, { r: sin(phaseT * 3) * 5, s: 1 + hop * 0.08 });
      spr('n' + (3 - j), W / 2, H * 0.5, { s: max(0.05, EB(min(1, (phaseT - j * STEP) / 0.3))) });
      spr('hint', W / 2, H * 0.63); spr('hint2', W / 2, H * 0.63 + 34);
    } else if (phase === 'play' && yaT < 0.6) {
      spr('nYa', W / 2, H * 0.38, { s: 1 + 0.35 * max(0, 1 - yaT / 0.2), a: yaT > 0.4 ? (0.6 - yaT) / 0.2 : 1 });
    } else if (phase === 'over') {
      dim(0.5 * min(1, phaseT / 0.25)); y = H * 0.42; s = max(0.05, EB(min(1, phaseT / 0.4)));
      spr('card', W / 2, y, { s: s });
      if (phaseT > 0.15) {
        spr(byTime ? 'tTiempo' : 'tFin', W / 2, y - 90, { s: s }); spr('lblM', W / 2, y - 30); drawNum(String(floor(meters)), W / 2, y + 16, 0.9, GOLD, 'mU');
        for (j = 0; j < 3; j++) { lt = EB(clamp((phaseT - 0.3 - j * 0.18) / 0.32, 0, 1)); if (lt > 0.02) spr(j < (meters >= GOAL * 1.5 ? 3 : meters >= GOAL ? 2 : 1) ? 'star' : 'star0', W / 2 + (j - 1) * 58, y + 76, { s: lt }); }
        spr(wonFlag ? 'mWin' : 'mLose', W / 2, y + 116);
      }
    }
  }

  // ---------- Arranque: imágenes → sprites → bucle ----------
  function build() {
    paintAll(); deku.y = GY;
    k.add([k.z(1), { draw: drawWorld }]);
    k.add([k.z(2), k.fixed(), { draw: drawHud }]);
    k.onUpdate(update);
    k.onMousePress(tap); k.onKeyPress('space', tap); k.onKeyPress('up', tap);
    phase = 'count'; phaseT = 0;
  }
  var pending = 0;
  Object.keys(SRC).forEach(n => { var im = new Image(); pending++; im.onload = () => { img[n] = im; loaded(); }; im.onerror = loaded; im.src = SRC[n]; });
  function loaded() { if (--pending === 0 && !ended) build(); }
  capTimer = setTimeout(() => finish(true), durationMs + 4000);   // respaldo (pestaña en segundo plano)
  return { stop: function () { if (ended) return; ended = true; cleanup(); } };   // parada antes del fin: sin onEnd
}

window.MiniGames.runner = { id: 'runner', title: 'Deku corre', world: 'mha', start: start };
})();
