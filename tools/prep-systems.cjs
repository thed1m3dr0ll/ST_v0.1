// Приводит рендеры систем (папка «для сайта/системы») к единому формату для блока «Профильные системы»:
// холст 2400×1200 (2:1), изделие по центру и одного размера, фон рендера плавно продолжен на весь холст.
// Так изделие видно целиком при любой высоте окна просмотра. Плюс миниатюры 320×256 для списка.
// Результат — src/assets/systems/catalog/<slug>.jpg и <slug>-thumb.jpg.
// Запуск из папки site: node tools/prep-systems.cjs [контактный-лист.jpg]
// Только одна система: ONLY=window node tools/prep-systems.cjs (имя — ключ из `files`)
// Новая система — добавить строку в `files` ниже и запись в src/data/systems.ts.
const path = require('path');
const fs = require('fs');
const site = path.join(__dirname, '..');
const sharp = require('sharp');

const SRC = path.join(site, '../для сайта/системы');
const OUT = path.join(site, 'src/assets/systems/catalog');
fs.mkdirSync(OUT, { recursive: true });

const files = {
  facade: 'фасадные системы.png',
  'window-w77': 'ALT W77 HS оконная система.png', // новое имя файла (11.11.2026), чтобы браузеры не показывали старое фото из кэша
  door: 'W72HD габаритная дверь с термоизоляцией (дверная система) .png',
  portal: 'ALT SL160, общий вид портальная система.png',
  fire: 'ALT FR76 противопожарка.png',
  sliding: 'ALT 100P, раздвижная конструкция с усиленной створкой балконная система.png',
  railing: 'GB ограждение.png',
};

const W = 2400, H = 1200;           // холст 2:1
const BOX_W = 1100, BOX_H = 1000;   // куда вписываем само изделие (видно целиком при окне от 1.08:1 до 2:1)

// ---- оценка фона: заливка от краёв по плавным переходам + «pull-push» заполнение под изделием ----
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const CROP = 3; // у исходников артефакты в 1–2 крайних пикселях

function pullPush(val, known, w, h) {
  // заполняет неизвестные пиксели плавной интерполяцией известных
  if (w <= 1 && h <= 1) return val.slice();
  const w2 = Math.ceil(w / 2), h2 = Math.ceil(h / 2);
  const v2 = new Float32Array(w2 * h2), k2 = new Float32Array(w2 * h2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, j = (y >> 1) * w2 + (x >> 1);
    v2[j] += val[i] * known[i]; k2[j] += known[i];
  }
  for (let j = 0; j < v2.length; j++) if (k2[j] > 0) { v2[j] /= k2[j]; k2[j] = Math.min(1, k2[j]); }
  const c = pullPush(v2, k2, w2, h2);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // билинейно из грубого уровня
    const fx = clamp((x - 0.5) / 2, 0, w2 - 1), fy = clamp((y - 0.5) / 2, 0, h2 - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(w2 - 1, x0 + 1), y1 = Math.min(h2 - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    const cv = (c[y0 * w2 + x0] * (1 - ax) + c[y0 * w2 + x1] * ax) * (1 - ay) + (c[y1 * w2 + x0] * (1 - ax) + c[y1 * w2 + x1] * ax) * ay;
    const i = y * w + x;
    out[i] = val[i] * known[i] + cv * (1 - known[i]);
  }
  return out;
}

async function analyse(file, meta) {
  const sw = 500;
  const crop = { left: CROP, top: CROP, width: meta.width - 2 * CROP, height: meta.height - 2 * CROP };
  const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().extract(crop).resize(sw).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, N = w * h;
  const g = new Float32Array(N);
  for (let i = 0; i < N; i++) g[i] = (data[i * 3] + data[i * 3 + 1] + data[i * 3 + 2]) / 3;
  // фон = всё, что связано с краем кадра плавными переходами
  const bgMask = new Uint8Array(N), queue = [];
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { bgMask[y * w + x] = 1; queue.push(y * w + x); }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { bgMask[y * w + x] = 1; queue.push(y * w + x); }
  while (queue.length) {
    const i = queue.pop(), x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx; if (bgMask[j]) continue;
      if (Math.abs(g[j] - g[i]) <= 2.2) { bgMask[j] = 1; queue.push(j); }
    }
  }
  // изделие (с запасом на сглаженные края)
  const prod = new Uint8Array(N);
  const R = 3;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!bgMask[y * w + x])
    for (let yy = Math.max(0, y - R); yy <= Math.min(h - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(w - 1, x + R); xx++) prod[yy * w + xx] = 1;
  const known = new Float32Array(N);
  for (let i = 0; i < N; i++) known[i] = prod[i] ? 0 : 1;
  const field = [0, 1, 2].map((c) => { const v = new Float32Array(N); for (let i = 0; i < N; i++) v[i] = data[i * 3 + c]; return pullPush(v, known, w, h); });
  const rows = new Array(h).fill(0), cols = new Array(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!bgMask[y * w + x]) { rows[y]++; cols[x]++; }
  const lim = 2;
  const first = (a) => a.findIndex((v) => v > lim);
  const last = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v > lim);
  const bb = { u0: first(cols) / (w - 1), u1: last(cols) / (w - 1), v0: first(rows) / (h - 1), v1: last(rows) / (h - 1) };
  // поле фона как картинка (сглаживаем блочность)
  const fb = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) fb[i * 3 + c] = clamp(Math.round(field[c][i]), 0, 255);
  const fieldImg = await sharp(fb, { raw: { width: w, height: h, channels: 3 } }).blur(4).raw().toBuffer();
  return { bb, crop, fieldImg, fw: w, fh: h };
}

