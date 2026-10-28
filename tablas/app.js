/* Las Tablas de María — motor principal (vanilla JS, sin dependencias) */
(function () {
'use strict';

// ---------- utilidades ----------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const IMG = n => `assets/img/${n}.webp`;
const parse = k => k.split('x').map(Number);

const MAX_TABLE = 8;      // 28-oct (M9): el examen del 29-oct añade la tabla del 8
const GOAL = 60;          // aciertos al día
const GAME_COST = 100;    // monedas por partida

const WORLDS = {
  onepiece: { id: 'onepiece', name: 'Grand Line', series: 'One Piece', tables: [1, 2, 3], bg: 'bg_onepiece', music: 'music_onepiece',
    chars: [['ch_luffy', 'Luffy'], ['ch_zoro', 'Zoro'], ['ch_nami', 'Nami'], ['ch_chopper', 'Chopper']],
    boss: { img: 'boss_buggy', name: 'Buggy el Payaso', hp: 10 }, win: 'win_onepiece', maria: 'maria_onepiece', hitSfx: 'punch',
    phrase: 'v_world_onepiece', combo: { img: 'ch_luffy', text: '¡GEAR 5!' },
    catch: ['¡Gomu gomu no...!', '¡Shishishi!', '¡Serás la reina de las tablas!', '¡Carne para celebrarlo!'] },
  demonslayer: { id: 'demonslayer', name: 'Monte Sagiri', series: 'Demon Slayer', tables: [4, 5], bg: 'bg_demonslayer', music: 'music_demonslayer',
    chars: [['ch_tanjiro', 'Tanjiro'], ['ch_nezuko', 'Nezuko'], ['ch_zenitsu', 'Zenitsu'], ['ch_inosuke', 'Inosuke']],
    boss: { img: 'boss_demon', name: 'Oni Bobalicón', hp: 10 }, win: 'win_demonslayer', maria: 'maria_demonslayer', hitSfx: 'slash',
    phrase: 'v_world_demonslayer', combo: { img: 'ch_tanjiro', text: '¡RESPIRACIÓN DEL AGUA!' },
    catch: ['¡Respiración del agua!', '¡Mmm-mmm!', '¡Concentración total!', '¡Soy el rey de la montaña!'] },
  haikyuu: { id: 'haikyuu', name: 'Gimnasio Karasuno', series: 'Haikyuu!!', tables: [6, 7], bg: 'bg_haikyuu', music: 'music_haikyuu',
    chars: [['ch_hinata', 'Hinata'], ['ch_kageyama', 'Kageyama'], ['ch_nishinoya', 'Nishinoya'], ['ch_tanaka', 'Tanaka']],
    boss: { img: 'boss_kuroo', name: 'Kuroo de Nekoma', hp: 12 }, win: 'win_haikyuu', maria: 'maria_haikyuu', hitSfx: 'spike',
    phrase: 'v_world_haikyuu', combo: { img: 'ch_hinata', text: '¡VUELA ALTO!' },
    catch: ['¡Estoy aquí!', '¡Vuela alto!', '¡Rolling thunder!', '¡Remate!'] },
  // 28-oct (M9): la tabla del 8 tiene mundo propio; el jefe también pregunta «3 × 8» además de «8 × 3»
  mha: { id: 'mha', name: 'Academia U.A.', series: 'My Hero Academia', tables: [8], extra: ['3x8', '4x8', '6x8', '7x8'], bg: 'bg_mha', music: 'music_mha',
    chars: [['ch_deku', 'Deku'], ['ch_ochaco', 'Uraraka'], ['ch_bakugo', 'Bakugo'], ['ch_allmight', 'All Might']],
    boss: { img: 'boss_gentle', name: 'Gentle Criminal', hp: 12 }, win: 'win_mha', maria: 'maria_mha', hitSfx: 'boom',
    phrase: 'v_world_mha', combo: { img: 'ch_deku', text: '¡PLUS ULTRA!' },
    catch: ['¡Plus Ultra!', '¡Detroit Smash!', '¡Eres una heroína!', '¡Ocho por todo!'] },
};
const worldForTable = t => t <= 3 ? WORLDS.onepiece : t <= 5 ? WORLDS.demonslayer : t <= 7 ? WORLDS.haikyuu : WORLDS.mha;
const OK_LINES = ['v_ok1', 'v_ok2', 'v_ok3', 'v_ok4', 'v_ok5', 'v_ok6', 'v_ok7'];

const GAMES = [
  { id: 'pacman', world: 'onepiece', img: 'ch_luffy', desc: 'Come toda la carne y escapa de los marines' },
  { id: 'tetris', world: 'demonslayer', img: 'ch_tanjiro', desc: 'Encaja los bloques y corta las filas con la katana' },
  { id: 'volley', world: 'haikyuu', img: 'ch_hinata', desc: 'Remata en el momento justo' },
  { id: 'slash', world: 'demonslayer', img: 'ch_nezuko', desc: 'Corta demonios con la espada (¡a Nezuko no!)' },
];

// ---------- estado guardado ----------
const KEY = 'tablas_maria_v1';
const defaults = () => ({ facts: {}, coins: 0, tickets: 1, rounds: 0, bestStreak: 0, bosses: {}, exams: [], best: {}, sound: true, today: { date: '', correct: 0 }, totalCorrect: 0, goalDays: 0 });
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return Object.assign(defaults(), s); } catch (e) {} return defaults(); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
// Hucha común de MariApps (MA-D4): monedas y entradas viven en MK.Wallet; S.coins y S.tickets son espejos (no se guardan aquí).
if (window.MK) {
  MK.Wallet.migrate('tablas', () => { MK.Wallet.add(S.coins || 0, 'tablas: monedas de antes'); MK.Wallet.addTickets(Math.max(0, (S.tickets || 0) - 1), 'tablas: entradas de antes'); });
  Object.defineProperty(S, 'coins', { get: () => MK.Wallet.coins, set: v => { const d = Math.round(v) - MK.Wallet.coins; if (d > 0) MK.Wallet.add(d, 'tablas'); else if (d < 0) MK.Wallet.spend(-d, 'tablas'); }, enumerable: false, configurable: true });
  Object.defineProperty(S, 'tickets', { get: () => MK.Wallet.tickets, set: v => MK.Wallet.addTickets(Math.round(v) - MK.Wallet.tickets, 'tablas'), enumerable: false, configurable: true });
}
const fact = k => S.facts[k] || (S.facts[k] = { box: 0, seen: 0, wrong: 0, last: 0 });
function today() { const d = new Date().toISOString().slice(0, 10); if (S.today.date !== d) S.today = { date: d, correct: 0 }; return S.today; }
const bestExam = () => S.exams.length ? Math.max.apply(null, S.exams) : 0;

const allFacts = [];
for (let a = 1; a <= MAX_TABLE; a++) for (let b = 1; b <= 10; b++) allFacts.push(`${a}x${b}`);
const tableFacts = t => allFacts.filter(k => k.startsWith(t + 'x'));

// ---------- selección adaptativa (los hechos flojos salen más) ----------
function weight(k) { const f = S.facts[k]; if (!f) return 4; return Math.max(0.4, 6 - f.box) + f.wrong * 1.5; }
function pickWeighted(pool, exclude) {
  const c = pool.filter(k => !exclude.includes(k)); const src = c.length ? c : pool;
  let tot = 0; const w = src.map(k => { const x = weight(k); tot += x; return x; });
  let r = Math.random() * tot;
  for (let i = 0; i < src.length; i++) { r -= w[i]; if (r <= 0) return src[i]; }
  return src[src.length - 1];
}
function buildQueue(pool, n) { const q = []; for (let i = 0; i < n; i++) q.push(pickWeighted(pool, q.slice(-3))); return q; }
function worstPool() {
  const sorted = allFacts.slice().sort((x, y) => { const a = S.facts[x] || { box: 0, wrong: 0 }, b = S.facts[y] || { box: 0, wrong: 0 }; return (a.box - a.wrong) - (b.box - b.wrong); });
  const weak = sorted.filter(k => { const f = S.facts[k]; return f && (f.wrong > 0 || f.box < 2); });
  return weak.length >= 6 ? weak.slice(0, 12) : sorted.slice(0, 8);
}
// 28-oct (M9): el 8 empuja más — 6 del 8 fijas, 1 de cada tabla del 1 al 7 y el resto por flojas (el 8 pesa el triple)
const pushPool = () => allFacts.concat(tableFacts(8), tableFacts(8));
function examQueue() {
  const q = shuffle(tableFacts(8)).slice(0, 6);
  for (let t = 1; t < 8; t++) q.push(pick(tableFacts(t)));
  const pool = pushPool();
  while (q.length < 20) { const k = pickWeighted(pool, q); if (!q.includes(k)) q.push(k); }
  return shuffle(q);
}

// ---------- Misión del 8 (M9, examen del 29-oct) ----------
const EIGHT = [
  { id: 'orden', name: 'En orden', desc: '8 × 1, 8 × 2… hasta 8 × 10', img: 'ch_deku' },
  { id: 'salteadas', name: 'Salteadas', desc: 'Las 10 del 8, sin orden', img: 'ch_ochaco' },
  { id: 'dificiles', name: 'Las difíciles', desc: '8 × 6, 8 × 7, 8 × 8, 8 × 9… y al revés', img: 'ch_bakugo' },
  { id: 'jefe', name: 'Jefe: Gentle Criminal', desc: 'Batalla con la tabla del 8', img: 'boss_gentle' },
  { id: 'examen', name: 'Examen del 8', desc: '20 preguntas: 12 del 8 y 8 de repaso', img: 'ch_allmight' },
];
const EIGHT_TRICKS = [
  { t: 'Doble, doble y doble', b: '8 × 3: <b>3</b> → 6 → 12 → <b>24</b>', v: 'v_eight_trick1' },
  { t: 'Acaban en 8, 6, 4, 2, 0', b: '<span class="e8">8 16 24 32 4<u>0</u></span><span class="e8">48 56 64 72 8<u>0</u></span>', v: 'v_eight_trick2' },
  { t: '8 × 5 = 40, la mitad de 80', b: 'Desde ahí, suma o resta 8: 8 × 6 = <b>48</b> · 8 × 4 = <b>32</b>', v: 'v_eight_trick3' },
  { t: 'Da igual el orden', b: '3 × 8 = 8 × 3 = <b>24</b>', v: 'v_eight_trick4' },
];
const eightState = () => S.eight || (S.eight = {});
const eightDone = id => (eightState()[id] || 0) >= 2;
const eightCount = () => EIGHT.filter(s => eightDone(s.id)).length;
const eightNext = () => EIGHT.find(s => !eightDone(s.id));
function eightQueue(id) {
  const t8 = tableFacts(8);
  if (id === 'orden') return t8.slice();
  if (id === 'salteadas') return shuffle(t8);
  if (id === 'dificiles') {
    const pool = ['8x3', '8x4', '8x6', '8x7', '8x8', '8x9', '3x8', '4x8', '6x8', '7x8'];
    t8.forEach(k => { const f = S.facts[k]; if (f && f.wrong && !pool.includes(k)) pool.push(k); });
    return buildQueue(pool, 12);
  }
  // examen: 9 del 8 + 3 al revés (2×8…7×8) + 8 de repaso de las demás tablas, las flojas primero
  const q = shuffle(t8).slice(0, 9).concat(shuffle(['2x8', '3x8', '4x8', '5x8', '6x8', '7x8']).slice(0, 3));
  const rest = allFacts.filter(k => !k.startsWith('8x') && !/x8$/.test(k));
  while (q.length < 20) { const k = pickWeighted(rest, q); if (!q.includes(k)) q.push(k); }
  return shuffle(q);
}
// guarda las estrellas del paso; devuelve si es la primera vez que se supera y si la misión queda completa
function markEight(id, stars) {
  const st = eightState(), was = eightDone(id); st[id] = Math.max(st[id] || 0, stars);
  const all = eightCount() === EIGHT.length, firstAll = all && !st.done;
  if (firstAll) { st.done = true; S.coins += 100; }
  save(); return { newly: !was && eightDone(id), firstAll };
}
function eightCelebrate(r) {
  if (r.firstAll) setTimeout(() => { moment({ img: 'win_mha', text: '¡MISIÓN DEL 8 CUMPLIDA! +100', sfx: 'win', flash: true, ms: 2200 }); Confetti.burst(180); Audio.say('v_eight_done'); }, 900);
  else if (r.newly) setTimeout(() => Audio.say('v_eight_step'), 1600);
}
function renderEight() {
  $('#eight-tricks').innerHTML = EIGHT_TRICKS.map((x, i) => `<button class="trick" data-i="${i}"><b>${x.t}</b><span>${x.b}</span><small>🔊 Tócalo para oírlo</small></button>`).join('');
  $$('#eight-tricks .trick').forEach(b => b.addEventListener('click', () => { Audio.sfx('pop', .4); Audio.say(EIGHT_TRICKS[b.dataset.i].v); }));
  const nx = eightNext(), el = $('#eight-steps'); el.innerHTML = '';
  $('#eight-count').textContent = `${eightCount()}/${EIGHT.length}`;
  EIGHT.forEach((s, i) => {
    const c = document.createElement('button'); c.className = 'step' + (eightDone(s.id) ? ' done' : '') + (nx === s ? ' next' : '');
    c.innerHTML = `<img src="${IMG(s.img)}" alt=""><div><b>${i + 1} · ${s.name}</b><small>${s.desc}</small><span class="st">${starsSvg(eightState()[s.id] || 0)}</span></div><span class="go">${eightDone(s.id) ? '✓' : nx === s ? '¡Ahora!' : '›'}</span>`;
    c.addEventListener('click', () => startEight(s.id)); el.appendChild(c);
  });
}
let eightIntroDay = '';
function goEight() {
  setWorld(WORLDS.mha); renderEight(); show('eight'); Audio.music('music_mha', .3);
  const d = MK.dayKey ? MK.dayKey() : today().date; if (eightIntroDay !== d) { eightIntroDay = d; setTimeout(() => Audio.say('v_eight_intro'), 300); }
}
function startEight(id) {
  if (id === 'jefe') return startBattle(WORLDS.mha);
  if (id === 'examen') {
    Q = { mode: 'exam', sel: 'm8:examen', queue: eightQueue('examen'), i: 0, results: [], correct: 0, wrong: [], coins: 0, retries: 0, world: WORLDS.mha, state: 'wait' };
    beginQuiz(); Audio.say('v_eight_review'); return;
  }
  Q = { mode: 'train', sel: 'm8:' + id, queue: eightQueue(id), i: 0, results: [], correct: 0, wrong: [], coins: 0, retries: 0, world: WORLDS.mha, state: 'wait' };
  beginQuiz(); Audio.say('v_train_start');
}
function tableStars(t) { let sum = 0; for (let b = 1; b <= 10; b++) sum += (S.facts[`${t}x${b}`] || { box: 0 }).box; const avg = sum / 10; return avg >= 4 ? 3 : avg >= 2.5 ? 2 : avg >= 1 ? 1 : 0; }
const starsSvg = (n, max = 3) => Array.from({ length: max }, (_, i) => `<svg class="${i < n ? 'on' : ''}"><use href="#i-star"/></svg>`).join('');

// ---------- audio (Web Audio: funciona en iPhone tras el primer toque) ----------
const Audio = {
  ctx: null, buf: {}, musicSrc: null, musicGain: null, musicName: null, musicVol: .35, voice: null, voiceId: 0, on: S.sound !== false,
  unlock() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const s = this.ctx.createBufferSource(); s.buffer = this.ctx.createBuffer(1, 1, 22050); s.connect(this.ctx.destination); s.start(0);
    } catch (e) {}
  },
  load(name) {
    if (!this.ctx) return Promise.resolve(null);
    if (!this.buf[name]) {
      this.buf[name] = fetch(`assets/audio/${name}.mp3`).then(r => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
        .then(ab => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej))).catch(() => null);
    }
    return this.buf[name];
  },
  async sfx(name, vol = 1) {
    if (!this.on || !this.ctx) return; const b = await this.load(name); if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.ctx.destination); s.start();
  },
  say(name, opt = {}) {
    if (!this.on || !this.ctx) return Promise.resolve();
    const id = ++this.voiceId;
    return this.load(name).then(b => {
      if (this.voiceId !== id) return;              // ya ha empezado otra frase
      this.stopVoice();
      if (!b) return this.speak(opt.text);
      return new Promise(res => {
        const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination);
        this.duck(true);
        s.onended = () => { if (this.voice === s) { this.voice = null; this.duck(false); } res(); };
        s.start(); this.voice = s;
      });
    });
  },
  stopVoice() {
    if (this.voice) { try { this.voice.onended = null; this.voice.stop(); } catch (e) {} this.voice = null; this.duck(false); }
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
  },
  speak(text) {
    return new Promise(res => {
      if (!text || !('speechSynthesis' in window)) return res();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; u.onend = res; u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 4000);
    });
  },
  duck(on) {
    if (!this.musicGain || !this.ctx) return; const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t); this.musicGain.gain.setTargetAtTime(on ? this.musicVol * .3 : this.musicVol, t, .08);
  },
  async music(name, vol = .35) {
    this.musicVol = vol;
    if (this.musicName === name && this.musicSrc) { this.duck(!!this.voice); return; }
    this.musicName = name; this.stopMusic();
    if (!this.on || !this.ctx) return;
    const b = await this.load(name); if (!b || this.musicName !== name) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(this.ctx.destination); s.start();
    g.gain.setTargetAtTime(vol, this.ctx.currentTime, .3); this.musicSrc = s; this.musicGain = g;
  },
  stopMusic() {
    if (!this.musicSrc) return; const s = this.musicSrc, g = this.musicGain;
    try { g.gain.setTargetAtTime(0, this.ctx.currentTime, .12); } catch (e) {}
    setTimeout(() => { try { s.stop(); } catch (e) {} }, 500); this.musicSrc = null; this.musicGain = null;
  },
  setOn(v) { this.on = v; if (!v) { this.stopMusic(); this.stopVoice(); this.musicName = null; } },
};
const SFX_PRELOAD = ['correct', 'wrong', 'coin', 'pop', 'levelup', 'win', 'lose', 'roar', 'punch', 'slash', 'spike', 'whoosh', 'chest', 'boom', 'ding', 'heart', 'drum', 'cannon'];
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

