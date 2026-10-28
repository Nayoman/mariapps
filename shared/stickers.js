/* MariApps — catálogo de pegatinas del álbum (común a todas las apps). Rutas relativas a la raíz de MariApps.
   Las de las tablas ya existen (tablas/assets/img); las nuevas (st_*) se generan en shared/img/. */
window.MK_STICKERS = [
  // One Piece
  { id: 'luffy', name: 'Luffy', series: 'onepiece', img: 'tablas/assets/img/ch_luffy.webp' },
  { id: 'zoro', name: 'Zoro', series: 'onepiece', img: 'tablas/assets/img/ch_zoro.webp' },
  { id: 'nami', name: 'Nami', series: 'onepiece', img: 'tablas/assets/img/ch_nami.webp' },
  { id: 'chopper', name: 'Chopper', series: 'onepiece', img: 'tablas/assets/img/ch_chopper.webp' },
  { id: 'sanji', name: 'Sanji', series: 'onepiece', img: 'shared/img/st_sanji.webp' },
  { id: 'usopp', name: 'Usopp', series: 'onepiece', img: 'shared/img/st_usopp.webp' },
  // Demon Slayer
  { id: 'tanjiro', name: 'Tanjiro', series: 'demonslayer', img: 'tablas/assets/img/ch_tanjiro.webp' },
  { id: 'nezuko', name: 'Nezuko', series: 'demonslayer', img: 'tablas/assets/img/ch_nezuko.webp' },
  { id: 'zenitsu', name: 'Zenitsu', series: 'demonslayer', img: 'tablas/assets/img/ch_zenitsu.webp' },
  { id: 'inosuke', name: 'Inosuke', series: 'demonslayer', img: 'tablas/assets/img/ch_inosuke.webp' },
  { id: 'giyu', name: 'Giyu', series: 'demonslayer', img: 'shared/img/st_giyu.webp' },
  { id: 'rengoku', name: 'Rengoku', series: 'demonslayer', img: 'shared/img/st_rengoku.webp' },
  // Haikyuu
  { id: 'hinata', name: 'Hinata', series: 'haikyuu', img: 'tablas/assets/img/ch_hinata.webp' },
  { id: 'kageyama', name: 'Kageyama', series: 'haikyuu', img: 'tablas/assets/img/ch_kageyama.webp' },
  { id: 'nishinoya', name: 'Nishinoya', series: 'haikyuu', img: 'tablas/assets/img/ch_nishinoya.webp' },
  { id: 'tanaka', name: 'Tanaka', series: 'haikyuu', img: 'tablas/assets/img/ch_tanaka.webp' },
  { id: 'daichi', name: 'Daichi', series: 'haikyuu', img: 'shared/img/st_daichi.webp' },
  { id: 'sugawara', name: 'Sugawara', series: 'haikyuu', img: 'shared/img/st_sugawara.webp' },
  // My Hero Academia
  { id: 'deku', name: 'Deku', series: 'mha', img: 'shared/img/st_deku.webp' },
  { id: 'ochaco', name: 'Ochaco', series: 'mha', img: 'shared/img/st_ochaco.webp' },
  { id: 'allmight', name: 'All Might', series: 'mha', img: 'shared/img/st_allmight.webp' },
  { id: 'bakugo', name: 'Bakugo', series: 'mha', img: 'shared/img/st_bakugo.webp' },
  { id: 'todoroki', name: 'Todoroki', series: 'mha', img: 'shared/img/st_todoroki.webp' },
  { id: 'iida', name: 'Iida', series: 'mha', img: 'shared/img/st_iida.webp' },
];
window.MK_SERIES = {
  onepiece: { name: 'One Piece', color: '#E4002B' },
  demonslayer: { name: 'Demon Slayer', color: '#1E6F50' },
  haikyuu: { name: 'Haikyuu!!', color: '#F26A1B' },
  mha: { name: 'My Hero Academia', color: '#2BA84A' },
};
