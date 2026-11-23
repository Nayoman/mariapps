/* Lengua — la ficha del cole en datos (fuente: foto en assets/raw/ficha_lengua_1.jpg, M8). Mismo formato que Ciencias (window.CS)
   para que el motor sea el mismo. Definiciones y reglas = las de la ficha; las palabras de práctica amplían sus ejemplos.
   keys = grupos de palabras clave que tiene que contener la definición escrita; min = grupos necesarios.
   frases = oraciones para el ejercicio «partes» (sujeto | predicado, y el verbo dentro del predicado). */
window.CS = (function () {
  const worlds = {
    sinonimos: { id: 'sinonimos', series: 'haikyuu', title: 'Sinónimos y antónimos', sub: 'Lo mismo y lo contrario', hero: 'hinata', heroName: 'Hinata', heroImg: '../tablas/assets/img/ch_hinata.webp', bg: '../tablas/assets/img/bg_haikyuu.webp', music: 'music_haikyuu', boss: { id: 'kuroo', name: 'Kuroo (Nekoma)', img: '../tablas/assets/img/boss_kuroo.webp', hp: 8, intro: '¡Kuroo lo dice todo al revés! Gánale con sinónimos y antónimos.' }, win: '../tablas/assets/img/win_haikyuu.webp', intro: 'w_sinonimos', badge: '🔁' },
    cqk: { id: 'cqk', series: 'onepiece', title: 'C, QU y K', sub: 'Casa, queso y koala', hero: 'luffy', heroName: 'Luffy', heroImg: '../tablas/assets/img/ch_luffy.webp', bg: '../tablas/assets/img/bg_onepiece.webp', music: 'music_onepiece', boss: { id: 'buggy', name: 'Buggy el Payaso', img: '../tablas/assets/img/boss_buggy.webp', hp: 8, intro: '¡Buggy ha robado las letras C, QU y K de las palabras!' }, win: '../tablas/assets/img/win_onepiece.webp', intro: 'w_cqk', badge: '🧀' },
    g: { id: 'g', series: 'demonslayer', title: 'G, GU y GÜ', sub: 'Gato, guitarra y pingüino', hero: 'tanjiro', heroName: 'Tanjiro', heroImg: '../tablas/assets/img/ch_tanjiro.webp', bg: '../tablas/assets/img/bg_demonslayer.webp', music: 'music_demonslayer', boss: { id: 'oni', name: 'Oni de las letras', img: '../tablas/assets/img/boss_demon.webp', hp: 8, intro: '¡Un oni ha borrado las diéresis! Devuélvelas a su sitio.' }, win: '../tablas/assets/img/win_demonslayer.webp', intro: 'w_g', badge: '🐧' },
    comunicacion: { id: 'comunicacion', series: 'mha', title: 'La comunicación', sub: 'Oral, no verbal y medios', hero: 'deku', heroName: 'Deku', heroImg: '../shared/img/st_deku.webp', bg: '../ciencias/assets/img/bg_mha.webp', music: 'music_mha', boss: { id: 'gentle', name: 'Gentle Criminal', img: '../ciencias/assets/img/boss_gentle.webp', hp: 8, intro: '¡Gentle Criminal quiere cortar todas las comunicaciones!' }, win: '../ciencias/assets/img/win_mha.webp', intro: 'w_comunicacion', badge: '💬' },
    sujeto: { id: 'sujeto', series: 'onepiece', title: 'Sujeto y predicado', sub: 'Quién, qué hace y el verbo', hero: 'nami', heroName: 'Nami', heroImg: '../tablas/assets/img/ch_nami.webp', bg: '../tablas/assets/img/bg_onepiece.webp', music: 'music_onepiece', boss: { id: 'arlong', name: 'Arlong', img: 'assets/img/boss_arlong.webp', hp: 8, intro: '¡Arlong ha roto las frases en pedazos! Ayuda a Nami a recomponerlas.' }, win: '../tablas/assets/img/win_onepiece.webp', intro: 'w_sujeto', badge: '✏️' },
  };
  const WORLD_ORDER = ['sinonimos', 'cqk', 'g', 'comunicacion', 'sujeto'];

  // ---------- conceptos: lo que hay que saber explicar (ESCRIBIR, lección de 3 tiempos) ----------
  const concepts = [
    { id: 'sinonimo', world: 'sinonimos', name: 'los sinónimos', q: '¿Qué son los sinónimos?', def: 'Los sinónimos son palabras que significan lo mismo o casi lo mismo. Por ejemplo: rápido y veloz.', short: 'Palabras que significan lo mismo o casi lo mismo', keys: [['palabras'], ['mismo', 'igual', 'parecido']] },
    { id: 'antonimo', world: 'sinonimos', name: 'los antónimos', q: '¿Qué son los antónimos?', def: 'Los antónimos son palabras que significan lo contrario. Por ejemplo: encender y apagar.', short: 'Palabras que significan lo contrario', keys: [['palabras'], ['contrario', 'opuesto', 'al reves']] },
    { id: 'regla_c', world: 'cqk', name: 'cuándo se escribe C', q: '¿Cuándo se escribe C con sonido /k/?', def: 'Se escribe C delante de a, o, u, y suena como /k/: casa, comida, cubo. Delante de e, i también se escribe C: cena, cine.', short: 'Delante de a, o, u (casa, comida, cubo)', keys: [['a', 'o', 'u'], ['delante']] },
    { id: 'regla_qu', world: 'cqk', name: 'cuándo se escribe QU', q: '¿Cuándo se escribe QU?', def: 'Se escribe QU delante de e, i. También suena como /k/: queso, quince, esquina.', short: 'Delante de e, i (queso, quince)', keys: [['e', 'i'], ['delante', 'antes']] },
    { id: 'regla_k', world: 'cqk', name: 'la letra K', q: '¿Cuándo se escribe K?', def: 'La K se usa solo en algunas palabras, como koala, kilo, kimono y karate.', short: 'Solo en algunas palabras (koala, kilo, kimono, karate)', keys: [['algunas', 'pocas', 'solo'], ['palabras', 'koala', 'kilo', 'kimono', 'karate']], min: 1 },
    { id: 'sonido_k', world: 'cqk', name: 'el sonido /k/', q: '¿Cómo se puede escribir el sonido /k/?', def: 'El sonido /k/ se puede escribir con C (ca, co, cu), con QU (que, qui) y con K en algunas palabras.', short: 'Con C (ca, co, cu), con QU (que, qui) y con K', keys: [['c'], ['qu'], ['k']], min: 2 },
    { id: 'regla_g', world: 'g', name: 'cuándo se escribe G', q: '¿Cuándo se escribe G con sonido /g/?', def: 'Se escribe G delante de a, o, u, y suena como /g/: gato, goma, gusano. Delante de e, i también se escribe G: gente, girasol.', short: 'Delante de a, o, u (gato, goma, gusano)', keys: [['a', 'o', 'u'], ['delante']] },
    { id: 'regla_gu', world: 'g', name: 'cuándo se escribe GU', q: '¿Cuándo se escribe GU?', def: 'Se escribe GU delante de e, i. La U no suena: guerra, guitarra, guía.', short: 'Delante de e, i y la U no suena (guitarra)', keys: [['e', 'i'], ['no suena', 'muda', 'no se oye', 'no se pronuncia']] },
    { id: 'regla_gue', world: 'g', name: 'cuándo se escribe GÜ', q: '¿Cuándo se escribe GÜ, con diéresis?', def: 'Se escribe GÜ delante de e, i cuando queremos que suene la U: pingüino, cigüeña, vergüenza.', short: 'Delante de e, i cuando queremos que suene la U (pingüino)', keys: [['e', 'i'], ['suene', 'suena', 'se oye', 'pronuncia']] },
    { id: 'comunicacion', world: 'comunicacion', name: 'la comunicación', q: '¿Qué es la comunicación?', def: 'La comunicación es el intercambio de información entre dos o más personas.', short: 'El intercambio de información entre dos o más personas', keys: [['intercambio', 'intercambiar', 'compartir'], ['informacion'], ['personas']], min: 2 },
    { id: 'oral', world: 'comunicacion', name: 'la comunicación oral', q: '¿Qué es la comunicación oral?', def: 'En la comunicación oral nos comunicamos hablando.', short: 'Nos comunicamos hablando', keys: [['hablando', 'hablamos', 'hablar', 'voz', 'palabras']] },
    { id: 'no_verbal', world: 'comunicacion', name: 'la comunicación no verbal', q: '¿Qué es la comunicación no verbal?', def: 'En la comunicación no verbal utilizamos gestos, expresiones y señales.', short: 'Usamos gestos, expresiones y señales', keys: [['gestos', 'gesto'], ['expresiones', 'senales', 'senal', 'cara']] },
    { id: 'medios', world: 'comunicacion', name: 'los medios de comunicación', q: '¿Qué medios de comunicación utilizamos?', def: 'Utilizamos distintos medios para comunicarnos: el teléfono, la carta, el ordenador, la televisión y los mensajes.', short: 'Teléfono, carta, ordenador, televisión y mensajes', keys: [['telefono', 'movil'], ['carta'], ['ordenador'], ['television', 'tele'], ['mensajes', 'mensaje']], min: 3 },
    { id: 'oracion', world: 'sujeto', name: 'las partes de la oración', q: '¿Qué dos partes tienen las oraciones?', def: 'Las oraciones tienen dos partes: el sujeto y el predicado.', short: 'El sujeto y el predicado', keys: [['sujeto'], ['predicado']] },
    { id: 'sujeto', world: 'sujeto', name: 'el sujeto', q: '¿Qué es el sujeto?', def: 'El sujeto es de quién se habla en la oración. Puede ser una persona, un animal o una cosa.', short: 'De quién se habla en la oración', keys: [['quien', 'quién'], ['habla']] },
    { id: 'predicado', world: 'sujeto', name: 'el predicado', q: '¿Qué es el predicado?', def: 'El predicado indica qué se dice del sujeto. Siempre tiene un verbo.', short: 'Lo que se dice del sujeto; siempre tiene un verbo', keys: [['dice', 'cuenta'], ['sujeto', 'verbo']] },
    { id: 'verbo', world: 'sujeto', name: 'el verbo', q: '¿Qué es el verbo?', def: 'El verbo es la palabra que indica la acción que realiza el sujeto. Puede estar en presente, pasado o futuro.', short: 'La palabra que indica la acción del sujeto', keys: [['accion', 'hace'], ['sujeto', 'palabra', 'presente', 'pasado', 'futuro']] },
  ];

  // ---------- listas: elegir todos los que son ----------
  const lists = [
    { id: 'sin_rapido', world: 'sinonimos', q: '¿Cuáles son sinónimos de «rápido»?', items: ['Veloz', 'Ligero'], distractors: ['Lento', 'Tranquilo', 'Despacio'] },
    { id: 'ant_lista', world: 'sinonimos', q: '¿Qué parejas son antónimos (lo contrario)?', items: ['Encender - apagar', 'Cerca - lejos', 'Limpio - sucio', 'Barato - caro'], distractors: ['Bonito - hermoso', 'Comenzar - empezar', 'Sencillo - fácil'] },
    { id: 'con_qu', world: 'cqk', q: '¿Qué palabras se escriben con QU?', items: ['Queso', 'Quince', 'Esquina', 'Mosquito'], distractors: ['Casa', 'Cubo', 'Koala', 'Cometa'] },
    { id: 'con_k', world: 'cqk', q: '¿Qué palabras se escriben con K?', items: ['Koala', 'Kilo', 'Kimono', 'Karate'], distractors: ['Queso', 'Casa', 'Cuna', 'Quince'] },
    { id: 'con_gu', world: 'g', q: '¿En qué palabras la U NO suena?', items: ['Guerra', 'Guitarra', 'Guía', 'Juguete'], distractors: ['Pingüino', 'Cigüeña', 'Vergüenza'] },
    { id: 'con_gue', world: 'g', q: '¿Qué palabras llevan diéresis (GÜ)?', items: ['Pingüino', 'Cigüeña', 'Vergüenza', 'Agüita'], distractors: ['Guitarra', 'Gato', 'Guerra', 'Gente'] },
    { id: 'medios_lista', world: 'comunicacion', q: '¿Cuáles son medios de comunicación?', items: ['Teléfono', 'Carta', 'Ordenador', 'Televisión', 'Mensajes'], distractors: ['Bicicleta', 'Nevera', 'Mochila'] },
    { id: 'no_verbal_lista', world: 'comunicacion', q: '¿Qué es comunicación NO verbal?', items: ['Sonreír', 'Levantar el pulgar', 'Una señal de STOP', 'Decir adiós con la mano'], distractors: ['Hablar por teléfono', 'Contar un cuento en voz alta'] },
    { id: 'verbos_lista', world: 'sujeto', q: '¿Cuáles son verbos (acciones)?', items: ['Juega', 'Corre', 'Comió', 'Saltará'], distractors: ['Parque', 'Niño', 'Azul', 'Mesa'] },
  ];

  // ---------- clasificar en cajones ----------
  const sorts = [
    { id: 'sin_ant', world: 'sinonimos', q: '¿Sinónimos o antónimos?', bins: ['Sinónimos (lo mismo)', 'Antónimos (lo contrario)'], items: [['Rápido - veloz', 0], ['Bonito - hermoso', 0], ['Comenzar - empezar', 0], ['Inteligente - listo', 0], ['Pequeño - diminuto', 0], ['Sencillo - fácil', 0], ['Encender - apagar', 1], ['Cerca - lejos', 1], ['Limpio - sucio', 1], ['Subir - bajar', 1], ['Barato - caro', 1], ['Juntar - separar', 1]] },
    { id: 'c_qu_k', world: 'cqk', q: '¿Con C, con QU o con K?', bins: ['C', 'QU', 'K'], items: [['casa', 0], ['comida', 0], ['cubo', 0], ['cama', 0], ['colina', 0], ['queso', 1], ['quince', 1], ['esquina', 1], ['koala', 2], ['kilo', 2], ['kimono', 2], ['karate', 2]] },
    { id: 'g_gu_gue', world: 'g', q: '¿Con G, con GU o con GÜ?', bins: ['G', 'GU', 'GÜ'], items: [['gato', 0], ['goma', 0], ['gusano', 0], ['gente', 0], ['girasol', 0], ['guerra', 1], ['guitarra', 1], ['guía', 1], ['pingüino', 2], ['cigüeña', 2], ['vergüenza', 2]] },
    { id: 'oral_noverbal', world: 'comunicacion', q: '¿Oral o no verbal?', bins: ['Oral (hablamos)', 'No verbal (gestos)'], items: [['Hablar por teléfono', 0], ['Contar un chiste', 0], ['Cantar una canción', 0], ['Explicar un juego', 0], ['Sonreír', 1], ['Pulgar arriba', 1], ['Señal de STOP', 1], ['Guiñar un ojo', 1]] },
    { id: 'suj_pred', world: 'sujeto', q: '¿Es un sujeto o un predicado?', bins: ['Sujeto (¿quién?)', 'Predicado (¿qué se dice?)'], items: [['El niño', 0], ['Mi gata', 0], ['Luffy', 0], ['La pelota', 0], ['juega en el parque', 1], ['duerme en el sofá', 1], ['come mucha carne', 1], ['rueda por el suelo', 1]] },
  ];

  // ---------- completar la palabra: hueco «_» + letras posibles (sale como pregunta de elegir) ----------
  const fills = [
    ['cqk', '_asa', 'c', ['c', 'qu', 'k']], ['cqk', '_omida', 'c', ['c', 'qu', 'k']], ['cqk', '_ubo', 'c', ['c', 'qu', 'k']], ['cqk', '_eso', 'qu', ['c', 'qu', 'k']],
    ['cqk', '_ince', 'qu', ['c', 'qu', 'k']], ['cqk', 'es_ina', 'qu', ['c', 'qu', 'k']], ['cqk', '_oala', 'k', ['c', 'qu', 'k']], ['cqk', '_ilo', 'k', ['c', 'qu', 'k']],
    ['cqk', '_arate', 'k', ['c', 'qu', 'k']], ['cqk', '_imono', 'k', ['c', 'qu', 'k']], ['cqk', '_ama', 'c', ['c', 'qu', 'k']], ['cqk', '_olina', 'c', ['c', 'qu', 'k']],
    ['cqk', 'mos_ito', 'qu', ['c', 'qu', 'k']], ['cqk', 'bar_o', 'c', ['c', 'qu', 'k']], ['cqk', 'pe_eño', 'qu', ['c', 'qu', 'k']], ['cqk', '_eremos', 'qu', ['c', 'qu', 'k']],
    ['g', '_ato', 'g', ['g', 'gu', 'gü']], ['g', '_oma', 'g', ['g', 'gu', 'gü']], ['g', '_usano', 'g', ['g', 'gu', 'gü']], ['g', '_erra', 'gu', ['g', 'gu', 'gü']],
    ['g', '_itarra', 'gu', ['g', 'gu', 'gü']], ['g', '_ía', 'gu', ['g', 'gu', 'gü']], ['g', 'pin_ino', 'gü', ['g', 'gu', 'gü']], ['g', 'ci_eña', 'gü', ['g', 'gu', 'gü']],
    ['g', 'ver_enza', 'gü', ['g', 'gu', 'gü']], ['g', 'ju_ete', 'gu', ['g', 'gu', 'gü']], ['g', 'ho_era', 'gu', ['g', 'gu', 'gü']], ['g', 'a_ita', 'gü', ['g', 'gu', 'gü']],
    ['g', 'lechu_a', 'g', ['g', 'gu', 'gü']], ['g', 'man_era', 'gu', ['g', 'gu', 'gü']],
  ];

  // ---------- frases para partir: [sujeto, predicado, verbo] ----------
  const frases = [
    ['El niño', 'juega en el parque', 'juega'], ['Luffy', 'come mucha carne', 'come'], ['Nami', 'dibuja un mapa', 'dibuja'],
    ['Mi gata', 'duerme en el sofá', 'duerme'], ['Hinata', 'salta muy alto', 'salta'], ['Tanjiro', 'protege a Nezuko', 'protege'],
    ['La pelota', 'rueda por el suelo', 'rueda'], ['Deku', 'entrenó toda la tarde', 'entrenó'], ['Los pingüinos', 'nadan en el agua fría', 'nadan'],
    ['María', 'leerá un libro mañana', 'leerá'], ['El koala', 'come hojas de eucalipto', 'come'], ['Mis amigos', 'cantaron una canción', 'cantaron'],
    ['La cigüeña', 'vuela sobre el pueblo', 'vuela'], ['Kageyama', 'pasa el balón a Hinata', 'pasa'], ['Zoro', 'se perdió otra vez', 'perdió'],
  ];

  // ---------- preguntas sueltas ----------
  const questions = [
    // sinónimos y antónimos
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «bonito» es…', options: ['hermoso', 'feo', 'grande'], a: 0 },
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «comenzar» es…', options: ['terminar', 'empezar', 'parar'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «inteligente» es…', options: ['listo', 'torpe', 'alto'], a: 0 },
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «pequeño» es…', options: ['enorme', 'diminuto', 'largo'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «sencillo» es…', options: ['difícil', 'fácil', 'raro'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'Un sinónimo de «rápido» es…', options: ['lento', 'veloz', 'quieto'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «encender» es…', options: ['prender', 'apagar', 'brillar'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «cerca» es…', options: ['lejos', 'junto', 'al lado'], a: 0 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «limpio» es…', options: ['brillante', 'sucio', 'nuevo'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «subir» es…', options: ['bajar', 'trepar', 'saltar'], a: 0 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «barato» es…', options: ['económico', 'caro', 'gratis'], a: 1 },
    { type: 'choice', world: 'sinonimos', q: 'El antónimo de «juntar» es…', options: ['unir', 'separar', 'pegar'], a: 1 },
    { type: 'tf', world: 'sinonimos', s: '«Rápido» y «veloz» son sinónimos.', a: true },
    { type: 'tf', world: 'sinonimos', s: '«Subir» y «bajar» son sinónimos.', a: false, why: 'Significan lo contrario: son antónimos.' },
    { type: 'tf', world: 'sinonimos', s: 'Los antónimos son palabras que significan lo contrario.', a: true },
    { type: 'tf', world: 'sinonimos', s: '«Bonito» y «hermoso» son antónimos.', a: false, why: 'Significan lo mismo: son sinónimos.' },
    { type: 'reto', world: 'sinonimos', q: 'Hinata es bajito y Tsukishima es muy alto. «Bajo» y «alto» son…', options: ['sinónimos', 'antónimos'], a: 1 },
    { type: 'reto', world: 'sinonimos', q: 'Cambia la palabra sin cambiar lo que dice: «La casa está limpia y es pequeña» → «La casa está limpia y es…»', options: ['diminuta', 'enorme', 'sucia'], a: 0, why: 'Diminuta es sinónimo de pequeña: la frase dice lo mismo.' },
    { type: 'reto', world: 'sinonimos', q: 'Kuroo dice: «Este partido es facilísimo». Hinata le contesta lo contrario: «¡Es…!»', options: ['dificilísimo', 'sencillísimo', 'facilón'], a: 0 },
    { type: 'reto', world: 'sinonimos', q: '¿Qué pareja es la rara?', options: ['rápido - veloz', 'bonito - hermoso', 'cerca - lejos'], a: 2, why: 'Cerca y lejos son antónimos; las otras dos son sinónimos.' },
    { type: 'reto', world: 'sinonimos', q: 'Si «encender» y «apagar» son antónimos, ¿qué pasa si pones «no» delante? «No encender» significa casi…', options: ['apagar', 'encender', 'brillar'], a: 0 },
    // C, QU, K
    { type: 'choice', world: 'cqk', q: 'Delante de a, o, u, el sonido /k/ se escribe con…', options: ['C', 'QU', 'K'], a: 0 },
    { type: 'choice', world: 'cqk', q: 'Delante de e, i, el sonido /k/ se escribe con…', options: ['C', 'QU', 'K'], a: 1 },
    { type: 'choice', world: 'cqk', q: '¿Cuál está bien escrita?', options: ['keso', 'queso', 'ceso'], a: 1 },
    { type: 'choice', world: 'cqk', q: '¿Cuál está bien escrita?', options: ['koala', 'coala', 'quoala'], a: 0, why: 'Koala es una de las pocas palabras que se escriben con K.' },
    { type: 'choice', world: 'cqk', q: '¿Cuál está bien escrita?', options: ['quasa', 'kasa', 'casa'], a: 2 },
    { type: 'choice', world: 'cqk', q: '¿Cuál está bien escrita?', options: ['esquina', 'escina', 'eskina'], a: 0 },
    { type: 'tf', world: 'cqk', s: 'Se escribe «quince» con QU porque va delante de la i.', a: true },
    { type: 'tf', world: 'cqk', s: 'La K se usa en muchísimas palabras.', a: false, why: 'Solo en algunas: koala, kilo, kimono, karate…' },
    { type: 'tf', world: 'cqk', s: 'En «cubo», la C suena como /k/.', a: true },
    { type: 'reto', world: 'cqk', q: 'Luffy quiere escribir el sonido /k/ delante de la E. ¿Qué letras usa?', options: ['QU, como en «queso»', 'C, como en «ceso»', 'CU, como en «cueso»'], a: 0 },
    { type: 'reto', world: 'cqk', q: '«Barco» en plural es «barcos». ¿Y «barquito»? ¿Por qué cambia la C por QU?', options: ['Porque ahora va delante de la i', 'Porque es más pequeño', 'Porque es un barco pirata'], a: 0 },
    { type: 'reto', world: 'cqk', q: 'Chopper pesa 2… ¿cómo se escribe? «2 _ilos»', options: ['kilos', 'quilos', 'cilos'], a: 0 },
    { type: 'reto', world: 'cqk', q: '¿Qué palabra NO tiene el sonido /k/?', options: ['cena', 'casa', 'queso'], a: 0, why: '«Cena» se escribe con C delante de e, pero no suena /k/.' },
    // G, GU, GÜ
    { type: 'choice', world: 'g', q: 'Delante de a, o, u, el sonido /g/ se escribe con…', options: ['G', 'GU', 'GÜ'], a: 0 },
    { type: 'choice', world: 'g', q: 'Delante de e, i, para el sonido /g/ (como en «guitarra») se escribe…', options: ['G', 'GU', 'J'], a: 1 },
    { type: 'choice', world: 'g', q: '¿Cuándo se ponen los dos puntitos (diéresis) en la Ü?', options: ['Cuando queremos que suene la U', 'Siempre después de la G', 'Nunca'], a: 0 },
    { type: 'choice', world: 'g', q: '¿Cuál está bien escrita?', options: ['pinguino', 'pingüino', 'pingino'], a: 1 },
    { type: 'choice', world: 'g', q: '¿Cuál está bien escrita?', options: ['guitarra', 'güitarra', 'gitarra'], a: 0 },
    { type: 'choice', world: 'g', q: '¿Cuál está bien escrita?', options: ['ciguëña', 'cigueña', 'cigüeña'], a: 2 },
    { type: 'tf', world: 'g', s: 'En «guerra» la U no suena.', a: true },
    { type: 'tf', world: 'g', s: 'En «pingüino» la U sí suena.', a: true },
    { type: 'tf', world: 'g', s: '«Gente» y «girasol» se escriben con GU.', a: false, why: 'Se escriben con G: gente, girasol.' },
    { type: 'reto', world: 'g', q: 'Si a «pingüino» le quitas la diéresis, ¿cómo se leería?', options: ['«pinguino», con la U muda', 'igual', 'pingoino'], a: 0 },
    { type: 'reto', world: 'g', q: 'Tanjiro toca la «_itarra». ¿Qué falta?', options: ['gu', 'g', 'gü'], a: 0 },
    { type: 'reto', world: 'g', q: '«Agua» → «agüita». ¿Por qué lleva diéresis?', options: ['Para que la U siga sonando delante de la i', 'Porque es poca agua', 'Porque está fría'], a: 0 },
    // comunicación
    { type: 'choice', world: 'comunicacion', q: 'La comunicación es…', options: ['el intercambio de información entre dos o más personas', 'hablar solo', 'escribir en la pizarra'], a: 0 },
    { type: 'choice', world: 'comunicacion', q: 'Hablar con tu amiga es comunicación…', options: ['oral', 'no verbal'], a: 0 },
    { type: 'choice', world: 'comunicacion', q: 'Levantar el pulgar 👍 es comunicación…', options: ['oral', 'no verbal'], a: 1 },
    { type: 'choice', world: 'comunicacion', q: 'Una señal de STOP es comunicación…', options: ['oral', 'no verbal'], a: 1 },
    { type: 'choice', world: 'comunicacion', q: '¿Cuál NO es un medio de comunicación?', options: ['teléfono', 'carta', 'bicicleta', 'televisión'], a: 2 },
    { type: 'tf', world: 'comunicacion', s: 'Para comunicarse hacen falta dos o más personas.', a: true },
    { type: 'tf', world: 'comunicacion', s: 'Sonreír es comunicación oral.', a: false, why: 'Sonreír es un gesto: comunicación no verbal.' },
    { type: 'tf', world: 'comunicacion', s: 'Un mensaje en el móvil es un medio de comunicación.', a: true },
    { type: 'reto', world: 'comunicacion', q: 'Deku y All Might se miran y asienten sin decir nada. ¿Se están comunicando?', options: ['Sí, con comunicación no verbal', 'No, porque no hablan'], a: 0 },
    { type: 'reto', world: 'comunicacion', q: 'Escribes una carta a tu abuela. ¿Quién recibe la información?', options: ['La abuela', 'El cartero', 'Nadie'], a: 0 },
    { type: 'reto', world: 'comunicacion', q: 'En un partido de vóley, el árbitro pita y señala con el brazo. ¿Qué comunicación usa?', options: ['Solo oral', 'No verbal (gestos y señales)'], a: 1 },
    // sujeto y predicado
    { type: 'choice', world: 'sujeto', q: 'Las oraciones tienen dos partes:', options: ['sujeto y predicado', 'principio y final', 'verbo y punto'], a: 0 },
    { type: 'choice', world: 'sujeto', q: 'Para encontrar el sujeto preguntamos…', options: ['¿Quién?', '¿Cuándo?', '¿Cuánto?'], a: 0 },
    { type: 'choice', world: 'sujeto', q: 'El predicado siempre tiene…', options: ['un verbo', 'un nombre de persona', 'un número'], a: 0 },
    { type: 'choice', world: 'sujeto', q: '«Comió» está en…', options: ['pasado', 'presente', 'futuro'], a: 0 },
    { type: 'choice', world: 'sujeto', q: '«Saltará» está en…', options: ['pasado', 'presente', 'futuro'], a: 2 },
    { type: 'choice', world: 'sujeto', q: '«Juega» está en…', options: ['pasado', 'presente', 'futuro'], a: 1 },
    { type: 'tf', world: 'sujeto', s: 'El sujeto puede ser una persona, un animal o una cosa.', a: true },
    { type: 'tf', world: 'sujeto', s: 'El verbo indica la acción que realiza el sujeto.', a: true },
    { type: 'tf', world: 'sujeto', s: 'El predicado nunca tiene verbo.', a: false, why: 'El predicado SIEMPRE tiene un verbo.' },
    { type: 'reto', world: 'sujeto', q: '«En el parque juega el niño». ¿Quién juega?', options: ['el niño', 'en el parque', 'juega'], a: 0, why: 'El sujeto puede ir al final: pregunta ¿quién?' },
    { type: 'reto', world: 'sujeto', q: 'Cambia el verbo al futuro: «Nami dibuja un mapa» → «Nami ___ un mapa»', options: ['dibujará', 'dibujó', 'dibuja'], a: 0 },
    { type: 'reto', world: 'sujeto', q: '«La pelota rueda». ¿El sujeto es una persona, un animal o una cosa?', options: ['una cosa', 'una persona', 'un animal'], a: 0 },
  ];
  // los huecos de letras entran como preguntas de elegir (tipo «fill»: botones grandes con letras)
  fills.forEach(([w, word, a, opts]) => questions.push({ type: 'fill', world: w, q: 'Completa: ' + word.replace('_', '__'), word, options: opts, a: opts.indexOf(a), why: 'Se escribe «' + word.replace('_', a) + '».' }));

  // ---------- «¿Sabías que…?» ----------
  const facts = [
    { id: 'f1', world: 'sinonimos', text: 'El español tiene más de noventa mil palabras en el diccionario, y muchísimas tienen sinónimos.' },
    { id: 'f2', world: 'sinonimos', text: 'Los antónimos que se forman poniendo «des» delante se llaman así porque «des» significa «lo contrario»: hacer y deshacer, atar y desatar.' },
    { id: 'f3', world: 'cqk', text: 'La K casi no se usa en español: casi todas las palabras con K vienen de otros idiomas, como koala, que viene de Australia, o kimono, que viene de Japón.' },
    { id: 'f4', world: 'cqk', text: 'Karate es una palabra japonesa que significa «mano vacía»: se pelea sin armas.' },
    { id: 'f5', world: 'g', text: 'Los dos puntitos de la Ü se llaman diéresis. En español solo se ponen encima de la U.' },
    { id: 'f6', world: 'g', text: 'Los pingüinos no pueden volar, pero nadan tan rápido como un delfín pequeño.' },
    { id: 'f7', world: 'comunicacion', text: 'Las abejas se comunican bailando: con su baile les dicen a las otras dónde hay flores.' },
    { id: 'f8', world: 'comunicacion', text: 'El primer mensaje de texto de la historia se envió en 1992 y decía «Feliz Navidad».' },
    { id: 'f9', world: 'sujeto', text: 'En español a veces el sujeto se esconde: en «Jugamos al vóley» el sujeto es «nosotros», aunque no aparezca.' },
    { id: 'f10', world: 'sujeto', text: 'Los verbos en infinitivo terminan en -ar, -er o -ir: saltar, comer, vivir.' },
  ];

  // ---------- chistes ----------
  const jokes = [
    { who: 'Luffy', q: '¿Qué le dice un queso a otro queso?', a: '¡Qué bien te veo, estás muy curado!' },
    { who: 'Nami', q: '¿Cuál es el colmo de un diccionario?', a: 'Quedarse sin palabras.' },
    { who: 'Tanjiro', q: '¿Qué le dice una G a una U?', a: '¡Contigo delante de la E, ya no suena nada!' },
    { who: 'Hinata', q: '¿Cuál es el antónimo de «salto»?', a: '¡Ninguno! Yo nunca dejo de saltar.' },
    { who: 'Nezuko', q: '¿Por qué el pingüino lleva diéresis?', a: 'Para que se oiga cuando dice «u-u-u» de frío.' },
    { who: 'Luffy', q: '¿Qué le dice el koala a la K?', a: '¡Sin ti yo no sería nadie!' },
    { who: 'Zenitsu', q: '¿Qué hace un verbo en el gimnasio?', a: '¡Acción, acción y más acción!' },
    { who: 'Chopper', q: '¿Cómo se dice «pañuelo» en japonés?', a: '¡Saka-moko!' },
    { who: 'Hinata', q: '¿Qué le dice un sujeto a un predicado?', a: '¡Sin mí no sabrías de quién hablas!' },
    { who: 'Nami', q: 'Profe: «Dime una oración con sujeto». Alumno: «El sujeto se fue».', a: 'Profe: «¿Y el predicado?». Alumno: «¡Se fue con él!»' },
    { who: 'Inosuke', q: '¿Por qué el libro de Lengua está siempre tranquilo?', a: 'Porque tiene todas sus palabras en orden.' },
    { who: 'Ochaco', q: '¿Qué le dice una carta a un móvil?', a: '¡Tú eres muy rápido, pero yo tengo sello!' },
    { who: 'Tanjiro', q: '¿Qué le dice el sinónimo a su amigo?', a: '¡Tú y yo somos casi lo mismo!' },
    { who: 'Luffy', q: '¿Por qué la vaca no usa el móvil?', a: 'Porque prefiere la comunicación «muuuu» verbal.' },
    { who: 'Nezuko', q: '¿Qué le dice una cigüeña a otra cigüeña?', a: '¡Qué vergüenza, hemos perdido los puntitos!' },
    { who: 'Chopper', q: '¿Cuál es el colmo de una guitarra?', a: 'Que la U no suene… ¡y ella sí!' },
  ];
  const VOICE_OF = { Ochaco: 'girl', Nezuko: 'girl', Chopper: 'girl', Nami: 'woman', Tanjiro: 'boy', Hinata: 'boy', Luffy: 'boy', Zenitsu: 'boy', Inosuke: 'boy' };

  // ---------- frases de los personajes (voz) ----------
  const lines = {
    w_sinonimos: '¡Hola, María! Soy Hinata. Kageyama y yo somos casi contrarios, ¡pero juntos somos invencibles! Vamos con sinónimos y antónimos.',
    w_cqk: '¡Hola, María! Soy Luffy. Casa, queso y koala suenan igual al principio, ¡pero se escriben distinto! ¡Al abordaje!',
    w_g: '¡Hola, María! Soy Tanjiro. Gato, guitarra y pingüino: con mi olfato descubrimos cuándo suena la U.',
    w_comunicacion: '¡Hola, María! Soy Deku. Un héroe tiene que saber comunicarse: hablando, con gestos y con todos los medios.',
    w_sujeto: '¡Hola, María! Soy Nami. Toda frase tiene su mapa: quién es el sujeto, qué se dice de él y dónde está el verbo.',
    cs_intro: '¡Hola, María! Bienvenida a Lengua. Cinco temas, cinco aventuras. ¡Vamos!',
    learn_1: 'Primero te lo enseño. Escucha y mira.',
    learn_3: '¡Última prueba! ¿Qué es esto?',
    write_start: 'Escribe la regla con tus palabras. Las palabras importantes tienen que estar.',
    write_fix: 'Casi. Mira la ficha, escúchala y escríbela tú.',
    sort_start: 'Pon cada palabra en su cajón.',
    list_start: 'Toca todos los que son. ¡Cuidado con los intrusos!',
    reto_start: '¡Pregunta reto! Aquí hay que pensar.',
    fill_start: '¿Qué letra falta? Toca la buena.',
    parts_start: 'Toca el trozo que te pido de la frase.',
    sobre: '¡Un sobre sorpresa! ¿Qué habrá dentro?',
    sticker: '¡Pegatina nueva para tu álbum!',
    quick_start: '¿Ya lo sabes? Demuéstralo. Si aciertas, nos saltamos lo fácil.',
    quick_pass: '¡Lo tenías! Nos saltamos lo fácil y vamos a lo difícil.',
    world_done: '¡Tema dominado! Tres estrellas. ¡Eres increíble!',
    mixed_start: 'Mezcla de todos los temas. ¡Concéntrate!',
    p_sujeto: '¿Cuál es el sujeto? Pregunta: ¿quién?',
    p_predicado: '¿Cuál es el predicado? ¿Qué se dice del sujeto?',
    p_verbo: '¿Cuál es el verbo? ¿Qué hace?',
  };

  const byWorld = (arr, w) => arr.filter(x => x.world === w);
  const hash = t => { let h = 5381; const n = String(t); for (let i = 0; i < n.length; i++) h = ((h * 33) ^ n.charCodeAt(i)) >>> 0; return h.toString(36); };
  return { hash, SPOT: {}, VOICE_OF, worlds, WORLD_ORDER, concepts, lists, sorts, questions, frases, scenes: {}, facts, jokes, lines, byWorld, concept: id => concepts.find(c => c.id === id) };
})();