// ---------- capas: toast, confeti, momentos ----------
let current = 'start', toastT = 0;
function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + id)); current = id; if (window.MK && MK.Time) MK.Time.studying(id === 'quiz' || id === 'battle'); }   // cuenta como estudio real (AR-D1)
function setWorld(w) { document.body.dataset.world = w ? w.id : 'home'; }
function toast(msg, ms = 1800) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function flash() { const d = document.createElement('div'); d.className = 'flash'; document.body.appendChild(d); setTimeout(() => d.remove(), 520); }
function plus(txt, x, y) {
  const el = document.createElement('div'); el.className = 'plus'; el.textContent = txt; el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el);
  const a = el.animate([{ transform: 'translate(-50%,0) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,-34px) scale(1.15)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-100px) scale(1)', opacity: 0 }], { duration: 950, easing: 'cubic-bezier(.2,.8,.2,1)' });
  a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1200);
}
const Confetti = {
  cv: null, ctx: null, parts: [], raf: 0, colors: ['#E4002B', '#FFC72C', '#F52C98', '#1E6F50', '#4f7cff', '#F26A1B', '#fff'],
  burst(n = 140) {
    this.cv = this.cv || $('#confetti'); this.ctx = this.cv.getContext('2d');
    const W = this.cv.width = innerWidth, H = this.cv.height = innerHeight;
    for (let i = 0; i < n; i++) this.parts.push({ x: W / 2 + (Math.random() - .5) * 160, y: H * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 5, s: 6 + Math.random() * 7, c: pick(this.colors), r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3, life: 1 });
    if (!this.raf) this.tick();
  },
  tick() {
    const c = this.ctx; c.clearRect(0, 0, this.cv.width, this.cv.height);
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.parts) { p.vy += .42; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; p.life -= .011; c.save(); c.globalAlpha = Math.max(0, p.life); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); c.restore(); }
    this.raf = this.parts.length ? requestAnimationFrame(() => this.tick()) : 0;
    if (!this.parts.length) c.clearRect(0, 0, this.cv.width, this.cv.height);
  },
};
async function moment(o) {
  const m = $('#moment'); $('#moment-img').src = IMG(o.img); $('#moment-txt').textContent = o.text; m.classList.add('show');
  if (o.sfx) Audio.sfx(o.sfx); vibrate([60, 40, 60]); if (o.flash) flash();
  await sleep(o.ms || 1500); m.classList.remove('show');
}

