// Готовит фото для страницы «Объекты» из папок «для сайта».
// Исходники весят до 60 МБ — уменьшаем до 2000 px по длинной стороне.
// Результат — src/content/objects/<slug>/01.jpg, 02.jpg… Первое фото — обложка карточки, дальше — порядок в галерее.
// Если в папке объекта уже есть index.json (данные из админки), в нём обновляется только список фото.
// Сейчас фото обычно загружают прямо в админке (/admin/ → «Объекты») — этот скрипт нужен для массовой подготовки.
// Запуск из папки site: node tools/prep-objects.cjs <slug>  (без slug пересоберёт ВСЕ объекты из списка ниже)
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const site = path.join(__dirname, '..');
const SRC = path.join(site, '../для сайта');
const OUT = path.join(site, 'src/content/objects');

const ZHK = 'фото жилых комплексов';
const DOM = 'фото частных объектов (коттеджи)';
const PR = 'прочие объекты';

// slug (= имя папки в src/content/objects) → список фото по порядку
const objects = {
  'zhk-georgievsky': [`${ZHK}/жк георгиевский (фасадное остекление)/DSC08243.JPG`, `${ZHK}/жк георгиевский (фасадное остекление)/DSC08290.JPG`, `${ZHK}/жк георгиевский (фасадное остекление)/DSC08299.JPG`],
  'zhk-plotnichny': ['DJI_0955.JPG', 'DSC08439.JPG', 'DSC08459.JPG', 'DSC08475.JPG', 'DJI_0974.JPG'].map((f) => `${ZHK}/жк плотничный (фасадное остекление)/${f}`),
  'zhk-timiryazevsky': [
    ...['DJI_0982.JPG', 'DJI_0984.JPG', 'DJI_0990.JPG'].map((f) => `${ZHK}/жк тимирязевский (панорамное остекление)/${f}`),
    `${PR}/козырьки/козырьки на вантах (жк тимирязевский).JPG`,
    `${PR}/козырьки/козырек на винтах (жк тимирязевский).png`,
  ],
  'zhk-holms': ['Photo 477.jpg', 'Photo 468.jpg', 'Photo 470.jpg', 'Photo 480.jpg', 'Photo 471.jpg', 'Photo 481.jpg', 'Photo 486.jpg'].map((f) => `${ZHK}/жк холмс (фасадное остекление)/${f}`),

  'novopokrovskoe': ['DJI_20251213151013_0001_D.jpg', 'DSC01089.jpg', 'DJI_20251213151055_0004_D.jpg', 'DSC01069.jpg', 'DSC01073.jpg', 'DSC01081.jpg', 'DSC01094.jpg', 'DSC01097.jpg', 'DSC01104.jpg', 'DSC01109.jpg'].map((f) => `${DOM}/деревня Новопокровское/${f}`),
  'royka': ['Современная вилла в зимнем снегу.png', 'Современный дом в зимнем свете.png', 'DJI_20251215175718_0041_D.JPG', 'DSC01382.JPG', 'DSC01387.JPG', 'DSC01394.JPG', 'DSC01409.JPG'].map((f) => `${DOM}/деревня Ройка/${f}`),
  'aleksandrovskaya-sloboda': ['фасадное остекление загородного дома2.png', 'фасадное остекление загородного дома.png', 'фасадное остекление загородного дома1.png', 'DSC01253.png', 'DSC01277.png'].map((f) => `${DOM}/мкр-н Александровская слобода/${f}`),
  'yubileynaya': ['фасадное остекление дома.png', 'фасадное остекление дома1.png', 'фасадное остекление дома2.png'].map((f) => `${DOM}/ул. Юбилейная, Нижний Новгород/${f}`),

  'wake-park': ['DSC08628.JPG', 'DSC08621.JPG', 'DSC08610.JPG', 'DSC08634.JPG', 'DSC08479.JPG'].map((f) => `${PR}/WAKE PARK панорамное остекление/${f}`),
  'escape': ['DSC08180.JPG', 'DSC08133.JPG', 'DSC08174.JPG'].map((f) => `${PR}/ресторан Escape/${f}`),
  'kamaz': ['DSC05089.jpg', 'DSC05096.jpg', 'DSC05100.jpg', 'DSC05155.jpg', 'DSC05158.jpg', 'DSC05163.jpg', 'DSC05091.jpg', 'DSC05094.jpg'].map((f) => `${PR}/центр Камаз/${f}`),
  'novakard': ['Футуристическое офисное здание в зелени.png', 'Современное офисное здание под облачным небом.png', 'Волнообразный фасад под голубым небом.png', 'Футуристический фасад в изгибах света.png', 'Современный фасад закруглённой башни.png', 'Футуристический фасад под облачным небом.png', '388AF5B3-D39A-4AE6-97CA-FB8CF1966256.png'].map((f) => `${PR}/новакард (остекление фасада_витражи)/${f}`),
  'galereya-rozhdestvenskaya': ['крупногабаритное панорамное окно + входная группа.png', 'панорамное остекление.png', 'панорамное остекление (2).jpg', 'панорамное остекление .jpg', 'панорамное остекление.jpg'].map((f) => `${PR}/галерея на рождественской/${f}`),
  'restoran-rozhdestvenskaya': ['DSC04843.jpg', 'Арочное окно с отражением города.png', 'DSC04850.jpg', 'DSC04828.jpg', 'DSC04841.jpg', 'DSC04852.jpg', 'DSC04854.jpg', 'DSC04875.jpg', 'DSC04834.jpg', 'Мятная арочная дверь в бетоне.png'].map((f) => `${PR}/ресторан на рождественской/${f}`),
  'ncfm-sarov': ['нцфм (можно пставить на обложку).png', 'нцфм.png', 'Современное офисное здание на стройке (1).png', 'Современное офисное здание на стройке.png'].map((f) => `${PR}/нцфм саров/${f}`),
  'sadko': ['DSC06106.JPG', 'DSC06109.JPG', 'DSC06128.JPG', 'DSC06130.JPG', 'DSC06163.JPG', 'DSC06179.JPG', 'DSC06170.JPG'].map((f) => `${PR}/внутренние перегородки/клиника Садко/${f}`),

  'klubny-dom-yaroslavskaya': [
    ...['DJI_0934.JPG', 'DSC08603.JPG', 'DSC08604.JPG'].map((f) => `${PR}/ограждения/ограждения крыши клубный дом на ярославской/${f}`),
    `${PR}/козырьки/козырек на зажимном профиле клубный дом на ярславской.JPG`,
    `${PR}/козырьки/козырек клубного дома на ярславской (на зажимном профиле).png`,
  ],
  'norkemikal': ['DJI_0066.JPG', 'DJI_0070.JPG', 'DSC08208.JPG', 'DSC08225.JPG', 'DSC08228.JPG'].map((f) => `${PR}/Норкемикал остекление кровли/${f}`),
  'roza-rossa': ['roza rossa 2.png', 'roza rossa.png'].map((f) => `${PR}/выход на крышу/${f}`),
};

(async () => {
  const only = process.argv[2];
  for (const [slug, files] of Object.entries(objects)) {
    if (only && only !== slug) continue;
    const dir = path.join(OUT, slug);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) if (/^\d+\.jpg$/i.test(f)) fs.rmSync(path.join(dir, f));
    const names = files.map((_, i) => `${String(i + 1).padStart(2, '0')}.jpg`);
    for (const [i, f] of files.entries()) {
      await sharp(path.join(SRC, f), { limitInputPixels: false })
        .rotate()
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(path.join(dir, names[i]));
    }
    const json = path.join(dir, 'index.json');
    if (fs.existsSync(json)) {
      const data = JSON.parse(fs.readFileSync(json, 'utf8'));
      data.photos = names;
      fs.writeFileSync(json, JSON.stringify(data, null, 2) + '\n');
    }
    console.log(slug, files.length);
  }
})();
