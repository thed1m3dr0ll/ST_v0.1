// Готовит фото первого экрана страницы «Вакансии» (/careers/) → src/assets/careers/hero-*.jpg.
// С 2026-11-06 на первом экране одно фото — 80 (до этого 83, 82; раньше был коллаж: фото 81 + галерея на Рождественской).
// Запуск из папки site: node tools/prep-careers.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const R = path.join(site, '../для сайта');
const OUT = path.join(site, 'src/assets/careers');
fs.mkdirSync(OUT, { recursive: true });

const hero = {
  // фото 80 (было 83, 82, 81, 78) — новое имя файла, чтобы браузер не показал старое из кэша.
  // Исходник всего 1673×940, а на телефоне экран заполняется по высоте и нужно около 2900 px: увеличиваем до 2560
  // с лёгкой резкостью и сохраняем почти без сжатия (качество 95, цвет без прореживания)
  'hero-people-80-hd': '80.png',
};

(async () => {
  for (const [name, src] of Object.entries(hero)) {
    await sharp(path.join(R, src)).rotate().flatten({ background: '#fbfdff' })
      .resize({ width: 2560, kernel: 'lanczos3' })
      .sharpen({ sigma: 0.9, m1: 0.5, m2: 1.4 })
      .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toFile(path.join(OUT, name + '.jpg'));
  }
  console.log('готово:', fs.readdirSync(OUT).join(', '));
})();