// ---------- home ----------
function renderHome() {
  $('#coins').textContent = S.coins; $$('.coins-mirror').forEach(e => e.textContent = S.coins); $('#tickets').textContent = S.tickets;
  const t = today(); $('#goal-ring').style.setProperty('--p', Math.min(100, t.correct / GOAL * 100)); $('#goal-txt').textContent = t.correct;
  $('#hello-sub').textContent = t.correct >= GOAL ? '¡Objetivo de hoy conseguido! Sigue si quieres.' : `Objetivo de hoy: ${GOAL} aciertos · llevas ${t.correct}`;
  $('#games-sub').textContent = S.tickets ? `Tienes ${S.tickets} entrada${S.tickets > 1 ? 's' : ''} gratis` : `Cuestan ${GAME_COST} monedas`;
  const map = $('#tables-map'); map.innerHTML = '';
  for (let t2 = 1; t2 <= MAX_TABLE; t2++) {
    const b = document.createElement('button'); b.className = 'tmap'; b.innerHTML = `${t2}<span class="st">${starsSvg(tableStars(t2))}</span>`;
    b.addEventListener('click', () => startTrain(t2)); map.appendChild(b);
  }
  $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute');
  const n8 = eightCount(); $('#eight-sub').textContent = eightState().done ? '¡Misión cumplida! Repásala cuando quieras' : `${n8} de ${EIGHT.length} pasos · ${n8 ? 'sigue con el ' + (n8 + 1) : 'empieza por los trucos'}`;
}
function goHome() { setWorld(null); renderHome(); show('home'); Audio.music('music_home', .3); }

