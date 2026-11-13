// Данные для поисковиков и соцсетей (их не видно на страницах).
// Всё берётся из контактов (src/content/contacts.json, админка → «Контакты»): поменяли телефон, адрес или часы —
// здесь обновится само. Адрес сайта (домен) задан в astro.config.mjs → site.
import contacts from '../content/contacts.json';
import { site } from './site';

const c = contacts as Record<string, string | undefined>;

// «Пн–Пт» / «Пн, Ср, Пт» → дни недели для поисковиков. Не разобрали — часы работы просто не указываем.
const DAYS: Record<string, string> = { пн: 'Monday', вт: 'Tuesday', ср: 'Wednesday', чт: 'Thursday', пт: 'Friday', сб: 'Saturday', вс: 'Sunday' };
const ORDER = Object.keys(DAYS);
function parseDays(s: string): string[] {
  const parts = s.toLowerCase().replace(/\s/g, '').split(',');
  const out: string[] = [];
  for (const p of parts) {
    const [a, b] = p.split(/[–—-]/);
    const i = ORDER.indexOf(a), j = b ? ORDER.indexOf(b) : i;
    if (i < 0 || j < 0 || j < i) return [];
    for (let k = i; k <= j; k++) out.push(DAYS[ORDER[k]]);
  }
  return out;
}

function openingHours() {
  const days = parseDays(c.daysShort ?? '');
  const t = (c.hours ?? '').match(/(\d{1,2}:\d{2})\D+(\d{1,2}:\d{2})/);
  if (!days.length || !t) return undefined;
  const pad = (x: string) => x.padStart(5, '0');
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: pad(t[1]), closes: pad(t[2]) }];
}

// «г. Нижний Новгород, ул. Ломоносова, 9Б» → город и улица
function address() {
  const [city, ...rest] = site.address.split(',').map((x) => x.trim());
  if (!city) return undefined;
  return {
    '@type': 'PostalAddress',
    addressCountry: 'RU',
    addressLocality: city.replace(/^г\.\s*/, ''),
    streetAddress: rest.join(', ') || undefined,
  };
}

// координаты из Яндекс Карт записаны как «долгота,широта»
function geo() {
  const [lon, lat] = (c.mapCoords ?? '').split(',').map(Number);
  return lat && lon ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lon } : undefined;
}

// Карточка компании (schema.org) — Яндекс и Google по ней понимают название, адрес, телефон и часы работы
export function organizationLd(siteUrl: URL, logoUrl: string, imageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: siteUrl.href,
    logo: logoUrl,
    image: imageUrl,
    telephone: site.phone || undefined,
    email: site.email || undefined,
    address: address(),
    geo: geo(),
    openingHoursSpecification: openingHours(),
    sameAs: [site.vk, site.hh, site.dreamjob, c.mapOrg].filter(Boolean),
  };
}
