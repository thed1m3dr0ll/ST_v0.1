// Локальный сервер админки (Decap CMS): через него админка на http://localhost:4321/admin/ сохраняет файлы
// прямо в проект. Запуск: npm run cms (его же запускает «Запустить сайт.bat»). Порт 8081, доступ только с этого компьютера.
process.env.BIND_HOST ||= '127.0.0.1';
process.chdir(require('path').join(__dirname, '..'));
require('decap-server');