// ---------- elegir tabla / ver tabla ----------
function renderPick() {
  const g = $('#pick-grid'); g.innerHTML = '';
  for (let t = 1; t <= MAX_TABLE; t++) {
    const row = document.createElement('div'); row.className = 'pick-row';
    const b = document.createElement('button'); b.className = 'pick-btn'; b.innerHTML = `<span>Tabla del ${t}</span><span class="st">${starsSvg(tableStars(t))}</span>`;
    b.addEventListener('click', () => startTrain(t));
    const eye = document.createElement('button'); eye.className = 'pick-eye'; eye.textContent = 'Ver'; eye.addEventListener('click', () => showTable(t));
    row.appendChild(b); row.appendChild(eye); g.appendChild(row);
  }
}
let tableShown = 1;
function showTable(t, back) {
  tableShown = t; $('#s-table .topbar [data-go]').dataset.go = back || 'pick'; const w = worldForTable(t); setWorld(w); $('#table-bg').style.backgroundImage = `url(${IMG(w.bg)})`; $('#table-title').textContent = `Tabla del ${t}`;
  const list = $('#table-list'); list.innerHTML = '';
  for (let b = 1; b <= 10; b++) {
    const line = document.createElement('button'); line.className = 'table-line'; line.innerHTML = `${t} × ${b} = <b>${t * b}</b>`;
    line.addEventListener('click', () => { Audio.sfx('pop', .4); Audio.say(`a_${t}x${b}`, { text: `${t} por ${b}, ${t * b}` }); });
    list.appendChild(line);
  }
  show('table'); Audio.music(w.music);
}

// ---------- mundos (batalla) ----------
function renderWorlds() {
  const el = $('#worlds-list'); el.innerHTML = '';
  Object.values(WORLDS).forEach(w => {
    const done = !!S.bosses[w.id];
    const c = document.createElement('div'); c.className = 'world-card' + (done ? ' done' : '');
    c.innerHTML = `<img src="${IMG(w.boss.img)}" alt=""><div><h3>${w.series}${done ? '<span class="badge">¡Derrotado!</span>' : ''}</h3><p>${w.boss.name} · tablas del ${w.tables.join(', ')} · ${w.boss.hp} golpes</p><button class="btn btn-accent">${done ? 'Otra vez' : '¡Luchar!'}</button></div>`;
    $('button', c).addEventListener('click', () => startBattle(w)); el.appendChild(c);
  });
}

// ---------- quiz: entrenar y examen ----------
let Q = null, streak = 0, lastMascot = '';
function startTrain(sel) {
  let pool, world, queue;
  if (sel === 'mixed') { pool = pushPool(); queue = buildQueue(pool, 12); world = pick(Object.values(WORLDS)); }
  else if (sel === 'worst') { pool = worstPool(); queue = buildQueue(pool, 12); world = pick(Object.values(WORLDS)); }
  else { pool = tableFacts(sel); queue = shuffle(pool); world = worldForTable(sel); }
  Q = { mode: 'train', sel, queue, i: 0, results: [], correct: 0, wrong: [], coins: 0, retries: 0, world, state: 'wait' };
  beginQuiz(); Audio.say(sel === 'mixed' || sel === 'worst' ? 'v_mixed_start' : 'v_train_start');
}
function startExam() {
  Q = { mode: 'exam', sel: 'exam', queue: examQueue(), i: 0, results: [], correct: 0, wrong: [], coins: 0, retries: 0, world: pick(Object.values(WORLDS)), state: 'wait' };
  beginQuiz(); Audio.say('v_exam_start');
}
function beginQuiz() {
  streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
  setWorld(Q.world); $('#quiz-bg').style.backgroundImage = `url(${IMG(Q.world.bg)})`; Audio.music(Q.world.music);
  show('quiz'); setMascot(); setTimeout(askNext, 900);
}
function renderProgress() { $('#quiz-progress').innerHTML = Q.queue.map((k, i) => `<i class="${Q.results[i] || ''}${i === Q.i ? ' cur' : ''}"></i>`).join(''); }
function renderAnswer() { $('#ans-txt').textContent = Q.input; }
function setMascot() {
  let c = pick(Q.world.chars); if (c[0] === lastMascot) c = pick(Q.world.chars); lastMascot = c[0];
  $('#mascot-img').src = IMG(c[0]); $('#mascot-name').textContent = c[1];
}
function mascotReact(cls) { const m = $('#mascot-img'); m.classList.remove('jump', 'sad'); void m.offsetWidth; m.classList.add(cls); setTimeout(() => m.classList.remove(cls), 650); }
let bubbleT = 0;
function bubble(txt) { const b = $('#bubble'); b.textContent = txt; b.classList.add('show'); clearTimeout(bubbleT); bubbleT = setTimeout(() => b.classList.remove('show'), 1800); }

