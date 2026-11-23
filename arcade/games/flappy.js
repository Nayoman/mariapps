/* flappy.js — «Nami vuela entre islas» (One Piece), con KAPLAY 3001. Toca para aletear entre la isla y la nube de tormenta;
   «฿» = +5; 3 corazones; meta 15. Textos y formas se pintan UNA vez en canvas 2D y se suben como sprites (nítidos; la caché global
   de fuentes de KAPLAY se rompe al cambiar de partida). Partículas propias: las de KAPLAY 3001.0.12 no reinician su reloj al reusarse. */
(function () {
'use strict';
window.MiniGames = window.MiniGames || {};
var FONT = '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif', PI = Math.PI, TAU = PI * 2;
var sin = Math.sin, cos = Math.cos, min = Math.min, max = Math.max, abs = Math.abs, floor = Math.floor, rand = Math.random;
var SRC = { bg: '../tablas/assets/img/bg_onepiece.webp', nami: 'assets/tokens/ch_nami.png', luffy: 'assets/tokens/ch_luffy.png' };
var GOAL = 15, GRAV = 1300, FLAP = 430, MAXFALL = 620, SPEED0 = 145, SPACING = 245, GAP0 = 230, GAPMIN = 170;
var IW = 84, IWS = 118, PALM = 60, CW = 96, CWS = 128, NR = 27, TOK = 72, SEA = 66, TOP = 112, STEP = 0.7, END_MS = 1500;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function rnd(a, b) { return a + rand() * (b - a); }
function lin(g, x0, y0, x1, y1, st) { var gr = g.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]); return gr; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
function dot(g, x, y, r, c) { g.fillStyle = c; circ(g, x, y, r); g.fill(); }
function oval(g, x, y, rx, ry, a, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, TAU); g.fill(); }
function line(g, c, w, pts) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); for (var i = 0; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); }
function heartPath(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.4);
  g.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.9); g.closePath();
}
function starPath(g, x, y, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var q = i % 2 ? r * 0.45 : r, a = -PI / 2 + i * PI / 5; g.lineTo(x + cos(a) * q, y + sin(a) * q); } g.closePath(); }
function circleRect(cx, cy, r, x0, y0, x1, y1) { var dx = cx - clamp(cx, x0, x1), dy = cy - clamp(cy, y0, y1); return dx * dx + dy * dy < r * r; }

