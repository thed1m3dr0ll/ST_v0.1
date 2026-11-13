// Закрывает черновик сайта на Netlify паролем: открыть ссылку может только тот, кому передали пароль.
// Обычный пароль Netlify доступен только на платном тарифе, поэтому проверка сделана здесь.
// Пароль лежит в настройке SITE_PASSWORD на Netlify, в коде его нет. Логин может быть любым.
// Если настройки нет, сайт не откроется никому. На рабочем сервере в РФ этот файл не используется.

declare const Netlify: { env: { get(name: string): string | undefined } };

export default async (req: Request) => {
  const password = Netlify.env.get('SITE_PASSWORD');
  const encoded = (req.headers.get('authorization') ?? '').split(' ')[1] ?? '';
  let given = '';
  try { given = atob(encoded).split(':').slice(1).join(':'); } catch { /* неверный заголовок — как пустой пароль */ }
  if (password && given === password) return; // пароль верный — показываем сайт

  return new Response('Сайт доступен только по паролю.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Steklyanika", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

export const config = { path: '/*' };