function askNext() {
  if (!Q) return;
  if (Q.i >= Q.queue.length) return endRound();
  const k = Q.queue[Q.i]; const [a, b] = parse(k);
  Q.cur = { k, a, b, ans: a * b }; Q.input = ''; Q.state = 'answer';
  $('#q-a').textContent = a; $('#q-b').textContent = b; renderAnswer();
  $('#fix').classList.remove('show'); $('#qcard').classList.remove('ok', 'bad');
  if (Q.i > 0 && Q.i % 3 === 0) setMascot();
  renderProgress(); Q.t0 = performance.now();
  Audio.say(`q_${a}x${b}`, { text: `¿Cuánto es ${a} por ${b}?` });
  const nk = Q.queue[Q.i + 1]; if (nk) Audio.load('q_' + nk);
}
function onKey(kk) {
  if (!Q || current !== 'quiz' || Q.state === 'wait') return;
  Audio.sfx('pop', .45);
  if (kk === 'del') { Q.input = Q.input.slice(0, -1); renderAnswer(); return; }
  if (kk === 'ok') { if (Q.input) check(); return; }
  if (Q.input.length >= 3) return;
  Q.input += kk; renderAnswer();
  if (Q.input.length >= String(Q.cur.ans).length) check();
}
async function check() {
  const val = parseInt(Q.input, 10), ms = performance.now() - Q.t0, card = $('#qcard');
  if (Q.state === 'retype') {
    if (val === Q.cur.ans) { Q.state = 'wait'; Audio.sfx('correct', .6); card.classList.remove('bad'); card.classList.add('ok'); await sleep(550); Q.i++; askNext(); }
    else { Q.input = ''; renderAnswer(); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 450); Audio.sfx('wrong', .5); }
    return;
  }
  Q.state = 'wait';
  if (val === Q.cur.ans) await onCorrect(ms); else await onWrong(ms);
}
async function onCorrect(ms) {
  const f = fact(Q.cur.k); f.seen++; f.box = Math.min(5, f.box + (ms < 3500 ? 1 : .5)); f.last = Date.now();
  streak++; S.bestStreak = Math.max(S.bestStreak, streak); Q.correct++; Q.results[Q.i] = 'ok';
  const t = today(); t.correct++; S.totalCorrect++;
  let c = Q.mode === 'exam' ? 15 : 10; if (streak >= 5) c += 5; Q.coins += c; S.coins += c; save();
  renderProgress(); $('#qcard').classList.add('ok'); $('#streak').textContent = streak; $('#streak-pill').classList.toggle('hot', streak >= 3);
  mascotReact('jump'); Audio.sfx('correct'); vibrate(20);
  const r = $('#qcard').getBoundingClientRect(); plus(`+${c} ฿`, r.left + r.width / 2, r.top + 10);
  let wait = Q.mode === 'exam' ? 450 : 800;
  if (Q.mode !== 'exam' && streak === 10) { wait = 300; await bigCombo(); }
  else if (Q.mode !== 'exam' && streak === 5) { bubble(pick(Q.world.catch)); Audio.say('v_combo5'); wait = 1200; }
  else if (Math.random() < (Q.mode === 'exam' ? .25 : .55)) { Audio.say(pick(OK_LINES)); if (Math.random() < .35) bubble(pick(Q.world.catch)); }
  if (t.correct === GOAL) { S.goalDays++; save(); setTimeout(() => { moment({ img: 'maria_onepiece', text: '¡OBJETIVO DEL DÍA!', sfx: 'win', flash: true, ms: 1800 }); Audio.say('v_fly'); Confetti.burst(120); }, 400); wait = 2300; }
  await sleep(wait); if (!Q) return; Q.i++; askNext();
}
async function bigCombo() {
  flash(); Audio.say(Q.world.phrase);
  await moment({ img: Q.world.combo.img, text: Q.world.combo.text, sfx: Q.world.hitSfx, ms: 1600 });
  Confetti.burst(90);
}
async function onWrong() {
  const f = fact(Q.cur.k); f.seen++; f.wrong++; f.box = Math.max(0, f.box - 2);
  streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
  Q.results[Q.i] = 'bad'; Q.wrong.push(Q.cur.k); save(); renderProgress();
  const card = $('#qcard'); card.classList.add('bad', 'shake'); setTimeout(() => card.classList.remove('shake'), 450);
  mascotReact('sad'); Audio.sfx('wrong'); vibrate(80);
  const { a, b, ans } = Q.cur;
  if (Q.mode === 'exam') { await sleep(650); if (!Q) return; Q.i++; askNext(); return; }
  // corrección: se la enseñamos, la oye y la escribe ella
  $('#fix').innerHTML = `${a} × ${b} = ${ans}<small>Escríbela tú</small>`; $('#fix').classList.add('show');
  Q.input = ''; renderAnswer(); Q.state = 'retype';
  const myI = Q.i;
  Audio.say(`a_${a}x${b}`, { text: `${a} por ${b}, ${ans}` }).then(() => { if (Q && Q.i === myI && Q.state === 'retype') Audio.say('v_retype'); });
  if (Q.retries < 4) { Q.retries++; Q.queue.splice(Math.min(Q.queue.length, Q.i + 3), 0, Q.cur.k); renderProgress(); }
}

