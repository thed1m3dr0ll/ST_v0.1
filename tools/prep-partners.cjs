// Готовит фото для страницы «Партнерам»:
// — первый экран: «для сайта/прочие объекты/ресторан Escape/фото для 1 экрана страницы Партнерам».
//   Исходник 7008×4672 — уменьшаем до 2560 по ширине (больше PageHero не запрашивает) → src/assets/partners/hero-escape.jpg;
// — карточки «Открыты для сотрудничества»: «для сайта/для страницы партнерам» (PNG ≈ 1672×941, с 23.10.2026;
//   раньше были светлые коллажи из «для экрана открыты для сотрудничества») → src/assets/partners/coop/<латинское имя>.jpg без уменьшения.
// Запуск из папки site: node tools/prep-partners.cjs
// Сертификаты для этой страницы готовит отдельный скрипт tools/prep-certificates.py (там есть PDF).
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/прочие объекты/ресторан Escape/фото для 1 экрана страницы Партнерам.JPG');
const OUT = path.join(site, 'src/assets/partners');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  await sharp(SRC)
    .rotate()
    .resize({ width: 2560, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT, 'hero-escape.jpg'));
  console.log('готово:', fs.readdirSync(OUT).join(', '));

  const COOP_SRC = path.join(site, '../для сайта/для страницы партнерам');
  const COOP_OUT = path.join(OUT, 'coop');
  fs.mkdirSync(COOP_OUT, { recursive: true });
  const coop = { 'девелопер.png': 'developer.jpg', 'архитектор.png': 'architect.jpg', 'владелец бизнеса.png': 'business.jpg', 'частное лицо.png': 'private.jpg' };
  for (const [src, out] of Object.entries(coop)) {
    await sharp(path.join(COOP_SRC, src)).flatten({ background: '#fbfdff' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(COOP_OUT, out));
  }
  console.log('готово:', fs.readdirSync(COOP_OUT).join(', '));
})();
