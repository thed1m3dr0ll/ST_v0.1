// Согласие посетителя на необязательные технологии: единый выбор «Принять» / «Отклонить»
// (баннер — components/CookieBanner.astro). Аналитика и реклама разрешаются и запрещаются вместе, отдельных переключателей нет.
// Здесь только запись и чтение решения. Загрузка и отключение сервисов — в scripts/trackers.ts.
//
// Запись в localStorage — необходимая технология: она нужна, чтобы применять выбор посетителя, и никуда не передаётся.
// Юридическим подтверждением согласия она не служит: посетитель может её удалить или изменить.
// Для подтверждения запись нужно хранить на сервере — см. sendConsentRecord() ниже.

const KEY = 'stk-cookie-choice';

// Поднять, если изменился состав сервисов или условия согласия: у всех старые записи перестанут действовать,
// необязательные технологии отключатся, и посетитель увидит баннер снова.
export const CONSENT_VERSION = 2;
// Редакция Политики cookie, с которой согласился посетитель. Менять вместе с текстом src/content/docs/cookies.md
export const POLICY_EDITION = '2026-11-05';
const TTL = 365 * 24 * 3600e3; // через год спрашиваем снова

export type CookieChoice = 'accepted' | 'declined';
export type CookieCategory = 'analytics' | 'ads';
export type ConsentRecord = {
  id: string;                                // случайный номер записи, с личностью посетителя не связан
  v: number;                                 // версия механизма согласия
  policy: string;                            // редакция Политики cookie
  choice: CookieChoice;
  categories: Record<CookieCategory, boolean>;
  at: string;                                // дата и время выбора
  source: 'banner' | 'settings';             // первый показ баннера или ссылка «Настройки cookie»
};

// Если localStorage недоступен, выбор действует только до ухода со страницы; дальше — снова баннер и блокировка
let unsaved: ConsentRecord | null = null;

function isValid(s: ConsentRecord | null): s is ConsentRecord {
  if (!s || s.v !== CONSENT_VERSION) return false;
  if (s.choice !== 'accepted' && s.choice !== 'declined') return false;
  const at = Date.parse(s.at);
  if (Number.isNaN(at) || Date.now() - at > TTL) return false;
  // Запись, где категории не совпадают с решением, не считаем согласием
  const allowed = s.choice === 'accepted';
  return s.categories?.analytics === allowed && s.categories?.ads === allowed;
}

export function getConsent(): ConsentRecord | null {
  if (unsaved) return unsaved;
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as ConsentRecord | null;
    return isValid(s) ? s : null;
  } catch { return null; }
}

export function getCookieChoice(): CookieChoice | null {
  return getConsent()?.choice ?? null;
}

// Единственная проверка разрешения. Нет записи — нет разрешения.
export function hasConsent(category: CookieCategory): boolean {
  return getConsent()?.categories[category] === true;
}

function newId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function setCookieChoice(choice: CookieChoice, source: ConsentRecord['source']) {
  const allowed = choice === 'accepted';
  const record: ConsentRecord = {
    id: getConsent()?.id ?? newId(),
    v: CONSENT_VERSION,
    policy: POLICY_EDITION,
    choice,
    categories: { analytics: allowed, ads: allowed },
    at: new Date().toISOString(),
    source,
  };
  unsaved = null;
  try { localStorage.setItem(KEY, JSON.stringify(record)); } catch { unsaved = record; }
  sendConsentRecord(record);
  notify();
}

// Передача записи на сервер. Пока сервера нет, запись остаётся только в браузере.
function sendConsentRecord(record: ConsentRecord) {
  // TODO: при подключении постоянного хостинга заменить на реальную отправку, например:
  // fetch('/api/consent', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }).catch(() => {});
  void record;
}

const listeners: (() => void)[] = [];
let lastSeen = '';
const stampOf = (r: ConsentRecord | null) => (r ? `${r.id}|${r.at}` : '');

function notify() {
  lastSeen = stampOf(getConsent());
  listeners.forEach((cb) => cb());
}

// Вызывается при любом изменении выбора, в том числе сделанном в другой вкладке
export function onConsentChange(cb: () => void) {
  listeners.push(cb);
}

export function initConsent() {
  lastSeen = stampOf(getConsent());
  const syncIfChanged = () => { if (stampOf(getConsent()) !== lastSeen) notify(); };
  // Выбор изменили в другой вкладке
  window.addEventListener('storage', (e) => { if (e.key === KEY || e.key === null) syncIfChanged(); });
  // Страница вернулась кнопкой «Назад» из кэша браузера, а выбор за это время изменился
  window.addEventListener('pageshow', (e) => { if (e.persisted) syncIfChanged(); });
}