// ---------- resultado ----------
let R = { again: null };
function endRound() {
  Q.state = 'wait'; const n = Q.queue.length, ratio = Q.correct / n;
  S.rounds++; let bonus = 0;
  const uniqWrong = Array.from(new Set(Q.wrong));
  if (Q.mode === 'exam') {
    const nota = Math.round(ratio * 100) / 10; S.exams.push(nota); if (nota >= 9) bonus = 100; else if (nota >= 7) bonus = 50;
    S.coins += bonus; save();
    if (Q.sel === 'm8:examen') {
      const r = markEight('examen', nota >= 9 ? 3 : nota >= 7 ? 2 : nota >= 5 ? 1 : 0);
      showResult({ img: nota >= 7 ? Q.world.win : Q.world.maria, round: nota < 7, title: `Nota: ${String(nota).replace('.', ',')}`,
        stars: nota >= 9 ? 3 : nota >= 7 ? 2 : nota >= 5 ? 1 : 0, coins: Q.coins + bonus, bg: Q.world.bg,
        sub: nota === 10 ? '¡Perfecto! ¡La tabla del 8 es tuya!' : nota >= 7 ? `${Q.correct} de ${n} bien. ¡Mañana lo vas a bordar!` : `${Q.correct} de ${n} bien. Repasa estas y vuelve a intentarlo.`,
        wrong: uniqWrong, again: () => startEight('examen'), voice: nota === 10 ? 'v_exam_great' : nota >= 7 ? 'v_exam_pass' : 'v_exam_fail', confetti: nota >= 9, back: 'eight' });
      return eightCelebrate(r);
    }
    showResult({ img: nota >= 7 ? Q.world.win : Q.world.maria, round: nota < 7, title: `Nota: ${String(nota).replace('.', ',')}`,
      stars: nota >= 9 ? 3 : nota >= 7 ? 2 : nota >= 5 ? 1 : 0, coins: Q.coins + bonus, bg: Q.world.bg,
      sub: nota === 10 ? '¡Perfecto! ¡Eres la reina de las tablas!' : nota >= 7 ? `${Q.correct} de ${n} bien. ¡Aprobado!` : `${Q.correct} de ${n} bien. Repasa estas y vuelve a intentarlo.`,
      wrong: uniqWrong, again: startExam, voice: nota === 10 ? 'v_exam_great' : nota >= 7 ? 'v_exam_pass' : 'v_exam_fail', confetti: nota >= 9 });
  } else {
    const stars = ratio >= .9 ? 3 : ratio >= .7 ? 2 : ratio >= .5 ? 1 : 0;
    if (!Q.wrong.length) bonus = 50; S.coins += bonus; save();
    const step = String(Q.sel).startsWith('m8:') ? EIGHT.find(x => 'm8:' + x.id === Q.sel) : null;
    const label = step ? `«${step.name}» de la Misión del 8` : Q.sel === 'mixed' ? 'la mezcla' : Q.sel === 'worst' ? 'las difíciles' : `la tabla del ${Q.sel}`;
    if (step) return endEightTrain(step, stars, bonus, uniqWrong, label, n);
    showResult({ img: stars >= 2 ? Q.world.win : Q.world.maria, round: stars < 2, title: !Q.wrong.length ? '¡Ronda perfecta!' : stars >= 1 ? '¡Ronda superada!' : '¡Buen entreno!',
      stars, coins: Q.coins + bonus, bg: Q.world.bg, sub: `${Q.correct} de ${n} bien en ${label}${bonus ? ' · ¡bono de 50 por no fallar!' : ''}`,
      wrong: uniqWrong, again: () => startTrain(Q.sel), voice: stars >= 1 ? 'v_level' : 'v_hint', confetti: stars === 3 });
  }
}
function endEightTrain(step, stars, bonus, wrong, label, n) {
  const r = markEight(step.id, stars), nx = eightNext(), sel = Q.sel;
  showResult({ img: stars >= 2 ? Q.world.win : Q.world.maria, round: stars < 2, title: !Q.wrong.length ? '¡Paso perfecto!' : stars >= 2 ? '¡Paso superado!' : '¡Casi! Otra vez',
    stars, coins: Q.coins + bonus, bg: Q.world.bg, sub: `${Q.correct} de ${n} bien en ${label}${stars < 2 ? ' · para superarlo, 7 de cada 10 a la primera' : ''}`,
    wrong, again: stars >= 2 && nx ? () => startEight(nx.id) : () => startEight(sel.slice(3)), againLabel: stars >= 2 && nx ? `Siguiente: ${nx.name}` : 'Otra vez',
    voice: stars >= 1 ? 'v_level' : 'v_hint', confetti: stars === 3, back: 'eight' });
  eightCelebrate(r);
}
function showResult(o) {
  R.again = o.again;
  $('#result-bg').style.backgroundImage = `url(${IMG(o.bg)})`;
  const img = $('#result-img'); img.src = IMG(o.img); img.classList.toggle('round', !!o.round);
  $('#result-title').textContent = o.title; $('#result-stars').innerHTML = starsSvg(o.stars); $('#result-sub').textContent = o.sub || '';
  $('#result-coins').innerHTML = o.coins ? `<svg class="ico"><use href="#i-coin"/></svg> +${o.coins} monedas` : '';
  const list = $('#result-list'); list.innerHTML = '';
  (o.wrong || []).forEach(k => {
    const [a, b] = parse(k); const btn = document.createElement('button'); btn.textContent = `${a} × ${b} = ${a * b}`;
    btn.addEventListener('click', () => Audio.say(`a_${a}x${b}`, { text: `${a} por ${b}, ${a * b}` })); list.appendChild(btn);
  });
  const canPlay = S.tickets > 0 || S.coins >= GAME_COST;
  $('#result-game').disabled = !canPlay; $('#result-game').textContent = canPlay ? 'Jugar minijuego' : `Minijuego (faltan ${GAME_COST - S.coins} ฿)`;
  $('#result-again').textContent = o.againLabel || 'Otra vez';
  R.back = o.back || 'home'; $('#result-back').textContent = o.back === 'eight' ? 'Volver a la Misión del 8' : 'Volver al mapa';
  show('result');
  if (o.stars === 3 || o.confetti) { Audio.sfx('levelup'); setTimeout(() => Confetti.burst(160), 200); } else if (o.stars >= 1) Audio.sfx('win', .7); else Audio.sfx('lose', .6);
  if (o.voice) setTimeout(() => Audio.say(o.voice), 500);
}

