// Готовит фото для страницы «Услуги» (/services/):
// первый экран — коллаж из трёх фото (WAKE PARK, панорамное остекление Александровской слободы DSC01277, алюм. дверь Александровская слобода)
// → src/assets/services/hero-*.jpg; карточки услуг — квадраты 1000×1000 → src/assets/services/cards/*.jpg;
// фото первых экранов страниц услуг → src/assets/services/pages/<slug>/*.jpg (список pages ниже).
// Запуск из папки site: node tools/prep-services.cjs (только карточки: node tools/prep-services.cjs cards [facade doors …])
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const R = path.join(site, '../для сайта');
const OUT = path.join(site, 'src/assets/services');
fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true });

// Фото первого экрана: высота до 1600 px (каждое занимает треть ширины экрана)
const hero = {
  'hero-wakepark': 'прочие объекты/WAKE PARK панорамное остекление/DSC08628.JPG',
  'hero-aleksandrovskaya': 'фото частных объектов (коттеджи)/мкр-н Александровская слобода/DSC01277.png',
  'hero-door': 'прочие объекты/двери/алюм дверь александровская слобода.png',
};

// Карточки: [файл, точка кадрирования для квадрата, необязательно — приближение { zoom, x, y }:
// квадрат со стороной min(ширина, высота) / zoom с центром в долях x, y от размеров фото]
const S = 'для страницы услуги/';
const cards = {
  // S — фото, которые пользователь положил специально для карточек
  facade: [S + 'фасадное остекление.png', 'centre'],
  windows: [S + 'окна.png', 'centre'],
  doors: [S + 'дверь.png', 'centre'],
  terraces: [S + 'Терраса.png', 'centre'],
  verandas: ['веранда.png', 'centre'],
  'winter-gardens': ['прочие объекты/зимний сад/Современная стеклянная терраса среди сосен.png', 'centre'],
  partitions: [S + 'перегородки.png', 'centre', { zoom: 1, x: 0.62, y: 0.5 }], // кадр правее — чтобы дверь «01» не обрезалась
  railings: [S + 'ограждения.png', 'centre', { zoom: 1, x: 0.6, y: 0.5 }], // правее — стекло с отражением заката
  skylights: [S + 'зенитные фонари.png', 'centre'],
  canopies: [S + 'козырьки (1).png', 'centre', { zoom: 1, x: 0.5, y: 0.44 }], // фото вертикальное: кадр выше центра, козырёк — в середине карточки
  individual: ['прочие объекты/выход на крышу/roza rossa 2.png', 'centre', { zoom: 1, x: 0.58, y: 0.5 }], // заглушка — выходы на крышу Roza Rossa; кадр правее центра, чтобы павильон не обрезался
};

// Страницы услуг (/services/<slug>/): фото первого экрана, которые листаются, → src/assets/services/pages/<slug>/01.jpg, 02.jpg…
// Порядок — как в списке; строка, оканчивающаяся на «/», — вся папка (только файлы, без вложенных папок).
const H = 'фото жилых комплексов/', P = 'фото частных объектов (коттеджи)/', O = 'прочие объекты/';
const pages = {
  facade: [H + 'жк холмс (фасадное остекление)/Photo 468.jpg', H + 'жк холмс (фасадное остекление)/Photo 477.jpg',
    H + 'жк плотничный (фасадное остекление)/DSC08475.JPG', H + 'жк плотничный (фасадное остекление)/DSC08439.JPG',
    P + 'деревня Новопокровское/DSC01069.jpg', P + 'деревня Ройка/пр.JPG'],
  windows: [H + 'жк георгиевский (фасадное остекление)/DSC08299.JPG', H + 'жк плотничный (фасадное остекление)/DSC08439.JPG',
    H + 'жк тимирязевский (панорамное остекление)/DJI_0990.JPG', O + 'центр Камаз/DSC05163.jpg', P + 'деревня Ройка/DSC01387.JPG'],
  doors: [O + 'двери/'],
  terraces: [O + 'терраса/'],
  verandas: ['веранда.png', 'веранда2.png'],
  'winter-gardens': [O + 'зимний сад/'],
  partitions: [O + 'внутренние перегородки/клиника Садко/'],
  railings: [O + 'ограждения/', O + 'ограждения/ограждения крыши клубный дом на ярославской/'],
  skylights: [O + 'зенитные фонари/'],
  canopies: [O + 'козырьки/'], // вложенная папка Новакарда — фасад и витражи, не козырьки
  individual: [O + 'ресторан на рождественской/23.png', O + 'ресторан на рождественской/24.png', O + 'галерея на рождественской/панорамное остекление (2).jpg'],
};
const isPhoto = (f) => /\.(jpe?g|png|webp)$/i.test(f);
const expand = (src) => src.endsWith('/')
  ? fs.readdirSync(path.join(R, src)).filter((f) => isPhoto(f) && fs.statSync(path.join(R, src, f)).isFile()).sort((a, b) => a.localeCompare(b, 'ru')).map((f) => src + f)
  : [src];

const onlyCards = process.argv[2] === 'cards';
const cardNames = process.argv.slice(3); // пусто — все карточки

(async () => {
  if (!onlyCards) for (const [slug, list] of Object.entries(pages)) {
    const dir = path.join(OUT, 'pages', slug);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const files = list.flatMap(expand);
    for (const [i, src] of files.entries()) {
      await sharp(path.join(R, src)).rotate().flatten({ background: '#fbfdff' })
        .resize({ width: 1800, height: 1400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(dir, String(i + 1).padStart(2, '0') + '.jpg'));
    }
    console.log(slug + ':', files.length, 'фото');
  }
  if (!onlyCards) for (const [name, src] of Object.entries(hero)) {
    await sharp(path.join(R, src)).rotate().flatten({ background: '#fbfdff' })
      .resize({ height: 1600, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, name + '.jpg'));
  }
  for (const [name, [src, pos, crop]] of Object.entries(cards)) {
    if (cardNames.length && !cardNames.includes(name)) continue;
    let img = sharp(path.join(R, src)).rotate().flatten({ background: '#fbfdff' });
    if (crop) {
      const { width: w, height: h } = await sharp(path.join(R, src)).rotate().metadata();
      const side = Math.round(Math.min(w, h) / crop.zoom);
      const left = Math.min(w - side, Math.max(0, Math.round(w * crop.x - side / 2)));
      const top = Math.min(h - side, Math.max(0, Math.round(h * crop.y - side / 2)));
      img = sharp(await img.extract({ left, top, width: side, height: side }).toBuffer());
    }
    await img
      .resize(1000, 1000, { fit: 'cover', position: pos })
      .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'cards', name + '.jpg'));
  }
  console.log('готово:', fs.readdirSync(OUT).join(', '), '|', fs.readdirSync(path.join(OUT, 'cards')).join(', '));
})();
