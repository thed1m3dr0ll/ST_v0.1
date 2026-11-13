// Только для dev (npm run dev): браузер не хранит картинки /_image в кэше «на год», а каждый раз сверяется с сервером.
// Иначе после замены фото с тем же именем файла (скрипты tools/prep-*.cjs, админка) браузер продолжает показывать старое.
// Подключено в astro.config.mjs. На опубликованный сайт не влияет — там у файлов картинок в имени хэш содержимого.
export function devImageCache() {
  return {
    name: 'dev-image-cache',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/_image')) {
            const setHeader = res.setHeader.bind(res);
            res.setHeader = (name, value) => setHeader(name, String(name).toLowerCase() === 'cache-control' ? 'no-cache' : value);
          }
          next();
        });
      },
    },
  };
}
