// Готовит фото для страницы «Девелоперам» (/partners/developers/):
// первый экран — «для сайта/девелоперам/Архитектор с чертежами на стройке.png» (1774×887)
// → src/assets/developers/hero.jpg без уменьшения (исходник и так небольшой);
// полоса «Обсудим ваш проект» — фото ЖК «Плотничный» (изогнутый остеклённый фасад) → src/assets/developers/cta-plotnichny.jpg.
// Запуск из папки site: node tools/prep-developers.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/девелоперам/Архитектор с чертежами на стройке.png');
const OUT = path.join(site, 'src/assets/developers');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  await sharp(SRC).flatten({ background: '#fbfdff' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'hero.jpg'));
  await sharp(path.join(site, 'src/content/objects/zhk-plotnichny/02.jpg')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'cta-plotnichny.jpg'));
  console.log('готово:', fs.readdirSync(OUT).join(', '));
})();