function start(container, opts) {
  opts = opts || {};
  var bgc = (opts.theme && opts.theme.bg) || '#0b1a33', i;
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
  var WHITE = C('#ffffff'), GOLD = C('#ffd23f'), RED = C('#ff3b5c'), BLACK = C('#000000');
  function fx(n, cols, v, life, s, g, sq, ang, spr) { return { n: n, cols: cols, v: v, life: life, s: s, g: g, sq: sq, ang: ang, spr: spr }; }
  var FX = {   // n, colores, velocidad, vida, tamaño, gravedad, cuadradas, ángulo, apertura
    puff: fx(5, [WHITE, C('#d9f1ff')], 85, 0.42, 12, -50, 0, 2.26, 1.1), spark: fx(9, [GOLD, WHITE, C('#ffe9a3')], 170, 0.5, 7, 150, 1),
    coin: fx(15, [GOLD, WHITE, C('#ff9f1c')], 260, 0.65, 9, 380, 1), hurt: fx(15, [WHITE, RED, C('#ffb3c1')], 240, 0.6, 9, 420),
    splash: fx(18, [WHITE, C('#7fd8ff'), C('#2aa7e0')], 300, 0.7, 10, 900, 0, -1.57, 1.6),
    party: fx(44, [GOLD, WHITE, C('#ff5c8a'), C('#5ce1ff'), C('#7bd96f')], 380, 1.3, 10, 420, 1)
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
  var gold = (g, h) => lin(g, 0, h * 0.18, 0, h * 0.86, [0, '#fff6b8', 0.5, '#ffd23f', 1, '#ff9a1a']);
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
  function puff(g, x, y, r) {
    var gr = g.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
    gr.addColorStop(0, '#aab3c2'); gr.addColorStop(0.65, '#6b7486'); gr.addColorStop(1, '#4a5162'); dot(g, x, y, r, gr);
  }
  function leaf(g, px, py, deg, len, droop) {
    var a = deg * PI / 180, tx = px + cos(a) * len, ty = py + sin(a) * len + droop, nx = -sin(a), ny = cos(a), mx = (px + tx) / 2, my = (py + ty) / 2 - 5;
    g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(mx + nx * 11, my + ny * 11, tx, ty); g.quadraticCurveTo(mx - nx * 6, my - ny * 6, px, py);
    g.fillStyle = '#2fae4f'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#1b6e33'; g.stroke();
    g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(mx + nx * 2, my + ny * 2, tx, ty); g.strokeStyle = 'rgba(190,255,180,.75)'; g.stroke();
  }
  function cloudShape(g, w, h) {
    var u = w / 132; [[30, 36, 19], [55, 25, 24], [84, 28, 22], [105, 38, 16], [70, 38, 20]].forEach(p => dot(g, p[0] * u, p[1] * u, p[2] * u, '#fff'));
    rr(g, 14 * u, 34 * u, 104 * u, 18 * u, 9 * u); g.fill();
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = lin(g, 0, 20 * u, 0, h, [0, 'rgba(160,190,230,0)', 1, 'rgba(140,175,225,.55)']); g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  function seaTile(name, h, cr, c0, c1, foam, ph) {   // 4 olas por loseta: se repite sin costura
    paint(name, 240, h, (g, w) => {
      var x, P = [];
      for (x = 0; x <= w; x += 4) P.push(x, cr + sin(x / w * TAU * 4 + ph) * 6);
      g.beginPath(); g.moveTo(0, h); for (x = 0; x < P.length; x += 2) g.lineTo(P[x], P[x + 1]);
      g.lineTo(w, h); g.closePath(); g.fillStyle = lin(g, 0, 0, 0, h, [0, c0, 1, c1]); g.fill();
      line(g, foam, 3, P); g.fillStyle = 'rgba(255,255,255,.35)';
      for (x = 22; x < w; x += 60) { rr(g, x, cr + 22, 16, 3, 1.5); g.fill(); rr(g, x + 28, cr + 38, 10, 3, 1.5); g.fill(); }
    });
  }
  function paintAll() {
    var MG = 14, j;
    paint('bg', W + MG * 2, H + MG * 2, (g, w, h) => {   // + velo; el margen tapa los bordes al temblar
      if (img.bg) { var s = max(w / img.bg.width, h / img.bg.height), dw = img.bg.width * s, dh = img.bg.height * s; g.drawImage(img.bg, (w - dw) / 2, (h - dh) / 2, dw, dh); }
      else { g.fillStyle = lin(g, 0, 0, 0, h, [0, '#3b8fd6', 0.55, '#bfe6ff', 0.56, '#1d8fc0', 1, '#0b4f7a']); g.fillRect(0, 0, w, h); }
      g.fillStyle = 'rgba(8,16,40,.36)'; g.fillRect(0, 0, w, h);
    });
    paint('shade', W, 128, (g, w, h) => { g.fillStyle = lin(g, 0, 0, 0, h, [0, 'rgba(4,10,28,.6)', 1, 'rgba(4,10,28,0)']); g.fillRect(0, 0, w, h); });
    paint('c1', 132, 58, cloudShape); paint('c2', 96, 42, cloudShape);
    seaTile('seaF', SEA, 12, '#2bb0de', '#0a5a8c', 'rgba(255,255,255,.92)', 0);
    paint('island', IWS, PALM + H, (g, w, h) => {
      var cx = w / 2, x0 = cx - IW / 2, y0 = PALM, y, px = cx + 5, py = 25;
      g.fillStyle = lin(g, x0, 0, x0 + IW, 0, [0, '#57361e', 0.3, '#b47b44', 0.62, '#8a5a30', 1, '#45291a']); rr(g, x0, y0 + 10, IW, h - y0 - 10, 16); g.fill();
      g.strokeStyle = 'rgba(45,24,10,.35)'; g.lineWidth = 3;
      for (y = y0 + 48; y < h; y += 32) { g.beginPath(); g.moveTo(x0 + 5, y); g.quadraticCurveTo(cx, y + 8, x0 + IW - 5, y - 3); g.stroke(); }
      g.fillStyle = lin(g, 0, y0 - 8, 0, y0 + 30, [0, '#fff1b5', 1, '#e0ac58']);
      g.beginPath(); g.moveTo(x0 - 9, y0 + 24); g.quadraticCurveTo(cx, y0 - 22, x0 + IW + 9, y0 + 24); g.quadraticCurveTo(cx, y0 + 36, x0 - 9, y0 + 24); g.fill();
      [x0 + 2, x0 + IW - 4].forEach(bx => { dot(g, bx - 7, y0 + 19, 8, '#2e8f3e'); dot(g, bx + 7, y0 + 19, 8, '#2e8f3e'); dot(g, bx, y0 + 14, 9, '#4cc65a'); });
      g.strokeStyle = '#7d4f25'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - 3, y0 + 8); g.quadraticCurveTo(cx - 16, y0 - 16, px, py + 4); g.stroke();
      g.strokeStyle = '#b98249'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 6, y0 + 4); g.quadraticCurveTo(cx - 18, y0 - 16, px - 3, py + 6); g.stroke();
      [[cx - 7, y0 - 3], [cx - 7.5, y0 - 14], [cx - 3.5, y0 - 23]].forEach(p => line(g, 'rgba(60,32,12,.55)', 2, [p[0] - 5, p[1] + 1, p[0] + 4, p[1] - 1]));
      [[172, 40, 20], [8, 40, 20], [-160, 46, 15], [-20, 46, 15], [-125, 38, 8], [-55, 38, 8], [-90, 22, 0]].forEach(L => leaf(g, px, py, L[0], L[1], L[2]));
      [[-5, 5], [5, 6], [0, 9]].forEach(p => dot(g, px + p[0], py + p[1], 4.5, '#6b4423'));
    });
    paint('cloud', CWS, H, (g, w, h) => {
      var cx = w / 2, x0 = cx - CW / 2, b = h - 34, y, n;
      g.fillStyle = lin(g, x0, 0, x0 + CW, 0, [0, '#3a4150', 0.45, '#677083', 1, '#333947']); g.fillRect(x0, 0, CW, b);
      for (y = 16, n = 0; y < b - 6; y += 34, n++) { puff(g, x0 + 4, y + (n % 2) * 12, 14 + n % 3); puff(g, x0 + CW - 4, y + 17 - (n % 2) * 10, 14 + (n + 1) % 3); }
      puff(g, x0 + 12, b + 2, 22); puff(g, x0 + CW - 12, b + 2, 22); puff(g, cx - 25, b + 9, 19); puff(g, cx + 25, b + 9, 19); puff(g, cx, b + 5, 28);
      oval(g, cx - 10, b + 3, 5.5, 6.5, 0, '#fff'); oval(g, cx + 10, b + 3, 5.5, 6.5, 0, '#fff'); dot(g, cx - 9, b + 5, 3, '#1d2230'); dot(g, cx + 9, b + 5, 3, '#1d2230');
      line(g, '#1d2230', 3, [cx - 18, b - 6, cx - 5, b - 2]); line(g, '#1d2230', 3, [cx + 18, b - 6, cx + 5, b - 2]);
      g.lineWidth = 2.5; g.beginPath(); g.arc(cx, b + 22, 7, PI * 1.15, PI * 1.85); g.stroke();
    });
    paint('bolt', 28, 52, g => {
      g.beginPath(); [15, 1, 4, 26, 13, 26, 7, 51, 25, 19, 16, 19, 23, 1].forEach((v, n, a) => { if (n % 2) g.lineTo(a[n - 1], v); }); g.closePath();
      g.fillStyle = '#ffe14d'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff8cc'; g.stroke();
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
    paint('card', 300, 280, (g, w, h) => { rr(g, 3, 3, w - 6, h - 6, 26); g.fillStyle = 'rgba(10,22,52,.93)'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffc72c'; g.stroke(); });
    [['meta', 'Meta ' + GOAL, 'rgba(0,0,0,.45)', '#fff'], ['metaOk', '¡Meta!', '#ffc72c', '#3a2400']].forEach(p => {
      var w = Math.ceil(tw(p[1], 16)) + 44;
      paint(p[0], w, 34, g => {
        rr(g, 1, 1, w - 2, 32, 16); g.fillStyle = p[2]; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.3)'; g.stroke();
        starPath(g, 18, 17, 8); g.fillStyle = '#ffd23f'; g.fill(); g.strokeStyle = 'rgba(80,40,0,.5)'; g.stroke(); txt(g, p[1], 31, 18, 16, p[3], 'left');
      });
    });
    var bw = Math.ceil(tw('¡Vamos, Nami!', 19)) + 30;
    paint('bubble', bw + 12, 50, g => {
      rr(g, 2, 2, bw, 40, 18); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.moveTo(bw - 22, 38); g.lineTo(bw + 10, 48); g.lineTo(bw - 6, 30); g.fill();
      txt(g, '¡Vamos, Nami!', bw / 2 + 2, 23, 19, '#c4002a');
    });
    token('nami', img.nami, TOK, '#ff9f43'); token('namiBig', img.nami, 132, '#ff9f43'); token('luffy', img.luffy, 66, '#e4002b');
    [['title', 'Nami vuela entre islas', 27, gold], ['hint', 'Toca para volar', 25, '#fff'], ['hint2', '¡Pasa entre las islas!', 19, '#bfe9ff'],
      ['n3', '3', 120, gold], ['n2', '2', 120, gold], ['n1', '1', 120, gold], ['nYa', '¡YA!', 96, gold], ['p1', '+1', 30, '#fff'], ['p5', '+5', 34, gold],
      ['tCasi', '¡Casi!', 30, '#ffd1dc'], ['tAgua', '¡Al agua no!', 27, '#bfe9ff'], ['tMeta', '¡Meta conseguida!', 30, gold], ['tBien', '¡Genial!', 28, '#fff'],
      ['tFin', '¡Fin!', 74, gold], ['tTiempo', '¡Tiempo!', 62, gold], ['lblPts', 'PUNTOS', 17, '#eef2f8'],
      ['mWin', '¡Navegante experta!', 24, gold], ['mLose', '¡Casi! La meta son ' + GOAL, 20, '#fff']].forEach(L => label(L[0], L[1], L[2], L[3]));
    for (j = 0; j < 10; j++) { ADV['d' + j] = tw(String(j), 60); label('d' + j, String(j), 60, '#fff'); }
  }

  function spr(name, x, y, o) {
    var z = SZ[name]; if (!z) return;
    o = o || {}; var s = o.s == null ? 1 : o.s;
    k.drawSprite({ sprite: name, pos: k.vec2(x, y), width: z[0] * s * (o.sx || 1), height: z[1] * s * (o.sy || 1), anchor: o.an || 'center',
      opacity: o.a == null ? 1 : o.a, angle: o.r || 0, flipX: !!o.fl, color: o.c });
  }
  function tile(name, y, off) { var w = SZ[name][0], x = -(((off % w) + w) % w); for (; x < W; x += w) spr(name, x, y, { an: 'topleft' }); }
  function drawNum(str, x, y, s, col) {
    var j, t = 0, d; for (j = 0; j < str.length; j++) t += ADV['d' + str[j]] * s;
    x -= t / 2; for (j = 0; j < str.length; j++) { d = 'd' + str[j]; spr(d, x + ADV[d] * s / 2, y, { s: s, c: col }); x += ADV[d] * s; }
  }

  // ---------- Estado ----------
  var phase = 'load', phaseT = 0, cIdx = -1, ended = false, wonFlag = false, byTime = false, endTimer = 0, capTimer = 0;
  var score = 0, hearts = 3, passed = 0, spawned = 0, speed = SPEED0, dist = 0, lastC = null, playT = 0, yaT = 9, invuln = 0, freeze = 0;
  var flash = 0, scorePop = 0, heartPop = 0, metaPop = 0, metaDone = false, luffyT = -1, hop = 0, seaOff = 0, namiTw = null;
  var nami = { x: 0, y: 0, vy: 0, ang: 0, sx: 1, sy: 1, a: 1, k: 1 }, PAIRS = [], COINS = [], CL = [], PP = [], TX = [], RINGS = [];
  for (i = 0; i < 160; i++) PP.push({ on: false });
  for (i = 0; i < 10; i++) TX.push({ on: false });
  for (i = 0; i < 6; i++) RINGS.push({ on: false });
  function free(list) { for (var j = 0; j < list.length; j++) if (!list[j].on) return list[j]; return null; }
  function addScore(n) { score += n; scorePop = 1; try { if (typeof opts.onScore === 'function') opts.onScore(score); } catch (e) { /* silencio */ } }
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

  // ---------- Islas, monedas y choques ----------
  function spawnPair() {
    var gap = max(GAPMIN, GAP0 - spawned * 3.5), lo = TOP + gap / 2, hi = H - SEA - 58 - PALM - gap / 2, c, p = free(PAIRS), q;
    if (!p) { p = {}; PAIRS.push(p); }
    c = hi <= lo || lastC == null ? (lo + hi) / 2 : clamp(lastC + rnd(-130, 130), lo, hi);
    p.on = true; p.x = W + 70; p.top = c - gap / 2; p.bot = c + gap / 2; p.passed = false; p.fl = rand() < 0.5; p.bolt = rand() < 0.6; p.bx = rnd(-20, 20); p.ph = rnd(0, 6);
    if (lastC != null && rand() < 0.45) {
      q = free(COINS); if (!q) { q = {}; COINS.push(q); }
      q.on = true; q.x = p.x - SPACING / 2; q.y = (lastC + c) / 2; q.ph = rnd(0, 6);
    }
    lastC = c; spawned++;
  }
  function hit(kind) {
    hearts--; invuln = 1.1; freeze = 0.07; flash = 1; heartPop = 1; k.shake(8); sfx('wrong'); buzz([60, 40, 60]);
    burst(nami.x, nami.y, kind === 'mar' ? FX.splash : FX.hurt);
    text(kind === 'mar' ? 'tAgua' : 'tCasi', clamp(nami.x + 20, 90, W - 90), nami.y - 52, 1.1, 40);
    nami.vy = kind === 'nube' ? 160 : -FLAP * (kind === 'mar' ? 1.25 : 1);
    if (hearts <= 0) finish(false);
  }
  function passIsland() {
    passed++; addScore(1); text('p1', nami.x + 6, nami.y - 46); burst(nami.x, nami.y - 10, FX.spark);
    if (score >= GOAL && !metaDone) meta(); else sfx('pop');
    if (passed % 5 === 0) { speed = SPEED0 * Math.pow(1.02, passed / 5); text('tBien', W / 2, H * 0.3, 1.1, 40); }   // +2 %
    if (passed === 10) { luffyT = 0; sfx('tada'); }
  }
  function meta() { metaDone = true; metaPop = 1; sfx('levelup'); buzz([40, 30, 40]); text('tMeta', W / 2, H * 0.24, 1.6, 30); burst(W / 2, 70, FX.party); }
  function flap() {
    nami.vy = -FLAP;
    if (namiTw) namiTw.cancel();
    namiTw = k.tween(0, 1, 0.3, v => { nami.sx = 0.84 + 0.16 * v; nami.sy = 1.2 - 0.2 * v; }, EB);
    burst(nami.x - 16, nami.y + 20, FX.puff);
  }
  function tap() {
    if (ended) return;
    if (phase === 'count') hop = 1;   // cuenta atrás: saltito, sin gravedad
    else if (phase === 'play' && freeze <= 0) flap();
  }
  function begin() {   // aleteo automático: no cae al empezar
    phase = 'play'; playT = 0; yaT = 0; nami.x = Math.round(W * 0.3); nami.y = H * 0.42; nami.k = 0.3;
    k.tween(0.3, 1, 0.35, v => { nami.k = v; }, EB); flap();
  }

  // ---------- Bucle ----------
  function update() {
    var dt = min(0.05, k.dt()), j, p, c, sp;
    phaseT += dt; yaT += dt; flash = max(0, flash - dt * 2.6); scorePop = max(0, scorePop - dt * 4); heartPop = max(0, heartPop - dt * 2.5);
    metaPop = max(0, metaPop - dt * 2); hop = max(0, hop - dt * 4);
    for (j = 0; j < PP.length; j++) { p = PP[j]; if (!p.on) continue; if ((p.t += dt) >= p.life) { p.on = false; continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.r += p.vr * dt; }
    for (j = 0; j < TX.length; j++) if (TX[j].on && (TX[j].t += dt) >= TX[j].life) TX[j].on = false;
    for (j = 0; j < RINGS.length; j++) if (RINGS[j].on && (RINGS[j].t += dt) >= 0.4) RINGS[j].on = false;
    if (luffyT >= 0 && (luffyT += dt) > 3.1) luffyT = -1;
    sp = phase === 'play' && freeze <= 0 ? speed : phase === 'count' ? SPEED0 * 0.45 : 0;
    for (j = 0; j < CL.length; j++) { c = CL[j]; c.x -= c.v * (sp ? 1 : 0.3) * dt; if (c.x < -90) { c.x = W + 90; c.y = c.far ? rnd(H * 0.15, H * 0.33) : rnd(H * 0.22, H * 0.55); } }
    seaOff += sp * dt;
    if (phase === 'count') {
      j = min(3, floor(phaseT / STEP));
      if (j !== cIdx) { cIdx = j; sfx(j < 3 ? 'drum' : 'whoosh'); if (j === 3) begin(); }
      return;
    }
    if (phase !== 'play') return;
    if (freeze > 0) { freeze -= dt; return; }   // hit-stop
    playT += dt;
    nami.vy = min(MAXFALL, nami.vy + GRAV * dt); nami.y += nami.vy * dt;
    if (nami.y < NR + 4) { nami.y = NR + 4; if (nami.vy < 0) nami.vy = 0; }
    nami.ang += ((nami.vy < 0 ? -16 : min(48, nami.vy * 0.085)) - nami.ang) * min(1, dt * 9);
    if (invuln > 0) { invuln -= dt; nami.a = floor(invuln * 14) % 2 ? 0.35 : 1; if (invuln <= 0) nami.a = 1; }
    dist -= speed * dt; if (dist <= 0) { spawnPair(); dist += SPACING; }
    for (j = 0; j < PAIRS.length; j++) {
      p = PAIRS[j]; if (!p.on) continue;
      p.x -= speed * dt; if (p.x < -CWS) { p.on = false; continue; }
      if (!p.passed && p.x + IW / 2 < nami.x - NR) { p.passed = true; passIsland(); }
      var isl = circleRect(nami.x, nami.y, NR, p.x - IW / 2 + 7, p.bot + 16, p.x + IW / 2 - 7, H + 400);
      if (isl || circleRect(nami.x, nami.y, NR, p.x - CW / 2 + 8, -400, p.x + CW / 2 - 8, p.top - 8)) {
        if (invuln > 0) { if (invuln < 0.15) invuln = 0.15; }
        else { hit(isl ? 'isla' : 'nube'); if (phase !== 'play') return; }
      }
    }
    for (j = 0; j < COINS.length; j++) {
      c = COINS[j]; if (!c.on) continue;
      c.x -= speed * dt; if (c.x < -30) { c.on = false; continue; }
      var dx = c.x - nami.x, dy = c.y - nami.y;
      if (dx * dx + dy * dy < (NR + 22) * (NR + 22)) {
        c.on = false; addScore(5); text('p5', c.x, c.y - 30); burst(c.x, c.y, FX.coin); ring(c.x, c.y, GOLD, 46); buzz(15);
        if (score >= GOAL && !metaDone) meta(); else sfx('coin');
      }
    }
    if (nami.y + NR > H - SEA + 14) {   // el mar quita un corazón
      nami.y = H - SEA + 14 - NR;
      if (invuln > 0) nami.vy = -FLAP * 1.1; else { hit('mar'); if (phase !== 'play') return; }
    }
    if (playT >= playSecs) finish(true);
  }
  function finish(time) {
    if (phase === 'over' || ended) return;
    phase = 'over'; phaseT = 0; byTime = time; wonFlag = score >= GOAL; clearTimeout(capTimer);
    sfx(wonFlag ? 'tada' : 'drum'); buzz(wonFlag ? [80, 50, 120] : 60);
    if (wonFlag) burst(W / 2, H * 0.32, FX.party);
    endTimer = setTimeout(endNow, END_MS);
  }
  function endNow() {
    if (ended) return;
    ended = true; cleanup();
    try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: score, won: wonFlag }); } catch (e) { /* silencio */ }
  }
  function cleanup() {
    clearTimeout(endTimer); clearTimeout(capTimer);
    try { k.quit(); } catch (e) { /* ya parado */ }
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  // ---------- Dibujo por fotograma ----------
  function drawWorld() {
    var t = k.time(), j, p, c, u;
    spr('bg', W / 2, H / 2);
    for (j = 0; j < CL.length; j++) { c = CL[j]; spr(c.n, c.x, c.y, { s: c.s, a: c.a }); }
    for (j = 0; j < PAIRS.length; j++) {
      p = PAIRS[j]; if (!p.on) continue;
      spr('cloud', p.x, p.top + 3, { an: 'bot', fl: p.fl });
      if (p.bolt && sin(t * 7 + p.ph) > 0.8) spr('bolt', p.x + p.bx, p.top - 66);
      spr('island', p.x, p.bot, { an: 'top', fl: p.fl });
    }
    for (j = 0; j < COINS.length; j++) { c = COINS[j]; if (c.on) spr('coin', c.x, c.y + sin(t * 3 + c.ph) * 4, { sx: max(0.15, abs(cos(t * 4 + c.ph))) }); }
    if (phase === 'play' || phase === 'over') spr('nami', nami.x, nami.y, { sx: nami.sx * nami.k, sy: nami.sy * nami.k, r: nami.ang, a: nami.a });
    tile('seaF', H - SEA, seaOff);
    for (j = 0; j < RINGS.length; j++) {
      c = RINGS[j]; if (!c.on) continue; u = c.t / 0.4;
      k.drawCircle({ pos: k.vec2(c.x, c.y), radius: 10 + c.r * EC(u), fill: false, outline: { width: 5 - 4 * u, color: c.c }, opacity: 1 - u });
    }
    for (j = 0; j < PP.length; j++) {
      p = PP[j]; if (!p.on) continue; u = min(1, (1 - p.t / p.life) * 1.4);
      if (p.sq) k.drawRect({ pos: k.vec2(p.x, p.y), width: p.s, height: p.s * 0.7, anchor: 'center', angle: p.r, color: p.c, opacity: u });
      else k.drawCircle({ pos: k.vec2(p.x, p.y), radius: p.s / 2 * (0.5 + 0.5 * u), color: p.c, opacity: u });
    }
    for (j = 0; j < TX.length; j++) {
      c = TX[j]; if (!c.on) continue; u = c.t / c.life;
      spr(c.n, c.x, c.y - EC(u) * c.rise, { s: u < 0.18 ? 0.55 + 0.45 * EB(u / 0.18) : 1, a: u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1 });
    }
  }
  function dim(a) { k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: BLACK, opacity: a }); }
  function drawHud() {
    var j, s, x, y, lt;
    spr('shade', W / 2, 0, { an: 'top' });
    for (j = 0; j < 3; j++) spr(j < hearts ? 'h1' : 'h0', 28 + j * 35, 32, { s: j === hearts ? 1 + heartPop * 0.7 : 1 });
    drawNum(String(score), W / 2, 58, 1 + 0.32 * scorePop * scorePop);
    spr(metaDone ? 'metaOk' : 'meta', W - 12, 32, { an: 'right', s: 1 + 0.4 * metaPop });
    if (luffyT >= 0) {
      lt = luffyT; x = lt < 0.45 ? W + 70 - 120 * EB(lt / 0.45) : lt < 2.6 ? W - 50 : W - 50 + 120 * EIB(min(1, (lt - 2.6) / 0.4));
      y = H - SEA - 66 + sin(lt * 6) * 4;
      spr('luffy', x, y, { r: sin(lt * 9) * 9 });
      if (lt > 0.3 && lt < 2.75) spr('bubble', x - 40, y - 40, { an: 'right', s: max(0.05, lt < 0.6 ? EB((lt - 0.3) / 0.3) : lt > 2.55 ? (2.75 - lt) / 0.2 : 1) });
    }
    if (flash > 0) k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: RED, opacity: flash * 0.32 });
    if (phase === 'count') {
      dim(0.45); j = min(2, floor(phaseT / STEP));
      spr('title', W / 2, H * 0.17);
      spr('namiBig', W / 2, H * 0.34 + sin(phaseT * 4) * 7 - hop * 18, { r: sin(phaseT * 3) * 6, s: 1 + hop * 0.08 });
      spr('n' + (3 - j), W / 2, H * 0.53, { s: max(0.05, EB(min(1, (phaseT - j * STEP) / 0.3))) });
      spr('hint', W / 2, H * 0.67); spr('hint2', W / 2, H * 0.67 + 36);
    } else if (phase === 'play' && yaT < 0.6) {
      spr('nYa', W / 2, H * 0.4, { s: 1 + 0.35 * max(0, 1 - yaT / 0.2), a: yaT > 0.4 ? (0.6 - yaT) / 0.2 : 1 });
    } else if (phase === 'over') {
      dim(0.5 * min(1, phaseT / 0.25)); y = H * 0.45; s = max(0.05, EB(min(1, phaseT / 0.4)));
      spr('card', W / 2, y, { s: s });
      if (phaseT > 0.15) {
        spr(byTime ? 'tTiempo' : 'tFin', W / 2, y - 90, { s: s }); spr('lblPts', W / 2, y - 30); drawNum(String(score), W / 2, y + 16, 0.95, GOLD);
        for (j = 0; j < 3; j++) { lt = EB(clamp((phaseT - 0.3 - j * 0.18) / 0.32, 0, 1)); if (lt > 0.02) spr(j < (score >= GOAL * 2 ? 3 : score >= GOAL ? 2 : 1) ? 'star' : 'star0', W / 2 + (j - 1) * 58, y + 76, { s: lt }); }
        spr(wonFlag ? 'mWin' : 'mLose', W / 2, y + 116);
      }
    }
  }

  // ---------- Arranque: imágenes → sprites → bucle ----------
  function build() {
    paintAll();
    for (i = 0; i < 5; i++) { var far = i < 2; CL.push({ far: far, n: far ? 'c2' : 'c1', x: rnd(0, W), y: far ? rnd(H * 0.15, H * 0.33) : rnd(H * 0.22, H * 0.55), s: far ? rnd(0.75, 0.95) : rnd(0.9, 1.15), a: far ? 0.5 : 0.78, v: far ? 14 : 34 }); }
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

window.MiniGames.flappy = { id: 'flappy', title: 'Nami vuela entre islas', world: 'onepiece', start: start };
})();
