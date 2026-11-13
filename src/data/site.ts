// Общие данные сайта: контакты, меню, слоганы.
// Контакты (телефон, почта, адрес, режим работы, ВКонтакте, карта) лежат в src/content/contacts.json
// и редактируются через админку /admin/ → «Настройки сайта» → «Контакты».
// Меняете телефон или адрес — меняется на всех страницах сразу.
import contacts from '../content/contacts.json';

const c = contacts as Record<string, string | undefined>;
const val = (k: string, fallback = '') => (c[k] ?? '').trim() || fallback;

const phone = val('phone');
// Ссылка для звонка: только цифры, 8XXXXXXXXXX → +7XXXXXXXXXX
const telHref = (p: string) => `tel:+${p.replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7')}`;

// Контакты по отделам — блок «Свяжитесь с нами» (главная и «Контакты»).
// Сотрудничество = основной телефон и почта сайта (они же в шапке и подвале).
const dep = (title: string, p: string, email: string) => ({ title, phone: p, phoneHref: telHref(p), email });
const departments = [
  dep('Сотрудничество', phone, val('email')),
  dep('Карьера', val('careerPhone'), val('careerEmail')),
  dep('Общие вопросы', val('infoPhone'), val('infoEmail')),
].filter((d) => d.phone || d.email);

export const site = {
  // false — сайт закрыт от поисковиков (черновик). Перед официальным запуском поставить true
  // и удалить файл public/robots.txt (или разрешить в нём индексацию).
  indexable: false,
  name: 'Стекляника',
  legalName: 'ООО «Стекляника»',
  slogan: 'Больше, чем остекление',
  motto: 'Больше света. Больше возможностей.',
  description:
    'Проектирование, производство и монтаж светопрозрачных конструкций под ключ для коммерческих и частных объектов.',
  phone,
  phoneHref: telHref(phone),
  email: val('email'),
  departments,
  address: val('address'),
  workHours: `${val('daysShort', 'Пн–Пт')} ${val('hours')}`.trim(),
  workHoursFull: `${val('daysFull', 'Понедельник–пятница')}: ${val('hours')}`,
  vk: val('vk', 'https://vk.ru/steklyanika'),
  // Страницы компании (не конкретных вакансий) — блок «Свяжитесь с нами», под «Построить маршрут»
  hh: val('hh'),
  dreamjob: val('dreamjob'),
  // Куда ведут адрес и кнопка «Построить маршрут»: карточка организации в Яндекс Картах.
  // Если ссылки нет — поиск адреса на картах.
  mapLink: val('mapOrg', `https://yandex.ru/maps/?text=${encodeURIComponent(val('address'))}`),
};

// children — кнопки, которые выпадают под пунктом шапки при наведении (в мобильном меню — вложенные пункты).
// У «Услуг» список берётся из src/data/services.ts (подставляет Header.astro), в мобильное меню он не выводится —
// там 11 пунктов, полный список есть на странице «Услуги».
export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };
export const nav: NavItem[] = [
  { label: 'О нас', href: '/about/', children: [{ label: 'События', href: '/about/events/' }] },
  { label: 'Услуги', href: '/services/' },
  { label: 'Объекты', href: '/projects/' },
  {
    label: 'Партнерам', href: '/partners/', children: [
      { label: 'Девелоперам', href: '/partners/developers/' },
      { label: 'Архитекторам и дизайнерам', href: '/partners/architects/' },
      { label: 'Владельцам бизнеса', href: '/partners/business/' },
      { label: 'Частным лицам', href: '/partners/private/' },
    ],
  },
  { label: 'Вакансии', href: '/careers/' },
  { label: 'Контакты', href: '/contacts/' },
];

// Факты о компании (главная — блок «Главное — в фактах», страница «О компании»).
// Верхний ряд — цифры: value крупно, label — подпись.
export const facts = [
  { icon: 'trend', value: '6 лет', label: 'на рынке' },
  { icon: 'building', value: '100+', label: 'реализованных проектов' },
  { icon: 'factory', value: '1000 м²', label: 'собственное производство' },
  { icon: 'facade', prefix: 'до', value: '5000 м²', label: 'витражных конструкций в месяц' },
  { icon: 'window', prefix: 'до', value: '2000 м²', label: 'оконных систем' },
];

// Нижний ряд — текстовые факты: accent выделяется жирным.
export const textFacts = [
  { icon: 'globe', before: 'Работаем в ', accent: 'разных', after: ' регионах России' },
  { icon: 'truck', before: 'Доставка ', accent: 'личным транспортом', after: '' },
];
