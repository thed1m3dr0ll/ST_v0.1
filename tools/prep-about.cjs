// Готовит фото для страницы «О нас» из папки «для сайта/для страницы о нас».
// Исходники весят 6–12 МБ — уменьшаем до разумного размера, директора кадрируем квадратом.
// Результат — src/assets/about/*.jpg. Запуск из папки site: node tools/prep-about.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/для страницы о нас');
const OUT = path.join(site, 'src/assets/about');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  // Первый экран: справа (от ≈ 80 % ширины) лестница и техэтаж — их отрезаем, левый край кадра оставляем целиком.
  // По ширине 2560 (больше PageHero не запрашивает).
  const hero = sharp(path.join(SRC, 'фон для 1 экрана.JPG')).rotate();
  const hm = await hero.metadata();
  await hero
    .extract({ left: 0, top: 0, width: Math.round(hm.width * 0.8), height: hm.height })
    .resize({ width: 2560, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, 'hero-roof.jpg'));

  // Директор: исходник 5760×3840, фигура от левой руки (≈ 2790 px) до правого локтя (≈ 4530 px), голова ≈ 3210 px.
  // Квадратный кадр на всю высоту, центр — по корпусу (≈ 3600 px): фигура стоит посередине, фон с обеих сторон.
  const src = sharp(path.join(SRC, 'фото директора.jpg')).rotate();
  const { width: w, height: h } = await src.metadata();
  const cropW = h;
  const left = Math.min(w - cropW, Math.max(0, Math.round(3600 / 5760 * w - cropW / 2)));
  await src
    .extract({ left, top: 0, width: cropW, height: h })
    .resize({ width: 1200 })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, 'director.jpg'));

  console.log('готово:', fs.readdirSync(OUT).join(', '));
})();
