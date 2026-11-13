// Необязательные сервисы: загрузка, остановка и очистка их данных по выбору посетителя (scripts/cookies.ts).
//
// ПРАВИЛО: аналитика и реклама подключаются только здесь. Код счётчиков нельзя вставлять в layout, HTML или другие компоненты,
// а части <noscript> из кабинетов Яндекса и VK не добавляем вообще: они срабатывают без согласия.
// Цели и события отправляем только через trackGoal().

import { hasConsent, onConsentChange, type CookieCategory } from './cookies';

// Номера из кабинетов Яндекс.Метрики и VK Рекламы. Пока поле пустое, сервис не загружается.
export const TRACKER_IDS = {
  metrika: '',
  vkPixel: '',
};

type Tracker = {
  name: string;
  category: CookieCategory;
  isConfigured: () => boolean;
  start: () => void;
  stop: () => void;
  goal: (name: string) => void;
  // Что удаляем при отказе. Cookie на доменах самих сервисов (mc.yandex.ru, mail.ru) сайт удалить не может.
  cookies: RegExp;
  storage: RegExp;
};

const w = window as unknown as Record<string, any>;

function addScript(src: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
}

const metrika: Tracker = {
  name: 'Яндекс.Метрика',
  category: 'analytics',
  isConfigured: () => !!TRACKER_IDS.metrika,
  start() {
    const id = TRACKER_IDS.metrika;
    delete w[`disableYaCounter${id}`];
    w.ym = w.ym || function (...args: unknown[]) { (w.ym.a = w.ym.a || []).push(args); };
    w.ym.l = Date.now();
    addScript('https://mc.yandex.ru/metrika/tag.js');
    // При подключении сверить с кодом из кабинета Метрики. Вебвизор здесь намеренно не включён.
    w.ym(Number(id), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  },
  stop() {
    const id = TRACKER_IDS.metrika;
    w[`disableYaCounter${id}`] = true; // официальный запрет сбора и отправки данных
    w.ym?.(Number(id), 'destruct');    // официальная остановка счётчика
  },
  goal(name) { w.ym?.(Number(TRACKER_IDS.metrika), 'reachGoal', name); },
  // Список: https://yandex.ru/support/metrica/general/cookie-usage.html
  cookies: /^(_ym|gdpr$)/,
  storage: /^(_ym|ytm_|zz$)/,
};

const vkPixel: Tracker = {
  name: 'Пиксель VK Рекламы',
  category: 'ads',
  isConfigured: () => !!TRACKER_IDS.vkPixel,
  start() {
    (w._tmr = w._tmr || []).push({ id: TRACKER_IDS.vkPixel, type: 'pageView', start: Date.now() });
    addScript('https://top-fwz1.mail.ru/js/code.js'); // при подключении сверить с кодом из кабинета VK Рекламы
  },
  stop() { w._tmr = []; }, // метода остановки у пикселя нет: окончательно его выключает перезагрузка страницы в sync()
  goal(name) { w._tmr?.push({ type: 'reachGoal', id: TRACKER_IDS.vkPixel, goal: name }); },
  // Официального списка нет. Имена взяты из кода top-fwz1.mail.ru/js/code.js версии 60.6.0 (05.11.2026),
  // при подключении сверить с реальным пикселем в DevTools → Application.
  cookies: /^(tmr|domain_sid$|vkidExtId$)/,
  storage: /^(tmr|rb_sync_id$)/,
};

const trackers: Tracker[] = [metrika, vkPixel];

// Проверка без настоящих сервисов, только в npm run dev (в сборку сайта не попадает):
// localStorage['stk-test-trackers'] = '1' добавляет два тестовых сервиса, они обращаются только к самому сайту.
if (import.meta.env.DEV) {
  const test = (category: CookieCategory): Tracker => ({
    name: `Тест: ${category}`,
    category,
    isConfigured: () => true,
    start() {
      addScript(`/__test-tracker-${category}.js`);
      document.cookie = `_stk_test_${category}=1; path=/; max-age=3600`;
      localStorage.setItem(`_stk_test_${category}`, '1');
    },
    stop() {},
    goal(name) { console.info(`[тестовый сервис ${category}] цель`, name); },
    cookies: /^_stk_test_/,
    storage: /^_stk_test_/,
  });
  try { if (localStorage.getItem('stk-test-trackers')) trackers.push(test('analytics'), test('ads')); } catch { /* нет хранилища */ }
}

const running = new Set<Tracker>();

function eraseCookie(name: string) {
  const host = location.hostname;
  // Метрика ставит cookie на домен верхнего уровня (.example.ru), поэтому пробуем все уровни домена
  const domains = [''];
  const parts = host.split('.');
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
  domains.push(`; domain=${host}`);
  domains.forEach((d) => { document.cookie = `${name}=; Max-Age=0; path=/${d}`; });
}

function clearData(t: Tracker) {
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => t.cookies.test(n)).forEach(eraseCookie);
  for (const store of [localStorage, sessionStorage]) {
    Object.keys(store).filter((k) => t.storage.test(k)).forEach((k) => store.removeItem(k));
  }
}

// Приводит сервисы в соответствие с текущим выбором
function sync() {
  let stopped = false;
  for (const t of trackers) {
    const allowed = hasConsent(t.category);
    if (allowed && t.isConfigured() && !running.has(t)) {
      running.add(t);
      try { t.start(); } catch (e) { console.warn(`${t.name}: не удалось запустить`, e); }
    } else if (!allowed && running.has(t)) {
      running.delete(t);
      stopped = true;
      try { t.stop(); } catch (e) { console.warn(`${t.name}: не удалось остановить`, e); }
    }
    // Без разрешения данные сервиса удаляем при каждой загрузке: это закрывает отказ, истёкший срок и новую версию согласия
    if (!allowed) try { clearData(t); } catch { /* нет доступа к хранилищу */ }
  }
  // Уже работающий скрипт из страницы не выгрузить: перезагружаем её без него. Если сервисов не было, перезагрузка не нужна.
  if (stopped) location.reload();
}

// Цель или событие для всех разрешённых сервисов. Без согласия ничего не отправляется.
export function trackGoal(name: string) {
  running.forEach((t) => { if (hasConsent(t.category)) t.goal(name); });
}

export function initTrackers() {
  onConsentChange(sync);
  sync();
}