(async () => {
  const sheet = [];
  for (const [slug, name] of Object.entries(files)) {
    if (process.env.ONLY && process.env.ONLY !== slug) continue;
    const file = path.join(SRC, name);
    const meta = await sharp(file).metadata();
    const { bb, crop, fieldImg, fw, fh } = await analyse(file, meta);
    const bw = (bb.u1 - bb.u0) * crop.width, bh = (bb.v1 - bb.v0) * crop.height;
    const s = Math.min(BOX_W / bw, BOX_H / bh);
    const w0 = Math.round(crop.width * s), h0 = Math.round(crop.height * s);
    const ox = Math.round(W / 2 - ((bb.u0 + bb.u1) / 2) * w0), oy = Math.round(H / 2 - ((bb.v0 + bb.v1) / 2) * h0);
    const src = await sharp(file).flatten({ background: '#ffffff' }).removeAlpha().extract(crop).resize(w0, h0).raw().toBuffer();
    const fieldFull = await sharp(fieldImg, { raw: { width: fw, height: fh, channels: 3 } }).resize(w0, h0, { kernel: 'cubic' }).raw().toBuffer();
    const fieldAt = (u, v, c) => {
      const x = clamp(Math.round(u * (fw - 1)), 0, fw - 1), y = clamp(Math.round(v * (fh - 1)), 0, fh - 1);
      return fieldImg[(y * fw + x) * 3 + c];
    };

    // фон холста: поле фона с «прижатыми» к краям исходника координатами, на 1/4 разрешения, затем размытие
    const q = 4, qw = W / q, qh = H / q, bgq = Buffer.alloc(qw * qh * 3);
    for (let y = 0; y < qh; y++) for (let x = 0; x < qw; x++) {
      const u = clamp((x * q - ox) / w0, 0, 1), v = clamp((y * q - oy) / h0, 0, 1);
      for (let c = 0; c < 3; c++) bgq[(y * qw + x) * 3 + c] = fieldAt(u, v, c);
    }
    const bg = await sharp(bgq, { raw: { width: qw, height: qh, channels: 3 } }).blur(10).resize(W, H, { kernel: 'cubic' }).raw().toBuffer();

    // сам рендер: изделие непрозрачно, фон рендера у краёв плавно переходит в продолжение фона
    const F = Math.round(0.12 * Math.min(w0, h0));
    const out = Buffer.from(bg);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = x - ox, sy = y - oy;
      if (sx < 0 || sy < 0 || sx >= w0 || sy >= h0) continue;
      const si = (sy * w0 + sx) * 3, o = (y * W + x) * 3;
      const d = Math.min(sx, sy, w0 - 1 - sx, h0 - 1 - sy);
      let a = smooth(F * 0.1, F, d);
      if (a < 1) {
        const diff = Math.abs((src[si] + src[si + 1] + src[si + 2]) - (fieldFull[si] + fieldFull[si + 1] + fieldFull[si + 2])) / 3;
        a = Math.max(a, smooth(3, 12, diff));
      }
      for (let c = 0; c < 3; c++) out[o + c] = Math.round(src[si + c] * a + bg[o + c] * (1 - a));
    }

    const img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
    await img.clone().jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, `${slug}.jpg`));
    // миниатюра для списка: центр холста 5:4, изделие целиком
    await img.clone().extract({ left: (W - 1500) / 2, top: 0, width: 1500, height: 1200 }).resize(320, 256).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${slug}-thumb.jpg`));
    sheet.push(await img.clone().resize(600, 300).jpeg().toBuffer());
    console.log(slug, 'bbox', Object.values(bb).map((n) => n.toFixed(3)).join(' '), 'scale', s.toFixed(3));
  }
  if (process.argv[2]) {
    await sharp({ create: { width: 1220, height: 1240, channels: 3, background: '#ffffff' } })
      .composite(sheet.map((input, i) => ({ input, left: (i % 2) * 610, top: Math.floor(i / 2) * 310 })))
      .jpeg().toFile(process.argv[2]);
  }
})();
