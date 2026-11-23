/* INGLÉS — motor de la app (script plano, sin módulos). M14, 21-nov-2026: «Animals», «Animal parts», «Has got» y «Questions».
   Lo del examen va en INGLÉS (voz de Alice en cada palabra y cada frase); las instrucciones y los ánimos, en castellano.
   Cuatro tipos de ejercicio: card (mira y escucha) · choice (elige) · tiles (ordena letras o palabras) · write (escribe con el teclado de la app).
   Hucha, tiempo de estudio y premio del 10: los del kit común (MK.Wallet, MK.Time, MK.Prizes). */
(function () {
  'use strict';
  const { $, $$, sleep, pick, Wallet, Audio, UI, Nav, Confetti } = MK;
  const shuffle = a => MK.shuffle(a.slice());
  Audio.dirs = [{ dir: 'assets/audio/', test: /^(w|s|q|i|qi|a)_/ }, { dir: '../ciencias/assets/audio/', test: /^(l|j)_/ }, { dir: '../tablas/assets/audio/', test: /^music_(onepiece|demonslayer|haikyuu)$/ }, MK.ROOT + 'shared/audio/'];
  const GOAL = 40;
  const REWARD = { choice: 10, tiles: 15, write: 20 };
  const { S, save } = MK.store('ingles_v1', () => ({ k: {}, best: {}, rounds: 0, bestStreak: 0, exams: [], today: { date: '', correct: 0 }, totalCorrect: 0, jokesSeen: [] }));
  const W = EN.worlds, ORDER = EN.WORLD_ORDER;
  const JOKES = (window.CS && CS.jokes) || [];
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const kst = k => S.k[k] || (S.k[k] = { ok: 0, bad: 0, last: 0 });
  const score = k => { const s = S.k[k]; return s ? s.ok - 2 * s.bad : -1; };
  const weakest = (list, keyOf, n) => shuffle(list).sort((a, b) => score(keyOf(a)) - score(keyOf(b))).slice(0, n);
  function today() { const d = MK.dayKey(); if (S.today.date !== d) S.today = { date: d, correct: 0 }; return S.today; }
  const say = (name, text) => (name ? Audio.say(name, { text: text || '' }) : Promise.resolve());   // frases en castellano del kit
  const sayEn = name => (name ? Audio.say(name, { text: '' }) : Promise.resolve());                 // inglés: sin voz de respaldo (leería en español)
  const OK_LINES = ['v_ok1', 'v_ok2', 'v_ok3', 'v_ok4', 'v_ok5', 'v_ok6', 'v_ok7'], WRONG_LINES = ['v_wrong1', 'v_wrong2', 'v_wrong3'];
  const OK_TXT = ['¡Genial!', '¡Increíble!', MK.Name.g('¡Eres una crack!', '¡Qué crack!'), '¡Perfecto!', '¡Así se hace!', '¡Toma ya!', '¡Muy bien!'];
  const starsSvg = (n, max) => Array.from({ length: max || 3 }, (_, i) => `<svg class="${i < n ? 'on' : ''}"><use href="#i-star"/></svg>`).join('');
  const norm = t => String(t || '').toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?¿¡]/g, ' ').replace(/\s+/g, ' ').trim();

  // ---------- fabricar ejercicios: cada uno lleva su solución (sol) y su castellano (sol_es) ----------
  const others = (x, n) => shuffle(EN.WORDS.filter(o => o.world === x.world && o.id !== x.id)).slice(0, n);
  const gapQ = f => `A ${f.a.w} <span class="gap cur">&nbsp;</span> ${f.p.art}.`;
  const M = {
    card: x => ({ kind: 'card', w: x.world, title: cap(x.w), es: x.es, pics: [x.img], voice: ['w_' + x.id] }),
    // vocabulario
    pw: x => { const o = shuffle([x, ...others(x, 3)]); return { kind: 'choice', w: x.world, label: 'Elige su nombre', pics: [x.img], options: o.map(v => ({ t: cap(v.w), es: v.es })), a: o.indexOf(x), after: ['w_' + x.id], sol: cap(x.w), sol_es: x.es, key: 'pw_' + x.id }; },
    lp: x => { const o = shuffle([x, ...others(x, 3)]); return { kind: 'choice', w: x.world, label: 'Escucha y toca el dibujo', listen: true, voice: ['w_' + x.id], reveal: cap(x.w), optPics: true, options: o.map(v => ({ img: v.img })), a: o.indexOf(x), sol: cap(x.w), sol_es: x.es, key: 'lp_' + x.id }; },
    sp: x => ({ kind: 'tiles', w: x.world, label: 'Ordena las letras', pics: [x.img], target: x.w.split(''), extra: [], join: '', voice: ['w_' + x.id], after: ['w_' + x.id], sol: cap(x.w), sol_es: x.es, key: 'sp_' + x.id }),
    wr: x => ({ kind: 'write', w: x.world, label: 'Escribe su nombre', pics: [x.img], answer: x.w, after: ['w_' + x.id], sol: cap(x.w), sol_es: x.es, key: 'wr_' + x.id }),
    // has got
    hg: f => ({ kind: 'choice', w: 'hasgot', label: '¿Has got o hasn\'t got?', pics: [f.a.img, f.p.img], q: gapQ(f), es: EN.stmt_es(f), options: [{ t: 'has got', es: 'tiene' }, { t: "hasn't got", es: 'no tiene' }], a: f.yes ? 0 : 1, two: true, after: ['s_' + f.id], sol: EN.stmt(f), sol_es: EN.stmt_es(f), key: 'hg_' + f.id }),
    tf: (f, shown) => ({ kind: 'choice', w: 'hasgot', label: 'True or false?', pics: [f.a.img, f.p.img], q: EN.stmt(f, shown), es: EN.stmt_es(f, shown), options: [{ t: 'True', es: 'Verdadero' }, { t: 'False', es: 'Falso' }], a: shown === f.yes ? 0 : 1, two: true, after: ['s_' + f.id], sol: EN.stmt(f), sol_es: EN.stmt_es(f), key: 'tf_' + f.id + (shown ? '_y' : '_n') }),
    sf: f => ({ kind: 'tiles', w: 'hasgot', label: 'Dilo en corto con «It»', pics: [f.a.img, f.p.img], q: EN.stmt(f), es: EN.stmt_es(f), target: (f.yes ? ["it's", 'got'] : ['it', "hasn't", 'got']).concat(f.p.art.split(' ')), extra: f.yes ? ['it', "hasn't"] : ["it's", 'has'], join: ' ', end: '.', after: ['i_' + f.p.id + (f.yes ? '_y' : '_n')], sol: EN.short(f.p, f.yes), sol_es: EN.short_es(f.p, f.yes), key: 'sf_' + f.id }),
    bs: f => ({ kind: 'tiles', w: 'hasgot', label: 'Ordena la frase', pics: [f.a.img, f.p.img], mark: f.yes ? '✔' : '✘', target: ['a', f.a.w, f.yes ? 'has' : "hasn't", 'got'].concat(f.p.art.split(' ')), extra: [f.yes ? "hasn't" : 'has'], join: ' ', end: '.', after: ['s_' + f.id], sol: EN.stmt(f), sol_es: EN.stmt_es(f), key: 'bs_' + f.id }),
    wh: f => ({ kind: 'write', w: 'hasgot', label: 'Escribe: has got o hasn\'t got', pics: [f.a.img, f.p.img], q: gapQ(f), es: EN.stmt_es(f), answer: EN.HG(f.yes), after: ['s_' + f.id], sol: EN.stmt(f), sol_es: EN.stmt_es(f), key: 'wh_' + f.id }),
    // preguntas
    qa: (f, it) => ({ kind: 'choice', w: 'questions', label: 'Contesta', pics: [f.a.img], q: it ? EN.questIt(f.p) : EN.quest(f), es: it ? EN.questIt_es(f.p) : EN.quest_es(f), voice: [it ? 'qi_' + f.p.id : 'q_' + f.id], options: [{ t: EN.ans(true), es: EN.ans_es(true) }, { t: EN.ans(false), es: EN.ans_es(false) }], a: f.yes ? 0 : 1, two: true, after: [f.yes ? 'a_yes' : 'a_no'], sol: (it ? EN.questIt(f.p) : EN.quest(f)) + ' ' + EN.ans(f.yes), sol_es: EN.quest_es(f) + ' ' + EN.ans_es(f.yes), key: (it ? 'qi_' : 'qa_') + f.id }),
    ql: f => ({ kind: 'choice', w: 'questions', label: 'Escucha y contesta', listen: true, voice: ['q_' + f.id], reveal: EN.quest(f), es: EN.quest_es(f), options: [{ t: EN.ans(true), es: EN.ans_es(true) }, { t: EN.ans(false), es: EN.ans_es(false) }], a: f.yes ? 0 : 1, two: true, after: [f.yes ? 'a_yes' : 'a_no'], sol: EN.quest(f) + ' ' + EN.ans(f.yes), sol_es: EN.quest_es(f) + ' ' + EN.ans_es(f.yes), key: 'ql_' + f.id }),
    qb: f => ({ kind: 'tiles', w: 'questions', label: 'Ordena la pregunta', pics: [f.a.img, f.p.img], mark: '?', target: ['has', 'a', f.a.w, 'got'].concat(f.p.art.split(' ')), extra: ['it'], join: ' ', end: '?', after: ['q_' + f.id], sol: EN.quest(f), sol_es: EN.quest_es(f), key: 'qb_' + f.id }),
    qw: f => ({ kind: 'write', w: 'questions', label: 'Escribe la respuesta corta', pics: [f.a.img], q: EN.quest(f), es: EN.quest_es(f), voice: ['q_' + f.id], answer: EN.ans(f.yes), after: [f.yes ? 'a_yes' : 'a_no'], sol: EN.quest(f) + ' ' + EN.ans(f.yes), sol_es: EN.quest_es(f) + ' ' + EN.ans_es(f.yes), key: 'qw_' + f.id }),
  };
  // las tarjetas de «Has got» y «Questions»: las frases de la hoja, tal cual
  const F = id => EN.fact(id), P = id => EN.word(id);
  const CARDS = {
    hasgot: () => [
      { kind: 'card', w: 'hasgot', title: 'A snake <b>has got</b> scales.', es: 'Una serpiente tiene escamas.', note: '<b>has got</b> = tiene', pics: [P('snake').img, P('scales').img], mark: '✔', voice: ['s_snake_scales'] },
      { kind: 'card', w: 'hasgot', title: 'It<b>\'s got</b> scales.', es: 'Tiene escamas.', note: 'Con <b>It</b> se junta: <b>It\'s got</b>', pics: [P('snake').img, P('scales').img], mark: '✔', voice: ['i_scales_y'] },
      { kind: 'card', w: 'hasgot', title: 'A bird <b>hasn\'t got</b> fur.', es: 'Un pájaro no tiene pelo.', note: '<b>hasn\'t got</b> = no tiene', pics: [P('bird').img, P('fur').img], mark: '✘', voice: ['s_bird_fur'] },
      { kind: 'card', w: 'hasgot', title: 'It <b>hasn\'t got</b> fur.', es: 'No tiene pelo.', note: 'Con <b>It</b>: <b>It hasn\'t got</b>', pics: [P('bird').img, P('fur').img], mark: '✘', voice: ['i_fur_n'] },
    ],
    questions: () => [
      { kind: 'card', w: 'questions', title: '<b>Has</b> a snake <b>got</b> scales?', es: '¿Una serpiente tiene escamas?', note: '<b>Yes, it has.</b>', pics: [P('snake').img, P('scales').img], mark: '✔', voice: ['q_snake_scales', 'a_yes'] },
      { kind: 'card', w: 'questions', title: '<b>Has</b> a bird <b>got</b> teeth?', es: '¿Un pájaro tiene dientes?', note: '<b>No, it hasn\'t.</b>', pics: [P('bird').img, P('teeth').img], mark: '✘', voice: ['q_bird_teeth', 'a_no'] },
      { kind: 'card', w: 'questions', title: '<b>Has</b> a parrot <b>got</b> feathers?', es: '¿Un loro tiene plumas?', note: '<b>Yes, it has.</b>', pics: [P('parrot').img, P('feathers').img], mark: '✔', voice: ['q_parrot_feathers', 'a_yes'] },
      { kind: 'card', w: 'questions', title: '<b>Has it got</b> scales?', es: '¿Tiene escamas? (el loro)', note: '<b>No, it hasn\'t.</b>', pics: [P('parrot').img, P('scales').img], mark: '✘', voice: ['qi_scales', 'a_no'] },
    ],
  };
  // n hechos, mitad «sí» y mitad «no», primero los que peor van en ese tipo de ejercicio
  function facts(n, pre) {
    const y = weakest(EN.FACTS.filter(f => f.yes), f => pre + f.id, Math.ceil(n / 2)), no = weakest(EN.FACTS.filter(f => !f.yes), f => pre + f.id, Math.floor(n / 2));
    return shuffle(y.concat(no));
  }
  const words = (w, n, pre) => weakest(EN.WORDS.filter(x => x.world === w), x => pre + x.id, n);
  const VOCAB = [
    { id: 'learn', name: 'Aprender', sub: 'Mira y escucha', cls: 'm-learn', emoji: '📖', items: w => { const xs = words(w, 6, 'pw_'); return xs.map(M.card).concat(shuffle(xs).map(M.pw)); } },
    { id: 'pw', name: '¿Qué es?', sub: 'Elige su nombre', cls: 'm-test', emoji: '🖼️', items: w => words(w, 8, 'pw_').map(M.pw) },
    { id: 'lp', name: 'Escucha', sub: 'Oye y toca el dibujo', cls: 'm-listen', emoji: '🎧', items: w => words(w, 8, 'lp_').map(M.lp) },
    { id: 'sp', name: 'Letras', sub: 'Ordena las letras', cls: 'm-label', emoji: '🔤', items: w => words(w, 6, 'sp_').map(M.sp) },
    { id: 'wr', name: 'Escribe', sub: 'Como en el examen', cls: 'm-write', emoji: '✍️', items: w => words(w, 6, 'wr_').map(M.wr) },
    { id: 'review', name: 'Repaso', sub: 'Todas las palabras', cls: 'm-review', emoji: '📚', items: w => EN.WORDS.filter(x => x.world === w).map(M.card) },
  ];
  const MODES = {
    animals: VOCAB, parts: VOCAB,
    hasgot: [
      { id: 'learn', name: 'Aprender', sub: 'Las frases de la ficha', cls: 'm-learn', emoji: '📖', items: () => CARDS.hasgot().concat(facts(4, 'hg_').map(M.hg)) },
      { id: 'hg', name: 'Elige', sub: 'has got / hasn\'t got', cls: 'm-test', emoji: '✅', items: () => facts(8, 'hg_').map(M.hg) },
      { id: 'tf', name: 'True/False', sub: 'Verdadero o falso', cls: 'm-forms', emoji: '⚖️', items: () => facts(8, 'tf_').map((f, i) => M.tf(f, i % 2 ? f.yes : !f.yes)).sort(() => Math.random() - .5) },
      { id: 'sf', name: 'En corto', sub: 'It\'s got · It hasn\'t got', cls: 'm-label', emoji: '✂️', items: () => facts(6, 'sf_').map(M.sf) },
      { id: 'bs', name: 'Ordena', sub: 'La frase, palabra a palabra', cls: 'm-reto', emoji: '🧩', items: () => facts(6, 'bs_').map(M.bs) },
      { id: 'wh', name: 'Escribe', sub: 'Como en el examen', cls: 'm-write', emoji: '✍️', items: () => facts(6, 'wh_').map(M.wh) },
    ],
    questions: [
      { id: 'learn', name: 'Aprender', sub: 'Pregunta y respuesta', cls: 'm-learn', emoji: '📖', items: () => CARDS.questions().concat(facts(4, 'qa_').map(f => M.qa(f))) },
      { id: 'qa', name: 'Contesta', sub: 'Yes, it has / No, it hasn\'t', cls: 'm-test', emoji: '💬', items: () => facts(8, 'qa_').map((f, i) => M.qa(f, i % 4 === 3)) },
      { id: 'ql', name: 'Escucha', sub: 'Oye la pregunta', cls: 'm-listen', emoji: '🎧', items: () => facts(6, 'ql_').map(M.ql) },
      { id: 'qb', name: 'Ordena', sub: 'La pregunta: Has … got …?', cls: 'm-reto', emoji: '🧩', items: () => facts(6, 'qb_').map(M.qb) },
      { id: 'qw', name: 'Escribe', sub: 'La respuesta corta', cls: 'm-write', emoji: '✍️', items: () => facts(6, 'qw_').map(M.qw) },
    ],
  };
  const modeOf = (w, id) => MODES[w].find(m => m.id === id);
  const modeItems = (id, w) => { const m = modeOf(w, id); return m ? m.items(w) : null; };
  const scored = w => MODES[w].filter(m => m.id !== 'learn' && m.id !== 'review');
  function worldPct(w) { const ms = scored(w); return Math.round(ms.reduce((a, m) => a + (S.best[w + '_' + m.id] || 0), 0) / ms.length); }
  function worldStars(w) { const p = worldPct(w); return p >= 85 ? 3 : p >= 55 ? 2 : p >= 25 ? 1 : 0; }
  // de menos a más difícil, como un examen del cole: escribir palabras, escuchar, has got, ordenar y preguntas
  function examItems() {
    const an = shuffle(EN.ANIMALS), fy = shuffle(EN.FACTS.filter(f => f.yes)), fn = shuffle(EN.FACTS.filter(f => !f.yes));
    return [M.wr(an[0]), M.wr(an[1]), M.wr(pick(EN.PARTS)), M.lp(an[2]), M.hg(fy[0]), M.hg(fn[0]), M.bs(pick([fy[1], fn[1]])), M.qa(fy[2]), M.qa(fn[2]), M.qw(pick([fy[3], fn[3]]))];
  }
  // rehacer un ejercicio a partir de su clave (para «Lo que más fallo»)
  function fromKey(k) {
    const m = k.match(/^([a-z]+)_(.+?)(_[yn])?$/); if (!m || !M[m[1] === 'qi' ? 'qa' : m[1]]) return null;
    const t = m[1], x = EN.word(m[2]), f = EN.fact(m[2]);
    if (['pw', 'lp', 'sp', 'wr'].includes(t)) return x ? M[t](x) : null;
    if (!f) return null;
    if (t === 'tf') return M.tf(f, m[3] === '_y'); if (t === 'qi') return M.qa(f, true);
    return M[t](f);
  }
  function worstItems() {
    const bad = Object.keys(S.k).filter(k => S.k[k].bad > S.k[k].ok).sort((a, b) => score(a) - score(b));
    const items = bad.map(fromKey).filter(Boolean).slice(0, 8);
    // si falla poco, se completa con lo más exigente que aún no ha hecho bien: escribir palabras y frases
    if (items.length < 6) weakest(EN.WORDS, x => 'wr_' + x.id, 6 - items.length).forEach(x => { if (!items.some(i => i.key === 'wr_' + x.id)) items.push(M.wr(x)); });
    if (items.length < 8) facts(2, 'wh_').forEach(f => items.push(M.wh(f)));
    return shuffle(items);
  }

  // ---------- pantallas ----------
  function show(id) { UI.show(id); MK.Time.studying(id === 'quiz'); }   // cuenta como estudio real (AR-D1)
  function goHome() { UI.setWorld('mha'); renderHome(); show('home'); Audio.music('music_mha', .22); }
  $$('[data-go]').forEach(b => b.addEventListener('click', () => (b.dataset.go === 'home' ? goHome() : show(b.dataset.go))));
  function renderHome() {
    const t = today(); $('#goal-ring').style.setProperty('--p', Math.min(100, t.correct / GOAL * 100)); $('#goal-txt').textContent = t.correct;
    $('#hello-sub').textContent = t.correct >= GOAL ? '¡Objetivo de hoy conseguido! Sigue si quieres.' : `Objetivo de hoy: ${GOAL} aciertos · llevas ${t.correct}`;
    const el = $('#worlds'); el.innerHTML = '';
    ORDER.forEach((w, i) => {
      const world = W[w], pct = worldPct(w), col = (window.MK_SERIES && MK_SERIES[world.series] || {}).color || '#4f7cff';
      const b = document.createElement('button'); b.className = 'world-card'; b.style.setProperty('--wc', col);
      b.innerHTML = `<img src="${world.heroImg}" alt=""><div><h3>${world.title}</h3><p>Paso ${i + 1} · ${world.title_es} · con ${world.heroName}</p><div class="bar"><i style="width:${pct}%"></i></div></div><span class="stars">${starsSvg(worldStars(w))}</span><span class="badge">${world.badge}</span>`;
      b.addEventListener('click', () => openWorld(w)); el.appendChild(b);
    });
    UI.stagger(el);
    $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute');
    Wallet.render(); MK.Time.render();
  }
  let curWorld = null;
  function openWorld(w) {
    curWorld = w; const world = W[w];
    UI.setWorld(world.series); $('#world-bg').style.backgroundImage = `url(${world.bg})`;
    $('#world-title').textContent = world.title; $('#world-hero').src = world.heroImg;
    const pct = worldPct(w), ms = scored(w), done = ms.filter(m => (S.best[w + '_' + m.id] || 0) >= 80).length;
    $('#world-stars').innerHTML = starsSvg(worldStars(w)); $('#world-bar').style.width = pct + '%';
    $('#world-sub').textContent = `${world.title_es} · ${done} de ${ms.length} ejercicios superados`;
    $('#world-bubble').textContent = pct >= 85 ? '¡Este paso es tuyo!' : pct >= 40 ? '¡Vas muy bien! Sigue' : world.hi;
    const el = $('#modes'); el.innerHTML = '';
    MODES[w].forEach(m => {
      const b = document.createElement('button'); b.className = `tile ${m.cls}`; const p = S.best[w + '_' + m.id];
      b.innerHTML = `${p != null ? `<span class="t-prog">${p >= 80 ? '✓ ' : ''}${p} %</span>` : ''}<span class="t-emoji">${m.emoji}</span><b>${m.name}</b><small>${m.sub}</small>`;
      b.addEventListener('click', () => startMode(w, m.id)); el.appendChild(b);
    });
    UI.stagger(el);
    show('world'); Audio.music(world.music, .22);
  }
  const FICHAS = [{ src: 'assets/fichas/ficha1.webp', name: 'La ficha del cole' }];
  function openFicha() { MK.Ficha.open(FICHAS, 0); }
  $('#btn-ficha').addEventListener('click', openFicha);
  function startMode(w, id) { const m = modeOf(w, id); startQuiz(m.items(w), { mode: id, world: w, title: m.name }); }
  function startExam() { startQuiz(examItems(), { mode: 'exam', exam: true, title: 'Examen de prueba', voice: 'v_exam_start', text: 'Examen de prueba. Tranquila, lo tienes.' }); }
  function startWorst() { startQuiz(worstItems(), { mode: 'worst', title: 'Lo que más fallo' }); }

  // ---------- el cuestionario (todos los modos) ----------
  let Q = null, streak = 0, typing = null;
  const live = it => Q && Q.items[Q.i] === it;
  function startQuiz(items, o) {
    Q = { items, i: 0, results: [], correct: 0, mode: o.mode, world: o.world || null, exam: !!o.exam, title: o.title };
    streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
    const w = Q.world ? W[Q.world] : null;
    UI.setWorld(w ? w.series : 'mha'); $('#quiz-bg').style.backgroundImage = `url(${w ? w.bg : '../ciencias/assets/img/bg_mha.webp'})`;
    $('#mascot-img').src = w ? w.heroImg : '../shared/img/st_deku.webp'; $('#mascot-name').textContent = w ? w.heroName : 'Deku';
    $('#quiz-ficha').classList.toggle('hidden', Q.exam); show('quiz'); Audio.music(w ? w.music : 'music_mha', .2);
    UI.bubble($('#bubble'), o.title || '¡Vamos!');
    if (o.voice) say(o.voice, o.text);
    setTimeout(nextItem, o.voice ? 900 : 0);
  }
  function renderProgress() { if (!Q) return; $('#quiz-progress').innerHTML = Q.items.map((_, i) => `<i class="${Q.results[i] || ''}${i === Q.i ? ' cur' : ''}"></i>`).join(''); }
  async function sayList(it, list) { for (const n of list || []) { if (!live(it)) return; await sayEn(n); if (list.length > 1) await sleep(300); } }
  function nextItem() {
    if (!Q) return;
    typing = null;
    if (Q.i >= Q.items.length) return endRound();
    const it = Q.items[Q.i];
    // cada 4 ejercicios, un personaje cuenta un chiste (MA-D8); nunca en el examen
    if (JOKES.length && !Q.exam && Q.i > 0 && Q.i % 4 === 0 && it.kind !== 'card' && !(Q.jokeDone = Q.jokeDone || {})[Q.i]) {
      Q.jokeDone[Q.i] = true; const q = Q; return tellJoke(Q.world).then(() => { if (Q === q) nextItem(); });
    }
    renderProgress();
    const area = $('#q-area'); area.innerHTML = ''; $('#q-actions').innerHTML = '';
    area.style.animation = 'none'; void area.offsetWidth; area.style.animation = '';
    const body = $('.quiz-body'); body.classList.remove('es-on'); $('#quiz-es').classList.toggle('hidden', !!Q.exam);
    RENDER[it.kind](it);
    const snd = $('#en-snd'); if (snd) snd.addEventListener('click', () => { Audio.stopVoice(); sayList(it, it.voice); });
    // el dibujo suena al tocarlo (menos donde oírlo sería la respuesta)
    if (it.voice && it.voice.length) setTimeout(() => { if (live(it)) sayList(it, it.voice); }, 350);
    body.scrollTop = 0;
  }
  async function answer(ok, it, o) {
    o = o || {}; if (!Q) return;
    Q.results[Q.i] = ok ? 'ok' : 'bad';
    if (it.key) { const s = kst(it.key); ok ? s.ok++ : s.bad++; s.last = Date.now(); }
    if (ok) {
      Q.correct++; streak++; S.bestStreak = Math.max(S.bestStreak, streak); today().correct++; S.totalCorrect++;
      const r = (REWARD[it.kind] || 10) + (streak >= 3 ? 5 : 0); Wallet.add(r, 'ingles ' + it.kind); UI.plus('+' + r, innerWidth - 64, 110);
      Audio.sfx('correct', .8); MK.vibrate(30); UI.react($('#mascot-img'), 'jump'); UI.bubble($('#bubble'), pick(OK_TXT));
      if (streak === 5) say('v_combo5'); else if (streak === 10) { say('v_combo10'); Confetti.burst(100); }
      $('#streak').textContent = streak; if (streak >= 3) $('#streak-pill').classList.add('hot');
    } else {
      streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
      Audio.sfx('wrong', .6); MK.vibrate([40, 30, 40]); UI.react($('#mascot-img'), 'sad'); UI.bubble($('#bubble'), o.bubble || 'Casi… fíjate');
    }
    if (!Q.exam) $('.quiz-body').classList.add('es-on');   // después de contestar, el castellano confirma lo que significaba
    save(); renderProgress();
  }
  function continueBtn(label) {
    return new Promise(res => { const b = document.createElement('button'); b.className = 'btn btn-accent btn-xl'; b.textContent = label || 'Seguir'; b.addEventListener('click', () => { b.disabled = true; res(); }); $('#q-actions').appendChild(b); });
  }
  async function advance(ms) { const q = Q; await sleep(ms || 0); if (Q !== q) return; Audio.stopVoice(); Q.i++; nextItem(); }
  // después de contestar: se enseña la solución, suena en inglés y se sigue (si falló, con botón, para que la lea)
  async function finish(ok, it, o) {
    await answer(ok, it, o);
    if (!ok || o && o.why) { const d = document.createElement('div'); d.className = 'q-why'; d.innerHTML = `${ok ? '' : '✔ '}<b>${it.sol}</b>${o && o.tip ? `<br>${o.tip}` : ''}${Q && !Q.exam && it.sol_es && !it.es ? `<br><span class="es">${it.sol_es}</span>` : ''}`; const qc = $('.qcard', $('#q-area')); if (qc) qc.after(d); else $('#q-area').appendChild(d); }
    const q = Q; if (!q) return;
    if (ok) { await Promise.race([sayList(it, it.after), sleep(4500)]); if (Q === q && live(it)) advance(450); }
    else { sayList(it, it.after); await continueBtn('Seguir'); if (Q === q && live(it)) advance(0); }
  }
  function picsHtml(it, extra) {
    if (!it.pics || !it.pics.length) return '';
    const m = it.mark ? `<span class="en-mark ${it.mark === '✔' ? 'y' : it.mark === '✘' ? 'n' : 'q'}">${it.mark}</span>` : '';
    return `<div class="en-pics n${it.pics.length} ${extra || ''}">${it.pics.map((p, i) => `<img src="${p}" alt="">${i === 0 && it.pics.length > 1 ? m : ''}`).join('')}${it.pics.length === 1 ? m : ''}</div>`;
  }
  const SND = '<button class="en-snd" id="en-snd" aria-label="Oír otra vez">🔊</button>';
  const headHtml = it => `<div class="qkind">${it.label || ''}</div><div class="qcard en-q">${picsHtml(it)}${it.listen ? `<button class="en-snd big" id="en-snd" aria-label="Oír otra vez">🔊</button><div class="qtext hidden" id="en-reveal">${it.reveal || ''}</div>` : (it.q ? `<div class="qtext">${it.q}</div>` : '')}${it.es ? `<div class="qes">${it.es}</div>` : ''}${!it.listen && it.voice ? SND : ''}</div>`;

  const RENDER = {
    card(it) {
      const cards = Q.items.filter(x => x.kind === 'card'), n = cards.indexOf(it);
      $('#q-area').innerHTML = `<div class="qkind">Mira y escucha · ${n + 1} de ${cards.length}</div><div class="qcard teach en-card"><div class="period">${cards.slice(0, 10).map((_, i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>${picsHtml(it, 't-scene')}<div class="t-name">${it.title}</div>${it.note ? `<div class="t-def">${it.note}</div>` : ''}<div class="t-es">${it.es}</div>${SND}</div>`;
      UI.bubble($('#bubble'), 'Escucha y repite en voz alta');
      const row = document.createElement('div'); row.className = 'q-pair'; $('#q-actions').appendChild(row);
      const btn = (t, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = t; b.addEventListener('click', () => { b.disabled = true; fn(); }); row.appendChild(b); };
      if (Q.i > 0 && Q.items[Q.i - 1].kind === 'card') btn('Anterior', 'btn btn-ghost btn-prev', () => { Audio.stopVoice(); Q.i--; nextItem(); });
      btn(Q.mode === 'review' && Q.i === Q.items.length - 1 ? 'Terminar' : 'Siguiente', 'btn btn-accent btn-xl', () => advance(0));
      const pics = $('.en-pics', $('#q-area')); if (pics) pics.addEventListener('click', () => { Audio.stopVoice(); sayList(it, it.voice); });
    },
    choice(it) {
      const area = $('#q-area');
      area.innerHTML = headHtml(it) + `<div class="choices${it.optPics ? ' en-opics' : ''}${it.two ? ' en-two' : ''}" id="choices"></div>`;
      const box = $('#choices'); let done = false;
      it.options.forEach((o, i) => {
        const b = document.createElement('button'); b.className = 'choice';
        b.innerHTML = o.img ? `<img src="${o.img}" alt="">` : `<span>${o.t}</span>${o.es ? `<small>${o.es}</small>` : ''}`;
        b.addEventListener('click', () => {
          if (done) return; done = true; const ok = i === it.a;
          $$('.choice', box).forEach((c, j) => { if (j === it.a) c.classList.add('ok'); else if (j === i) c.classList.add('bad'); else c.classList.add('dim'); });
          const rv = $('#en-reveal'); if (rv) rv.classList.remove('hidden');
          const g = $('.gap', area); if (g) { g.textContent = it.options[it.a].t; g.classList.remove('cur'); g.classList.add('ok'); }
          Audio.stopVoice(); finish(ok, it);
        });
        box.appendChild(b);
      });
    },
    // ordenar letras (una palabra) o palabras (una frase): se toca la ficha que va en el hueco que late
    tiles(it) {
      const area = $('#q-area'), letters = it.join === '';
      area.innerHTML = headHtml(it) + `<div class="chips en-build"><div class="en-slots${letters ? ' letters' : ''}" id="slots">${it.target.map(() => '<span class="en-slot"></span>').join('')}${it.end ? `<span class="en-end">${it.end}</span>` : ''}</div><div class="en-bank" id="bank"></div></div>`;
      const slots = Array.from($$('.en-slot', area)), bank = $('#bank'); let cur = 0, errors = 0, done = false;
      const mark = () => slots.forEach((s, i) => s.classList.toggle('cur', i === cur && !done));
      let pool = shuffle(it.target.concat(it.extra || []));
      for (let t = 0; t < 6 && pool.slice(0, it.target.length).join('|') === it.target.join('|'); t++) pool = shuffle(pool);
      pool.forEach(w => {
        const b = document.createElement('button'); b.className = 'chipbtn en-tile'; b.innerHTML = `<span>${w}</span>`;
        b.addEventListener('click', () => {
          if (done || b.classList.contains('used')) return;
          if (w === it.target[cur]) {
            const s = slots[cur]; s.textContent = cur === 0 && !letters ? cap(w) : w; s.classList.add('ok'); b.classList.add('used'); Audio.sfx('snap', .7); MK.vibrate(20); cur++;
            if (cur === it.target.length) { done = true; mark(); const ok = Q.exam ? errors === 0 : errors <= 1; finish(ok, it, { why: !ok, bubble: 'Bien colocada, pero con fallos' }); return; }
            mark();
          } else { errors++; b.classList.add('bad'); Audio.sfx('wrong', .5); MK.vibrate(40); setTimeout(() => b.classList.remove('bad'), 350); UI.bubble($('#bubble'), letters ? 'Esa letra no va ahí' : 'Esa palabra no va ahí'); }
        });
        bank.appendChild(b);
      });
      mark();
    },
    // escribir con el teclado de la app: sin corrector ni palabras sugeridas, y sin que el teclado de la tablet tape la pantalla
    write(it) {
      const area = $('#q-area');
      area.innerHTML = headHtml(it) + `<div class="chips en-kb"><div class="en-typed" id="typed"><span id="typed-t"></span><i class="caret"></i></div><div class="en-keys" id="keys"></div></div>`;
      const out = $('#typed-t'), box = $('#typed'); let val = '', done = false;
      const paint = () => { out.textContent = val; const g = $('.gap', area); if (g) g.textContent = val || ' '; };
      const press = k => {
        if (done) return;
        if (k === '⌫') val = val.slice(0, -1); else if (k === '␣') { if (val && !val.endsWith(' ')) val += ' '; } else if (val.length < 22) val += k;
        Audio.sfx('pop', .3); paint();
      };
      const check = () => {
        if (done || !norm(val)) { if (!done) UI.bubble($('#bubble'), 'Escribe primero'); return; }
        done = true; typing = null; const a = norm(val), b = norm(it.answer), ok = a === b, casi = !ok && a.replace(/'/g, '') === b.replace(/'/g, '');
        box.classList.add(ok ? 'ok' : 'bad'); const g = $('.gap', area); if (g) { g.textContent = it.answer; g.classList.remove('cur'); g.classList.add('ok'); }
        $('#q-actions').innerHTML = '';
        $('#keys').classList.add('hidden'); finish(ok, it, { why: !ok, tip: ok ? '' : casi ? 'Casi: te falta el apóstrofo <b>\'</b>' : `Tú has escrito: «${val.trim()}»`, bubble: casi ? '¡Ojo con el apóstrofo!' : 'Casi… mira cómo se escribe' });
      };
      ['qwertyuiop', 'asdfghjkl', "zxcvbnm'"].forEach((row, r) => {
        const d = document.createElement('div'); d.className = 'en-krow';
        row.split('').concat(r === 2 ? ['⌫'] : []).forEach(k => { const b = document.createElement('button'); b.className = 'en-key' + (k === '⌫' ? ' wide' : k === "'" ? ' apos' : ''); b.textContent = k === "'" ? '’' : k; b.addEventListener('click', () => press(k)); d.appendChild(b); });
        $('#keys').appendChild(d);
      });
      const d = document.createElement('div'); d.className = 'en-krow';
      const sp = document.createElement('button'); sp.className = 'en-key space'; sp.textContent = 'espacio'; sp.addEventListener('click', () => press('␣')); d.appendChild(sp); $('#keys').appendChild(d);
      const ok = document.createElement('button'); ok.className = 'btn btn-accent btn-xl'; ok.id = 'en-check'; ok.textContent = 'Comprobar'; ok.addEventListener('click', check); $('#q-actions').appendChild(ok);
      typing = { press, check }; paint();
    },
  };
  // con teclado de verdad (portátil) también se puede escribir
  document.addEventListener('keydown', ev => {
    if (!typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'Backspace') { typing.press('⌫'); ev.preventDefault(); } else if (ev.key === 'Enter') typing.check(); else if (ev.key === ' ') { typing.press('␣'); ev.preventDefault(); }
    else if (/^[a-zA-Z'’]$/.test(ev.key)) typing.press(ev.key === '’' ? "'" : ev.key.toLowerCase());
  });

  // ---------- fin de ronda ----------
  async function endRound() {
    const q = Q; Q = null; typing = null;
    const w = q.world ? W[q.world] : null;
    if (q.mode === 'review') {
      Audio.sfx('ding');
      return showResult({ title: '¡Repasado!', sub: `Has visto y oído las ${q.items.length} palabras. ¿Practicamos?`, img: w.heroImg, world: q.world, again: () => startMode(q.world, 'review'), next: () => openWorld(q.world) });
    }
    const n = q.items.filter(i => i.kind !== 'card').length, c = q.correct, pct = n ? c / n : 1;
    S.rounds++; const bonus = n >= 4 && !q.exam ? 20 : 0; if (bonus) Wallet.add(bonus, 'ingles ronda'); if (MK.Hucha) MK.Hucha.round('ingles:' + (q.exam ? 'examen' : (q.world || '') + ':' + q.mode), c, n);
    if (q.world && q.mode !== 'learn') { const k = q.world + '_' + q.mode; S.best[k] = Math.max(S.best[k] || 0, Math.round(pct * 100)); }
    save();
    const stars = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .5 ? 1 : 0;
    Audio.sfx(stars >= 2 ? 'levelup' : 'ding'); if (stars === 3) Confetti.burst(150);
    const list = q.items.filter((it, i) => q.results[i] === 'bad').slice(0, 6).map(it => `<div><b>${it.sol}</b>${it.sol_es ? `<br><span class="es">${it.sol_es}</span>` : ''}</div>`).join('');
    if (q.exam) {
      const nota = Math.round(pct * 20) / 2; S.exams.push(nota); save();
      const prize = MK.Prizes.exam(nota, 'ingles');          // un 10 = minutos de YouTube (PR-D1)
      say(nota >= 9 ? 'v_exam_great' : nota >= 5 ? 'v_exam_pass' : 'v_exam_fail');
      if (prize) setTimeout(() => { say('v_premio'); Confetti.burst(200); }, 2200);
      return showResult({ title: nota >= 9 ? '¡Sobresaliente!' : nota >= 5 ? '¡Examen aprobado!' : 'Casi… a repasar', stars, nota, sub: `${c} de ${n} bien · tu mejor nota: ${String(Math.max(...S.exams)).replace('.', ',')}${prize ? ' · 🎁 PREMIO ESPECIAL: ' + (prize / 60) + ' minutos de YouTube' : ''}`, img: '../ciencias/assets/img/win_mha.webp', list, again: startExam, next: goHome });
    }
    if (stars >= 2) say('v_level');
    if (q.world && worldPct(q.world) >= 85 && !S['done_' + q.world]) { S['done_' + q.world] = true; save(); Wallet.add(100, 'ingles paso dominado'); }
    const titles = { 3: '¡Ronda perfecta!', 2: '¡Ronda superada!', 1: 'Bien, sigue así', 0: 'A repasar un poco' };
    showResult({ title: titles[stars], stars, sub: `${c} de ${n} bien${bonus ? ' · +' + bonus + ' monedas de ronda' : ''}`, img: w ? (stars >= 2 ? w.win : w.heroImg) : '../ciencias/assets/img/win_mha.webp', list, world: q.world, again: () => (q.world ? startMode(q.world, q.mode) : startWorst()), next: () => (q.world ? openWorld(q.world) : goHome()) });
  }
  let R = {};
  function showResult(o) {
    R = o; const w = o.world ? W[o.world] : null;
    $('#result-bg').style.backgroundImage = `url(${w ? w.bg : '../ciencias/assets/img/bg_mha.webp'})`;
    $('#result-img').src = o.img || ''; $('#result-title').textContent = o.title; $('#result-stars').innerHTML = o.stars == null ? '' : starsSvg(o.stars);
    const nota = $('#result-nota'); nota.classList.toggle('hidden', o.nota == null); if (o.nota != null) nota.textContent = String(o.nota).replace('.', ',');
    $('#result-sub').textContent = o.sub || ''; $('#result-list').innerHTML = o.list || '';
    $('#result-again').classList.toggle('hidden', !o.again); $('#result-next').classList.toggle('hidden', !o.next);
    show('result'); Wallet.render();
  }
  $('#result-again').addEventListener('click', () => R.again && R.again());
  $('#result-next').addEventListener('click', () => R.next && R.next());
  $('#result-arcade').addEventListener('click', () => Nav.arcade('ingles'));

  // ---------- chistes entre ejercicios (los de Ciencias, con sus voces) ----------
  function tellJoke(w) {
    return new Promise(res => {
      const hero = w ? W[w].heroName : null;
      let pool = JOKES.map((j, i) => ({ j, i })).filter(x => !S.jokesSeen.includes(x.i));
      if (!pool.length) { S.jokesSeen = []; pool = JOKES.map((j, i) => ({ j, i })); }
      const mine = pool.filter(x => x.j.who === hero);
      const { j, i } = pick(mine.length && Math.random() < .7 ? mine : pool);
      S.jokesSeen.push(i); save();
      const ov = $('#joke'), img = $('#joke-img'), punch = $('#joke-a'), ok = $('#joke-ok');
      const st = (window.MK_STICKERS || []).find(s => s.name === j.who);
      img.src = st ? '../' + st.img : (w ? W[w].heroImg : '../shared/img/st_deku.webp');
      $('#joke-title').textContent = `Chiste de ${j.who}`; $('#joke-q').textContent = j.q; punch.textContent = j.a;
      punch.classList.add('hidden'); ok.classList.add('hidden'); ov.classList.add('show'); Audio.sfx('pop', .5);
      let revealed = false;
      const reveal = () => { if (revealed) return; revealed = true; punch.classList.remove('hidden'); Audio.sfx('tada', .6); ok.classList.remove('hidden'); };
      const t = setTimeout(reveal, 4500);
      say('j_' + i, j.q + ' ' + j.a).then(() => { clearTimeout(t); reveal(); });
      ok.onclick = () => { ov.classList.remove('show'); Audio.stopVoice(); res(); };
    });
  }

  $('#quiz-es').addEventListener('click', () => $('.quiz-body').classList.toggle('es-on'));
  $('#quiz-ficha').addEventListener('click', openFicha);
  $('#quiz-back').addEventListener('click', () => { const w = Q && Q.world; Q = null; typing = null; Audio.stopVoice(); w ? openWorld(w) : goHome(); });

  // ---------- arranque ----------
  function init() {
    $('#btn-start').addEventListener('click', () => {
      Audio.unlock(); Audio.preload(['correct', 'wrong', 'coin', 'pop', 'levelup', 'snap', 'tada', 'ding']);
      Wallet.touchDay(); goHome();
    });
    $('#btn-home').addEventListener('click', () => Nav.home());
    $('#btn-sound').addEventListener('click', () => { Audio.setOn(!Audio.on); if (Audio.on) { Audio.unlock(); Audio.music('music_mha', .22); } renderHome(); });
    $('#btn-exam').addEventListener('click', startExam);
    $('#btn-worst').addEventListener('click', startWorst);
    $('#btn-arcade').addEventListener('click', () => Nav.arcade('ingles'));
    $('#radio-slot').appendChild(MK.Radio.button());
    document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
    MK.tapSounds('.btn, .tile, .iconbtn, .world-card');
    Wallet.on(() => Wallet.render());
  }
  init();
  window.__en = { S, save, M, MODES, Wallet, startMode, startQuiz, startExam, startWorst, openWorld, goHome, modeItems, examItems, worstItems, fromKey, openFicha, norm, get Q() { return Q; }, get typing() { return typing; } };
})();
