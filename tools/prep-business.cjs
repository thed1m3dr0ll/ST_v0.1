// Готовит фото для страницы «Владельцам бизнеса» (/partners/business/):
// — первый экран: «для сайта/владельцы бизнеса/для первого экрана.png» → src/assets/business/hero.jpg;
// — «Разные проекты — уникальные решения»: фото из «для сайта/владельцы бизнеса/разные проекты» →
//   вертикальные 3:4 в src/assets/business/deck/NN.jpg (порядок и центр кадра по ширине — в списке deck ниже);
// — полоса «Как мы работаем»: Центр КАМАЗ → src/assets/business/band-kamaz.jpg;
// — полоса «Рассчитаем стоимость»: ресторан на Рождественской (DSC04850) → src/assets/business/cta-restoran.jpg.
// Запуск из папки site: node tools/prep-business.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/владельцы бизнеса');
const OUT = path.join(site, 'src/assets/business');

// файл → x: где по ширине кадра центр вертикальной вырезки (0 — левый край, 1 — правый)
const deck = [
  { file: 'Арочное окно с отражением города.png', x: 0.48 },
  { file: 'DSC08133.JPG', x: 0.5 },
  { file: 'панорамное остекление (2).jpg', x: 0.5 },
  { file: 'Мятная арочная дверь в бетоне.png', x: 0.55 },
  { file: 'DSC08139.JPG', x: 0.38 },
];
const W = 720, H = 960; // карточка 3:4

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await sharp(path.join(SRC, 'для первого экрана.png')).flatten({ background: '#fbfdff' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'hero.jpg'));

  const dir = path.join(OUT, 'deck');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, { file, x }] of deck.entries()) {
    const img = sharp(path.join(SRC, 'разные проекты', file), { limitInputPixels: false }).rotate();
    const buf = await img.toBuffer({ resolveWithObject: true });
    const { width, height } = buf.info;
    const w = Math.min(width, Math.round(height * 3 / 4));
    const left = Math.max(0, Math.min(width - w, Math.round(width * x - w / 2)));
    await sharp(buf.data).extract({ left, top: 0, width: w, height }).resize(W, H)
      .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`));
  }

  await sharp(path.join(site, 'src/content/objects/kamaz/01.jpg')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'band-kamaz.jpg'));
  await sharp(path.join(site, 'src/content/objects/restoran-rozhdestvenskaya/03.jpg')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'cta-restoran.jpg'));
  console.log('готово');
})();
