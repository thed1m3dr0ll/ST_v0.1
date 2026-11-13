// Сертификаты компании для карусели сертификатов (components/home/Certificates.astro) — на главной и на «Партнерам».
// Список (порядок, подписи, какие картинки) лежит в src/content/certificates.json и редактируется через админку
// /admin/ → «Настройки сайта» → «Сертификаты». Картинки — в src/assets/company-certificates/ (туда же их кладёт админка).
// Сертификаты в PDF сначала нужно превратить в картинку: положите PDF в «для сайта/сертификаты» и запустите
// python tools/prep-certificates.py — картинка появится в src/assets/company-certificates/, дальше выбрать её в админке.
//
// Порядок в списке = порядок в карусели. Количество может быть любым.
import type { ImageMetadata } from 'astro';
import data from '../content/certificates.json';

const images = import.meta.glob<ImageMetadata>('../assets/company-certificates/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, import: 'default' });
const byName = Object.fromEntries(Object.entries(images).map(([p, img]) => [p.split('/').pop()!, img]));

type CertificateFile = { image?: string; alt?: string };

export const certificates = ((data as { items?: CertificateFile[] }).items ?? [])
  .map((c) => ({ image: byName[String(c.image ?? '').split('/').pop()!], alt: (c.alt ?? '').trim() || 'Сертификат' }))
  .filter((c): c is { image: ImageMetadata; alt: string } => !!c.image);
