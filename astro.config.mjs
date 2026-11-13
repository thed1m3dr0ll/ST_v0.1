import { defineConfig } from 'astro/config';
import { adminUploads } from './tools/admin-uploads.mjs';
import { devImageCache } from './tools/dev-image-cache.mjs';

export default defineConfig({
  // адрес сайта: по нему строятся полные ссылки для превью в соцсетях и данных для поисковиков (src/layouts/Base.astro).
  // Сменится домен — поменять здесь
  site: 'https://steklyanika.ru',
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
  // порядок в файлах админки (/admin/): тяжёлые фото уменьшаются до 2000 px, пути к фото объектов выправляются —
  // см. tools/admin-uploads.mjs
  // в dev картинки не залипают в кэше браузера после замены фото — см. tools/dev-image-cache.mjs
  integrations: [adminUploads(), devImageCache()],
  // 3D-модель профиля (three.js) — отдельный файл ~560 КБ, грузится лениво только у блока «Технологии»
  vite: {
    build: { chunkSizeWarningLimit: 700 },
    // на Windows с кириллицей в пути изменения стилей иногда не подхватываются — опрашиваем файлы сами
    server: { watch: { usePolling: true, interval: 300 } },
  },
  image: {
    // исходные фото весят десятки мегабайт — Astro сам ужимает их в WebP при сборке
    responsiveStyles: true,
  },
});
