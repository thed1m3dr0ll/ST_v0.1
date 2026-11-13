// Объекты для страницы «Объекты». По клику на карточку открывается всплывающее окно с галереей и описанием.
// Каждый объект — папка src/content/objects/<папка>/: в ней index.json (название, тип, локация, работы, список фото)
// и сами фото. Редактируется через админку /admin/ → «Объекты» (там же загружаются фото; первое — обложка).
// Здесь — только чтение и подготовка для страниц.
import type { ImageMetadata } from 'astro';
import { lines } from './lines';

export interface Project {
  slug: string;
  title: string;
  type: 'residential' | 'private' | 'commercial' | 'special';
  location: string;
  works?: string[];       // каждый пункт — отдельная строка в «Выполненных работах»; нет — строка не выводится
  cover: ImageMetadata;
  gallery: ImageMetadata[];
}

export const projectTypes = [
  { id: 'all', label: 'Все объекты' },
  { id: 'residential', label: 'Жилые комплексы' },
  { id: 'private', label: 'Частные дома' },
  { id: 'commercial', label: 'Коммерческие' },
  { id: 'special', label: 'Специальные решения' },
] as const;

// Подпись над названием в карточке
export const typeLabels: Record<Project['type'], string> = {
  residential: 'Жилой комплекс',
  private: 'Частный дом',
  commercial: 'Коммерческий объект',
  special: 'Специальное решение',
};

// Как объект хранится в index.json (поля админки — public/admin/config.yml)
type ObjectFile = {
  title?: string;
  type?: string;
  location?: string;
  works?: string | string[]; // каждый пункт — с новой строки (см. lines.ts)
  photos?: string[];
  published?: boolean;
  order?: number;
};

const files = import.meta.glob<ObjectFile>('../content/objects/*/index.json', { eager: true, import: 'default' });
const photos = import.meta.glob<ImageMetadata>('../content/objects/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, import: 'default' });

const types = Object.keys(typeLabels) as Project['type'][];

export const projects: Project[] = Object.entries(files)
  .map(([file, o]) => {
    const dir = file.slice(0, file.lastIndexOf('/') + 1); // ../content/objects/<папка>/
    const slug = dir.split('/').at(-2)!;
    // в JSON фото записаны по имени файла (иногда с путём) — ищем их в папке объекта
    const gallery = (o.photos ?? [])
      .map((ph) => photos[dir + String(ph ?? '').split('/').pop()])
      .filter(Boolean);
    return { o, slug, gallery };
  })
  .filter(({ o, gallery }) => o.published !== false && o.title?.trim() && gallery.length > 0)
  .sort((a, b) => (a.o.order ?? 999) - (b.o.order ?? 999) || a.o.title!.localeCompare(b.o.title!, 'ru'))
  .map(({ o, slug, gallery }) => ({
    slug,
    title: o.title!.trim(),
    type: types.includes(o.type as Project['type']) ? (o.type as Project['type']) : 'commercial',
    location: (o.location ?? '').trim(),
    works: lines(o.works),
    cover: gallery[0],
    gallery,
  }));
