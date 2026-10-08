/* Ciencias Sociales — motor de la app (script plano, sin módulos).
   Aprender = lección de 3 tiempos (Montessori) · practicar de las 3 formas del examen (escribir, unir/test, poner nombres)
   · repaso por cajas (lo fallado vuelve antes) · retos de pensar · «¿ya lo sabes?» para saltarse lo dominado · jefes ·
   examen de prueba con nota · sobres sorpresa (pegatinas, «¿sabías que…?», chistes) · hucha común (MK.Wallet). */
(function () {
  'use strict';
  const { $, $$, sleep, rnd, pick, shuffle, Wallet, Audio, UI, Nav, Confetti, matchKeys } = MK;
  // orden de búsqueda de clips: voces propias → músicas de los mundos (en las tablas) → lo genérico (../shared/audio/)
  Audio.dirs = [{ dir: 'assets/audio/', test: /^(d|q|qq|l|f|j|n)_/ }, { dir: '../tablas/assets/audio/', test: /^music_(onepiece|demonslayer|haikyuu)$/ }, MK.ROOT + 'shared/audio/'];
  const GOAL = 40;
  const REWARD = { choice: 10, tf: 10, write: 15, list: 10, sort: 15, label: 20, spot: 10, teach: 0 };
  const { S, save } = MK.store('ciencias_v1', () => ({ c: {}, q: {}, rounds: 0, bestStreak: 0, bosses: {}, exams: [], today: { date: '', correct: 0 }, totalCorrect: 0, quick: {}, sobres: 0, factsSeen: [], jokesSeen: [], forms: false }));
  const cst = id => S.c[id] || (S.c[id] = { box: 0, seen: 0, wrong: 0, last: 0 });
  const qst = k => S.q[k] || (S.q[k] = { ok: 0, bad: 0, last: 0 });
  function today() { const d = MK.dayKey(); if (S.today.date !== d) S.today = { date: d, correct: 0 }; return S.today; }
  const W = CS.worlds, ORDER = CS.WORLD_ORDER;
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const worldConcepts = w => CS.concepts.filter(c => c.world === w);
  const sceneOf = w => Object.keys(CS.scenes).find(k => CS.scenes[k].world === w);
  function worldPct(w) { const cs = worldConcepts(w); return Math.round(cs.reduce((a, c) => a + Math.min(4, cst(c.id).box), 0) / (cs.length * 4) * 100); }
  function worldStars(w) { const p = worldPct(w); return p >= 85 ? 3 : p >= 55 ? 2 : p >= 25 ? 1 : 0; }
  const starsSvg = (n, max) => Array.from({ length: max || 3 }, (_, i) => `<svg class="${i < n ? 'on' : ''}"><use href="#i-star"/></svg>`).join('');
  const say = (name, text) => name ? Audio.say(name, { text }) : Promise.resolve();
  const OK_LINES = ['v_ok1', 'v_ok2', 'v_ok3', 'v_ok4', 'v_ok5', 'v_ok6', 'v_ok7'], WRONG_LINES = ['v_wrong1', 'v_wrong2', 'v_wrong3'];
  const OK_TXT = ['¡Genial!', '¡Increíble!', '¡Eres una crack!', '¡Perfecto!', '¡Así se hace!', '¡Toma ya!', '¡Muy bien!'];
  const tfText = q => '¿Verdadero o falso? ' + q.s;

  // ---------- pantallas ----------
  function show(id) { UI.show(id); }
  function goHome() { UI.setWorld('mha'); renderHome(); show('home'); Audio.music('music_mha', .22); }
  function go(id) { if (id === 'home') return goHome(); show(id); }
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  // ---------- pesos de repaso (cajas): lo nuevo y lo fallado pesa más; lo que toca repasar por días, también ----------
  const DUE_DAYS = [0, 1, 2, 4, 7, 10];
  function weight(c) { const s = cst(c.id); const days = (Date.now() - (s.last || 0)) / 864e5; const due = s.box > 0 && days >= DUE_DAYS[Math.min(5, s.box)] ? 2 : 0; return Math.max(.4, 6 - s.box) + s.wrong * 1.5 + due; }
  function pickWeighted(pool, n) {
    const out = []; let cand = pool.slice();
    while (out.length < n && cand.length) {
      let tot = 0; cand.forEach(c => { tot += weight(c); });
      let r = Math.random() * tot, chosen = cand[cand.length - 1];
      for (const c of cand) { r -= weight(c); if (r <= 0) { chosen = c; break; } }
      out.push(chosen); cand = cand.filter(c => c !== chosen);
    }
    return out;
  }
  function others(c, n, pool) {
    let o = shuffle((pool || CS.concepts).filter(x => x.id !== c.id && x.world === c.world)).slice(0, n);
    if (o.length < n) o = o.concat(shuffle(CS.concepts.filter(x => x.id !== c.id && !o.includes(x) && x.world !== c.world)).slice(0, n - o.length));
    return o;
  }

  // ---------- fabricar preguntas ----------
  const I = {
    teach: c => ({ kind: 'teach', c, cid: c.id, voice: 'd_' + c.id, text: c.def }),
    defChoice: (c, pool) => { const opts = shuffle([c, ...others(c, 2, pool)]); return { kind: 'choice', q: c.q, options: opts.map(o => o.short), a: opts.indexOf(c), cid: c.id, key: 'dc_' + c.id, voice: 'q_' + c.id, text: c.q, why: c.def, label: 'Reconocer' }; },
    nameChoice: c => { const opts = shuffle([c, ...others(c, 2)]); return { kind: 'choice', q: `¿Qué es esto? «${c.short}»`, options: opts.map(o => cap(o.name)), a: opts.indexOf(c), cid: c.id, key: 'nc_' + c.id, voice: 'l_learn_3', text: '¿Qué es esto?', why: c.def, label: 'Nombrar' }; },
    spot: c => { const [sc, lid] = CS.SPOT[c.id]; const scene = CS.scenes[sc]; const round = scene.rounds.find(r => r.labels.some(l => l.id === lid)); return { kind: 'spot', c, cid: c.id, scene, round, lid, key: 'sp_' + c.id, voice: 'l_toca', voice2: 'n_' + lid, text: 'Toca: ' + c.name, label: 'Reconocer' }; },
    write: c => ({ kind: 'write', c, cid: c.id, key: 'w_' + c.id, voice: 'q_' + c.id, text: c.q, label: 'Escribir' }),
    choice: q => ({ kind: 'choice', q: q.q, options: q.options, a: q.a, why: q.why, key: 'qq_' + CS.hash(q.q), voice: 'qq_' + CS.hash(q.q), text: q.q, reto: q.type === 'reto', label: q.type === 'reto' ? 'Reto: piensa' : 'Elige' }),
    tf: q => ({ kind: 'tf', s: q.s, a: q.a, why: q.why, key: 'qq_' + CS.hash(tfText(q)), voice: 'qq_' + CS.hash(tfText(q)), text: tfText(q), label: 'Verdadero o falso' }),
    list: l => ({ kind: 'list', l, key: 'li_' + l.id, voice: 'q_' + l.id, text: l.q, label: 'Elige todos' }),
    sort: s => ({ kind: 'sort', s, key: 'so_' + s.id, voice: 'q_' + s.id, text: s.q, label: 'Clasificar' }),
    label: (sc, ri) => { const scene = CS.scenes[sc]; return { kind: 'label', scene, round: scene.rounds[ri], key: 'la_' + sc + ri, voice: 'l_label_start', text: CS.lines.label_start, label: 'Poner nombres' }; },
    fromQ: q => q.type === 'tf' ? I.tf(q) : I.choice(q),
  };
  function modeItems(mode, w) {
    const cs = worldConcepts(w), qs = CS.questions.filter(q => q.world === w);
    switch (mode) {
      case 'learn': {
        const todo = cs.filter(c => cst(c.id).box < 2).slice(0, 3); if (!todo.length) return null;
        const items = todo.map(I.teach);
        shuffle(todo).forEach(c => items.push(CS.SPOT[c.id] ? I.spot(c) : I.defChoice(c, cs)));
        shuffle(todo).forEach(c => items.push(I.nameChoice(c)));
        return items;
      }
      case 'write': return pickWeighted(cs, 5).map(I.write);
      case 'test': {
        const items = [];
        shuffle(CS.lists.filter(l => l.world === w)).slice(0, 2).forEach(l => items.push(I.list(l)));
        shuffle(CS.sorts.filter(s => s.world === w)).slice(0, 1).forEach(s => items.push(I.sort(s)));
        shuffle(qs.filter(q => q.type !== 'reto')).slice(0, 6).forEach(q => items.push(I.fromQ(q)));
        return shuffle(items);
      }
      case 'label': { const sc = sceneOf(w); return CS.scenes[sc].rounds.map((_, i) => I.label(sc, i)); }
      case 'reto': {
        let r = shuffle(qs.filter(q => q.type === 'reto')).slice(0, 6);
        if (r.length < 6) r = r.concat(shuffle(CS.questions.filter(q => q.type === 'reto' && q.world !== w)).slice(0, 6 - r.length));
        return r.map(I.choice);
      }
      case 'quick': return shuffle(cs).slice(0, 6).map(c => I.defChoice(c, cs));
    }
    return null;
  }
  function worstItems() {
    const worst = CS.concepts.slice().sort((a, b) => weight(b) - weight(a)).slice(0, 6);
    const items = worst.map((c, i) => i % 2 ? I.write(c) : I.defChoice(c));
    const badQ = CS.questions.filter(q => { const s = S.q['qq_' + CS.hash(q.type === 'tf' ? tfText(q) : q.q)]; return s && s.bad > s.ok; });
    shuffle(badQ).slice(0, 3).forEach(q => items.push(I.fromQ(q)));
    return shuffle(items);
  }
  function examItems() {
    const items = [];
    ORDER.forEach(w => { items.push(I.write(pick(worldConcepts(w)))); items.push(I.label(sceneOf(w), 0)); });
    shuffle(CS.lists).slice(0, 3).forEach(l => items.push(I.list(l)));
    shuffle(CS.sorts).slice(0, 2).forEach(s => items.push(I.sort(s)));
    shuffle(CS.questions.filter(q => q.type !== 'reto')).slice(0, 7).forEach(q => items.push(I.fromQ(q)));
    return shuffle(items);
  }

  // ---------- home ----------
  function renderHome() {
    const t = today(); $('#goal-ring').style.setProperty('--p', Math.min(100, t.correct / GOAL * 100)); $('#goal-txt').textContent = t.correct;
    $('#hello-sub').textContent = t.correct >= GOAL ? '¡Objetivo de hoy conseguido! Sigue si quieres.' : `Objetivo de hoy: ${GOAL} aciertos · llevas ${t.correct}`;
    const el = $('#worlds'); el.innerHTML = '';
    ORDER.forEach(w => {
      const world = W[w], pct = worldPct(w), col = window.MK_SERIES[world.series].color;
      const b = document.createElement('button'); b.className = 'world-card'; b.style.setProperty('--wc', col);
      b.innerHTML = `<img src="${world.heroImg}" alt=""><div><h3>${world.title}</h3><p>${world.sub} · con ${world.heroName}</p><div class="bar"><i style="width:${pct}%"></i></div></div><span class="stars">${starsSvg(worldStars(w))}</span><span class="badge">${world.badge}</span>`;
      b.addEventListener('click', () => openWorld(w)); el.appendChild(b);
    });
    UI.stagger(el);
    $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute');
    Wallet.render();
  }

  // ---------- mundo ----------
  let curWorld = null;
  const MODES = [
    { id: 'learn', name: 'Aprender', sub: 'Lección de 3 pasos', cls: 'm-learn', emoji: '📖', prog: w => { const cs = worldConcepts(w); return cs.filter(c => cst(c.id).box >= 2).length + '/' + cs.length; } },
    { id: 'write', name: 'Escribir', sub: 'Definiciones a mano', cls: 'm-write', emoji: '✍️', prog: w => { const cs = worldConcepts(w); return cs.filter(c => cst(c.id).box >= 3).length + '/' + cs.length; } },
    { id: 'test', name: 'Unir y test', sub: 'Listas, cajones, V/F', cls: 'm-test', emoji: '🧩', prog: w => { const n = Object.keys(S.q).filter(k => /^(li_|so_|qq_)/.test(k) && S.q[k].ok > 0).length; return n ? n + ' bien' : ''; } },
    { id: 'label', name: 'Poner nombres', sub: 'En el dibujo', cls: 'm-label', emoji: '📍', prog: w => { const sc = sceneOf(w); const n = CS.scenes[sc].rounds.filter((_, i) => (S.q['la_' + sc + i] || {}).ok > 0).length; return n + '/' + CS.scenes[sc].rounds.length; } },
    { id: 'reto', name: 'Reto', sub: 'Para pensar', cls: 'm-reto', emoji: '🧠', prog: w => { const n = CS.questions.filter(q => q.world === w && q.type === 'reto' && (S.q['qq_' + CS.hash(q.q)] || {}).ok > 0).length; return n + '/' + CS.questions.filter(q => q.world === w && q.type === 'reto').length; } },
    { id: 'battle', name: 'Jefe', sub: 'Gana una entrada', cls: 'm-battle', emoji: '⚔️', prog: w => (S.bosses[w] ? S.bosses[w] + ' victorias' : '') },
  ];
  function openWorld(w) {
    curWorld = w; const world = W[w];
    UI.setWorld(world.series); $('#world-bg').style.backgroundImage = `url(${world.bg})`;
    $('#world-title').textContent = world.title; $('#world-hero').src = world.heroImg;
    const pct = worldPct(w), cs = worldConcepts(w), dom = cs.filter(c => cst(c.id).box >= 3).length;
    $('#world-stars').innerHTML = starsSvg(worldStars(w)); $('#world-bar').style.width = pct + '%';
    $('#world-sub').textContent = `${dom} de ${cs.length} conceptos dominados`;
    $('#world-bubble').textContent = pct >= 85 ? '¡Esta ficha es tuya!' : pct >= 40 ? '¡Vas muy bien! Sigue' : CS.lines[world.intro].split('.')[0] + '.';
    $('#btn-quick').classList.toggle('hidden', !!S.quick[w]);
    const el = $('#modes'); el.innerHTML = '';
    MODES.forEach(m => {
      const b = document.createElement('button'); b.className = `tile ${m.cls}`; const p = m.prog(w);
      b.innerHTML = `${p ? `<span class="t-prog">${p}</span>` : ''}<span class="t-emoji">${m.emoji}</span><b>${m.name}</b><small>${m.sub}</small>`;
      b.addEventListener('click', () => m.id === 'battle' ? startBattle(w) : startMode(w, m.id)); el.appendChild(b);
    });
    if (w === 'costa') { const b = document.createElement('button'); b.className = 'tile m-forms'; b.innerHTML = `${S.forms ? '<span class="t-prog">visto</span>' : ''}<span class="t-emoji">🌊</span><b>Tierra y agua</b><small>Invierte las formas</small>`; b.addEventListener('click', openForms); el.appendChild(b); }
    UI.stagger(el);
    show('world'); Audio.music(world.music, .22);
    if (!S.visitedVoice || S.visitedVoice !== w) { say('l_' + world.intro, CS.lines[world.intro]); S.visitedVoice = w; }
  }
  $('#btn-quick').addEventListener('click', () => startMode(curWorld, 'quick'));
  function startMode(w, mode) {
    const items = modeItems(mode, w);
    if (!items) { UI.toast('¡Ya lo has aprendido todo! Practica o ve a por el jefe'); Audio.sfx('ding'); return; }
    const titles = { learn: 'Aprender', write: 'Escribir', test: 'Unir y test', label: 'Poner nombres', reto: 'Reto', quick: '¿Ya lo sabes?' };
    const voices = { learn: 'learn_1', write: 'write_start', test: 'list_start', label: 'label_start', reto: 'reto_start', quick: 'quick_start' };
    startQuiz(items, { mode, world: w, title: titles[mode], voice: 'l_' + voices[mode], text: CS.lines[voices[mode]] });
  }
  function startExam() { startQuiz(examItems(), { mode: 'exam', exam: true, title: 'Examen de prueba', voice: 'v_exam_start', text: 'Examen de prueba. Tranquila, lo tienes.' }); }
  function startWorst() { startQuiz(worstItems(), { mode: 'worst', title: 'Lo que más fallo', voice: 'l_mixed_start', text: CS.lines.mixed_start }); }

  // ---------- el cuestionario (todos los modos) ----------
  let Q = null, streak = 0;
  function setMascot(world) {
    $('#mascot-img').src = world ? world.heroImg : 'assets/img/ch_ochaco.webp'; $('#mascot-name').textContent = world ? world.heroName : 'Ochaco';
  }
  function startQuiz(items, o) {
    Q = { items, i: 0, results: [], correct: 0, mode: o.mode, world: o.world || null, exam: !!o.exam, title: o.title };
    streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
    const w = Q.world ? W[Q.world] : null;
    UI.setWorld(w ? w.series : 'mha'); $('#quiz-bg').style.backgroundImage = `url(${w ? w.bg : 'assets/img/bg_mha.webp'})`;
    setMascot(w); show('quiz'); Audio.music(w ? w.music : 'music_mha', .2);
    UI.bubble($('#bubble'), o.title || '¡Vamos!');
    if (o.voice) say(o.voice, o.text);
    setTimeout(nextItem, o.voice ? 700 : 0);
  }
  function renderProgress() { if (!Q) return; $('#quiz-progress').innerHTML = Q.items.map((_, i) => `<i class="${Q.results[i] || ''}${i === Q.i ? ' cur' : ''}"></i>`).join(''); }
  function nextItem() {
    if (!Q) return;
    if (Q.i >= Q.items.length) return endRound();
    const it = Q.items[Q.i];
    // cada 4 ejercicios, un personaje cuenta un chiste (nunca en el examen ni en «¿ya lo sabes?»)
    if (!Q.exam && Q.mode !== 'quick' && Q.i > 0 && Q.i % 4 === 0 && it.kind !== 'teach' && !(Q.jokeDone = Q.jokeDone || {})[Q.i]) {
      Q.jokeDone[Q.i] = true; const q = Q; return tellJoke(Q.world).then(() => { if (Q === q) nextItem(); });
    }
    renderProgress();
    const area = $('#q-area'); area.innerHTML = ''; $('#q-actions').innerHTML = '';
    area.style.animation = 'none'; void area.offsetWidth; area.style.animation = '';
    RENDER[it.kind](it);
    if (it.voice) { const p = say(it.voice, it.text); if (it.voice2) p.then(() => Q && Q.items[Q.i] === it && say(it.voice2)); }
    $('.quiz-body').scrollTop = 0;
  }
  async function answer(ok, it, o) {
    o = o || {}; if (!Q) return;
    Q.results[Q.i] = ok ? 'ok' : 'bad';
    if (it.key) { const s = qst(it.key); ok ? s.ok++ : s.bad++; s.last = Date.now(); }
    if (it.cid) { const c = cst(it.cid); c.seen++; c.last = Date.now(); if (ok) c.box = Math.min(5, c.box + 1); else { c.box = Math.max(0, c.box - 1); c.wrong++; } }
    if (ok) {
      Q.correct++; streak++; S.bestStreak = Math.max(S.bestStreak, streak); today().correct++; S.totalCorrect++;
      const r = (REWARD[it.kind] || 10) + (streak >= 3 ? 5 : 0); Wallet.add(r, 'ciencias ' + it.kind); UI.plus('+' + r, innerWidth - 64, 110);
      Audio.sfx('correct', .8); MK.vibrate(30); UI.react($('#mascot-img'), 'jump'); UI.bubble($('#bubble'), pick(OK_TXT));
      if (streak === 5) say('v_combo5'); else if (streak === 10) { say('v_combo10'); Confetti.burst(100); } else if (!Q.exam && !o.quiet) say(pick(OK_LINES));
      $('#streak').textContent = streak; if (streak >= 3) $('#streak-pill').classList.add('hot');
    } else {
      streak = 0; $('#streak').textContent = 0; $('#streak-pill').classList.remove('hot');
      Audio.sfx('wrong', .6); MK.vibrate([40, 30, 40]); UI.react($('#mascot-img'), 'sad'); UI.bubble($('#bubble'), 'Casi… fíjate');
      if (!Q.exam && !o.quiet) say(pick(WRONG_LINES));
    }
    save(); renderProgress();
  }
  function continueBtn(label) {
    return new Promise(res => { const b = document.createElement('button'); b.className = 'btn btn-accent btn-xl'; b.textContent = label || 'Seguir'; b.addEventListener('click', () => { b.disabled = true; res(); }); $('#q-actions').appendChild(b); });
  }
  async function advance(ms) { const q = Q; await sleep(ms || 0); if (Q !== q) return; Q.i++; nextItem(); }

  // escena con puntos
  function sceneHtml(scene, round) {
    const labels = round ? round.labels : scene.rounds.flatMap(r => r.labels);
    return `<div class="scene" style="--r:${scene.ratio || 1.34}"><img src="${scene.img}" alt="">${labels.map(l => `<div class="spot" data-id="${l.id}" style="left:${l.x}%;top:${l.y}%"></div>`).join('')}</div>`;
  }
  const labelText = (scene, id) => { for (const r of scene.rounds) { const l = r.labels.find(x => x.id === id); if (l) return l.text; } return id; };
  function addSpotName(spot, text, gold) { const n = document.createElement('span'); n.className = 'spot-name' + (gold ? ' gold' : ''); n.textContent = text; n.style.left = spot.style.left; n.style.top = spot.style.top; spot.parentNode.appendChild(n); }
  // «¿seguro o dudo?» (metacognición) — solo al practicar
  function confHtml() { return `<div class="conf" id="conf"><button class="on" data-c="seguro">Estoy segura</button><button data-c="dudo">Dudo</button></div>`; }
  function confWire() { const c = $('#conf'); if (!c) return; $$('button', c).forEach(b => b.addEventListener('click', () => { $$('button', c).forEach(x => x.classList.remove('on')); b.classList.add('on'); })); }
  function confFeedback(ok) { const on = $('#conf button.on'); if (!on) return; const d = on.dataset.c === 'dudo'; if (d && ok) UI.bubble($('#bubble'), '¡Dudabas y lo sabías! Confía más', 2500); if (!d && !ok) UI.bubble($('#bubble'), 'Estabas segura… mira bien esta', 2500); }

  const RENDER = {
    teach(it) {
      const c = it.c, area = $('#q-area'), sp = CS.SPOT[c.id];
      let html = `<div class="qkind">Lección · ${cap(c.name)}</div><div class="qcard teach"><div class="period"><i class="on"></i><i></i><i></i></div>`;
      if (sp) html += sceneHtml(CS.scenes[sp[0]], null);
      else if (c.world === 'tierra' && /oceano|continente|mapamundi|colores/.test(c.id)) html += `<img class="t-img" src="assets/img/scene_mapamundi.webp" alt="">`;
      else if (c.id === 'costa_baja') html += `<img class="t-img" src="assets/img/scene_costa_baja.webp" alt="">`;
      else html += `<img class="t-img" src="${sceneOf(c.world) ? CS.scenes[sceneOf(c.world)].img : W[c.world].bg}" alt="">`;
      html += `<div class="t-name">${cap(c.name)}</div><div class="t-def">${c.def}</div></div>`;
      area.innerHTML = html;
      if (sp) { const spot = $(`.spot[data-id="${sp[1]}"]`, area); if (spot) { spot.classList.add('pulse'); addSpotName(spot, labelText(CS.scenes[sp[0]], sp[1]), true); } }
      UI.bubble($('#bubble'), 'Escucha y mira');
      continueBtn('Siguiente').then(() => advance(0));
    },
    spot(it) {
      const area = $('#q-area');
      area.innerHTML = `<div class="qkind">Segundo paso</div><div class="qcard"><div class="qtext">Toca: <b>${cap(it.c.name)}</b></div></div>` + sceneHtml(it.scene, it.round);
      let done = false;
      $$('.spot', area).forEach(sp => sp.addEventListener('click', async () => {
        if (done) return; done = true; const ok = sp.dataset.id === it.lid;
        if (ok) { sp.classList.add('done'); addSpotName(sp, labelText(it.scene, it.lid)); Audio.sfx('snap', .7); }
        else { sp.classList.add('bad'); const right = $(`.spot[data-id="${it.lid}"]`, area); right.classList.add('pulse'); addSpotName(right, labelText(it.scene, it.lid), true); }
        await answer(ok, it); advance(ok ? 800 : 1900);
      }));
    },
    choice(it) { RENDER._choice(it, false); },
    tf(it) { RENDER._choice(it, true); },
    _choice(it, isTF) {
      const area = $('#q-area');
      area.innerHTML = `<div class="qkind">${it.label || ''}</div><div class="qcard"><div class="qtext">${isTF ? it.s : it.q}</div></div>` + (Q.exam || Q.mode === 'quick' ? '' : confHtml()) + `<div class="choices${isTF ? ' tf' : ''}" id="choices"></div>`;
      confWire();
      const opts = isTF ? ['Verdadero', 'Falso'] : it.options, correct = isTF ? (it.a ? 0 : 1) : it.a, box = $('#choices');
      let done = false;
      opts.forEach((t, i) => {
        const b = document.createElement('button'); b.className = 'choice'; b.innerHTML = `<span>${t}</span>`;
        b.addEventListener('click', async () => {
          if (done) return; done = true; const ok = i === correct;
          $$('.choice', box).forEach((x, j) => { if (j === correct) x.classList.add('ok'); else if (j === i) x.classList.add('bad'); else x.classList.add('dim'); });
          await answer(ok, it); confFeedback(ok);
          if (!ok && !Q.exam) { if (it.why) { const d = document.createElement('div'); d.className = 'q-why'; d.innerHTML = `<b>Fíjate:</b> ${it.why}`; area.appendChild(d); } await continueBtn('Lo tengo'); advance(0); }
          else advance(ok ? 700 : 1400);
        });
        box.appendChild(b);
      });
      UI.stagger(box);
    },
    write(it) {
      const c = it.c, area = $('#q-area');
      area.innerHTML = `<div class="qkind">Escribe la definición</div><div class="qcard"><div class="qtext">${c.q}</div><textarea class="write" id="w-in" rows="3" placeholder="Escribe aquí con tus palabras…" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea><div class="fix" id="w-fix"></div></div>`;
      const ta = $('#w-in'), fx = $('#w-fix'), btn = document.createElement('button'); btn.className = 'btn btn-accent btn-xl'; btn.textContent = 'Comprobar'; $('#q-actions').appendChild(btn);
      let phase = 1;
      btn.addEventListener('click', async () => {
        if (phase === 3) { btn.disabled = true; return advance(0); }
        const v = ta.value.trim(); if (v.length < 3) { UI.toast('Escribe un poquito más'); return; }
        const m = matchKeys(v, c.keys, c.min);
        if (phase === 1) {
          await answer(m.ok, it);
          if (m.ok) { fx.innerHTML = `<b>¡Bien!</b> La ficha dice: ${c.def}`; fx.classList.add('show'); btn.textContent = 'Seguir'; phase = 3; return; }
          if (Q.exam) { fx.innerHTML = `<b>La ficha dice:</b> ${c.def}`; fx.classList.add('show'); btn.textContent = 'Seguir'; phase = 3; return; }
          fx.innerHTML = `<b>Te faltan palabras importantes.</b> La ficha dice: <u>${c.def}</u><br>Escúchala y escríbela tú.`; fx.classList.add('show');
          say('l_write_fix', CS.lines.write_fix).then(() => say('d_' + c.id, c.def));
          ta.value = ''; ta.focus(); btn.textContent = 'Comprobar otra vez'; phase = 2; return;
        }
        if (m.ok) { Audio.sfx('correct', .7); Wallet.add(5, 'ciencias reescribir'); UI.plus('+5', innerWidth - 64, 110); UI.bubble($('#bubble'), '¡Ahora sí!'); btn.disabled = true; advance(600); }
        else { Audio.sfx('wrong', .5); UI.toast('Faltan: ' + m.missing.join(', ')); }
      });
    },
    list(it) {
      const l = it.l, area = $('#q-area'), opts = shuffle([...l.items, ...l.distractors]);
      area.innerHTML = `<div class="qkind">Elige todos los que son</div><div class="qcard"><div class="qtext">${l.q}</div><p class="muted" style="margin-top:6px">Son ${l.items.length}. Toca y luego comprueba.</p></div><div class="chips" id="chips"></div>`;
      const box = $('#chips'); let done = false;
      opts.forEach(t => { const b = document.createElement('button'); b.className = 'chipbtn'; b.textContent = t; b.addEventListener('click', () => { if (done) return; b.classList.toggle('sel'); Audio.sfx('pop', .4); }); box.appendChild(b); });
      const btn = document.createElement('button'); btn.className = 'btn btn-accent btn-xl'; btn.textContent = 'Comprobar'; $('#q-actions').appendChild(btn);
      btn.addEventListener('click', async () => {
        if (done) return; done = true; btn.disabled = true; let ok = true;
        $$('.chipbtn', box).forEach(b => { const is = l.items.includes(b.textContent), sel = b.classList.contains('sel'); b.classList.remove('sel'); if (is && sel) b.classList.add('ok'); else if (!is && sel) { b.classList.add('bad'); ok = false; } else if (is && !sel) { b.classList.add('miss'); ok = false; } });
        await answer(ok, it); advance(ok ? 900 : 2300);
      });
    },
    sort(it) {
      const s = it.s, area = $('#q-area'), items = shuffle(s.items); let idx = 0, errors = 0, done = false;
      area.innerHTML = `<div class="qkind">Clasificar</div><div class="qcard"><div class="qtext">${s.q}</div></div><div class="bins" id="bins" style="--n:${s.bins.length}"></div><div class="sort-item" id="sort-item"></div><div class="sort-left" id="sort-left"></div>`;
      const bins = $('#bins');
      s.bins.forEach((b, i) => { const el = document.createElement('button'); el.className = 'bin'; el.innerHTML = `<span>${b}</span><div class="bin-items"></div>`; el.addEventListener('click', () => drop(i, el)); bins.appendChild(el); });
      function showItem() { if (idx >= items.length) return finish(); $('#sort-item').textContent = items[idx][0]; $('#sort-left').textContent = `${items.length - idx} por colocar · toca el cajón`; }
      function drop(i, el) {
        if (done || idx >= items.length) return; const [txt, right] = items[idx];
        if (i === right) { Audio.sfx('snap', .6); el.classList.add('ok'); setTimeout(() => el.classList.remove('ok'), 300); const sp = document.createElement('span'); sp.textContent = txt; $('.bin-items', el).appendChild(sp); idx++; showItem(); }
        else { errors++; Audio.sfx('wrong', .5); MK.vibrate(40); el.classList.add('bad'); $('#sort-item').classList.add('bad'); setTimeout(() => { el.classList.remove('bad'); $('#sort-item').classList.remove('bad'); }, 350); UI.bubble($('#bubble'), 'Ahí no encaja. Prueba el otro'); }
      }
      async function finish() { done = true; $('#sort-item').textContent = '¡Todo colocado!'; $('#sort-left').textContent = errors ? `${errors} ${errors === 1 ? 'intento fallido' : 'intentos fallidos'}` : '¡Sin fallos!'; const ok = Q.exam ? errors === 0 : errors <= 1; await answer(ok, it); advance(900); }
      showItem();
    },
    label(it) {
      const sc = it.scene, round = it.round, area = $('#q-area');
      area.innerHTML = `<div class="qkind">Pon los nombres</div><div class="qcard" style="padding:10px 14px"><div class="qtext" style="font-size:18px">${round.title}</div><p class="muted" style="font-size:13px;margin-top:4px">Arrastra cada nombre a su punto (o toca el nombre y luego el punto)</p></div>` + sceneHtml(sc, round) + `<div class="tray" id="tray"></div>`;
      const tray = $('#tray'), scene = $('.scene', area);
      shuffle(round.labels).forEach(l => { const b = document.createElement('button'); b.className = 'lab'; b.textContent = l.text; b.dataset.id = l.id; tray.appendChild(b); });
      let errors = 0, placed = 0, done = false, sel = null;
      function tryPlace(chip, spot) {
        if (done || !chip || !spot || spot.classList.contains('done')) return false;
        if (chip.dataset.id === spot.dataset.id) { spot.classList.add('done'); addSpotName(spot, chip.textContent); chip.remove(); Audio.sfx('snap', .7); MK.vibrate(20); placed++; if (placed === round.labels.length) finish(); return true; }
        errors++; chip.classList.add('bad'); spot.classList.add('bad'); Audio.sfx('wrong', .5); MK.vibrate(40);
        setTimeout(() => { chip.classList.remove('bad'); spot.classList.remove('bad'); }, 350); UI.bubble($('#bubble'), 'Ahí no va. Prueba otro sitio'); return false;
      }
      tray.addEventListener('click', ev => { const c = ev.target.closest('.lab'); if (!c || done) return; $$('.lab', tray).forEach(x => x.classList.remove('sel')); sel = c; c.classList.add('sel'); Audio.sfx('pop', .4); });
      scene.addEventListener('click', ev => { const sp = ev.target.closest('.spot'); if (!sp || done || !sel) return; if (tryPlace(sel, sp)) sel = null; });
      tray.addEventListener('pointerdown', ev => { const c = ev.target.closest('.lab'); if (!c || done) return; DRAG.begin(ev, c, scene, tryPlace); });
      async function finish() { done = true; const ok = Q.exam ? errors === 0 : errors <= 1; UI.bubble($('#bubble'), errors ? `Hecho, con ${errors} ${errors === 1 ? 'fallo' : 'fallos'}` : '¡Todos a la primera!'); await answer(ok, it); advance(1100); }
    },
  };
  // arrastre de etiquetas (una sola instalación de oyentes para toda la página)
  const DRAG = {
    d: null,
    begin(ev, chip, scene, place) { const g = chip.cloneNode(true); g.classList.add('drag'); g.classList.remove('sel'); document.body.appendChild(g); this.d = { chip, ghost: g, scene, place, moved: false, x0: ev.clientX, y0: ev.clientY }; chip.classList.add('ghost'); this.move(ev); },
    nearest(x, y) { let best = null, bd = 1e9; $$('.spot:not(.done)', this.d.scene).forEach(s => { const r = s.getBoundingClientRect(); const dd = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); if (dd < bd) { bd = dd; best = s; } }); return bd < 46 ? best : null; },
    move(ev) { const d = this.d; if (!d) return; d.ghost.style.left = ev.clientX + 'px'; d.ghost.style.top = ev.clientY + 'px'; if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) > 8) d.moved = true; const sp = this.nearest(ev.clientX, ev.clientY); $$('.spot', d.scene).forEach(s => s.classList.toggle('hot', s === sp)); },
    end(ev, cancel) { const d = this.d; if (!d) return; this.d = null; d.ghost.remove(); d.chip.classList.remove('ghost'); $$('.spot', d.scene).forEach(s => s.classList.remove('hot')); if (cancel || !d.moved) return; const sp = this.nearest(ev.clientX, ev.clientY); if (sp) d.place(d.chip, sp); },
  };
  window.addEventListener('pointermove', ev => DRAG.move(ev), { passive: true });
  window.addEventListener('pointerup', ev => DRAG.end(ev, false));
  window.addEventListener('pointercancel', ev => DRAG.end(ev, true));

  // ---------- fin de ronda ----------
  async function endRound() {
    const q = Q; Q = null;
    const n = q.items.filter(i => i.kind !== 'teach').length, c = q.correct, pct = n ? c / n : 1;
    S.rounds++; const bonus = n >= 4 ? 20 : 0; if (bonus) Wallet.add(bonus, 'ciencias ronda');
    if (q.mode === 'quick') { S.quick[q.world] = true; q.items.forEach((it, i) => { if (q.results[i] === 'ok' && it.cid) { const s = cst(it.cid); s.box = Math.max(s.box, 2); } }); }
    if (q.mode === 'learn') q.items.forEach((it, i) => { if (it.key && it.key.startsWith('nc_') && q.results[i] === 'ok') { const s = cst(it.cid); s.box = Math.max(s.box, 2); } });
    save();
    const stars = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .5 ? 1 : 0, w = q.world ? W[q.world] : null;
    Audio.sfx(stars >= 2 ? 'levelup' : 'ding'); if (stars === 3) Confetti.burst(150);
    const missed = q.items.filter((it, i) => q.results[i] === 'bad');
    const list = missed.slice(0, 6).map(it => {
      if (it.cid) { const cc = CS.concept(it.cid); return `<div><b>${cap(cc.name)}:</b> ${cc.short}</div>`; }
      if (it.kind === 'choice') return `<div><b>${it.q}</b> → ${it.options[it.a]}</div>`;
      if (it.kind === 'tf') return `<div><b>${it.s}</b> → ${it.a ? 'Verdadero' : 'Falso'}${it.why ? ' · ' + it.why : ''}</div>`;
      if (it.kind === 'list') return `<div><b>${it.l.q}</b> → ${it.l.items.join(', ')}</div>`;
      if (it.kind === 'label') return `<div><b>${it.round.title}:</b> repásalo tocando «Aprender»</div>`;
      return '';
    }).join('');
    if (q.exam) {
      const nota = Math.round(pct * 20) / 2; S.exams.push(nota); save();
      say(nota >= 9 ? 'v_exam_great' : nota >= 5 ? 'v_exam_pass' : 'v_exam_fail');
      showResult({ title: nota >= 9 ? '¡Sobresaliente!' : nota >= 5 ? '¡Examen aprobado!' : 'Casi… a repasar', stars, nota, sub: `${c} de ${n} bien · tu mejor nota: ${String(Math.max(...S.exams)).replace('.', ',')}`, img: 'assets/img/win_mha.webp', list, again: startExam, next: goHome });
      return;
    }
    if (q.mode !== 'quick' && n >= 4 && pct >= .5) await openSobre(q.world, false);
    if (q.mode === 'quick' && pct >= .5) say('l_quick_pass', CS.lines.quick_pass); else if (stars >= 2) say('v_level');
    if (q.world && worldPct(q.world) >= 85 && !S['done_' + q.world]) { S['done_' + q.world] = true; save(); say('l_world_done', CS.lines.world_done); Wallet.add(100, 'ficha dominada'); }
    const titles = { 3: '¡Ronda perfecta!', 2: '¡Ronda superada!', 1: 'Bien, sigue así', 0: 'A repasar un poco' };
    showResult({ title: q.mode === 'quick' ? (pct >= .5 ? '¡Ya sabías mucho!' : 'Vamos a aprenderlo') : titles[stars], stars, sub: `${c} de ${n} bien${bonus ? ' · +' + bonus + ' monedas de ronda' : ''}`, img: w ? (stars >= 2 ? w.win : w.heroImg) : 'assets/img/win_mha.webp', list, world: q.world, again: () => startMode(q.world, q.mode), next: () => (q.world ? openWorld(q.world) : goHome()) });
  }
  let R = {};
  function showResult(o) {
    R = o; const w = o.world ? W[o.world] : null;
    $('#result-bg').style.backgroundImage = `url(${w ? w.bg : 'assets/img/bg_mha.webp'})`;
    $('#result-img').src = o.img || ''; $('#result-title').textContent = o.title; $('#result-stars').innerHTML = starsSvg(o.stars || 0);
    const nota = $('#result-nota'); nota.classList.toggle('hidden', o.nota == null); if (o.nota != null) nota.textContent = String(o.nota).replace('.', ',');
    $('#result-sub').textContent = o.sub || ''; $('#result-list').innerHTML = o.list || '';
    $('#result-again').classList.toggle('hidden', !o.again); $('#result-next').classList.toggle('hidden', !o.next);
    show('result'); Wallet.render();
  }
  $('#result-again').addEventListener('click', () => R.again && R.again());
  $('#result-next').addEventListener('click', () => R.next && R.next());
  $('#result-arcade').addEventListener('click', () => Nav.arcade('ciencias'));

  // ---------- sobres sorpresa ----------
  function openSobre(w, forceSticker) {
    return new Promise(res => {
      const series = w ? W[w].series : pick(Object.keys(window.MK_SERIES));
      const unowned = window.MK_STICKERS.filter(s => !Wallet.hasSticker(s.id));
      const mine = unowned.filter(s => s.series === series);
      const r = Math.random(); let prize = null;
      const factsLeft = CS.facts.filter(f => !S.factsSeen.includes(f.id) && (!w || f.world === w)), factsAny = CS.facts.filter(f => !S.factsSeen.includes(f.id));
      const jokesLeft = CS.jokes.filter((_, i) => !S.jokesSeen.includes(i));
      if ((forceSticker || r < .55) && mine.length) prize = { type: 'sticker', s: pick(mine) };
      else if (r < .8 && (factsLeft.length || factsAny.length)) prize = { type: 'fact', f: pick(factsLeft.length ? factsLeft : factsAny) };
      else if (jokesLeft.length) { const i = CS.jokes.indexOf(pick(jokesLeft)); prize = { type: 'joke', j: CS.jokes[i], i }; }
      else if (unowned.length) prize = { type: 'sticker', s: pick(unowned) };
      else prize = { type: 'coins', n: 30 };
      const ov = $('#sobre'), img = $('#sobre-img'), title = $('#sobre-title'), txt = $('#sobre-txt'), ok = $('#sobre-ok');
      img.src = 'assets/img/img_sobre.webp'; img.className = 'wiggle'; title.textContent = '¡Sobre sorpresa!'; txt.textContent = 'Toca el sobre para abrirlo'; ok.classList.add('hidden');
      ov.classList.add('show'); Audio.sfx('chest', .6); say('l_sobre', CS.lines.sobre); S.sobres++; save();
      let opened = false;
      img.onclick = () => {
        if (opened) return; opened = true; Audio.sfx('sobre', .8); MK.vibrate([30, 30, 60]);
        setTimeout(() => {
          img.className = 'reveal';
          if (prize.type === 'sticker') { Wallet.giveSticker(prize.s.id, 'sobre ciencias'); img.src = '../' + prize.s.img; title.textContent = '¡Pegatina nueva!'; txt.textContent = `${prize.s.name} · ${window.MK_SERIES[prize.s.series].name}. Ya está en tu álbum.`; Audio.sfx('sticker', .8); say('l_sticker', CS.lines.sticker); Confetti.burst(90); }
          else if (prize.type === 'fact') { S.factsSeen.push(prize.f.id); img.src = W[prize.f.world].heroImg; title.textContent = '¿Sabías que…?'; txt.textContent = prize.f.text; Audio.sfx('tada', .7); say('f_' + prize.f.id, prize.f.text); }
          else if (prize.type === 'joke') { S.jokesSeen.push(prize.i); const st = window.MK_STICKERS.find(s => s.name === prize.j.who); img.src = st ? '../' + st.img : 'assets/img/ch_ochaco.webp'; title.textContent = `Chiste de ${prize.j.who}`; txt.textContent = prize.j.q + ' … ' + prize.j.a; Audio.sfx('tada', .7); say('j_' + prize.i, prize.j.q + ' ' + prize.j.a); }
          else { Wallet.add(prize.n, 'sobre'); title.textContent = '¡Monedas!'; txt.textContent = `+${prize.n} monedas para la hucha`; Audio.sfx('coin'); }
          save(); ok.classList.remove('hidden');
        }, 350);
      };
      ok.onclick = () => { ov.classList.remove('show'); Audio.stopVoice(); res(); };
    });
  }

  // ---------- chistes entre ejercicios ----------
  function tellJoke(w) {
    return new Promise(res => {
      const hero = w ? W[w].heroName : null;
      let pool = CS.jokes.map((j, i) => ({ j, i })).filter(x => !S.jokesSeen.includes(x.i));
      if (!pool.length) { S.jokesSeen = []; pool = CS.jokes.map((j, i) => ({ j, i })); }
      const mine = pool.filter(x => x.j.who === hero);
      const { j, i } = pick(mine.length && Math.random() < .7 ? mine : pool);
      S.jokesSeen.push(i); save();
      const ov = $('#joke'), img = $('#joke-img'), punch = $('#joke-a'), ok = $('#joke-ok');
      const st = window.MK_STICKERS.find(s => s.name === j.who);
      img.src = st ? '../' + st.img : (w ? W[w].heroImg : 'assets/img/ch_ochaco.webp');
      $('#joke-title').textContent = `Chiste de ${j.who}`; $('#joke-q').textContent = j.q; punch.textContent = j.a;
      punch.classList.add('hidden'); ok.classList.add('hidden'); ov.classList.add('show'); Audio.sfx('pop', .5);
      let revealed = false;
      const reveal = () => { if (revealed) return; revealed = true; punch.classList.remove('hidden'); Audio.sfx('tada', .6); ok.classList.remove('hidden'); };
      const t = setTimeout(reveal, 4500);
      say('j_' + i, j.q + ' ' + j.a).then(() => { clearTimeout(t); reveal(); });
      ok.onclick = () => { ov.classList.remove('show'); Audio.stopVoice(); res(); };
    });
  }

  // ---------- jefe ----------
  let B = null;
  function renderHearts() { $('#hearts').innerHTML = [0, 1, 2].map(i => `<svg class="${i < B.hearts ? '' : 'off'}"><use href="#i-heart"/></svg>`).join(''); }
  function renderHp() { $('#boss-hp').style.width = Math.max(0, B.hp / B.world.boss.hp * 100) + '%'; }
  function startBattle(w) {
    const world = W[w], pool = [];
    worldConcepts(w).forEach(c => pool.push(I.defChoice(c)));
    CS.questions.filter(q => q.world === w && q.type !== 'reto').forEach(q => pool.push(I.fromQ(q)));
    B = { world, w, hp: world.boss.hp, hearts: 3, queue: shuffle(pool), i: 0, raf: 0, lock: false };
    UI.setWorld(world.series); $('#battle-bg').style.backgroundImage = `url(${world.bg})`;
    $('#battle-title').textContent = 'Jefe'; $('#boss-img').src = world.boss.img; $('#boss-name').textContent = world.boss.name;
    $('#b-q').textContent = world.boss.intro; $('#b-choices').innerHTML = '';
    renderHearts(); renderHp(); show('battle'); Audio.music(world.music, .25); Audio.sfx('roar', .7);
    say('v_boss_start', world.boss.intro); setTimeout(() => B && askBattle(), 1500);
  }
  function askBattle() {
    if (!B) return;
    const it = B.queue[B.i % B.queue.length]; B.i++; B.cur = it; B.lock = false;
    const isTF = it.kind === 'tf'; $('#b-q').textContent = isTF ? tfText(it) : it.q;
    const opts = isTF ? ['Verdadero', 'Falso'] : it.options, correct = isTF ? (it.a ? 0 : 1) : it.a, box = $('#b-choices');
    box.innerHTML = ''; box.className = 'choices' + (isTF ? ' tf' : '');
    opts.forEach((t, i) => { const b = document.createElement('button'); b.className = 'choice'; b.innerHTML = `<span>${t}</span>`; b.addEventListener('click', () => onBattleChoice(i === correct, b, correct, false)); box.appendChild(b); });
    UI.stagger(box); say(it.voice, it.text); startTimer(12000);
  }
  function startTimer(ms) {
    cancelAnimationFrame(B.raf); const t0 = performance.now(), f = $('#timer-fill');
    const tick = () => { if (!B || B.lock) return; const p = 1 - (performance.now() - t0) / ms; f.style.transform = `scaleX(${Math.max(0, p)})`; if (p <= 0) return onBattleChoice(false, null, -1, true); B.raf = requestAnimationFrame(tick); };
    B.raf = requestAnimationFrame(tick);
  }
  async function onBattleChoice(ok, btn, correct, timeout) {
    if (!B || B.lock) return; B.lock = true; cancelAnimationFrame(B.raf);
    $$('#b-choices .choice').forEach((x, j) => { if (j === correct) x.classList.add('ok'); else if (x === btn) x.classList.add('bad'); else x.classList.add('dim'); });
    const it = B.cur; if (it.cid) { const c = cst(it.cid); c.seen++; c.last = Date.now(); if (ok) c.box = Math.min(5, c.box + 1); else c.wrong++; }
    if (it.key) { const s = qst(it.key); ok ? s.ok++ : s.bad++; }
    if (ok) {
      B.hp--; renderHp(); $('#boss-img').classList.add('hit'); setTimeout(() => $('#boss-img').classList.remove('hit'), 500);
      Audio.sfx('punch', .9); MK.vibrate(40); Wallet.add(10, 'jefe'); UI.plus('+10', innerWidth / 2, 220); today().correct++; S.totalCorrect++;
      if (B.hp <= 0) { save(); return winBattle(); }
      say('v_boss_hit');
    } else {
      B.hearts--; renderHearts(); Audio.sfx('wrong', .7); MK.vibrate([60, 40, 60]); if (timeout) UI.toast('¡Se acabó el tiempo!');
      if (B.hearts <= 0) { save(); return loseBattle(); }
    }
    save(); await sleep(ok ? 700 : 1300); if (B) askBattle();
  }
  async function winBattle() {
    const w = B.w, world = B.world; B = null;
    S.bosses[w] = (S.bosses[w] || 0) + 1; Wallet.addTickets(1, 'jefe vencido'); Wallet.add(50, 'jefe vencido'); save();
    Audio.sfx('win'); Confetti.burst(200); say('v_boss_win');
    await UI.moment({ img: world.win, text: '¡Jefe derrotado!', ms: 2200, flash: true });
    await openSobre(w, true);
    showResult({ title: '¡Jefe derrotado!', stars: 3, sub: '+1 entrada al Arcade · +50 monedas', img: world.win, world: w, again: () => startBattle(w), next: () => openWorld(w) });
  }
  async function loseBattle() {
    const w = B.w, world = B.world; B = null;
    Audio.sfx('lose'); say('v_boss_lose'); await sleep(900);
    showResult({ title: 'Esta vez no…', stars: 0, sub: 'Repasa un poco y vuelve a por él', img: world.boss.img, world: w, again: () => startBattle(w), next: () => startMode(w, 'learn') });
  }
  function leaveBattle() { if (B) { cancelAnimationFrame(B.raf); B = null; } Audio.stopVoice(); openWorld(curWorld || 'tierra'); }
  $('#battle-back').addEventListener('click', leaveBattle);
  $('#quiz-back').addEventListener('click', () => { const w = Q && Q.world; Q = null; Audio.stopVoice(); w ? openWorld(w) : goHome(); });

  // ---------- tierra y agua (Montessori: la misma forma invertida es la contraria) ----------
  const FORMS = [
    { a: ['Isla', 'Porción de tierra rodeada de agua por todas partes'], b: ['Lago', 'Agua rodeada de tierra por todas partes'], path: 'M100,28 C142,22 164,56 150,82 C138,108 86,112 62,90 C38,68 56,34 100,28 Z' },
    { a: ['Península', 'Tierra rodeada de agua por todas partes menos por una (el istmo)'], b: ['Golfo', 'Gran entrada del mar en la tierra'], path: 'M0,120 H200 V96 H112 L108,80 C136,70 140,34 104,28 C68,24 60,70 92,80 L88,96 H0 Z' },
    { a: ['Cabo', 'Saliente de tierra que se adentra en el mar'], b: ['Bahía', 'Entrada pequeña del mar en la tierra'], path: 'M0,0 V120 H44 L128,60 L44,0 Z' },
    { a: ['Istmo', 'Franja estrecha de tierra que une dos tierras'], b: ['Estrecho', 'Franja estrecha de mar que une dos mares'], path: 'M0,0 H200 V34 C150,46 50,46 0,34 Z M0,120 H200 V86 C150,74 50,74 0,86 Z M90,34 C96,52 96,68 90,86 H110 C104,68 104,52 110,34 Z' },
  ];
  function openForms() {
    const world = W.costa; UI.setWorld('onepiece'); $('#forms-bg').style.backgroundImage = `url(${world.bg})`;
    const el = $('#forms-list'); el.innerHTML = `<div class="card"><b>La misma forma, al revés.</b> Donde había tierra hay agua y donde había agua hay tierra. Pulsa «Invertir» y mira cómo cambia el nombre.</div>`;
    FORMS.forEach(f => {
      const card = document.createElement('div'); card.className = 'form-card'; let inv = false;
      const draw = () => { const land = inv ? '#2b7fd6' : '#58b368', water = inv ? '#58b368' : '#2b7fd6'; card.innerHTML = `<svg viewBox="0 0 200 120"><rect width="200" height="120" fill="${water}"/><path d="${f.path}" fill="${land}" stroke="#fff" stroke-width="2"/></svg><div class="f-name">${(inv ? f.b : f.a)[0]}</div><div class="f-def">${(inv ? f.b : f.a)[1]}</div><button class="btn btn-ghost btn-sm">Invertir</button>`; $('button', card).addEventListener('click', () => { inv = !inv; Audio.sfx('wave', .5); draw(); }); };
      draw(); el.appendChild(card);
    });
    UI.stagger(el); show('forms'); Audio.music(world.music, .2);
    if (!S.forms) { S.forms = true; save(); Wallet.add(20, 'tierra y agua'); UI.toast('+20 monedas por explorar'); }
  }
  $('#forms-back').addEventListener('click', () => openWorld('costa'));

  // ---------- arranque ----------
  function init() {
    $('#btn-start').addEventListener('click', () => {
      Audio.unlock(); Audio.preload(['correct', 'wrong', 'coin', 'pop', 'levelup', 'win', 'lose', 'snap', 'sobre', 'sticker', 'tada', 'chest', 'punch', 'roar', 'ding']);
      Wallet.touchDay(); goHome(); say('l_cs_intro', CS.lines.cs_intro);
    });
    $('#btn-home').addEventListener('click', () => Nav.home());
    $('#btn-sound').addEventListener('click', () => { Audio.setOn(!Audio.on); if (Audio.on) { Audio.unlock(); Audio.music('music_mha', .22); } renderHome(); });
    $('#btn-exam').addEventListener('click', startExam);
    $('#btn-worst').addEventListener('click', startWorst);
    $('#btn-arcade').addEventListener('click', () => Nav.arcade('ciencias'));
    document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
    MK.tapSounds('.btn, .tile, .iconbtn, .world-card');
    Wallet.on(() => Wallet.render());
  }
  init();
  window.__cs = { S, Wallet, startMode, startExam, startWorst, startBattle, openWorld, goHome, openSobre, modeItems, examItems, get Q() { return Q; }, get B() { return B; }, info: () => ({ worlds: ORDER.map(w => w + ':' + worldPct(w) + '%'), coins: Wallet.coins, rounds: S.rounds }) };
})();
