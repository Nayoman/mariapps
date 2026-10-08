/* Ciencias Sociales — el contenido de las 4 fichas del cole en datos (fuente: fotos en ../CienciasSociales/).
   Nada de esto se inventa: definiciones y listas son las de las fichas. Las preguntas RETO hacen pensar con lo mismo.
   keys = grupos de palabras clave que tiene que contener la definición escrita (cada grupo: alternativas); min = grupos necesarios. */
window.CS = (function () {
  const worlds = {
    tierra: { id: 'tierra', series: 'mha', title: 'La Tierra', sub: 'Océanos, continentes y paisajes', hero: 'ochaco', heroName: 'Ochaco', heroImg: 'assets/img/ch_ochaco.webp', bg: 'assets/img/bg_mha.webp', music: 'music_mha', boss: { id: 'villano', name: 'Gentle Criminal', img: 'assets/img/boss_gentle.webp', hp: 8, intro: '¡Un villano elegante quiere borrar los nombres del mapa!' }, win: 'assets/img/win_mha.webp', intro: 'w_tierra', badge: '🌍' },
    montana: { id: 'montana', series: 'demonslayer', title: 'Los paisajes de montaña', sub: 'Cimas, valles, sierras y cordilleras', hero: 'tanjiro', heroName: 'Tanjiro', heroImg: '../tablas/assets/img/ch_tanjiro.webp', bg: '../tablas/assets/img/bg_demonslayer.webp', music: 'music_demonslayer', boss: { id: 'oni', name: 'Oni de la montaña', img: '../tablas/assets/img/boss_demon.webp', hp: 8, intro: '¡Un oni bloquea el paso de la montaña!' }, win: '../tablas/assets/img/win_demonslayer.webp', intro: 'w_montana', badge: '🏔️' },
    llanura: { id: 'llanura', series: 'haikyuu', title: 'Los paisajes de llanura', sub: 'Mesetas, depresiones, pueblos y ciudades', hero: 'hinata', heroName: 'Hinata', heroImg: '../tablas/assets/img/ch_hinata.webp', bg: '../tablas/assets/img/bg_haikyuu.webp', music: 'music_haikyuu', boss: { id: 'kuroo', name: 'Kuroo (Nekoma, la ciudad)', img: '../tablas/assets/img/boss_kuroo.webp', hp: 8, intro: '¡Kuroo, de la gran ciudad, te reta sobre las llanuras!' }, win: '../tablas/assets/img/win_haikyuu.webp', intro: 'w_llanura', badge: '🌾' },
    costa: { id: 'costa', series: 'onepiece', title: 'Los paisajes de costa', sub: 'Islas, cabos, golfos y bahías', hero: 'nami', heroName: 'Nami', heroImg: '../tablas/assets/img/ch_nami.webp', bg: '../tablas/assets/img/bg_onepiece.webp', music: 'music_onepiece', boss: { id: 'buggy', name: 'Buggy el Payaso', img: '../tablas/assets/img/boss_buggy.webp', hp: 8, intro: '¡Buggy quiere robar el mapa de la costa!' }, win: '../tablas/assets/img/win_onepiece.webp', intro: 'w_costa', badge: '🏖️' },
  };
  const WORLD_ORDER = ['tierra', 'montana', 'llanura', 'costa'];

  // ---------- conceptos: lo que hay que saber definir (modo ESCRIBIR, lección de 3 tiempos, unir) ----------
  const concepts = [
    // La Tierra
    { id: 'paisaje', world: 'tierra', name: 'el paisaje', q: '¿Qué es el paisaje?', def: 'El paisaje es el aspecto que tiene una amplia extensión de terreno.', short: 'El aspecto que tiene una amplia extensión de terreno', keys: [['aspecto'], ['terreno', 'extension']] },
    { id: 'colores', world: 'tierra', name: 'los tres colores de la Tierra', q: '¿Qué tres colores destacan en la superficie de la Tierra y qué es cada uno?', def: 'En la superficie de la Tierra destacan tres colores: el azul, que es el agua de los océanos y mares; el marrón, que son las rocas de los continentes e islas; y el verde, que es la vegetación.', short: 'Azul = agua · marrón = rocas · verde = vegetación', keys: [['azul'], ['marron'], ['verde']] },
    { id: 'mapamundi', world: 'tierra', name: 'el mapamundi', q: '¿Qué podemos ver en un mapamundi?', def: 'En un mapamundi podemos ver todos los océanos y los continentes a la vez.', short: 'Todos los océanos y los continentes a la vez', keys: [['oceanos'], ['continentes']] },
    { id: 'oceano', world: 'tierra', name: 'los océanos', q: '¿Qué son los océanos?', def: 'Los océanos son grandes superficies de agua salada. Hay cinco océanos: Pacífico, Atlántico, Índico, Glacial Ártico y Glacial Antártico.', short: 'Grandes superficies de agua salada', keys: [['agua'], ['salada']] },
    { id: 'continente', world: 'tierra', name: 'los continentes', q: '¿Qué son los continentes?', def: 'Los continentes son amplias extensiones de tierra. Hay seis continentes: Asia, América, África, Oceanía, Antártida y Europa.', short: 'Amplias extensiones de tierra', keys: [['tierra'], ['extensiones', 'extension', 'amplias', 'grandes', 'trozos']] },
    { id: 'relieve', world: 'tierra', name: 'el relieve', q: '¿Qué es el relieve?', def: 'El relieve son las formas del terreno, como las montañas o las llanuras.', short: 'Las formas del terreno (montañas, llanuras)', keys: [['formas'], ['terreno']] },
    { id: 'vegetacion', world: 'tierra', name: 'la vegetación', q: '¿Qué es la vegetación?', def: 'La vegetación son las plantas naturales que crecen en el terreno.', short: 'Las plantas naturales que crecen en el terreno', keys: [['plantas']] },
    { id: 'aguas', world: 'tierra', name: 'las aguas', q: '¿Por qué están formadas las aguas de un paisaje?', def: 'Las aguas están formadas por los océanos y mares, los ríos, los arroyos, la nieve, los lagos…', short: 'Océanos y mares, ríos, arroyos, nieve, lagos…', keys: [['oceanos', 'mares', 'mar'], ['rios', 'rio', 'lagos', 'arroyos', 'nieve']] },
    { id: 'construidos', world: 'tierra', name: 'los elementos construidos', q: '¿Qué elementos construidos por las personas puede tener un paisaje?', def: 'Los paisajes también pueden tener elementos construidos por las personas, como puentes, huertos o ciudades.', short: 'Puentes, huertos, ciudades…', keys: [['puentes', 'puente', 'huertos', 'huerto', 'ciudades', 'ciudad', 'carreteras', 'casas']] },
    { id: 'protegido', world: 'tierra', name: 'los paisajes protegidos', q: '¿Qué es un paisaje protegido?', def: 'Hay paisajes con elementos naturales tan valiosos que los declaramos parques nacionales o naturales. Así los protegemos.', short: 'Un paisaje tan valioso que se declara parque nacional o natural', keys: [['parque', 'parques'], ['nacional', 'natural', 'nacionales', 'naturales'], ['proteger', 'protegerlo', 'protegerlos', 'protegemos', 'valiosos', 'valioso']], min: 2 },
    // Montaña
    { id: 'paisaje_montana', world: 'montana', name: 'el paisaje de montaña', q: '¿Cómo es el terreno de los paisajes de montaña?', def: 'El terreno de los paisajes de montaña es elevado y suele tener abundante vegetación. Hay numerosas montañas que forman sierras, y valles que se abren entre ellas.', short: 'Terreno elevado con abundante vegetación, sierras y valles', keys: [['elevado', 'alto', 'elevada'], ['vegetacion', 'sierras', 'valles']] },
    { id: 'montana', world: 'montana', name: 'una montaña', q: '¿Qué es una montaña?', def: 'Una montaña es un terreno elevado y con gran pendiente. La cima es la parte más alta. Suele estar formada por rocas y, en muchos casos, tiene nieve en la parte superior.', short: 'Terreno elevado y con gran pendiente', keys: [['elevado', 'alto', 'elevada', 'alta'], ['pendiente']] },
    { id: 'cima', world: 'montana', name: 'la cima', q: '¿Qué es la cima?', def: 'La cima es la parte más alta de la montaña.', short: 'La parte más alta de la montaña', keys: [['mas alta', 'alta', 'alto', 'arriba']] },
    { id: 'valle', world: 'montana', name: 'un valle', q: '¿Qué es un valle?', def: 'Un valle es un terreno llano o hundido entre montañas. Suelen estar recorridos por ríos y tienen suelo fértil y con vegetación.', short: 'Terreno llano o hundido entre montañas, con ríos', keys: [['llano', 'hundido', 'llana'], ['entre montanas', 'montanas']] },
    { id: 'cordillera', world: 'montana', name: 'una cordillera', q: '¿Qué es una cordillera?', def: 'Una cordillera es un conjunto de numerosas montañas unidas entre sí. Suelen ser de gran extensión y gran altura.', short: 'Conjunto de muchas montañas unidas, muy extenso y alto', keys: [['conjunto', 'muchas', 'numerosas', 'grupo'], ['montanas'], ['unidas', 'juntas', 'grande', 'gran', 'altas', 'alta', 'altura']], min: 2 },
    { id: 'sierra', world: 'montana', name: 'una sierra', q: '¿Qué es una sierra?', def: 'Una sierra es un conjunto de montañas menos extensas que una cordillera. Suelen ser más bajas.', short: 'Conjunto de montañas más pequeño y más bajo que una cordillera', keys: [['conjunto', 'muchas', 'grupo', 'montanas'], ['menos', 'bajas', 'baja', 'pequena', 'pequenas', 'mas bajas', 'cordillera']] },
    { id: 'vida_montana', world: 'montana', name: 'la vida en la montaña', q: '¿Cómo es la vida en la montaña?', def: 'En la montaña hace frío y nieve en invierno. Los pueblos son pequeños y se comunican por carreteras estrechas y con curvas. Muchas veces es necesario construir túneles para atravesar las montañas. Por eso, el turismo es una actividad muy importante.', short: 'Frío y nieve, pueblos pequeños, carreteras con curvas, túneles y turismo', keys: [['frio', 'nieve'], ['pueblos', 'pequenos'], ['carreteras', 'curvas', 'tuneles', 'turismo']], min: 2 },
    { id: 'caracteristicas', world: 'montana', name: 'las características del paisaje de montaña', q: '¿Por qué se caracteriza el paisaje de montaña?', def: 'El paisaje de montaña se caracteriza por sus montañas, sierras y valles; por su gran riqueza natural y cultural; por la presencia de pueblos pequeños, y por el clima frío y la nieve en invierno.', short: 'Montañas, sierras y valles · riqueza natural y cultural · pueblos pequeños · frío y nieve', keys: [['montanas', 'sierras', 'valles'], ['riqueza', 'pueblos', 'frio', 'nieve']] },
    // Llanura
    { id: 'meseta', world: 'llanura', name: 'una meseta', q: '¿Qué es una meseta?', def: 'Una meseta es un terreno llano situado a bastante altura.', short: 'Terreno llano situado a bastante altura', keys: [['llano', 'llana', 'plano'], ['altura', 'alto', 'alta', 'elevado']] },
    { id: 'depresion', world: 'llanura', name: 'una depresión', q: '¿Qué es una depresión?', def: 'Una depresión es un terreno llano que está hundido respecto a otros terrenos más altos.', short: 'Terreno llano hundido respecto a otros más altos', keys: [['llano', 'llana', 'plano'], ['hundido', 'hundida', 'bajo', 'baja', 'mas bajo']] },
    { id: 'trabajos_pueblos', world: 'llanura', name: 'los trabajos en los pueblos de llanura', q: '¿En qué trabajan las personas en los pueblos de llanura y por qué?', def: 'En los pueblos de llanura, numerosas personas trabajan en la agricultura, porque los cultivos crecen bien en terrenos llanos cerca de los ríos. Se cultivan cereales, frutas, verduras y otros productos.', short: 'Agricultura: los cultivos crecen bien en terreno llano cerca de los ríos', keys: [['agricultura', 'agricultores', 'cultivos', 'cultivar', 'campo'], ['llanos', 'llano', 'rios', 'rio', 'cereales', 'frutas', 'verduras']] },
    { id: 'trabajos_ciudades', world: 'llanura', name: 'los trabajos en las ciudades', q: '¿En qué trabaja la mayoría de las personas en las ciudades?', def: 'En las ciudades, la mayoría de las personas trabajan en los transportes, fábricas, oficinas, comercios, hospitales…', short: 'Transportes, fábricas, oficinas, comercios, hospitales…', keys: [['transportes', 'transporte'], ['fabricas', 'fabrica'], ['oficinas', 'oficina'], ['comercios', 'comercio', 'tiendas'], ['hospitales', 'hospital']], min: 2 },
    // Costa
    { id: 'costa', world: 'costa', name: 'la costa', q: '¿Qué es la costa?', def: 'La costa es la tierra que está en contacto con el mar.', short: 'La tierra que está en contacto con el mar', keys: [['tierra'], ['mar']] },
    { id: 'costa_alta', world: 'costa', name: 'la costa alta', q: '¿Cómo es la costa alta?', def: 'La costa alta tiene acantilados, porque las montañas llegan hasta el mar.', short: 'Tiene acantilados: las montañas llegan hasta el mar', keys: [['acantilados', 'acantilado'], ['montanas', 'montana']] },
    { id: 'costa_baja', world: 'costa', name: 'la costa baja', q: '¿Cómo es la costa baja?', def: 'La costa baja tiene playas de arena o de cantos.', short: 'Tiene playas de arena o de cantos', keys: [['playas', 'playa'], ['arena', 'cantos']] },
    { id: 'archipielago', world: 'costa', name: 'un archipiélago', q: '¿Qué es un archipiélago?', def: 'Un archipiélago es un conjunto de muchas islas cercanas.', short: 'Conjunto de muchas islas cercanas', keys: [['conjunto', 'muchas', 'grupo', 'varias'], ['islas']] },
    { id: 'isla', world: 'costa', name: 'una isla', q: '¿Qué es una isla?', def: 'Una isla es una porción de tierra rodeada de agua por todas partes.', short: 'Porción de tierra rodeada de agua por todas partes', keys: [['tierra'], ['rodeada', 'rodeado'], ['agua', 'mar'], ['todas partes', 'todos los lados', 'todas']], min: 3 },
    { id: 'peninsula', world: 'costa', name: 'una península', q: '¿Qué es una península?', def: 'Una península es un terreno rodeado de agua por todas partes menos por una, llamada istmo.', short: 'Terreno rodeado de agua por todas partes menos por una (el istmo)', keys: [['rodeado', 'rodeada'], ['agua', 'mar'], ['menos por una', 'menos por un', 'menos una', 'menos', 'istmo']] },
    { id: 'istmo', world: 'costa', name: 'un istmo', q: '¿Qué es un istmo?', def: 'Un istmo es una franja estrecha de tierra que une la península con el continente.', short: 'Franja estrecha de tierra que une la península con el continente', keys: [['estrecha', 'estrecho', 'franja', 'trozo'], ['une', 'unir', 'junta'], ['peninsula', 'continente']], min: 2 },
    { id: 'cabo', world: 'costa', name: 'un cabo', q: '¿Qué es un cabo?', def: 'Un cabo es un saliente de tierra que se adentra en el mar.', short: 'Saliente de tierra que se adentra en el mar', keys: [['saliente', 'sale', 'adentra', 'entra', 'mete'], ['tierra'], ['mar']] },
    { id: 'golfo', world: 'costa', name: 'un golfo', q: '¿Qué es un golfo?', def: 'Un golfo es una gran entrada del mar en la tierra. Si son más pequeñas, se llaman bahías.', short: 'Gran entrada del mar en la tierra', keys: [['entrada', 'entra'], ['mar'], ['grande', 'gran']] },
    { id: 'bahia', world: 'costa', name: 'una bahía', q: '¿Qué es una bahía?', def: 'Una bahía es una entrada pequeña del mar en la tierra.', short: 'Entrada pequeña del mar en la tierra', keys: [['entrada', 'entra'], ['mar'], ['pequena', 'pequeno', 'chica']] },
    { id: 'vida_costa', world: 'costa', name: 'la vida en la costa', q: '¿Cómo es la vida en la costa?', def: 'En las costas viven muchas personas en pueblos y ciudades. Además, cada año llegan numerosos turistas para pasar sus vacaciones. Por eso, cuentan con muchas infraestructuras: carreteras, vías de ferrocarril, aeropuertos, hoteles, puertos deportivos…', short: 'Mucha gente y muchos turistas; por eso hay carreteras, trenes, aeropuertos, hoteles y puertos', keys: [['turistas', 'turismo', 'vacaciones'], ['hoteles', 'aeropuertos', 'carreteras', 'puertos', 'infraestructuras', 'ferrocarril', 'trenes']] },
    { id: 'trabajos_costa', world: 'costa', name: 'los trabajos en la costa', q: '¿En qué trabajan las personas en la costa?', def: 'Antes, muchas personas se dedicaban a la pesca. Ahora, la mayoría trabajan en la industria, como las conservas y los astilleros, y en los servicios, sobre todo en el turismo: guías, recepcionistas o camareros.', short: 'Antes pesca; ahora industria (conservas, astilleros) y servicios (turismo)', keys: [['pesca', 'pescar', 'pescadores'], ['industria', 'conservas', 'astilleros', 'fabricas'], ['turismo', 'servicios', 'guias', 'camareros', 'recepcionistas', 'hoteles']], min: 2 },
  ];

  // ---------- listas: elegir todos los que son (modo TEST) ----------
  const lists = [
    { id: 'oceanos', world: 'tierra', q: '¿Cuáles son los cinco océanos?', items: ['Pacífico', 'Atlántico', 'Índico', 'Glacial Ártico', 'Glacial Antártico'], distractors: ['Mediterráneo', 'Cantábrico', 'Mar Rojo', 'Mar Negro'] },
    { id: 'continentes', world: 'tierra', q: '¿Cuáles son los seis continentes?', items: ['Asia', 'América', 'África', 'Oceanía', 'Antártida', 'Europa'], distractors: ['España', 'China', 'Madagascar', 'Francia'] },
    { id: 'naturales', world: 'tierra', q: '¿Cuáles son los tres elementos naturales del paisaje?', items: ['Relieve', 'Vegetación', 'Aguas'], distractors: ['Puentes', 'Ciudades', 'Huertos', 'Carreteras'] },
    { id: 'colores_lista', world: 'tierra', q: '¿Qué tres colores destacan en la superficie de la Tierra?', items: ['Azul', 'Marrón', 'Verde'], distractors: ['Rojo', 'Amarillo', 'Negro', 'Blanco'] },
    { id: 'tipos_montana', world: 'montana', q: '¿Qué tipos de paisajes hay en la montaña?', items: ['Montañas', 'Valles', 'Sierras'], distractors: ['Playas', 'Mesetas', 'Islas'] },
    { id: 'vida_montana_lista', world: 'montana', q: '¿Qué cosas son típicas de la vida en la montaña?', items: ['Frío y nieve en invierno', 'Pueblos pequeños', 'Carreteras estrechas con curvas', 'Túneles', 'Turismo'], distractors: ['Playas de arena', 'Grandes fábricas', 'Astilleros'] },
    { id: 'cultivos', world: 'llanura', q: '¿Qué se cultiva en los pueblos de llanura?', items: ['Cereales', 'Frutas', 'Verduras'], distractors: ['Conservas', 'Astilleros', 'Coches'] },
    { id: 'trabajos_ciudad_lista', world: 'llanura', q: '¿En qué trabaja la mayoría de la gente en las ciudades?', items: ['Transportes', 'Fábricas', 'Oficinas', 'Comercios', 'Hospitales'], distractors: ['Agricultura', 'Pesca', 'Ganadería'] },
    { id: 'elementos_costa', world: 'costa', q: '¿Cuáles son elementos de los paisajes de costa?', items: ['Archipiélago', 'Isla', 'Península', 'Istmo', 'Cabo', 'Golfo', 'Bahía'], distractors: ['Valle', 'Meseta', 'Cima', 'Sierra'] },
    { id: 'trabajos_costa_lista', world: 'costa', q: '¿Cuáles son trabajos de las zonas de costa?', items: ['Pesca', 'Industria', 'Servicios (turismo)'], distractors: ['Agricultura', 'Minería', 'Ganadería'] },
    { id: 'infraestructuras', world: 'costa', q: '¿Qué infraestructuras tienen las costas por los turistas?', items: ['Carreteras', 'Vías de ferrocarril', 'Aeropuertos', 'Hoteles', 'Puertos deportivos'], distractors: ['Túneles de montaña', 'Tractores', 'Pistas de esquí'] },
  ];

  // ---------- clasificar: arrastrar cada frase a su cajón (modo UNIR) ----------
  const sorts = [
    { id: 'montana_valle', world: 'montana', q: 'Pon cada frase donde toca', bins: ['Montaña', 'Valle'], items: [['Terreno elevado', 0], ['Gran pendiente', 0], ['Cima en la parte más alta', 0], ['Formada por rocas', 0], ['Puede tener nieve en la cima', 0], ['Terreno llano o hundido', 1], ['Entre montañas', 1], ['Recorrido por un río', 1], ['Suelo fértil y con vegetación', 1]] },
    { id: 'pueblo_ciudad', world: 'llanura', q: '¿Trabajo de pueblo o de ciudad?', bins: ['En los pueblos', 'En las ciudades'], items: [['Agricultura', 0], ['Cultivar cereales', 0], ['Recoger frutas y verduras', 0], ['Transportes', 1], ['Fábricas', 1], ['Oficinas', 1], ['Comercios', 1], ['Hospitales', 1]] },
    { id: 'alta_baja', world: 'costa', q: '¿Costa alta o costa baja?', bins: ['Costa alta', 'Costa baja'], items: [['Acantilados', 0], ['Las montañas llegan hasta el mar', 0], ['Playas de arena', 1], ['Playas de cantos', 1]] },
    { id: 'natural_construido', world: 'tierra', q: '¿Natural o construido por las personas?', bins: ['Natural', 'Construido'], items: [['Una montaña', 0], ['Un río', 0], ['Un bosque', 0], ['La nieve', 0], ['Un puente', 1], ['Un huerto', 1], ['Una ciudad', 1], ['Una carretera', 1]] },
    { id: 'trabajos_costa_sort', world: 'costa', q: '¿Pesca, industria o turismo?', bins: ['Pesca', 'Industria', 'Turismo'], items: [['Barco pesquero', 0], ['Fábrica de conservas', 1], ['Astillero', 1], ['Guía turístico', 2], ['Recepcionista de hotel', 2], ['Camarero', 2]] },
  ];

  // ---------- preguntas sueltas: elegir (choice), verdadero/falso (tf), reto de pensar (reto) ----------
  const questions = [
    // La Tierra
    { type: 'choice', world: 'tierra', q: '¿Cuántos océanos hay?', options: ['Cuatro', 'Cinco', 'Seis', 'Siete'], a: 1 },
    { type: 'choice', world: 'tierra', q: '¿Cuántos continentes hay?', options: ['Cuatro', 'Cinco', 'Seis', 'Siete'], a: 2 },
    { type: 'choice', world: 'tierra', q: '¿Cuál de estos NO es un océano?', options: ['Pacífico', 'Mediterráneo', 'Índico', 'Atlántico'], a: 1, why: 'El Mediterráneo es un mar. Los cinco océanos son Pacífico, Atlántico, Índico, Glacial Ártico y Glacial Antártico.' },
    { type: 'choice', world: 'tierra', q: '¿Cuál de estos NO es un continente?', options: ['Asia', 'España', 'África', 'Europa'], a: 1, why: 'España es un país; está en el continente Europa.' },
    { type: 'choice', world: 'tierra', q: 'El color azul de la Tierra es…', options: ['el agua de los océanos y mares', 'las rocas', 'la vegetación', 'el cielo'], a: 0 },
    { type: 'choice', world: 'tierra', q: 'El color marrón de la Tierra es…', options: ['la vegetación', 'las rocas de los continentes e islas', 'el agua', 'los desiertos'], a: 1 },
    { type: 'choice', world: 'tierra', q: 'El color verde de la Tierra es…', options: ['el agua', 'las rocas', 'la vegetación', 'las ciudades'], a: 2 },
    { type: 'choice', world: 'tierra', q: 'Los océanos son grandes superficies de…', options: ['agua dulce', 'agua salada', 'hielo', 'arena'], a: 1 },
    { type: 'choice', world: 'tierra', q: 'Un paisaje tan valioso que se protege se declara…', options: ['parque nacional o natural', 'ciudad', 'mapamundi', 'continente'], a: 0 },
    { type: 'choice', world: 'tierra', q: 'Mira el mapamundi: ¿qué océano está entre América y Europa?', options: ['Pacífico', 'Índico', 'Atlántico', 'Glacial Ártico'], a: 2 },
    { type: 'choice', world: 'tierra', q: 'Mira el mapamundi: ¿qué océano está entre Asia y América?', options: ['Pacífico', 'Atlántico', 'Índico', 'Glacial Antártico'], a: 0 },
    { type: 'choice', world: 'tierra', q: '¿Qué océano rodea la Antártida?', options: ['Glacial Ártico', 'Glacial Antártico', 'Índico', 'Atlántico'], a: 1 },
    { type: 'choice', world: 'tierra', q: '¿Qué océano está arriba del todo, en el Polo Norte?', options: ['Glacial Antártico', 'Pacífico', 'Glacial Ártico', 'Índico'], a: 2 },
    { type: 'choice', world: 'tierra', q: '¿En qué continente está España?', options: ['Asia', 'América', 'Europa', 'África'], a: 2 },
    { type: 'tf', world: 'tierra', s: 'Hay cinco océanos.', a: true },
    { type: 'tf', world: 'tierra', s: 'Hay cinco continentes.', a: false, why: 'Hay seis: Asia, América, África, Oceanía, Antártida y Europa.' },
    { type: 'tf', world: 'tierra', s: 'El azul de la Tierra es la vegetación.', a: false, why: 'El azul es el agua; la vegetación es el verde.' },
    { type: 'tf', world: 'tierra', s: 'Un puente es un elemento natural del paisaje.', a: false, why: 'Un puente lo construyen las personas. Los naturales son el relieve, la vegetación y las aguas.' },
    { type: 'tf', world: 'tierra', s: 'La Antártida es un continente.', a: true },
    { type: 'tf', world: 'tierra', s: 'En un mapamundi solo se ve un continente.', a: false, why: 'En un mapamundi se ven todos los océanos y continentes a la vez.' },
    { type: 'tf', world: 'tierra', s: 'Los parques nacionales sirven para proteger paisajes muy valiosos.', a: true },
    { type: 'reto', world: 'tierra', q: 'Un lago de montaña, ¿a qué elemento natural del paisaje pertenece?', options: ['Al relieve', 'A la vegetación', 'A las aguas'], a: 2, why: 'Las aguas son océanos, mares, ríos, arroyos, nieve y lagos.' },
    { type: 'reto', world: 'tierra', q: 'Un bosque de pinos, ¿a qué elemento natural pertenece?', options: ['Al relieve', 'A la vegetación', 'A las aguas'], a: 1 },
    { type: 'reto', world: 'tierra', q: 'Una montaña, ¿a qué elemento natural pertenece?', options: ['Al relieve', 'A la vegetación', 'A las aguas'], a: 0, why: 'El relieve son las formas del terreno.' },
    { type: 'reto', world: 'tierra', q: '¿Por qué el azul es el color que más se ve en la Tierra?', options: ['Porque la mayor parte de la superficie es agua de océanos y mares', 'Porque el cielo se refleja', 'Porque hay muchos ríos'], a: 0 },
    { type: 'reto', world: 'tierra', q: 'Las Islas Atlánticas de Galicia son muy valiosas. ¿Qué son?', options: ['Un parque nacional', 'Una ciudad', 'Un continente'], a: 0, why: 'Es el Parque Nacional de las Islas Atlánticas de Galicia.' },
    { type: 'reto', world: 'tierra', q: 'Si pintas un mapamundi solo de azul y marrón, ¿qué te falta?', options: ['El verde de la vegetación', 'El rojo de los volcanes', 'Nada, está completo'], a: 0 },
    // Montaña
    { type: 'choice', world: 'montana', q: 'Un terreno llano entre montañas, recorrido por un río, es…', options: ['una cima', 'un valle', 'una sierra', 'una meseta'], a: 1 },
    { type: 'choice', world: 'montana', q: 'Un conjunto de muchísimas montañas unidas, muy extenso y muy alto, es…', options: ['una sierra', 'un valle', 'una cordillera', 'una cima'], a: 2 },
    { type: 'choice', world: 'montana', q: 'Un conjunto de montañas más pequeño y más bajo que una cordillera es…', options: ['una sierra', 'un valle', 'una meseta', 'una isla'], a: 0 },
    { type: 'choice', world: 'montana', q: '¿Qué es más grande y más alto?', options: ['Una sierra', 'Una cordillera'], a: 1 },
    { type: 'choice', world: 'montana', q: '¿Qué parte de la montaña puede tener nieve?', options: ['La cima', 'El valle', 'El río'], a: 0 },
    { type: 'choice', world: 'montana', q: '¿Qué actividad es muy importante en los pueblos de montaña?', options: ['La pesca', 'El turismo', 'Los astilleros'], a: 1 },
    { type: 'choice', world: 'montana', q: '¿Cómo son las carreteras de montaña?', options: ['Anchas y rectas', 'Estrechas y con curvas', 'No hay carreteras'], a: 1 },
    { type: 'choice', world: 'montana', q: '¿Para qué se construyen túneles en la montaña?', options: ['Para atravesar las montañas', 'Para guardar la nieve', 'Para que vivan los turistas'], a: 0 },
    { type: 'choice', world: 'montana', q: '¿De qué suele estar formada una montaña?', options: ['De arena', 'De rocas', 'De agua'], a: 1 },
    { type: 'tf', world: 'montana', s: 'La cima es la parte más baja de la montaña.', a: false, why: 'La cima es la parte más alta.' },
    { type: 'tf', world: 'montana', s: 'Un valle suele estar recorrido por ríos.', a: true },
    { type: 'tf', world: 'montana', s: 'Una sierra es más grande y más alta que una cordillera.', a: false, why: 'Es al revés: la cordillera es más extensa y más alta.' },
    { type: 'tf', world: 'montana', s: 'En la montaña hace frío y nieva en invierno.', a: true },
    { type: 'tf', world: 'montana', s: 'Los pueblos de montaña son muy grandes.', a: false, why: 'Son pequeños.' },
    { type: 'tf', world: 'montana', s: 'El suelo del valle es fértil y tiene vegetación.', a: true },
    { type: 'tf', world: 'montana', s: 'El paisaje de montaña tiene poca riqueza natural y cultural.', a: false, why: 'Tiene una gran riqueza natural y cultural.' },
    { type: 'reto', world: 'montana', q: 'Si una montaña no tuviera pendiente, ¿qué sería?', options: ['Una llanura', 'Una cordillera', 'Una cima'], a: 0, why: 'Sin pendiente no es montaña: sería un terreno llano.' },
    { type: 'reto', world: 'montana', q: 'Tanjiro sube hasta la parte más alta del monte. ¿Dónde está?', options: ['En el valle', 'En la cima', 'En la sierra'], a: 1 },
    { type: 'reto', world: 'montana', q: 'Varios ríos bajan de las montañas y se juntan en un terreno llano entre ellas. ¿Qué es ese terreno?', options: ['Un valle', 'Una cima', 'Un cabo'], a: 0 },
    { type: 'reto', world: 'montana', q: '¿Por qué el suelo del valle es fértil?', options: ['Porque lo recorre un río', 'Porque está muy alto', 'Porque tiene mucha nieve'], a: 0 },
    { type: 'reto', world: 'montana', q: 'Un pueblo de montaña sin túneles… ¿qué pasaría?', options: ['Habría que dar mucha vuelta por carreteras con curvas', 'No pasaría nada', 'Tendría más playas'], a: 0 },
    { type: 'reto', world: 'montana', q: 'Muchas montañas juntas, pero bajitas y en poco espacio. ¿Sierra o cordillera?', options: ['Sierra', 'Cordillera'], a: 0 },
    { type: 'reto', world: 'montana', q: '¿En qué se parecen una sierra y una cordillera?', options: ['Las dos son conjuntos de montañas', 'Las dos son terrenos llanos', 'Las dos tienen playas'], a: 0 },
    // Llanura
    { type: 'choice', world: 'llanura', q: 'Un terreno llano situado a bastante altura es…', options: ['una meseta', 'una depresión', 'un valle', 'una bahía'], a: 0 },
    { type: 'choice', world: 'llanura', q: 'Un terreno llano hundido respecto a otros más altos es…', options: ['una meseta', 'una depresión', 'una cima', 'un cabo'], a: 1 },
    { type: 'choice', world: 'llanura', q: '¿Dónde crecen bien los cultivos?', options: ['En terrenos llanos cerca de los ríos', 'En la cima de las montañas', 'En los acantilados'], a: 0 },
    { type: 'choice', world: 'llanura', q: '¿Cuál es el trabajo más típico de los pueblos de llanura?', options: ['La agricultura', 'Los hospitales', 'Los astilleros'], a: 0 },
    { type: 'choice', world: 'llanura', q: '¿Cuál NO es un trabajo típico de ciudad?', options: ['Transportes', 'Fábricas', 'Agricultura', 'Hospitales'], a: 2 },
    { type: 'choice', world: 'llanura', q: '¿Qué se cultiva en las llanuras?', options: ['Cereales, frutas y verduras', 'Conservas y astilleros', 'Hoteles y aeropuertos'], a: 0 },
    { type: 'tf', world: 'llanura', s: 'Una meseta es un terreno llano a bastante altura.', a: true },
    { type: 'tf', world: 'llanura', s: 'Una depresión es un terreno llano muy alto.', a: false, why: 'Una depresión está hundida respecto a otros terrenos más altos.' },
    { type: 'tf', world: 'llanura', s: 'En los pueblos de llanura muchas personas trabajan en la agricultura.', a: true },
    { type: 'tf', world: 'llanura', s: 'Los cultivos crecen mal en terrenos llanos.', a: false, why: 'Crecen bien en terrenos llanos cerca de los ríos.' },
    { type: 'tf', world: 'llanura', s: 'En las ciudades la mayoría trabaja en el campo.', a: false, why: 'En las ciudades trabajan en transportes, fábricas, oficinas, comercios y hospitales.' },
    { type: 'tf', world: 'llanura', s: 'Los hospitales y las oficinas son trabajos de ciudad.', a: true },
    { type: 'reto', world: 'llanura', q: 'Karasuno está en un pueblo con campos y Nekoma en una ciudad enorme. ¿Dónde habrá más tractores?', options: ['En el pueblo de Karasuno', 'En la ciudad de Nekoma'], a: 0, why: 'En los pueblos de llanura se trabaja en la agricultura.' },
    { type: 'reto', world: 'llanura', q: 'Un terreno llano, más bajo que todo lo de alrededor, con un río en medio. ¿Meseta o depresión?', options: ['Meseta', 'Depresión'], a: 1 },
    { type: 'reto', world: 'llanura', q: 'Un terreno llano en lo alto, donde hace más frío que abajo. ¿Meseta o depresión?', options: ['Meseta', 'Depresión'], a: 0 },
    { type: 'reto', world: 'llanura', q: '¿En qué se parecen una meseta y una depresión?', options: ['Las dos son terrenos llanos', 'Las dos están muy altas', 'Las dos tienen acantilados'], a: 0 },
    { type: 'reto', world: 'llanura', q: '¿Por qué los agricultores prefieren vivir cerca de los ríos?', options: ['Porque los cultivos necesitan agua', 'Porque hay más hospitales', 'Porque hay montañas'], a: 0 },
    { type: 'reto', world: 'llanura', q: 'Kuroo trabaja en una oficina y Hinata ayuda a recoger cereales. ¿Quién vive en la ciudad?', options: ['Kuroo', 'Hinata'], a: 0 },
    // Costa
    { type: 'choice', world: 'costa', q: 'Franja estrecha de tierra que une la península con el continente:', options: ['cabo', 'istmo', 'golfo', 'isla'], a: 1 },
    { type: 'choice', world: 'costa', q: 'Saliente de tierra que se adentra en el mar:', options: ['bahía', 'istmo', 'cabo', 'archipiélago'], a: 2 },
    { type: 'choice', world: 'costa', q: 'Gran entrada del mar en la tierra:', options: ['golfo', 'bahía', 'cabo', 'península'], a: 0 },
    { type: 'choice', world: 'costa', q: 'Entrada pequeña del mar en la tierra:', options: ['golfo', 'bahía', 'istmo', 'isla'], a: 1 },
    { type: 'choice', world: 'costa', q: 'Conjunto de muchas islas cercanas:', options: ['península', 'archipiélago', 'cabo', 'costa alta'], a: 1 },
    { type: 'choice', world: 'costa', q: 'Terreno rodeado de agua por todas partes menos por una:', options: ['isla', 'península', 'golfo', 'istmo'], a: 1 },
    { type: 'choice', world: 'costa', q: 'Porción de tierra rodeada de agua por todas partes:', options: ['isla', 'península', 'cabo', 'bahía'], a: 0 },
    { type: 'choice', world: 'costa', q: '¿Qué costa tiene acantilados?', options: ['La costa alta', 'La costa baja'], a: 0 },
    { type: 'choice', world: 'costa', q: '¿Qué costa tiene playas de arena o de cantos?', options: ['La costa alta', 'La costa baja'], a: 1 },
    { type: 'choice', world: 'costa', q: 'Los guías, recepcionistas y camareros trabajan en…', options: ['la pesca', 'la industria', 'el turismo (servicios)'], a: 2 },
    { type: 'choice', world: 'costa', q: 'Las conservas y los astilleros son…', options: ['industria', 'pesca', 'turismo'], a: 0 },
    { type: 'choice', world: 'costa', q: 'Antes, ¿a qué se dedicaban muchas personas de la costa?', options: ['A la pesca', 'A las oficinas', 'A los hoteles'], a: 0 },
    { type: 'tf', world: 'costa', s: 'La costa alta tiene playas de arena.', a: false, why: 'La costa alta tiene acantilados; las playas son de la costa baja.' },
    { type: 'tf', world: 'costa', s: 'Un archipiélago es una sola isla muy grande.', a: false, why: 'Es un conjunto de muchas islas cercanas.' },
    { type: 'tf', world: 'costa', s: 'Una isla está rodeada de agua por todas partes.', a: true },
    { type: 'tf', world: 'costa', s: 'El istmo une la península con el continente.', a: true },
    { type: 'tf', world: 'costa', s: 'Un golfo es más pequeño que una bahía.', a: false, why: 'El golfo es la entrada grande; la bahía, la pequeña.' },
    { type: 'tf', world: 'costa', s: 'Un cabo es una entrada del mar en la tierra.', a: false, why: 'Un cabo es un saliente de TIERRA que se adentra en el mar.' },
    { type: 'tf', world: 'costa', s: 'Cada año llegan muchos turistas a las costas.', a: true },
    { type: 'tf', world: 'costa', s: 'Ahora la mayoría de la gente de la costa trabaja en la industria y los servicios.', a: true },
    { type: 'reto', world: 'costa', q: 'Si quitáramos el istmo, ¿la península qué sería?', options: ['Una isla', 'Un cabo', 'Un golfo'], a: 0, why: 'Sin el istmo quedaría rodeada de agua por todas partes: una isla.' },
    { type: 'reto', world: 'costa', q: 'Muchas islas pequeñas muy juntas forman…', options: ['un archipiélago', 'una península', 'una bahía'], a: 0 },
    { type: 'reto', world: 'costa', q: 'Luffy ve un trozo de tierra que se mete en el mar como un dedo. ¿Qué es?', options: ['Un cabo', 'Un golfo', 'Un istmo'], a: 0 },
    { type: 'reto', world: 'costa', q: 'Una entrada del mar enorme, de muchos kilómetros. ¿Golfo o bahía?', options: ['Golfo', 'Bahía'], a: 0 },
    { type: 'reto', world: 'costa', q: 'Las montañas llegan hasta el mar y hay acantilados. ¿Qué costa es?', options: ['Costa alta', 'Costa baja'], a: 0 },
    { type: 'reto', world: 'costa', q: '¿Por qué en la costa hay tantos hoteles y aeropuertos?', options: ['Porque llegan muchos turistas', 'Porque hay muchas montañas', 'Porque se cultivan cereales'], a: 0 },
    { type: 'reto', world: 'costa', q: 'Nami quiere ir andando de la península al continente, sin barco. ¿Por dónde pasa?', options: ['Por el istmo', 'Por el cabo', 'Por el archipiélago'], a: 0 },
    { type: 'reto', world: 'costa', q: '¿En qué se diferencian un golfo y una bahía?', options: ['En el tamaño: el golfo es grande y la bahía pequeña', 'En el color del agua', 'En que la bahía tiene islas'], a: 0 },
    { type: 'reto', world: 'costa', q: '¿En qué se diferencian una isla y una península?', options: ['La isla tiene agua por todas partes; la península, por todas menos una', 'La isla es más grande', 'No se diferencian'], a: 0 },
    { type: 'reto', world: 'costa', q: 'Un pueblo de costa con una fábrica de conservas. ¿Qué tipo de trabajo es?', options: ['Industria', 'Pesca', 'Turismo'], a: 0 },
  ];

  // ---------- escenas para PONER NOMBRES (coordenadas en % sobre la imagen; se ajustan cuando esté el dibujo) ----------
  const scenes = {
    // coordenadas medidas sobre los dibujos generados el 8-oct (1200×896): x,y en % del ancho/alto
    mapamundi: { world: 'tierra', img: 'assets/img/scene_mapamundi.webp', ratio: 1200 / 896, title: 'Océanos y continentes', rounds: [
      { title: 'Los cinco océanos', labels: [{ id: 'pacifico', text: 'Pacífico', x: 9, y: 66 }, { id: 'atlantico', text: 'Atlántico', x: 37, y: 54 }, { id: 'indico', text: 'Índico', x: 69, y: 68 }, { id: 'artico', text: 'Glacial Ártico', x: 50, y: 5 }, { id: 'antartico', text: 'Glacial Antártico', x: 50, y: 84 }] },
      { title: 'Los seis continentes', labels: [{ id: 'america', text: 'América', x: 21, y: 38 }, { id: 'europa', text: 'Europa', x: 53, y: 28 }, { id: 'africa', text: 'África', x: 50, y: 54 }, { id: 'asia', text: 'Asia', x: 76, y: 33 }, { id: 'oceania', text: 'Oceanía', x: 85, y: 67 }, { id: 'antartida', text: 'Antártida', x: 50, y: 94 }] },
    ] },
    montana: { world: 'montana', img: 'assets/img/scene_montana.webp', ratio: 1200 / 896, title: 'El paisaje de montaña', rounds: [
      { title: 'Pon cada nombre en su sitio', labels: [{ id: 'cima', text: 'Cima', x: 38, y: 25 }, { id: 'montana', text: 'Montaña', x: 38, y: 50 }, { id: 'cordillera', text: 'Cordillera', x: 70, y: 40 }, { id: 'sierra', text: 'Sierra', x: 84, y: 53 }, { id: 'valle', text: 'Valle', x: 40, y: 85 }, { id: 'pueblo', text: 'Pueblo', x: 69, y: 79 }, { id: 'rio', text: 'Río', x: 60, y: 94 }] },
    ] },
    llanura: { world: 'llanura', img: 'assets/img/scene_llanura.webp', ratio: 1200 / 896, title: 'El paisaje de llanura', rounds: [
      { title: 'Pon cada nombre en su sitio', labels: [{ id: 'meseta', text: 'Meseta', x: 25, y: 30 }, { id: 'depresion', text: 'Depresión', x: 76, y: 62 }, { id: 'pueblo', text: 'Pueblo', x: 12, y: 84 }, { id: 'ciudad', text: 'Ciudad', x: 84, y: 17 }, { id: 'rio', text: 'Río', x: 66, y: 80 }] },
    ] },
    costa: { world: 'costa', img: 'assets/img/scene_costa.webp', ratio: 1200 / 896, title: 'Los elementos de la costa', rounds: [
      { title: 'Pon cada nombre en su sitio', labels: [{ id: 'archipielago', text: 'Archipiélago', x: 15, y: 17 }, { id: 'isla', text: 'Isla', x: 17, y: 58 }, { id: 'peninsula', text: 'Península', x: 51, y: 69 }, { id: 'istmo', text: 'Istmo', x: 57, y: 87 }, { id: 'cabo', text: 'Cabo', x: 50, y: 22 }, { id: 'golfo', text: 'Golfo', x: 75, y: 39 }, { id: 'bahia', text: 'Bahía', x: 88, y: 76 }, { id: 'costa_alta', text: 'Costa alta', x: 88, y: 7 }] },
    ] },
  };

  // ---------- «¿Sabías que…?» (sorpresas al abrir sobres; todo cierto) ----------
  const facts = [
    { id: 'f1', world: 'tierra', text: 'El océano Pacífico es tan grande que dentro cabrían todos los continentes juntos.' },
    { id: 'f2', world: 'tierra', text: 'La Antártida es el continente más frío: casi todo está cubierto de hielo, y solo viven allí científicos y pingüinos.' },
    { id: 'f3', world: 'tierra', text: 'Europa y Asia están pegados: juntos forman un enorme trozo de tierra llamado Eurasia.' },
    { id: 'f4', world: 'montana', text: 'El Everest, la montaña más alta del mundo, mide 8.849 metros: casi 9 kilómetros hacia arriba.' },
    { id: 'f5', world: 'montana', text: 'La cordillera más larga del mundo es la de los Andes, en América: unos 7.000 kilómetros de montañas seguidas.' },
    { id: 'f6', world: 'montana', text: 'Al lado de Totana está Sierra Espuña, un parque regional protegido lleno de bosques de pinos.' },
    { id: 'f7', world: 'montana', text: 'El túnel de montaña más largo del mundo está en Suiza y mide 57 kilómetros: un tren tarda 20 minutos en cruzarlo.' },
    { id: 'f8', world: 'llanura', text: 'Madrid está en la Meseta Central de España, a unos 650 metros de altura, aunque parezca llano.' },
    { id: 'f9', world: 'llanura', text: 'Los cereales como el trigo se cultivan en las llanuras desde hace más de 10.000 años.' },
    { id: 'f10', world: 'costa', text: 'Las Islas Canarias y las Islas Baleares son dos archipiélagos de España.' },
    { id: 'f11', world: 'costa', text: 'Cerca de Totana está el Mar Menor: una laguna de agua salada separada del Mediterráneo por una franja estrecha de arena, La Manga.' },
    { id: 'f12', world: 'costa', text: 'España está en la península ibérica: tiene mar por casi todos los lados y se une al resto de Europa por los Pirineos.' },
  ];

  // ---------- chistes de los personajes: entre ejercicio y ejercicio y en los sobres (q = pregunta, a = remate) ----------
  const jokes = [
    { who: 'Ochaco', q: '¿Qué le dice una montaña a otra montaña?', a: '¡Qué cima tienes!' },
    { who: 'Nami', q: '¿Cuál es el océano más educado?', a: 'El Pacífico: nunca se enfada.' },
    { who: 'Tanjiro', q: '¿Por qué el río nunca se pierde?', a: 'Porque siempre sigue su curso.' },
    { who: 'Hinata', q: '¿Qué hace una abeja en el gimnasio?', a: '¡Zum-ba!' },
    { who: 'Luffy', q: '¿Qué le dice un pez a otro pez?', a: '¡Nada!' },
    { who: 'Nezuko', q: '¿Qué le dice una iguana a su hermana gemela?', a: '¡Somos iguanitas!' },
    { who: 'Ochaco', q: '¿Qué le dijo el istmo a la península?', a: '¡Sin mí serías una isla!' },
    { who: 'Zenitsu', q: '¿Cuál es el colmo de un electricista?', a: '¡No seguir la corriente!' },
    { who: 'Chopper', q: '¿Qué hace un pato con una pata?', a: '¡Cojea!' },
    { who: 'Nami', q: '¿Qué le dice el cabo al mar?', a: 'Me meto un poquito, ¿vale?' },
    { who: 'Inosuke', q: '¿Cuál es el animal más antiguo?', a: '¡La cebra, porque está en blanco y negro!' },
    { who: 'Hinata', q: '¿Por qué el libro de mates estaba triste?', a: 'Porque tenía muchos problemas.' },
    { who: 'Tanjiro', q: '¿Por qué la meseta está siempre tranquila?', a: 'Porque todo lo ve llano.' },
    { who: 'Ochaco', q: '¿Qué le dice un jaguar a otro jaguar?', a: '¡Jaguar you!' },
    { who: 'Luffy', q: '¿Cuál es el país más picante?', a: 'Chile. ¿Y el más gracioso? ¡Jajapón!' },
    { who: 'Nezuko', q: '¿Por qué las focas miran siempre hacia arriba?', a: 'Porque ahí están los focos.' },
    { who: 'Nami', q: '¿Qué le dice una isla a otra isla?', a: '¡Juntas somos un archipiélago!' },
    { who: 'Hinata', q: '¿Qué le dice un semáforo a otro semáforo?', a: 'No me mires, que me estoy cambiando.' },
    { who: 'Zenitsu', q: '¿Qué hace una vaca en un terremoto?', a: '¡Un batido!' },
    { who: 'Chopper', q: '¿Cómo se despiden los químicos?', a: '¡Ácido un placer!' },
    { who: 'Ochaco', q: '¿Qué es lo que más pesa en la Tierra?', a: 'Nada, si estoy yo cerca: ¡todo flota!' },
    { who: 'Tanjiro', q: '¿Cuál es el colmo de un jardinero?', a: 'Que su novia lo deje plantado.' },
    { who: 'Nami', q: '¿Qué le dice el golfo a la bahía?', a: '¡Eres mi versión mini!' },
    { who: 'Luffy', q: 'Mamá, en el cole me llaman despistado.', a: 'Niño, que esta no es tu casa.' },
    { who: 'Inosuke', q: '¿Qué le dice un gusano a otro gusano?', a: 'Voy a dar una vuelta a la manzana.' },
    { who: 'Hinata', q: '¿Qué le dice una pared a otra pared?', a: 'Nos vemos en la esquina.' },
    { who: 'Nezuko', q: '¿Qué le dice el 1 al 10?', a: 'Para ser como yo tienes que ser sincero… ¡sin cero!' },
    { who: 'Chopper', q: '¿Cuál es el colmo de un pez?', a: '¡Que no sepa nadar… ni en el valle, que tiene río!' },
  ];
  // quién habla con qué tipo de voz (las de niña, chica y chico vienen de la biblioteca de ElevenLabs; el narrador es Leónidas)
  const VOICE_OF = { Ochaco: 'girl', Nezuko: 'girl', Chopper: 'girl', Nami: 'woman', Tanjiro: 'boy', Hinata: 'boy', Luffy: 'boy', Zenitsu: 'boy', Inosuke: 'boy' };

  // ---------- frases de los personajes (voz) ----------
  const lines = {
    w_tierra: '¡Hola, María! Soy Ochaco. Flotando desde aquí arriba se ve la Tierra entera: azul, marrón y verde. ¡Vamos a explorarla!',
    w_montana: '¡Hola, María! Soy Tanjiro. Yo me crié en la montaña, con nieve y mucha pendiente. ¡Te la enseño!',
    w_llanura: '¡Hola, María! Soy Hinata, de Karasuno, un pueblo rodeado de campos. Kuroo es de Nekoma, en la gran ciudad. ¡Vamos a ver las llanuras!',
    w_costa: '¡Hola, María! Soy Nami, la navegante. Islas, cabos, golfos… ¡en el mar lo sé todo! ¡A la costa!',
    cs_intro: '¡Hola, María! Bienvenida a Ciencias Sociales. Cuatro paisajes, cuatro aventuras. ¡Vamos!',
    learn_1: 'Primero te lo enseño. Escucha y mira.',
    learn_2: 'Ahora tú. Toca lo que te pido.',
    learn_3: '¡Última prueba! ¿Qué es esto?',
    write_start: 'Escribe la definición con tus palabras. Las palabras importantes tienen que estar.',
    write_fix: 'Casi. Mira la definición, escúchala y escríbela tú.',
    label_start: 'Arrastra cada nombre a su sitio en el dibujo.',
    sort_start: 'Pon cada frase en su cajón.',
    list_start: 'Toca todos los que son. ¡Cuidado con los intrusos!',
    reto_start: '¡Pregunta reto! Aquí hay que pensar.',
    tf_start: '¿Verdadero o falso?',
    sobre: '¡Un sobre sorpresa! ¿Qué habrá dentro?',
    sticker: '¡Pegatina nueva para tu álbum!',
    sabias: '¿Sabías que…?',
    quick_start: '¿Ya lo sabes? Demuéstralo. Si aciertas, nos saltamos lo fácil.',
    quick_pass: '¡Lo tenías! Nos saltamos lo fácil y vamos a lo difícil.',
    world_done: '¡Ficha dominada! Tres estrellas. ¡Eres increíble!',
    mixed_start: 'Mezcla de las cuatro fichas. ¡Concéntrate!',
  };

  const byWorld = (arr, w) => arr.filter(x => x.world === w);
  // nombre estable (hash corto) para el clip de voz de cada pregunta: misma función en el generador de audio
  const hash = t => { let h = 5381; const n = String(t); for (let i = 0; i < n.length; i++) h = ((h * 33) ^ n.charCodeAt(i)) >>> 0; return h.toString(36); };
  // concepto → punto de una escena (para enseñarlo señalándolo y para «toca el…»)
  const SPOT = { cima: ['montana', 'cima'], montana: ['montana', 'montana'], valle: ['montana', 'valle'], sierra: ['montana', 'sierra'], cordillera: ['montana', 'cordillera'], meseta: ['llanura', 'meseta'], depresion: ['llanura', 'depresion'], archipielago: ['costa', 'archipielago'], isla: ['costa', 'isla'], peninsula: ['costa', 'peninsula'], istmo: ['costa', 'istmo'], cabo: ['costa', 'cabo'], golfo: ['costa', 'golfo'], bahia: ['costa', 'bahia'], costa_alta: ['costa', 'costa_alta'] };
  return { hash, SPOT, VOICE_OF, worlds, WORLD_ORDER, concepts, lists, sorts, questions, scenes, facts, jokes, lines, byWorld, concept: id => concepts.find(c => c.id === id) };
})();
