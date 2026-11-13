// Копирует файлы админки Decap CMS из node_modules в public/admin/decap/ (чтобы админка работала без внешних CDN).
// Запускать после обновления пакета decap-cms: npm run cms:update
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../node_modules/decap-cms/dist');
const out = path.join(__dirname, '../public/admin/decap');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(src)) {
  if (f.endsWith('.map') || f.endsWith('.LICENSE.txt')) continue;
  if (!(f === 'decap-cms.js' || f.endsWith('.decap-cms.js') || f.endsWith('.wasm'))) continue;
  fs.copyFileSync(path.join(src, f), path.join(out, f));
  n++;
}
fs.copyFileSync(path.join(src, 'decap-cms.js.LICENSE.txt'), path.join(out, 'LICENSE.txt'));
console.log(`Скопировано файлов: ${n} → public/admin/decap/`);
