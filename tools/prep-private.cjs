// Готовит фото для страницы «Частным лицам» (/partners/private/):
// — первый экран: «для сайта/частным лицам/1 экран.png» → src/assets/private/hero.jpg;
// — «Каким может быть ваш дом»: фото из «для сайта/частным лицам/визуал» →
//   вертикальные 3:4 в src/assets/private/deck/NN.jpg (порядок и центр кадра по ширине — в списке deck ниже);
// — полоса «Рассчитаем стоимость»: коттедж в деревне Ройка → src/assets/private/cta-royka.jpg.
// Запуск из папки site: node tools/prep-private.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/частным лицам');
const OUT = path.join(site, 'src/assets/private');

// файл → x: где по ширине кадра центр вертикальной вырезки (0 — левый край, 1 — правый)
const deck = [
  { file: 'Солнечная веранда с видом на сад (1).png', x: 0.55 },
  { file: 'Светлая гостиная и стеклянный кабинет.png', x: 0.62 },
  { file: 'Современная терраса со стеклянным ограждением.png', x: 0.5 },
  { file: 'Солнечная оранжерея с зеленью и креслами.png', x: 0.5 },
  { file: 'Современная гостиная с видом на сад.png', x: 0.66 },
];
const W = 720, H = 960; // карточка 3:4

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await sharp(path.join(SRC, '1 экран.png')).flatten({ background: '#fbfdff' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'hero.jpg'));

  const dir = path.join(OUT, 'deck');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, { file, x }] of deck.entries()) {
    const img = sharp(path.join(SRC, 'визуал', file), { limitInputPixels: false }).rotate();
    const buf = await img.toBuffer({ resolveWithObject: true });
    const { width, height } = buf.info;
    const w = Math.min(width, Math.round(height * 3 / 4));
    const left = Math.max(0, Math.min(width - w, Math.round(width * x - w / 2)));
    await sharp(buf.data).extract({ left, top: 0, width: w, height }).resize(W, H)
      .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`));
  }

  await sharp(path.join(site, 'src/content/objects/royka/02.jpg')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'cta-royka.jpg'));
  console.log('готово');
})();