// ---------- batalla ----------
let B = null;
function startBattle(w) {
  B = { world: w, hp: w.boss.hp, hearts: 3, pool: w.tables.flatMap(t => tableFacts(t)).concat(w.extra || []), recent: [], cur: null, timer: 0, state: 'wait', hits: 0, wrong: [], coins: 0 };
  setWorld(w); $('#battle-bg').style.backgroundImage = `url(${IMG(w.bg)})`; $('#battle-title').textContent = w.boss.name;
  const bi = $('#boss-img'); bi.className = ''; bi.src = IMG(w.boss.img); $('#boss-name').textContent = w.boss.name; $('#fighter-img').src = IMG(w.maria);
  renderHearts(); renderHp(); $('#choices').innerHTML = ''; $('#b-a').textContent = '?'; $('#b-b').textContent = '?'; $('#timer-fill').style.transform = 'scaleX(1)';
  show('battle'); Audio.music(w.music); Audio.sfx('roar'); Audio.say('v_boss_start');
  setTimeout(askBattle, 1500);
}
function renderHearts() { $('#hearts').innerHTML = [0, 1, 2].map(i => `<svg class="${i < B.hearts ? '' : 'off'}"><use href="#i-heart"/></svg>`).join(''); }
function renderHp() { $('#boss-hp').style.width = Math.max(0, B.hp / B.world.boss.hp * 100) + '%'; }
function makeChoices(a, b) {
  const ans = a * b, set = new Set([ans]);
  const cands = shuffle([a * (b + 1), a * (b - 1), ans + a, ans - a, (a + 1) * b, (a - 1) * b, ans + 10, ans - 10, ans + 2, ans - 2]);
  cands.forEach(v => { if (set.size < 4 && v > 0 && v !== ans) set.add(v); });
  while (set.size < 4) set.add(ans + rnd(12) + 1);
  return shuffle(Array.from(set));
}
function askBattle() {
  if (!B || current !== 'battle') return;
  const k = pickWeighted(B.pool, B.recent.slice(-4)); B.recent.push(k); const [a, b] = parse(k);
  B.cur = { k, a, b, ans: a * b }; $('#b-a').textContent = a; $('#b-b').textContent = b;
  const ch = $('#choices'); ch.innerHTML = '';
  makeChoices(a, b).forEach(v => { const btn = document.createElement('button'); btn.textContent = v; btn.addEventListener('pointerdown', e => { e.preventDefault(); onChoice(v, btn); }); ch.appendChild(btn); });
  B.state = 'ask'; B.t0 = performance.now(); const fill = $('#timer-fill'); fill.classList.remove('low');
  clearInterval(B.timer);
  B.timer = setInterval(() => {
    if (!B) return clearInterval(B.timer);
    const p = 1 - (performance.now() - B.t0) / 9000; fill.style.transformOrigin = 'left'; fill.style.transform = `scaleX(${Math.max(0, p)})`; fill.classList.toggle('low', p < .3);
    if (p <= 0) { clearInterval(B.timer); onChoice(null, null); }
  }, 50);
  Audio.say(`q_${a}x${b}`, { text: `¿Cuánto es ${a} por ${b}?` });
}
async function onChoice(v, btn) {
  if (!B || B.state !== 'ask') return; B.state = 'wait'; clearInterval(B.timer);
  const { a, b, ans, k } = B.cur, f = fact(k); f.seen++;
  if (v === ans) {
    btn.classList.add('ok'); f.box = Math.min(5, f.box + 1); today().correct++; S.totalCorrect++; S.coins += 10; B.coins += 10; B.hits++; B.hp--; save(); renderHp();
    const fx = $('#slashfx'); fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    const bi = $('#boss-img'); bi.classList.remove('hit', 'attack'); void bi.offsetWidth; bi.classList.add('hit');
    const fi = $('#fighter-img'); fi.classList.remove('punch'); void fi.offsetWidth; fi.classList.add('punch');
    Audio.sfx(B.world.hitSfx); vibrate(40); const r = btn.getBoundingClientRect(); plus('+10 ฿', r.left + r.width / 2, r.top);
    if (B.hp <= 0) return winBattle();
    if (B.hits % 4 === 0) Audio.say('v_boss_hit'); else Audio.sfx('correct', .5);
    await sleep(750); askBattle();
  } else {
    if (btn) btn.classList.add('bad');
    $$('#choices button').forEach(x => { if (parseInt(x.textContent, 10) === ans) x.classList.add('ok'); });
    f.wrong++; f.box = Math.max(0, f.box - 2); B.hearts--; B.wrong.push(k); save(); renderHearts();
    const bi = $('#boss-img'); bi.classList.remove('hit', 'attack'); void bi.offsetWidth; bi.classList.add('attack');
    const sc = $('#s-battle'); sc.classList.add('shake-all'); setTimeout(() => sc.classList.remove('shake-all'), 450);
    Audio.sfx('wrong'); Audio.sfx('roar', .5); vibrate([80, 40, 80]);
    Audio.say(`a_${a}x${b}`, { text: `${a} por ${b}, ${ans}` });
    if (B.hearts <= 0) { await sleep(1000); return loseBattle(); }
    await sleep(1900); askBattle();
  }
}
async function winBattle() {
  // entrada solo por la PRIMERA victoria del día contra este jefe (AR-D1); las siguientes, 20 monedas
  const w = B.world, k = MK.dayKey(), first = (S.bossDay || (S.bossDay = {}))[w.id] !== k; S.bossDay[w.id] = k;
  S.bosses[w.id] = true; if (first) { S.coins += 150; S.tickets += 1; } else S.coins += 20; save();
  $('#boss-img').classList.add('dead'); Audio.sfx('win'); Audio.say('v_boss_win'); Confetti.burst(170); flash(); vibrate([100, 50, 100, 50, 200]);
  const coins = B.coins + (first ? 150 : 20), wrong = Array.from(new Set(B.wrong)); await sleep(1700); if (!B) return; B = null;
  const r8 = w.id === 'mha' ? markEight('jefe', 3) : null;
  showResult({ back: r8 ? 'eight' : undefined, img: w.win, title: '¡Jefe derrotado!', stars: 3, coins, bg: w.bg, sub: first ? `${w.boss.name} ha caído. +150 monedas y 1 entrada gratis para un minijuego.` : `${w.boss.name} ha caído otra vez. +20 monedas (la entrada era por la primera victoria de hoy).`, wrong, again: () => startBattle(w), againLabel: 'Otra batalla', confetti: false });
  if (r8) eightCelebrate(r8);
}
function loseBattle() {
  const w = B.world, coins = B.coins, hits = B.hits, wrong = Array.from(new Set(B.wrong)); B = null;
  Audio.sfx('lose'); Audio.say('v_boss_lose');
  showResult({ img: w.boss.img, round: true, title: '¡Casi!', stars: hits >= 6 ? 1 : 0, coins, bg: w.bg, sub: `${w.boss.name} se ha escapado con ${hits} golpes recibidos. Repasa estas y vuelve a por él.`, wrong, again: () => startBattle(w), againLabel: 'Revancha', back: w.id === 'mha' ? 'eight' : undefined });
}

// ---------- minijuegos ----------
let PLAY = null, playToken = 0;
function renderGames() {
  const el = $('#games-list'); el.innerHTML = '';
  $$('.coins-mirror').forEach(e => e.textContent = S.coins);
  GAMES.forEach(g => {
    const mod = window.MiniGames && window.MiniGames[g.id]; const w = WORLDS[g.world];
    const c = document.createElement('button'); c.className = `game-card g-${g.world}${mod ? '' : ' locked'}`;
    c.innerHTML = `<img src="${IMG(g.img)}" alt=""><div><b>${mod ? mod.title : 'Muy pronto'}</b><small>${g.desc}</small><small>${w.series} · récord: ${S.best[g.id] || 0}</small></div><span class="cost">${S.tickets ? '1 entrada' : GAME_COST + ' ฿'}</span>`;
    c.addEventListener('click', () => playGame(g)); el.appendChild(c);
  });
}
async function playGame(g) {
  const mod = window.MiniGames && window.MiniGames[g.id];
  if (!mod) return toast('Este juego aún no está listo');
  if (S.tickets > 0) S.tickets--; else if (S.coins >= GAME_COST) S.coins -= GAME_COST; else { Audio.sfx('wrong', .6); return toast(`Te faltan ${GAME_COST - S.coins} monedas. ¡A entrenar!`); }
  save(); const w = WORLDS[g.world]; setWorld(w); $('#play-title').textContent = mod.title;
  const area = $('#play-area'); area.innerHTML = ''; const box = document.createElement('div'); area.appendChild(box);
  show('play'); Audio.music(w.music, .18); Audio.say('v_minigame'); Audio.sfx('chest', .7);
  const token = ++playToken; await sleep(80); if (playToken !== token) return;
  const theme = { onepiece: { accent: '#E4002B', accent2: '#FFC72C', bg: '#0b1a33', text: '#fff' }, demonslayer: { accent: '#1E6F50', accent2: '#F4A6C8', bg: '#0f0f1a', text: '#fff' }, haikyuu: { accent: '#F26A1B', accent2: '#111', bg: '#1a1a1f', text: '#fff' } }[g.world];
  try {
    PLAY = mod.start(box, {
      durationMs: 80000, theme, vibrate, sfx: { play: n => Audio.sfx(n, .8) }, onScore: () => {},
      onEnd: res => {
        if (playToken !== token) return; PLAY = null; const score = (res && res.score) | 0, won = !!(res && res.won);
        const isBest = score > (S.best[g.id] || 0); S.best[g.id] = Math.max(S.best[g.id] || 0, score); const bonus = won ? 25 : 5; S.coins += bonus; save();
        Audio.sfx(won ? 'win' : 'coin'); toast(`${isBest && score > 0 ? '¡Nuevo récord! ' : ''}${score} puntos · +${bonus} monedas`, 2600);
        setTimeout(() => { if (playToken === token) { area.innerHTML = ''; goHome(); } }, 400);
      },
    });
  } catch (e) { toast('El juego ha fallado, te devuelvo las monedas'); S.coins += GAME_COST; save(); goHome(); }
}
function leavePlay() { playToken++; const p = PLAY; PLAY = null; try { p && p.stop && p.stop(); } catch (e) {} $('#play-area').innerHTML = ''; goHome(); }

