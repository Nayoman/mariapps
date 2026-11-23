/* Ciencias Sociales · TEMA 2 «Necesitamos el agua para vivir» (examen 11-nov-2026, CS-D2/CS-D3). Fuente: fotos en ../CienciasSociales/examen11_11/.
   Mismo motor que el Tema 1 (../ciencias/). Definiciones y listas = las de las fichas; las RETO hacen pensar con lo mismo. */
window.CS = (function () {
  const worlds = {
    marinas: { id: 'marinas', series: 'onepiece', title: 'Las aguas marinas', sub: 'Mares, océanos, olas y mareas', hero: 'nami', heroName: 'Nami', heroImg: '../tablas/assets/img/ch_nami.webp', bg: '../tablas/assets/img/bg_onepiece.webp', music: 'music_onepiece', boss: { id: 'buggy', name: 'Buggy el Payaso', img: '../tablas/assets/img/boss_buggy.webp', hp: 8, intro: '¡Buggy quiere ensuciar el mar con petróleo!' }, win: '../tablas/assets/img/win_onepiece.webp', intro: 'w_marinas', badge: '🌊' },
    rios: { id: 'rios', series: 'haikyuu', title: 'Los ríos', sub: 'Afluentes, cauce y caudal', hero: 'hinata', heroName: 'Hinata', heroImg: '../tablas/assets/img/ch_hinata.webp', bg: '../tablas/assets/img/bg_haikyuu.webp', music: 'music_haikyuu', boss: { id: 'kuroo', name: 'Kuroo (Nekoma)', img: '../tablas/assets/img/boss_kuroo.webp', hp: 8, intro: '¡Kuroo te reta a ver quién sabe más de ríos!' }, win: '../tablas/assets/img/win_haikyuu.webp', intro: 'w_rios', badge: '🏞️' },
    recorrido: { id: 'recorrido', series: 'demonslayer', title: 'El recorrido de un río', sub: 'Curso alto, medio y bajo', hero: 'tanjiro', heroName: 'Tanjiro', heroImg: '../tablas/assets/img/ch_tanjiro.webp', bg: '../tablas/assets/img/bg_demonslayer.webp', music: 'music_demonslayer', boss: { id: 'oni', name: 'Oni del río', img: '../tablas/assets/img/boss_demon.webp', hp: 8, intro: '¡Un oni ha cortado el río en la montaña!' }, win: '../tablas/assets/img/win_demonslayer.webp', intro: 'w_recorrido', badge: '〰️' },
    otras: { id: 'otras', series: 'mha', title: 'Otras aguas y ríos de España', sub: 'Lagos, hielos, aguas subterráneas y vertientes', hero: 'ochaco', heroName: 'Ochaco', heroImg: 'assets/img/ch_ochaco.webp', bg: 'assets/img/bg_mha.webp', music: 'music_mha', boss: { id: 'villano', name: 'Gentle Criminal', img: 'assets/img/boss_gentle.webp', hp: 8, intro: '¡Gentle Criminal quiere borrar las vertientes del mapa!' }, win: 'assets/img/win_mha.webp', intro: 'w_otras', badge: '🗺️' },
  };
  const WORLD_ORDER = ['marinas', 'rios', 'recorrido', 'otras'];

  const concepts = [
    // Ficha 1 · aguas marinas
    { id: 'aguas_marinas', world: 'marinas', name: 'las aguas marinas', q: '¿Qué son las aguas marinas y cuánto ocupan?', def: 'Las aguas marinas ocupan tres cuartas partes de la superficie de la Tierra. Están formadas por los mares y los océanos.', short: '¾ de la Tierra; mares y océanos', keys: [['mares', 'mar'], ['oceanos', 'oceano'], ['tres cuartas', 'tres cuartos', '3/4']], min: 2 },
    { id: 'saladas', world: 'marinas', name: 'por qué son saladas', q: '¿Por qué las aguas marinas son saladas?', def: 'Las aguas marinas son saladas porque tienen muchos minerales disueltos.', short: 'Tienen muchos minerales disueltos', keys: [['minerales', 'mineral']] },
    { id: 'movimiento', world: 'marinas', name: 'el movimiento del mar', q: '¿Por qué las aguas marinas están en continuo movimiento?', def: 'Las aguas marinas están en continuo movimiento debido a las olas y las mareas.', short: 'Por las olas y las mareas', keys: [['olas', 'ola'], ['mareas', 'marea']] },
    { id: 'vida_marina', world: 'marinas', name: 'la vida marina', q: '¿Qué seres vivos viven en los mares y océanos?', def: 'En los mares y océanos viven muchos seres vivos, como peces, moluscos, corales o ballenas.', short: 'Peces, moluscos, corales, ballenas', keys: [['peces', 'pez'], ['moluscos', 'molusco', 'corales', 'coral', 'ballenas', 'ballena']] },
    { id: 'aprovechar_mar', world: 'marinas', name: 'cómo aprovechamos el mar', q: '¿Para qué utilizamos las aguas marinas?', def: 'Utilizamos las aguas marinas para muchas actividades: el transporte, el ocio y la pesca.', short: 'Transporte, ocio y pesca', keys: [['transporte', 'barcos'], ['ocio', 'playa', 'banarse'], ['pesca', 'pescar']], min: 2 },
    { id: 'cientificamente', world: 'marinas', name: 'lo que nos da el mar', q: '¿Qué obtenemos del mar y qué debemos hacer con él?', def: 'Del mar obtenemos petróleo y algunos medicamentos. Pero también debemos cuidarlo y no contaminarlo.', short: 'Petróleo y medicamentos; cuidarlo y no contaminarlo', keys: [['petroleo', 'medicamentos', 'medicinas'], ['cuidar', 'cuidarlo', 'contaminar', 'contaminarlo']] },
    // Ficha 2 · los ríos
    { id: 'continentales', world: 'rios', name: 'las aguas continentales', q: '¿Qué son las aguas continentales?', def: 'En los continentes hay agua dulce en los ríos, arroyos, lagos, torrentes… Forman las aguas continentales.', short: 'El agua dulce de ríos, arroyos, lagos, torrentes…', keys: [['dulce'], ['rios', 'rio', 'lagos', 'lago', 'arroyos', 'torrentes']] },
    { id: 'rio', world: 'rios', name: 'un río', q: '¿Qué es un río?', def: 'Un río es una corriente de agua dulce que discurre de forma continua por la superficie de la Tierra hasta llegar al mar.', short: 'Corriente de agua dulce que va sin parar hasta el mar', keys: [['corriente'], ['dulce'], ['mar']], min: 2 },
    { id: 'afluente', world: 'rios', name: 'un afluente', q: '¿Qué es un afluente?', def: 'Los afluentes son ríos que no desembocan en el mar, sino en otros ríos.', short: 'Un río que desemboca en otro río', keys: [['rio', 'rios'], ['otro', 'otros']] },
    { id: 'cauce', world: 'rios', name: 'el cauce', q: '¿Qué es el cauce de un río?', def: 'El cauce es el terreno hundido por el que corre el agua. Puede ser muy ancho, como el del río Amazonas, o muy estrecho.', short: 'El terreno hundido por el que corre el agua', keys: [['terreno', 'suelo'], ['hundido', 'corre', 'va el agua', 'pasa']] },
    { id: 'caudal', world: 'rios', name: 'el caudal', q: '¿Qué es el caudal de un río?', def: 'El caudal es la cantidad de agua que lleva el río. Aumenta en primavera y en invierno, y disminuye en verano.', short: 'La cantidad de agua que lleva el río', keys: [['cantidad'], ['agua']] },
    { id: 'embalse', world: 'rios', name: 'los embalses', q: '¿Para qué sirven los embalses?', def: 'Los embalses almacenan agua para nuestro uso.', short: 'Almacenan agua para nuestro uso', keys: [['almacenan', 'almacenar', 'guardan', 'guardar'], ['agua']] },
    { id: 'aprovechar_rios', world: 'rios', name: 'cómo aprovechamos los ríos', q: '¿Para qué utilizamos el agua de los ríos?', def: 'Utilizamos el agua de los ríos para los embalses, que almacenan agua para nuestro uso; para el ocio, como el piragüismo o los deportes; y para el transporte, porque en algunos ríos navegamos para comunicarnos.', short: 'Embalses, ocio y transporte', keys: [['embalses', 'embalse'], ['ocio', 'piraguismo', 'deportes'], ['transporte', 'navegar', 'navegamos']], min: 2 },
    { id: 'vida_rios', world: 'rios', name: 'la vida en los ríos', q: '¿Por qué decimos que los ríos son una fuente de vida?', def: 'Los ríos son una fuente de vida: en sus aguas y orillas viven muchos animales, como la trucha, la nutria o la garza.', short: 'En sus aguas y orillas viven trucha, nutria, garza…', keys: [['animales', 'trucha', 'nutria', 'garza']] },
    // Ficha 3 · el recorrido de un río
    { id: 'curso', world: 'recorrido', name: 'el curso de un río', q: '¿Qué es el curso de un río y en qué partes se divide?', def: 'El curso es el recorrido que hace un río desde su nacimiento hasta su desembocadura. Se divide en tres partes: curso alto, curso medio y curso bajo.', short: 'Del nacimiento a la desembocadura: alto, medio y bajo', keys: [['recorrido', 'camino'], ['nacimiento', 'nace'], ['desembocadura', 'desemboca'], ['alto'], ['medio'], ['bajo']], min: 3 },
    { id: 'nacimiento', world: 'recorrido', name: 'el nacimiento', q: '¿Dónde nace un río?', def: 'Un río nace en las montañas: ese es su nacimiento, donde empieza el curso alto.', short: 'En las montañas', keys: [['montanas', 'montana']] },
    { id: 'curso_alto', world: 'recorrido', name: 'el curso alto', q: '¿Cómo es el curso alto de un río?', def: 'El curso alto es el recorrido del río desde su nacimiento en las montañas hasta que llega a terrenos llanos. Discurre por paisajes de montaña, su cauce es estrecho y poco profundo, y lleva poca agua porque el terreno está en pendiente.', short: 'Montaña, cauce estrecho y poco profundo, poca agua, pendiente', keys: [['montana', 'montanas'], ['estrecho'], ['poco profundo', 'poca agua', 'pendiente']], min: 2 },
    { id: 'curso_medio', world: 'recorrido', name: 'el curso medio', q: '¿Cómo es el curso medio de un río?', def: 'En el curso medio el río llega a paisajes de llanura y la pendiente del terreno desciende. Recibe agua de numerosos afluentes. Su cauce es más ancho y profundo, y su caudal aumenta. El agua discurre lentamente y forma curvas llamadas meandros.', short: 'Llanura, afluentes, más ancho y profundo, meandros', keys: [['llanura', 'llano'], ['afluentes', 'afluente'], ['meandros', 'curvas'], ['ancho', 'profundo', 'caudal']], min: 2 },
    { id: 'meandro', world: 'recorrido', name: 'los meandros', q: '¿Qué son los meandros?', def: 'Los meandros son las curvas que forma el río en el curso medio, cuando el agua discurre lentamente.', short: 'Las curvas del río en el curso medio', keys: [['curvas', 'curva']] },
    { id: 'curso_bajo', world: 'recorrido', name: 'el curso bajo', q: '¿Cómo es el curso bajo de un río?', def: 'El curso bajo es el último tramo del río y se aproxima a la costa. El cauce se hace más ancho y profundo, y el caudal, más abundante. La pendiente disminuye hasta llegar a la desembocadura, donde vierte sus aguas al mar.', short: 'Último tramo: muy ancho, mucho caudal, llega al mar', keys: [['ultimo', 'final'], ['costa', 'mar', 'desembocadura'], ['ancho', 'profundo', 'abundante']], min: 2 },
    { id: 'desembocadura', world: 'recorrido', name: 'la desembocadura', q: '¿Qué es la desembocadura?', def: 'La desembocadura es el final del río, donde vierte sus aguas al mar.', short: 'Donde el río vierte sus aguas al mar', keys: [['vierte', 'echa', 'llega', 'acaba', 'termina', 'final'], ['mar']] },
    // Ficha 4 · otras aguas y ríos de España
    { id: 'otras_aguas', world: 'otras', name: 'otras aguas dulces', q: '¿En qué otros lugares de la Tierra hay agua dulce?', def: 'Otros lugares de la Tierra donde podemos encontrar agua dulce son los lagos, los hielos de los Polos y las aguas subterráneas.', short: 'Lagos, hielos de los Polos y aguas subterráneas', keys: [['lagos', 'lago'], ['hielos', 'hielo', 'polos'], ['subterraneas', 'subterranea']], min: 2 },
    { id: 'lago', world: 'otras', name: 'un lago', q: '¿Qué es un lago?', def: 'Los lagos son extensiones de agua rodeadas de tierra por todas partes. Si son pequeños, se llaman lagunas.', short: 'Agua rodeada de tierra por todas partes', keys: [['agua'], ['rodeadas', 'rodeada', 'rodeado', 'rodeados'], ['tierra']], min: 2 },
    { id: 'laguna', world: 'otras', name: 'una laguna', q: '¿Qué es una laguna?', def: 'Una laguna es un lago pequeño.', short: 'Un lago pequeño', keys: [['lago'], ['pequeno', 'pequena', 'chico']] },
    { id: 'hielos', world: 'otras', name: 'los hielos de la Tierra', q: '¿Cómo está la mayor parte del agua dulce de la Tierra y dónde?', def: 'La mayor parte del agua dulce de la Tierra está en forma de hielo. Se encuentra en las zonas frías: los Polos y las cumbres montañosas.', short: 'En hielo: en los Polos y las cumbres montañosas', keys: [['hielo'], ['polos', 'cumbres', 'frias', 'montanas']] },
    { id: 'subterraneas', world: 'otras', name: 'las aguas subterráneas', q: '¿Qué son las aguas subterráneas?', def: 'Parte del agua de la lluvia y de la nieve se filtra por el terreno y se almacena bajo tierra. Se acumula en acuíferos y en ríos subterráneos.', short: 'Agua de lluvia y nieve guardada bajo tierra (acuíferos)', keys: [['lluvia', 'nieve'], ['filtra', 'bajo tierra', 'debajo'], ['acuiferos', 'subterraneos', 'acuifero']], min: 2 },
    { id: 'desembocan_espana', world: 'otras', name: 'dónde desembocan los ríos de España', q: '¿Dónde desembocan los ríos de España?', def: 'Los ríos de España desembocan en el océano Atlántico, el mar Mediterráneo y el mar Cantábrico.', short: 'Atlántico, Mediterráneo y Cantábrico', keys: [['atlantico'], ['mediterraneo'], ['cantabrico']], min: 3 },
    { id: 'vertientes', world: 'otras', name: 'las vertientes de España', q: '¿Cuántas vertientes hay en España y cuáles son?', def: 'En España hay tres vertientes, según el mar en el que desembocan los ríos: la vertiente atlántica, la vertiente mediterránea y la vertiente cantábrica.', short: 'Tres: atlántica, mediterránea y cantábrica', keys: [['atlantica'], ['mediterranea'], ['cantabrica']], min: 3 },
  ];

  const lists = [
    { id: 'aprov_mar', world: 'marinas', q: '¿Para qué utilizamos las aguas marinas?', items: ['Transporte', 'Ocio', 'Pesca'], distractors: ['Embalses', 'Beber del grifo', 'Regar los huertos'] },
    { id: 'seres_mar', world: 'marinas', q: '¿Cuáles viven en los mares y océanos?', items: ['Peces', 'Moluscos', 'Corales', 'Ballenas'], distractors: ['Truchas', 'Nutrias', 'Garzas'] },
    { id: 'del_mar', world: 'marinas', q: '¿Qué obtenemos del mar?', items: ['Petróleo', 'Algunos medicamentos'], distractors: ['Agua dulce para beber', 'Hielo de los Polos'] },
    { id: 'aguas_cont', world: 'rios', q: '¿Dónde hay agua dulce en los continentes?', items: ['Ríos', 'Arroyos', 'Lagos', 'Torrentes'], distractors: ['Mares', 'Océanos'] },
    { id: 'aprov_rio', world: 'rios', q: '¿Para qué utilizamos el agua de los ríos?', items: ['Embalses', 'Ocio (piragüismo)', 'Transporte'], distractors: ['Sacar petróleo', 'Pescar ballenas'] },
    { id: 'animales_rio', world: 'rios', q: '¿Qué animales viven en los ríos y sus orillas?', items: ['Trucha', 'Nutria', 'Garza'], distractors: ['Ballena', 'Coral', 'Pulpo'] },
    { id: 'partes_curso', world: 'recorrido', q: '¿En qué tres partes se divide el curso de un río?', items: ['Curso alto', 'Curso medio', 'Curso bajo'], distractors: ['Curso ancho', 'Curso salado', 'Curso final'] },
    { id: 'medio_lista', world: 'recorrido', q: '¿Qué pasa en el curso medio?', items: ['Llega a paisajes de llanura', 'Recibe numerosos afluentes', 'Forma meandros', 'Su caudal aumenta'], distractors: ['Cauce estrecho y poco profundo', 'Vierte sus aguas al mar'] },
    { id: 'alto_lista', world: 'recorrido', q: '¿Cómo es el curso alto?', items: ['Paisajes de montaña', 'Cauce estrecho', 'Poco profundo', 'Poca agua'], distractors: ['Forma meandros', 'Caudal muy abundante'] },
    { id: 'agua_dulce', world: 'otras', q: '¿Dónde más hay agua dulce en la Tierra?', items: ['Lagos', 'Hielos de los Polos', 'Aguas subterráneas'], distractors: ['Mares', 'Océanos'] },
    { id: 'mares_espana', world: 'otras', q: '¿Dónde desembocan los ríos de España?', items: ['Océano Atlántico', 'Mar Mediterráneo', 'Mar Cantábrico'], distractors: ['Océano Pacífico', 'Océano Índico'] },
    { id: 'vertientes_lista', world: 'otras', q: '¿Cuáles son las vertientes de España?', items: ['Atlántica', 'Mediterránea', 'Cantábrica'], distractors: ['Pacífica', 'Índica', 'Ártica'] },
    { id: 'zonas_frias', world: 'otras', q: '¿Dónde está el hielo de la Tierra?', items: ['Los Polos', 'Las cumbres montañosas'], distractors: ['Las playas', 'Las llanuras'] },
  ];

  const sorts = [
    { id: 'salada_dulce', world: 'marinas', q: '¿Agua salada o agua dulce?', bins: ['Salada', 'Dulce'], items: [['Mares', 0], ['Océanos', 0], ['Ríos', 1], ['Lagos', 1], ['Arroyos', 1], ['Hielos de los Polos', 1], ['Aguas subterráneas', 1]] },
    { id: 'mar_rio', world: 'rios', q: '¿Lo sacamos del mar o del río?', bins: ['Del mar', 'Del río'], items: [['Pesca', 0], ['Petróleo', 0], ['Medicamentos', 0], ['Embalses', 1], ['Piragüismo', 1]] },
    { id: 'cauce_caudal', world: 'rios', q: '¿Cauce o caudal?', bins: ['Cauce', 'Caudal'], items: [['Terreno hundido por el que corre el agua', 0], ['Puede ser muy ancho o muy estrecho', 0], ['El del Amazonas es muy ancho', 0], ['Cantidad de agua que lleva el río', 1], ['Aumenta en primavera e invierno', 1], ['Disminuye en verano', 1]] },
    { id: 'cursos', world: 'recorrido', q: '¿Curso alto, medio o bajo?', bins: ['Alto', 'Medio', 'Bajo'], items: [['Nace en las montañas', 0], ['Cauce estrecho', 0], ['Lleva poca agua', 0], ['Paisajes de llanura', 1], ['Recibe afluentes', 1], ['Forma meandros', 1], ['Último tramo', 2], ['Llega al mar', 2], ['Caudal más abundante', 2]] },
    { id: 'tipo_agua', world: 'otras', q: '¿Lago, hielo o agua subterránea?', bins: ['Lagos', 'Hielos', 'Subterráneas'], items: [['Rodeado de tierra por todas partes', 0], ['Si es pequeño, laguna', 0], ['En los Polos', 1], ['En las cumbres montañosas', 1], ['Se filtra por el terreno', 2], ['Acuíferos', 2], ['Ríos subterráneos', 2]] },
  ];

  const questions = [
    // Aguas marinas
    { type: 'choice', world: 'marinas', q: '¿Cuánto de la superficie de la Tierra ocupan las aguas marinas?', options: ['La mitad', 'Tres cuartas partes', 'Una cuarta parte', 'Toda'], a: 1 },
    { type: 'choice', world: 'marinas', q: 'Las aguas marinas están formadas por…', options: ['los ríos y los lagos', 'los mares y los océanos', 'los hielos', 'los embalses'], a: 1 },
    { type: 'choice', world: 'marinas', q: '¿Por qué el agua del mar es salada?', options: ['Porque tiene muchos minerales disueltos', 'Porque llueve sal', 'Porque está fría', 'Porque los peces la ensucian'], a: 0 },
    { type: 'choice', world: 'marinas', q: '¿Qué hace que el mar esté siempre en movimiento?', options: ['Los peces', 'Las olas y las mareas', 'Los barcos', 'Los ríos'], a: 1 },
    { type: 'choice', world: 'marinas', q: '¿Cuál de estos NO vive en el mar?', options: ['Ballena', 'Coral', 'Trucha', 'Molusco'], a: 2, why: 'La trucha vive en los ríos. En el mar: peces, moluscos, corales o ballenas.' },
    { type: 'choice', world: 'marinas', q: '¿Qué obtenemos del mar?', options: ['Petróleo y algunos medicamentos', 'Agua dulce para beber', 'Hielo', 'Electricidad de los embalses'], a: 0 },
    { type: 'choice', world: 'marinas', q: 'Un barco de pesca sirve para…', options: ['el transporte', 'el ocio', 'la pesca'], a: 2 },
    { type: 'choice', world: 'marinas', q: 'Un barco cargado de contenedores sirve para…', options: ['el transporte', 'el ocio', 'la pesca'], a: 0 },
    { type: 'choice', world: 'marinas', q: 'Ir a la playa con sombrilla es…', options: ['transporte', 'ocio', 'pesca'], a: 1 },
    { type: 'tf', world: 'marinas', s: 'Las aguas marinas son saladas.', a: true },
    { type: 'tf', world: 'marinas', s: 'Las aguas marinas ocupan la mitad de la Tierra.', a: false, why: 'Ocupan tres cuartas partes.' },
    { type: 'tf', world: 'marinas', s: 'El mar está siempre quieto.', a: false, why: 'Está en continuo movimiento por las olas y las mareas.' },
    { type: 'tf', world: 'marinas', s: 'Del mar obtenemos petróleo y algunos medicamentos.', a: true },
    { type: 'tf', world: 'marinas', s: 'Como el mar es tan grande, se puede contaminar.', a: false, why: 'Debemos cuidarlo y no contaminarlo.' },
    { type: 'tf', world: 'marinas', s: 'Los corales y los moluscos viven en el mar.', a: true },
    { type: 'reto', world: 'marinas', q: 'Si divides la Tierra en 4 trozos iguales, ¿cuántos serían de agua de mar?', options: ['1', '2', '3', '4'], a: 2, why: 'Tres cuartas partes = 3 de cada 4.' },
    { type: 'reto', world: 'marinas', q: 'Nami se bebe agua del mar y está salada. ¿Por qué?', options: ['Tiene muchos minerales disueltos', 'Está muy fría', 'Tiene olas'], a: 0 },
    { type: 'reto', world: 'marinas', q: 'Buggy tira basura al mar. ¿Qué dice la ficha?', options: ['Debemos cuidarlo y no contaminarlo', 'No pasa nada, es muy grande', 'Las olas la limpian'], a: 0 },
    { type: 'reto', world: 'marinas', q: 'El agua sube y baja en la playa a lo largo del día. ¿Qué es?', options: ['Las mareas', 'Un río', 'Un embalse'], a: 0 },
    // Los ríos
    { type: 'choice', world: 'rios', q: 'Un río es una corriente de agua…', options: ['salada', 'dulce', 'helada', 'quieta'], a: 1 },
    { type: 'choice', world: 'rios', q: 'Un río que desemboca en otro río se llama…', options: ['afluente', 'embalse', 'cauce', 'laguna'], a: 0 },
    { type: 'choice', world: 'rios', q: 'El terreno hundido por el que corre el agua es…', options: ['el caudal', 'el cauce', 'el embalse', 'el meandro'], a: 1 },
    { type: 'choice', world: 'rios', q: 'La cantidad de agua que lleva el río es…', options: ['el cauce', 'el caudal', 'el curso', 'el afluente'], a: 1 },
    { type: 'choice', world: 'rios', q: '¿Cuándo DISMINUYE el caudal de un río?', options: ['En primavera', 'En invierno', 'En verano'], a: 2 },
    { type: 'choice', world: 'rios', q: '¿Qué río tiene un cauce muy ancho, según la ficha?', options: ['El Amazonas', 'El Segura', 'Un arroyo'], a: 0 },
    { type: 'choice', world: 'rios', q: 'Los embalses sirven para…', options: ['almacenar agua para nuestro uso', 'pescar ballenas', 'hacer olas'], a: 0 },
    { type: 'choice', world: 'rios', q: 'Hacer piragüismo en un río es…', options: ['transporte', 'ocio', 'un embalse'], a: 1 },
    { type: 'choice', world: 'rios', q: '¿Cuál de estos animales vive en los ríos?', options: ['La ballena', 'La nutria', 'El coral'], a: 1 },
    { type: 'choice', world: 'rios', q: 'Los ríos, arroyos, lagos y torrentes forman las aguas…', options: ['marinas', 'continentales', 'saladas'], a: 1 },
    { type: 'tf', world: 'rios', s: 'Todos los ríos desembocan en el mar.', a: false, why: 'Algunos desembocan en otros ríos: son los afluentes.' },
    { type: 'tf', world: 'rios', s: 'El caudal aumenta en primavera y en invierno.', a: true },
    { type: 'tf', world: 'rios', s: 'El cauce es la cantidad de agua del río.', a: false, why: 'Eso es el caudal. El cauce es el terreno hundido por donde va el agua.' },
    { type: 'tf', world: 'rios', s: 'En algunos ríos navegamos para comunicarnos.', a: true },
    { type: 'tf', world: 'rios', s: 'La trucha, la nutria y la garza viven en los ríos y sus orillas.', a: true },
    { type: 'tf', world: 'rios', s: 'Los ríos son de agua salada.', a: false, why: 'Son de agua dulce.' },
    { type: 'reto', world: 'rios', q: 'En agosto el río de tu pueblo lleva muy poca agua. ¿Por qué?', options: ['En verano el caudal disminuye', 'Se ha secado el mar', 'Por las mareas'], a: 0 },
    { type: 'reto', world: 'rios', q: 'Un río pequeño se junta con otro más grande y ya no sigue solo. ¿Qué es el pequeño?', options: ['Un afluente', 'Un embalse', 'Un lago'], a: 0 },
    { type: 'reto', world: 'rios', q: 'Hinata ve el río muy ancho y lleno de agua. ¿Qué dos cosas está mirando?', options: ['El cauce y el caudal', 'La ola y la marea', 'El lago y la laguna'], a: 0 },
    { type: 'reto', world: 'rios', q: '¿Por qué un embalse ayuda en verano?', options: ['Porque guarda agua para cuando el río lleva poca', 'Porque hace olas', 'Porque sala el agua'], a: 0 },
    // El recorrido de un río
    { type: 'choice', world: 'recorrido', q: 'El recorrido de un río desde su nacimiento hasta su desembocadura se llama…', options: ['caudal', 'curso', 'cauce', 'afluente'], a: 1 },
    { type: 'choice', world: 'recorrido', q: '¿Dónde nace un río?', options: ['En las montañas', 'En el mar', 'En la playa'], a: 0 },
    { type: 'choice', world: 'recorrido', q: '¿En qué parte el cauce es estrecho y poco profundo?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 0 },
    { type: 'choice', world: 'recorrido', q: '¿En qué parte el río forma meandros?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 1 },
    { type: 'choice', world: 'recorrido', q: '¿En qué parte el río recibe numerosos afluentes?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 1 },
    { type: 'choice', world: 'recorrido', q: '¿Cuál es el último tramo del río?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 2 },
    { type: 'choice', world: 'recorrido', q: 'Las curvas que forma el río en el curso medio se llaman…', options: ['meandros', 'afluentes', 'cauces', 'olas'], a: 0 },
    { type: 'choice', world: 'recorrido', q: 'El lugar donde el río vierte sus aguas al mar es…', options: ['el nacimiento', 'la desembocadura', 'el meandro'], a: 1 },
    { type: 'choice', world: 'recorrido', q: '¿Por qué el curso alto lleva poca agua?', options: ['Porque el terreno está en pendiente', 'Porque es verano', 'Porque está cerca del mar'], a: 0 },
    { type: 'choice', world: 'recorrido', q: '¿Por qué paisaje discurre el curso medio?', options: ['De montaña', 'De llanura', 'De costa'], a: 1 },
    { type: 'tf', world: 'recorrido', s: 'El curso de un río se divide en tres partes.', a: true },
    { type: 'tf', world: 'recorrido', s: 'En el curso alto el río forma meandros.', a: false, why: 'Los meandros están en el curso medio.' },
    { type: 'tf', world: 'recorrido', s: 'En el curso bajo el cauce es más ancho y profundo, y el caudal más abundante.', a: true },
    { type: 'tf', world: 'recorrido', s: 'En el curso medio el agua va muy deprisa.', a: false, why: 'Discurre lentamente y forma meandros.' },
    { type: 'tf', world: 'recorrido', s: 'El curso bajo se aproxima a la costa.', a: true },
    { type: 'tf', world: 'recorrido', s: 'En el curso medio el caudal aumenta.', a: true },
    { type: 'reto', world: 'recorrido', q: 'Tanjiro ve un río estrecho con rocas y cascadas que baja por la montaña. ¿Qué curso es?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 0 },
    { type: 'reto', world: 'recorrido', q: 'Un río ancho y tranquilo hace eses por un campo llano. ¿Qué curso es?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 1 },
    { type: 'reto', world: 'recorrido', q: 'El río es anchísimo y ya se ve el mar. ¿Qué curso es?', options: ['Curso alto', 'Curso medio', 'Curso bajo'], a: 2 },
    { type: 'reto', world: 'recorrido', q: '¿Por qué el caudal va aumentando del curso alto al bajo?', options: ['Porque recibe agua de los afluentes', 'Porque llueve más abajo', 'Porque entra agua del mar'], a: 0 },
    { type: 'reto', world: 'recorrido', q: 'Ordena el viaje del agua: ¿cuál va PRIMERO?', options: ['Nacimiento', 'Meandros', 'Desembocadura'], a: 0 },
    { type: 'reto', world: 'recorrido', q: 'Si el terreno está muy en pendiente, el cauce del río suele ser…', options: ['estrecho y poco profundo', 'ancho y profundo', 'lleno de meandros'], a: 0 },
    // Otras aguas y ríos de España
    { type: 'choice', world: 'otras', q: 'Una extensión de agua rodeada de tierra por todas partes es…', options: ['un lago', 'un río', 'un mar', 'un afluente'], a: 0 },
    { type: 'choice', world: 'otras', q: 'Un lago pequeño se llama…', options: ['laguna', 'arroyo', 'embalse', 'acuífero'], a: 0 },
    { type: 'choice', world: 'otras', q: '¿Cómo está la mayor parte del agua dulce de la Tierra?', options: ['En forma de hielo', 'En los ríos', 'En los lagos'], a: 0 },
    { type: 'choice', world: 'otras', q: '¿Dónde está el hielo de la Tierra?', options: ['En los Polos y las cumbres montañosas', 'En las playas', 'En las llanuras'], a: 0 },
    { type: 'choice', world: 'otras', q: 'El agua de lluvia que se filtra y se guarda bajo tierra son las aguas…', options: ['marinas', 'subterráneas', 'saladas'], a: 1 },
    { type: 'choice', world: 'otras', q: '¿Dónde se acumulan las aguas subterráneas?', options: ['En acuíferos y ríos subterráneos', 'En las olas', 'En los Polos'], a: 0 },
    { type: 'choice', world: 'otras', q: '¿Cuántas vertientes hay en España?', options: ['Dos', 'Tres', 'Cuatro', 'Cinco'], a: 1 },
    { type: 'choice', world: 'otras', q: 'Las vertientes se distinguen según…', options: ['el mar en el que desembocan los ríos', 'lo largos que son los ríos', 'el color del agua'], a: 0 },
    { type: 'choice', world: 'otras', q: 'Mira el mapa: ¿qué vertiente es la más grande de España?', options: ['Atlántica', 'Mediterránea', 'Cantábrica'], a: 0 },
    { type: 'choice', world: 'otras', q: 'Mira el mapa: ¿qué vertiente es una franja estrecha arriba, en el norte?', options: ['Atlántica', 'Mediterránea', 'Cantábrica'], a: 2 },
    { type: 'choice', world: 'otras', q: '¿Cuál de estos NO es un mar donde desembocan los ríos de España?', options: ['Océano Atlántico', 'Mar Mediterráneo', 'Océano Pacífico', 'Mar Cantábrico'], a: 2 },
    { type: 'tf', world: 'otras', s: 'Los lagos están rodeados de tierra por todas partes.', a: true },
    { type: 'tf', world: 'otras', s: 'La mayor parte del agua dulce de la Tierra está en los ríos.', a: false, why: 'Está en forma de hielo, en los Polos y las cumbres montañosas.' },
    { type: 'tf', world: 'otras', s: 'Parte del agua de la lluvia y de la nieve se filtra por el terreno.', a: true },
    { type: 'tf', world: 'otras', s: 'En España hay cuatro vertientes.', a: false, why: 'Hay tres: atlántica, mediterránea y cantábrica.' },
    { type: 'tf', world: 'otras', s: 'Los ríos de la vertiente mediterránea desembocan en el mar Mediterráneo.', a: true },
    { type: 'tf', world: 'otras', s: 'El agua de los lagos, los hielos y las aguas subterráneas es dulce.', a: true },
    { type: 'reto', world: 'otras', q: 'Los ríos de la vertiente cantábrica, ¿dónde desembocan?', options: ['En el mar Cantábrico', 'En el océano Atlántico', 'En el mar Mediterráneo'], a: 0 },
    { type: 'reto', world: 'otras', q: 'El río Segura pasa por Murcia y llega al mar en Alicante. Mira el mapa: ¿de qué vertiente es?', options: ['Mediterránea', 'Atlántica', 'Cantábrica'], a: 0 },
    { type: 'reto', world: 'otras', q: 'Llueve en la montaña y el agua desaparece en el suelo. ¿Adónde va?', options: ['Se filtra y se guarda bajo tierra, en acuíferos', 'Se evapora al momento', 'Se convierte en sal'], a: 0 },
    { type: 'reto', world: 'otras', q: 'Ochaco flota hasta una cumbre con nieve todo el año. ¿Qué agua es?', options: ['Hielo: agua dulce', 'Agua marina', 'Agua subterránea'], a: 0 },
  ];

  const scenes = {"marinas":{"world":"marinas","img":"assets/img/scene_marinas.webp","ratio":1.963254593175853,"title":"Cómo es y cómo usamos el mar","rounds":[{"title":"Pon cada nombre en su sitio","labels":[{"id":"olas","text":"Olas","x":17,"y":23},{"id":"mareas","text":"Mareas","x":50,"y":23},{"id":"vida","text":"Vida marina","x":83,"y":23},{"id":"transporte_mar","text":"Transporte","x":17,"y":75},{"id":"ocio_mar","text":"Ocio","x":50,"y":75},{"id":"pesca","text":"Pesca","x":83,"y":75}]}]},"rios":{"world":"rios","img":"assets/img/scene_rios.webp","ratio":1.963254593175853,"title":"Los ríos y para qué los usamos","rounds":[{"title":"Pon cada nombre en su sitio","labels":[{"id":"rio","text":"Río","x":17,"y":30},{"id":"cauce","text":"Cauce","x":48,"y":30},{"id":"embalse","text":"Embalse","x":83,"y":23},{"id":"ocio_rio","text":"Ocio","x":17,"y":75},{"id":"transporte_rio","text":"Transporte","x":50,"y":75},{"id":"animales","text":"Animales","x":83,"y":77}]}]},"recorrido":{"world":"recorrido","img":"assets/img/scene_recorrido.webp","ratio":1.3800475059382422,"title":"El recorrido de un río","rounds":[{"title":"Pon cada nombre en su sitio","labels":[{"id":"nacimiento","text":"Nacimiento","x":25,"y":11},{"id":"alto","text":"Curso alto","x":75,"y":35},{"id":"medio","text":"Curso medio","x":16,"y":67},{"id":"meandros","text":"Meandros","x":33,"y":86},{"id":"bajo","text":"Curso bajo","x":65,"y":65},{"id":"desembocadura","text":"Desembocadura","x":84,"y":86}]}]},"espana":{"world":"otras","img":"assets/img/scene_espana.webp","ratio":1.4503968253968254,"title":"Las vertientes de España","rounds":[{"title":"Pon cada nombre en su sitio","labels":[{"id":"atlantica","text":"Vertiente atlántica","x":43,"y":51},{"id":"mediterranea","text":"Vertiente mediterránea","x":57,"y":32},{"id":"cantabrica","text":"Vertiente cantábrica","x":46,"y":13},{"id":"atlantico","text":"Océano Atlántico","x":21,"y":45},{"id":"mediterraneo","text":"Mar Mediterráneo","x":75,"y":57},{"id":"cantabrico","text":"Mar Cantábrico","x":49,"y":4}]}]}};

  const facts = [
    { id: 'g1', world: 'marinas', text: 'Si dejas secar un litro de agua de mar, quedan unos 35 gramos de sal: ¡como dos cucharadas!' },
    { id: 'g2', world: 'marinas', text: 'Las mareas las provoca la Luna: con su fuerza tira del agua de los mares y océanos.' },
    { id: 'g3', world: 'marinas', text: 'La ballena azul es el animal más grande que ha existido nunca: más grande que cualquier dinosaurio.' },
    { id: 'g4', world: 'rios', text: 'El Amazonas es el río que lleva más agua del mundo: en algunos sitios no se ve la otra orilla.' },
    { id: 'g5', world: 'rios', text: 'El Ebro es el río de España que lleva más agua.' },
    { id: 'g6', world: 'recorrido', text: 'El Tajo es el río más largo de España: nace en la sierra de Albarracín y desemboca en Lisboa, en el océano Atlántico.' },
    { id: 'g7', world: 'recorrido', text: 'El río Segura, el de Murcia, nace en la sierra de Segura, en Jaén, y desemboca en Guardamar, en el mar Mediterráneo.' },
    { id: 'g8', world: 'otras', text: 'El lago natural más grande de España es el lago de Sanabria, en Zamora.' },
    { id: 'g9', world: 'otras', text: 'El Mar Menor, al lado de Totana, en realidad es una laguna de agua salada.' },
    { id: 'g10', world: 'otras', text: 'Casi toda el agua dulce del planeta está congelada en la Antártida y en Groenlandia.' },
  ];

  const jokes = [{"who":"Ochaco","q":"¿Qué le dice una montaña a otra montaña?","a":"¡Qué cima tienes!"},{"who":"Nami","q":"¿Cuál es el océano más educado?","a":"El Pacífico: nunca se enfada."},{"who":"Tanjiro","q":"¿Por qué el río nunca se pierde?","a":"Porque siempre sigue su curso."},{"who":"Hinata","q":"¿Qué hace una abeja en el gimnasio?","a":"¡Zum-ba!"},{"who":"Luffy","q":"¿Qué le dice un pez a otro pez?","a":"¡Nada!"},{"who":"Nezuko","q":"¿Qué le dice una iguana a su hermana gemela?","a":"¡Somos iguanitas!"},{"who":"Ochaco","q":"¿Qué le dijo el istmo a la península?","a":"¡Sin mí serías una isla!"},{"who":"Zenitsu","q":"¿Cuál es el colmo de un electricista?","a":"¡No seguir la corriente!"},{"who":"Chopper","q":"¿Qué hace un pato con una pata?","a":"¡Cojea!"},{"who":"Nami","q":"¿Qué le dice el cabo al mar?","a":"Me meto un poquito, ¿vale?"},{"who":"Inosuke","q":"¿Cuál es el animal más antiguo?","a":"¡La cebra, porque está en blanco y negro!"},{"who":"Hinata","q":"¿Por qué el libro de mates estaba triste?","a":"Porque tenía muchos problemas."},{"who":"Tanjiro","q":"¿Por qué la meseta está siempre tranquila?","a":"Porque todo lo ve llano."},{"who":"Ochaco","q":"¿Qué le dice un jaguar a otro jaguar?","a":"¡Jaguar you!"},{"who":"Luffy","q":"¿Cuál es el país más picante?","a":"Chile. ¿Y el más gracioso? ¡Jajapón!"},{"who":"Nezuko","q":"¿Por qué las focas miran siempre hacia arriba?","a":"Porque ahí están los focos."},{"who":"Nami","q":"¿Qué le dice una isla a otra isla?","a":"¡Juntas somos un archipiélago!"},{"who":"Hinata","q":"¿Qué le dice un semáforo a otro semáforo?","a":"No me mires, que me estoy cambiando."},{"who":"Zenitsu","q":"¿Qué hace una vaca en un terremoto?","a":"¡Un batido!"},{"who":"Chopper","q":"¿Cómo se despiden los químicos?","a":"¡Ácido un placer!"},{"who":"Ochaco","q":"¿Qué es lo que más pesa en la Tierra?","a":"Nada, si estoy yo cerca: ¡todo flota!"},{"who":"Tanjiro","q":"¿Cuál es el colmo de un jardinero?","a":"Que su novia lo deje plantado."},{"who":"Nami","q":"¿Qué le dice el golfo a la bahía?","a":"¡Eres mi versión mini!"},{"who":"Luffy","q":"Mamá, en el cole me llaman despistado.","a":"Niño, que esta no es tu casa."},{"who":"Inosuke","q":"¿Qué le dice un gusano a otro gusano?","a":"Voy a dar una vuelta a la manzana."},{"who":"Hinata","q":"¿Qué le dice una pared a otra pared?","a":"Nos vemos en la esquina."},{"who":"Nezuko","q":"¿Qué le dice el 1 al 10?","a":"Para ser como yo tienes que ser sincero… ¡sin cero!"},{"who":"Chopper","q":"¿Cuál es el colmo de un pez?","a":"¡Que no sepa nadar… ni en el valle, que tiene río!"}];
  const VOICE_OF = {"Ochaco":"girl","Nezuko":"girl","Chopper":"girl","Nami":"woman","Tanjiro":"boy","Hinata":"boy","Luffy":"boy","Zenitsu":"boy","Inosuke":"boy"};

  const lines = {
    w_marinas: '¡Hola, María! Soy Nami, la navegante. El mar es salado, tiene olas y mareas… ¡y yo lo conozco entero! ¡Vamos!',
    w_rios: '¡Hola, María! Soy Hinata. ¡Los ríos corren tanto como yo en la cancha! Vamos a ver qué tienen.',
    w_recorrido: '¡Hola, María! Soy Tanjiro. En mi montaña nacen los ríos. Te enseño su camino hasta el mar.',
    w_otras: '¡Hola, María! Soy Ochaco. Lagos, hielos, agua escondida bajo tierra y los ríos de España. ¡Vamos a flotar por ellos!',
    cs_intro: '¡Hola, María! Tema dos: necesitamos el agua para vivir. Cuatro fichas, cuatro aventuras. ¡Vamos!',
    learn_1: "Primero te lo enseño. Escucha y mira.",
    learn_2: "Ahora tú. Toca lo que te pido.",
    learn_3: "¡Última prueba! ¿Qué es esto?",
    write_start: "Escribe la definición con tus palabras. Las palabras importantes tienen que estar.",
    write_fix: "Casi. Mira la definición, escúchala y escríbela tú.",
    label_start: "Arrastra cada nombre a su sitio en el dibujo.",
    sort_start: "Pon cada frase en su cajón.",
    list_start: "Toca todos los que son. ¡Cuidado con los intrusos!",
    reto_start: "¡Pregunta reto! Aquí hay que pensar.",
    tf_start: "¿Verdadero o falso?",
    sobre: "¡Un sobre sorpresa! ¿Qué habrá dentro?",
    sticker: "¡Pegatina nueva para tu álbum!",
    sabias: "¿Sabías que…?",
    quick_start: "¿Ya lo sabes? Demuéstralo. Si aciertas, nos saltamos lo fácil.",
    quick_pass: "¡Lo tenías! Nos saltamos lo fácil y vamos a lo difícil.",
    world_done: "¡Ficha dominada! Tres estrellas. ¡Eres increíble!",
    mixed_start: "Mezcla de las cuatro fichas. ¡Concéntrate!",
  };

  const byWorld = (arr, w) => arr.filter(x => x.world === w);
  const hash = t => { let h = 5381; const n = String(t); for (let i = 0; i < n.length; i++) h = ((h * 33) ^ n.charCodeAt(i)) >>> 0; return h.toString(36); };
  const SPOT = { cauce: ['rios', 'cauce'], embalse: ['rios', 'embalse'], rio: ['rios', 'rio'], nacimiento: ['recorrido', 'nacimiento'], curso_alto: ['recorrido', 'alto'], curso_medio: ['recorrido', 'medio'], meandro: ['recorrido', 'meandros'], curso_bajo: ['recorrido', 'bajo'], desembocadura: ['recorrido', 'desembocadura'] };
  return { hash, SPOT, VOICE_OF, worlds, WORLD_ORDER, concepts, lists, sorts, questions, scenes, facts, jokes, lines, byWorld, concept: id => concepts.find(c => c.id === id) };
})();
