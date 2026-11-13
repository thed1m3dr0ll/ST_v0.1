// События (новости компании) для страницы «О нас → События» (src/pages/about/events.astro).
// Каждое событие — файл src/content/events/<дата-время>.json, фото — в src/assets/events/.
// Редактируется через админку /admin/ → «События». Здесь — только чтение и подготовка для страницы.
// Текст хранится как HTML из редактора админки (public/admin/rich-text.js); здесь он чистится ещё раз:
// остаются только абзацы, переносы, жирный, курсив, подчёркивание и цвета из списка ниже.
import type { ImageMetadata } from 'astro';

// Должен совпадать с COLORS в public/admin/rich-text.js
const COLORS = ['#3d4a47', '#708a87', '#99bab8', '#000000'];

type EventFile = {
  title?: string;
  day?: string; // 2026-10-26 (в админке поле «Дата»)
  photo?: string;
  body?: string;
  published?: boolean;
};

export type SiteEvent = {
  slug: string;
  title: string;
  date: string;      // 2026-10-26 — для сортировки
  dateLabel: string; // 26 октября 2026
  photo?: ImageMetadata;
  html: string;      // полный текст
  excerpt: string;   // тот же текст без оформления — для карточки (обрезается многоточием в CSS)
};

const files = import.meta.glob<EventFile>('../content/events/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<ImageMetadata>('../assets/events/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, import: 'default' });
const byName = Object.fromEntries(Object.entries(images).map(([p, img]) => [p.split('/').pop()!, img]));

const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// Белый список тегов. Содержимое script/style выбрасывается целиком, остальные лишние теги — только сами теги.
export function cleanHtml(html = '') {
  return html
    .replace(/<(script|style|iframe|object|template)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (_, close: string, name: string, attrs: string) => {
      const tag = name.toLowerCase();
      if (tag === 'strong') return `<${close}b>`;
      if (tag === 'em') return `<${close}i>`;
      if (['p', 'b', 'i', 'u'].includes(tag)) return `<${close}${tag}>`;
      if (tag === 'br') return close ? '' : '<br>';
      if (tag === 'span') {
        if (close) return '</span>';
        const c = attrs.match(/color:\s*(#[0-9a-f]{6})/i)?.[1]?.toLowerCase();
        return c && COLORS.includes(c) ? `<span style="color:${c}">` : '<span>';
      }
      return '';
    })
    .replace(/<p>\s*<\/p>/g, '<p><br></p>')
    .trim();
}

const toText = (html: string) => html
  .replace(/<br>|<\/p>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return y && m && day ? `${day} ${months[m - 1]} ${y}` : '';
}

// По умолчанию — сначала новые. Без даты событие считается самым старым.
export const events: SiteEvent[] = Object.entries(files)
  .filter(([, e]) => e.published !== false && e.title?.trim())
  .map(([file, e]) => {
    const html = cleanHtml(String(e.body ?? ''));
    const date = /^\d{4}-\d{2}-\d{2}/.test(e.day ?? '') ? e.day!.slice(0, 10) : '';
    return {
      slug: file.split('/').pop()!.replace(/\.json$/, ''),
      title: e.title!.trim(),
      date,
      dateLabel: formatDate(date),
      photo: e.photo ? byName[String(e.photo).split('/').pop()!] : undefined,
      html,
      excerpt: toText(html),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