// ---------- galería ----------
function galleryItems() {
  const bosses = Object.keys(S.bosses).length, t = today();
  const items = [
    { img: IMG('maria_onepiece'), cap: 'María del Sombrero de Paja', ok: true },
    { img: IMG('maria_demonslayer'), cap: 'María cazadora de demonios', ok: S.rounds >= 1, how: 'Termina 1 ronda' },
    { img: IMG('maria_haikyuu'), cap: 'María nº 8 de Karasuno', ok: S.bestStreak >= 10, how: '10 aciertos seguidos' },
    { img: IMG('win_onepiece'), cap: 'Fiesta en el barco', ok: !!S.bosses.onepiece, how: 'Derrota a Buggy' },
    { img: IMG('win_demonslayer'), cap: 'Noche de glicinias', ok: !!S.bosses.demonslayer, how: 'Derrota al Oni' },
    { img: IMG('win_haikyuu'), cap: 'Victoria de Karasuno', ok: !!S.bosses.haikyuu, how: 'Derrota a Kuroo' },
    { img: IMG('maria_mha'), cap: 'María de la Academia U.A.', ok: !!S.bosses.mha, how: 'Derrota a Gentle' },
    { img: IMG('win_mha'), cap: 'Heroína de la tabla del 8', ok: !!eightState().done, how: 'Completa la Misión del 8' },
  ];
  const rules = [
    { ok: S.rounds >= 1, how: 'Termina 1 ronda' }, { ok: bosses >= 1, how: 'Derrota a un jefe' }, { ok: bestExam() >= 7, how: 'Saca un 7 en el examen' },
    { ok: bestExam() >= 9, how: 'Saca un 9 en el examen' }, { ok: t.correct >= GOAL || S.goalDays > 0, how: `${GOAL} aciertos en un día` }, { ok: bosses >= 3, how: 'Derrota a los 3 jefes' },
  ];
  ((window.APP_CONFIG && window.APP_CONFIG.posters) || []).forEach((p, i) => { const r = rules[i % rules.length]; items.push({ img: p.src, cap: p.cap || 'María', ok: r.ok, how: r.how }); });
  return items;
}
function renderGallery() {
  const el = $('#gallery-list'); el.innerHTML = ''; const grid = document.createElement('div'); grid.className = 'gallery-grid';
  galleryItems().forEach(it => {
    const b = document.createElement('button'); b.className = 'gal' + (it.ok ? '' : ' locked');
    b.innerHTML = `<img src="${it.img}" alt="">${it.ok ? `<div class="cap">${it.cap}</div>` : `<div class="lock"><svg><use href="#i-lock"/></svg>${it.how}</div>`}`;
    b.addEventListener('click', () => { if (!it.ok) { Audio.sfx('pop', .5); return toast(`Para desbloquearlo: ${it.how}`); } Audio.sfx('chest', .6); $('#lightbox-img').src = it.img; $('#lightbox').classList.add('show'); });
    grid.appendChild(b);
  });
  el.appendChild(grid);
}

// ---------- navegación e inicio ----------
function go(id) {
  if (id === 'home') return goHome();
  if (id === 'pick') { renderPick(); return show('pick'); }
  if (id === 'worlds') { renderWorlds(); return show('worlds'); }
  if (id === 'exam') return startExam();
  if (id === 'games') { if (window.MK) return MK.Nav.arcade('tablas'); renderGames(); return show('games'); }
  if (id === 'gallery') { renderGallery(); return show('gallery'); }
  if (id === 'eight') return goEight();
  show(id);
}
function init() {
  $$('[data-go]').forEach(b => b.addEventListener('click', () => { Audio.sfx('whoosh', .35); go(b.dataset.go); }));
  $('#btn-start').addEventListener('click', () => {
    Audio.unlock(); SFX_PRELOAD.forEach(n => Audio.load(n)); Object.keys(WORLDS).forEach(w => Audio.load(WORLDS[w].music)); Audio.load('music_home');
    goHome(); setTimeout(() => Audio.say('v_intro'), 300);
  });
  $('#btn-sound').addEventListener('click', () => { S.sound = !Audio.on; Audio.setOn(S.sound); save(); renderHome(); if (S.sound) { Audio.unlock(); Audio.music('music_home', .3); Audio.sfx('ding'); } });
  $$('#keypad button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); onKey(b.dataset.k); }));
  document.addEventListener('keydown', e => { if (current !== 'quiz') return; if (/^[0-9]$/.test(e.key)) onKey(e.key); else if (e.key === 'Backspace') onKey('del'); else if (e.key === 'Enter') onKey('ok'); });
  $('#qcard').addEventListener('click', () => { if (Q && Q.cur) Audio.say(`q_${Q.cur.a}x${Q.cur.b}`, { text: `¿Cuánto es ${Q.cur.a} por ${Q.cur.b}?` }); });
  $('#quiz-back').addEventListener('click', () => { Q = null; Audio.stopVoice(); goHome(); });
  $('#battle-back').addEventListener('click', () => { if (B) clearInterval(B.timer); B = null; Audio.stopVoice(); renderWorlds(); show('worlds'); Audio.music('music_home', .3); });
  $('#play-back').addEventListener('click', leavePlay);
  $('#btn-worst').addEventListener('click', () => startTrain('worst'));
  $('#btn-mixed').addEventListener('click', () => startTrain('mixed'));
  $('#btn-table-train').addEventListener('click', () => startTrain(tableShown));
  $('#result-again').addEventListener('click', () => R.again && R.again());
  $('#result-back').addEventListener('click', () => { Audio.sfx('whoosh', .35); go(R.back || 'home'); });
  $('#btn-eight-see').addEventListener('click', () => showTable(8, 'eight'));
  $('#result-game').addEventListener('click', () => { if (window.MK) return MK.Nav.arcade('tablas'); renderGames(); show('games'); });
  $('#lightbox-close').addEventListener('click', () => $('#lightbox').classList.remove('show'));
  $('#lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) $('#lightbox').classList.remove('show'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) Audio.stopVoice(); });
  window.addEventListener('resize', () => { if (Confetti.cv) { Confetti.cv.width = innerWidth; Confetti.cv.height = innerHeight; } });
  renderHome();
}
document.addEventListener('DOMContentLoaded', init);
window.__tablas = { get S() { return S; }, startTrain, startExam, startBattle, startEight, eightQueue, examQueue, go, Audio };
})();
