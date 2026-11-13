// Готовит фото для оборотной стороны блоков «Путь развития» на странице «О нас».
// Источники — папка «для сайта/таймлайн» (+ Нотариальная палата и Норкемикал из «прочие объекты»).
// Это промежуточные исходники для astro:assets (он ещё раз пережимает их в webp нужных размеров),
// поэтому сжимаем бережно: до 2400 px по большей стороне, JPEG 94 без прореживания цвета.
// Большие фото с профессиональной камеры после уменьшения слегка подтачиваем, маленькие не трогаем.
// Результат — src/assets/about/timeline/*.jpg.
// Запуск из папки site: node tools/prep-timeline.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта');
const OUT = path.join(site, 'src/assets/about/timeline');
fs.mkdirSync(OUT, { recursive: true });

const files = {
  'leto-2020': 'таймлайн/лето2020.png',
  'osen-2020': 'таймлайн/осень2020.jpg',
  'notarialnaya-palata': 'прочие объекты/крупногабаритное остекление Нотариальная палата.JPG',
  'ges-2': 'таймлайн/гэс-2.jpg',
  'norkemikal': 'прочие объекты/Норкемикал остекление кровли/DJI_0070.JPG',
  'vesna-2023-1': 'таймлайн/весна2023.JPG',
  'vesna-2023-2': 'таймлайн/весна2023_1.png',
  'vesna-2023-3': 'таймлайн/весна2023_2.PNG',
  'logistika': 'таймлайн/логистика.png',
};

(async () => {
  for (const [name, file] of Object.entries(files)) {
    const img = sharp(path.join(SRC, file)).rotate();
    const { width, height } = await img.metadata();
    const big = Math.max(width, height) > 2400;
    if (big) img.resize({ width: 2400, height: 2400, fit: 'inside', kernel: 'lanczos3' }).sharpen({ sigma: 0.6 });
    await img
      .flatten({ background: '#fbfdff' })
      .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
      .toFile(path.join(OUT, `${name}.jpg`));
  }
  console.log('готово:', fs.readdirSync(OUT).join(', '));
})();
