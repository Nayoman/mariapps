/* INGLÉS · «Animals», «Animal parts», «Has got» y «Questions» (examen lunes 23-nov-2026) — la hoja del cole en datos
   (foto del 21-nov en esta misma carpeta). NADA se inventa: las 10 palabras de animales, las 6 de partes y las cuatro formas
   de la hoja («has got», «'s got», «hasn't got», «Has … got …? Yes, it has. / No, it hasn't.»).
   Lo único que no está escrito en la hoja:
   · «a tail» y «a shell» llevan «a» dentro de una frase (la hoja solo trae la palabra suelta).
   · HAS = qué animal tiene qué parte. Solo las parejas que no admiten discusión; fuera las dudosas
     (cola de la serpiente, de la tortuga y del pájaro del dibujo; dientes del camaleón y de la tortuga; escamas de la tortuga). */
window.EN = (function () {
  const I = id => 'assets/img/' + id + '.webp';
  const ANIMALS = [
    { id: 'snake', w: 'snake', es: 'serpiente' }, { id: 'parrot', w: 'parrot', es: 'loro' }, { id: 'bird', w: 'bird', es: 'pájaro' },
    { id: 'chameleon', w: 'chameleon', es: 'camaleón' }, { id: 'peacock', w: 'peacock', es: 'pavo real' }, { id: 'turtle', w: 'turtle', es: 'tortuga' },
    { id: 'crocodile', w: 'crocodile', es: 'cocodrilo' }, { id: 'fox', w: 'fox', es: 'zorro' }, { id: 'raccoon', w: 'raccoon', es: 'mapache' },
    { id: 'leopard', w: 'leopard', es: 'leopardo' },
  ].map(x => Object.assign(x, { world: 'animals', img: I(x.id) }));
  // art = cómo va dentro de una frase · es_art = lo mismo en castellano
  const PARTS = [
    { id: 'tail', w: 'tail', es: 'cola', art: 'a tail', es_art: 'cola' }, { id: 'teeth', w: 'teeth', es: 'dientes', art: 'teeth', es_art: 'dientes' },
    { id: 'fur', w: 'fur', es: 'pelo', art: 'fur', es_art: 'pelo' }, { id: 'scales', w: 'scales', es: 'escamas', art: 'scales', es_art: 'escamas' },
    { id: 'feathers', w: 'feathers', es: 'plumas', art: 'feathers', es_art: 'plumas' }, { id: 'shell', w: 'shell', es: 'caparazón', art: 'a shell', es_art: 'caparazón' },
  ].map(x => Object.assign(x, { world: 'parts', img: I(x.id) }));
  const WORDS = ANIMALS.concat(PARTS);
  const word = id => WORDS.find(x => x.id === id);
  const ES_A = { snake: 'Una serpiente', parrot: 'Un loro', bird: 'Un pájaro', chameleon: 'Un camaleón', peacock: 'Un pavo real', turtle: 'Una tortuga', crocodile: 'Un cocodrilo', fox: 'Un zorro', raccoon: 'Un mapache', leopard: 'Un leopardo' };

  // 1 = lo tiene · 0 = no lo tiene · lo que no aparece = dudoso, no se pregunta
  const HAS = {
    snake: { scales: 1, teeth: 1, fur: 0, feathers: 0, shell: 0 },
    parrot: { feathers: 1, tail: 1, fur: 0, scales: 0, teeth: 0, shell: 0 },
    bird: { feathers: 1, fur: 0, scales: 0, teeth: 0, shell: 0 },
    chameleon: { scales: 1, tail: 1, fur: 0, feathers: 0, shell: 0 },
    peacock: { feathers: 1, tail: 1, fur: 0, scales: 0, teeth: 0, shell: 0 },
    turtle: { shell: 1, fur: 0, feathers: 0 },
    crocodile: { scales: 1, teeth: 1, tail: 1, fur: 0, feathers: 0, shell: 0 },
    fox: { fur: 1, tail: 1, teeth: 1, feathers: 0, scales: 0, shell: 0 },
    raccoon: { fur: 1, tail: 1, teeth: 1, feathers: 0, scales: 0, shell: 0 },
    leopard: { fur: 1, tail: 1, teeth: 1, feathers: 0, scales: 0, shell: 0 },
  };
  const FACTS = [];
  ANIMALS.forEach(a => PARTS.forEach(p => { if (HAS[a.id][p.id] !== undefined) FACTS.push({ a, p, yes: !!HAS[a.id][p.id], id: a.id + '_' + p.id }); }));
  const fact = id => FACTS.find(f => f.id === id);

  // ---------- las frases de la hoja ----------
  const HG = yes => (yes ? 'has got' : "hasn't got");
  const stmt = (f, yes) => `A ${f.a.w} ${HG(yes === undefined ? f.yes : yes)} ${f.p.art}.`;           // A snake has got scales.
  const short = (p, yes) => (yes ? `It's got ${p.art}.` : `It hasn't got ${p.art}.`);                  // It's got scales. / It hasn't got fur.
  const quest = f => `Has a ${f.a.w} got ${f.p.art}?`;                                                 // Has a snake got scales?
  const questIt = p => `Has it got ${p.art}?`;                                                         // Has it got feathers?
  const ans = yes => (yes ? 'Yes, it has.' : "No, it hasn't.");
  // en castellano (solo se enseña con el botón «ES» o después de contestar)
  const stmt_es = (f, yes) => `${ES_A[f.a.id]} ${(yes === undefined ? f.yes : yes) ? 'tiene' : 'no tiene'} ${f.p.es_art}.`;
  const short_es = (p, yes) => `${yes ? 'Tiene' : 'No tiene'} ${p.es_art}.`;
  const quest_es = f => `¿${ES_A[f.a.id]} tiene ${f.p.es_art}?`;
  const questIt_es = p => `¿Tiene ${p.es_art}?`;
  const ans_es = yes => (yes ? 'Sí, tiene.' : 'No, no tiene.');

  // ---------- las voces (Alice): nombre del audio → lo que dice ----------
  const CLIPS = {};
  WORDS.forEach(x => { CLIPS['w_' + x.id] = x.w.charAt(0).toUpperCase() + x.w.slice(1) + '.'; });
  FACTS.forEach(f => { CLIPS['s_' + f.id] = stmt(f); CLIPS['q_' + f.id] = quest(f); });
  PARTS.forEach(p => { CLIPS['i_' + p.id + '_y'] = short(p, true); CLIPS['i_' + p.id + '_n'] = short(p, false); CLIPS['qi_' + p.id] = questIt(p); });
  CLIPS.a_yes = ans(true); CLIPS.a_no = ans(false);

  const worlds = {
    animals: { id: 'animals', series: 'onepiece', title: 'Animals', title_es: 'Los 10 animales', heroName: 'Luffy', heroImg: '../tablas/assets/img/ch_luffy.webp', bg: '../tablas/assets/img/bg_onepiece.webp', music: 'music_onepiece', win: '../tablas/assets/img/win_onepiece.webp', badge: '🐍', hi: '¡Diez animales! Mira, escucha y repite.' },
    parts: { id: 'parts', series: 'demonslayer', title: 'Animal parts', title_es: 'Las 6 partes', heroName: 'Nezuko', heroImg: '../tablas/assets/img/ch_nezuko.webp', bg: '../tablas/assets/img/bg_demonslayer.webp', music: 'music_demonslayer', win: '../tablas/assets/img/win_demonslayer.webp', badge: '🦷', hi: 'Cola, dientes, pelo, escamas, plumas y caparazón.' },
    hasgot: { id: 'hasgot', series: 'haikyuu', title: 'Has got', title_es: 'Tiene y no tiene', heroName: 'Hinata', heroImg: '../tablas/assets/img/ch_hinata.webp', bg: '../tablas/assets/img/bg_haikyuu.webp', music: 'music_haikyuu', win: '../tablas/assets/img/win_haikyuu.webp', badge: '✅', hi: '«Has got» es tiene. «Hasn\'t got» es no tiene.' },
    questions: { id: 'questions', series: 'mha', title: 'Questions', title_es: 'Preguntar y contestar', heroName: 'Deku', heroImg: '../shared/img/st_deku.webp', bg: '../ciencias/assets/img/bg_mha.webp', music: 'music_mha', win: '../ciencias/assets/img/win_mha.webp', badge: '❓', hi: 'La pregunta empieza por «Has». Contesta corto.' },
  };
  const WORLD_ORDER = ['animals', 'parts', 'hasgot', 'questions'];
  return { ANIMALS, PARTS, WORDS, word, HAS, FACTS, fact, HG, stmt, short, quest, questIt, ans, stmt_es, short_es, quest_es, questIt_es, ans_es, CLIPS, worlds, WORLD_ORDER };
})();
