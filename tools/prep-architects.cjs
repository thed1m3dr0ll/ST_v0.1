// Готовит фото для страницы «Архитекторам и дизайнерам» (/partners/architects/):
// — первый экран: «для сайта/архитекторы и дизайнеры/фото первого экрана.png» → src/assets/architects/hero.jpg;
// — вкладка «Стекло»: квадратные фото образцов → вертикальные 3:4 (центр кадра, края образца чуть срезаны) в src/assets/architects/glass/<вид>/NN.jpg.
//   Источник вида — один файл и/или папка с тем же названием (в папке может быть сколько угодно фото —
//   на сайте они лягут стопкой, которую листают мышкой). Порядок в стопке — по имени файла;
// — вкладка «Алюминий»: рендеры профильных систем (src/assets/systems/catalog) → вертикальные 3:4 в src/assets/architects/alu/;
// — карточка «Интерьерные перегородки»: клиника «Садко» DSC06128 → src/assets/architects/partitions.jpg;
// — полоса «Свяжитесь с нами»: ресторан Escape → src/assets/architects/cta-escape.jpg.
// Запуск из папки site: node tools/prep-architects.cjs
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта/архитекторы и дизайнеры');
const OUT = path.join(site, 'src/assets/architects');

// вид стекла (папка на сайте) → файл и/или папка в исходниках
const glass = {
  clear: ['стекло обычное .png', 'стекло обычное', 'стекло прозрачное'],
  matte: ['стекло матовое.png', 'стекло матовое'],
  figured: ['стекло фигурное.png', 'стекло фигурное'],
  tinted: ['стекло тонировка.png', 'стекло тонировка', 'стекло тонированное'],
};
const alu = ['facade', 'window', 'door', 'portal', 'fire', 'sliding', 'railing'];

const W = 600, H = 800; // карточка 3:4
const isImg = (f) => /\.(png|jpe?g|webp)$/i.test(f);

function sources(names) {
  const list = [];
  for (const n of names) {
    const p = path.join(SRC, n);
    if (!fs.existsSync(p)) continue;
    if (fs.statSync(p).isDirectory()) fs.readdirSync(p).filter(isImg).sort((a, b) => a.localeCompare(b, 'ru')).forEach((f) => list.push(path.join(p, f)));
    else list.push(p);
  }
  return list;
}

// центральная вертикальная вырезка 3:4 по всей высоте кадра (у образцов стекло стоит по центру)
async function portrait(file, out) {
  const { width, height } = await sharp(file).metadata();
  const h = height, w = Math.min(width, Math.round(h * 3 / 4));
  await sharp(file).flatten({ background: '#fbfdff' })
    .extract({ left: Math.round((width - w) / 2), top: 0, width: w, height: h })
    .resize(W, H).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await sharp(path.join(SRC, 'фото первого экрана.png')).flatten({ background: '#fbfdff' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'hero.jpg'));

  for (const [slug, names] of Object.entries(glass)) {
    const dir = path.join(OUT, 'glass', slug);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const files = sources(names);
    for (const [i, f] of files.entries()) await portrait(f, path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`));
    console.log('стекло', slug, files.length, 'фото');
  }

  // рендеры систем лежат на холсте 2:1 (изделие в центре ≈ 1100×1000): берём центральный квадрат
  // и достраиваем фон сверху и снизу продолжением краёв — изделие остаётся целым
  const aluDir = path.join(OUT, 'alu');
  fs.mkdirSync(aluDir, { recursive: true });
  for (const slug of alu) {
    const sq = await sharp(path.join(site, 'src/assets/systems/catalog', `${slug}.jpg`))
      .extract({ left: 600, top: 0, width: 1200, height: 1200 }).resize(W, W).toBuffer();
    await sharp(sq).extend({ top: (H - W) / 2, bottom: (H - W) / 2, extendWith: 'copy' })
      .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(aluDir, `${slug}.jpg`));
  }

  // карточка «Интерьерные перегородки» на этой странице — своё фото (клиника «Садко», DSC06128), 6:5 как у карточек услуг
  await sharp(path.join(SRC, '../прочие объекты/внутренние перегородки/клиника Садко/DSC06128.JPG')).rotate()
    .resize(1200, 1000, { fit: 'cover', position: 'centre' }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'partitions.jpg'));

  await sharp(path.join(site, 'src/content/objects/escape/03.jpg')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'cta-escape.jpg'));
  console.log('готово');
})();
