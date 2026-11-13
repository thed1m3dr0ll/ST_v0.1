// Вакансии. Сами тексты лежат в src/content/vacancies/*.json (один файл — одна вакансия)
// и редактируются через админку /admin/ (раздел «Вакансии»). Здесь — только чтение и подготовка для страниц.
// Список — на странице «Вакансии» (src/pages/careers.astro), у каждой вакансии своя страница /careers/<slug>/
// (src/pages/careers/[slug].astro). Кнопка «Откликнуться» ведёт на hh.ru, а если ссылки нет — открывает форму резюме.
// Зарплату на сайте не указываем.

import { lines } from './lines';

// Как вакансия хранится в JSON (поля админки — public/admin/config.yml)
type VacancyFile = {
  title?: string;
  place?: string;
  employment?: string;
  experience?: string;
  schedule?: string;
  contract?: string;
  format?: string;
  duties?: string | string[]; // каждый пункт — с новой строки (см. lines.ts)
  requirements?: string | string[];
  conditions?: string | string[];
  hh?: string;
  published?: boolean;
  order?: number;
};

export type Vacancy = {
  slug: string;
  title: string;
  place: 'Офис' | 'Производство';
  employment: string; // пишется после места через точку: «Офис · полная занятость»
  hh: string; // пусто — кнопка «Откликнуться» открывает форму резюме на сайте
  facts: { label: string; value: string }[]; // короткие характеристики вверху страницы вакансии
  duties: string[];
  requirements: string[];
  conditions: string[];
};

const files = import.meta.glob<VacancyFile>('../content/vacancies/*.json', { eager: true, import: 'default' });

const lat: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
// Адрес страницы из названия: «Технолог-конструктор» → tehnolog-konstruktor
export function slugify(s: string) {
  return [...s.toLowerCase()].map((ch) => lat[ch] ?? ch).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'vacancy';
}

// Ссылка на hh.ru без хвоста ?from=…&hhtmFrom=… — остаётся чистый адрес вакансии
function cleanLink(url = '') {
  const s = url.trim();
  if (!s) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (/(^|\.)hh\.ru$/i.test(u.hostname)) u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return '';
  }
}

const used = new Set<string>();
export const vacancies: Vacancy[] = Object.values(files)
  .filter((v) => v.published !== false && v.title?.trim())
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title!.localeCompare(b.title!, 'ru'))
  .map((v) => {
    const title = v.title!.trim();
    let slug = slugify(title);
    for (let i = 2; used.has(slug); i++) slug = `${slugify(title)}-${i}`;
    used.add(slug);
    const facts = [
      { label: 'Опыт работы', value: v.experience },
      { label: 'График', value: v.schedule },
      { label: 'Оформление', value: v.contract },
      { label: 'Формат работы', value: v.format },
    ].filter((f): f is { label: string; value: string } => !!f.value?.trim());
    return {
      slug,
      title,
      place: v.place === 'Офис' ? 'Офис' : 'Производство',
      employment: (v.employment ?? '').trim() || 'полная занятость',
      hh: cleanLink(v.hh),
      facts,
      duties: lines(v.duties),
      requirements: lines(v.requirements),
      conditions: lines(v.conditions),
    };
  });
