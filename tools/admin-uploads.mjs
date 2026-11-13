// Порядок в файлах, которые пишет админка (/admin/). Подключено в astro.config.mjs: всё проверяется при запуске
// (dev и build), а в dev — ещё и сразу после каждого сохранения в админке.
//
// 1. Тяжёлые фото: исходники с камеры весят до 60 МБ. Фото больше 2000 px по длинной стороне пересохраняются
//    на месте (до 2000 px, качество 80), заодно поворачиваются по EXIF и теряют метаданные (в т. ч. геометку).
// 2. Пути к фото объектов: у только что созданного объекта админка ещё не знает имя его папки и пишет
//    «/src/content/objects/фото.jpg» — дописываем папку, чтобы в админке были видны превью.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MAX = 2000;
const EXT = /\.(jpe?g|png|webp)$/i;
// Папки, куда админка кладёт картинки (пути — от папки site)
const DIRS = ['src/content', 'src/assets/company-certificates', 'src/assets/uploads', 'src/assets/events'];

async function shrink(file) {
  try {
    const { size } = fs.statSync(file);
    const meta = await sharp(file, { limitInputPixels: false }).metadata();
    const long = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (long <= MAX * 1.2 && size <= 3 * 1024 * 1024) return;
    let img = sharp(file, { limitInputPixels: false }).rotate()
      .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
    const fmt = meta.format === 'jpg' ? 'jpeg' : meta.format;
    if (fmt === 'jpeg') img = img.jpeg({ quality: 80, mozjpeg: true });
    else if (fmt === 'png') img = img.png({ compressionLevel: 9 });
    else if (fmt === 'webp') img = img.webp({ quality: 80 });
    else return;
    const buf = await img.toBuffer();
    if (buf.length >= size && long <= MAX) return;
    fs.writeFileSync(file, buf);
    console.log(`[фото] уменьшено: ${path.relative(process.cwd(), file)} (${(size / 1048576).toFixed(1)} → ${(buf.length / 1048576).toFixed(1)} МБ)`);
  } catch {
    // файл ещё дописывается или это не картинка — попробуем при следующем изменении
  }
}

// src/content/objects/<папка>/index.json → photos: '/src/content/objects/<папка>/<файл>'
function fixPhotoPaths(json) {
  try {
    const data = JSON.parse(fs.readFileSync(json, 'utf8'));
    if (!Array.isArray(data.photos)) return;
    const dir = path.basename(path.dirname(json));
    const fixed = data.photos.map((p) => `/src/content/objects/${dir}/${String(p ?? '').split('/').pop()}`);
    if (JSON.stringify(fixed) === JSON.stringify(data.photos)) return;
    data.photos = fixed;
    fs.writeFileSync(json, JSON.stringify(data, null, 2) + '\n');
  } catch {
    // файл ещё дописывается — поправим при следующем изменении
  }
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

export function adminUploads() {
  let root = process.cwd();
  const isObjectJson = (f) => /[\\/]src[\\/]content[\\/]objects[\\/][^\\/]+[\\/]index\.json$/.test(f);
  return {
    name: 'admin-uploads',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        root = fileURLToPath(config.root);
        for (const d of DIRS) for (const f of walk(path.join(root, d))) await shrink(f);
        const objects = path.join(root, 'src/content/objects');
        if (fs.existsSync(objects)) for (const d of fs.readdirSync(objects)) {
          const json = path.join(objects, d, 'index.json');
          if (fs.existsSync(json)) fixPhotoPaths(json);
        }
      },
      'astro:server:setup': ({ server }) => {
        const dirs = DIRS.map((d) => path.join(root, d) + path.sep);
        const timers = new Map();
        const onFile = (file) => {
          const f = path.resolve(file);
          const job = isObjectJson(f) ? fixPhotoPaths : EXT.test(f) && dirs.some((d) => f.startsWith(d)) ? shrink : null;
          if (!job) return;
          clearTimeout(timers.get(f));
          timers.set(f, setTimeout(() => { timers.delete(f); job(f); }, 1500));
        };
        server.watcher.on('add', onFile);
        server.watcher.on('change', onFile);
      },
    },
  };
}
