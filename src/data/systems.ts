// Системы — блок «Профильные системы» на главной.
// Порядок в списке = порядок на сайте. model3d: true — вместо фото показывается 3D-модель (src/scripts/profile3d.ts).
// Картинки — рендеры из «для сайта/системы», приведённые к одному формату (холст 2:1, изделие по центру)
// в папке src/assets/systems/catalog.
// TODO: подробные характеристики и 3D-модели — добавить позже, сейчас только серия и назначение.
import type { ImageMetadata } from 'astro';
import facade from '../assets/systems/catalog/facade.jpg';
import facadeThumb from '../assets/systems/catalog/facade-thumb.jpg';
import windows from '../assets/systems/catalog/window-w77.jpg';
import windowsThumb from '../assets/systems/catalog/window-w77-thumb.jpg';
import door from '../assets/systems/catalog/door.jpg';
import doorThumb from '../assets/systems/catalog/door-thumb.jpg';
import portal from '../assets/systems/catalog/portal.jpg';
import portalThumb from '../assets/systems/catalog/portal-thumb.jpg';
import fire from '../assets/systems/catalog/fire.jpg';
import fireThumb from '../assets/systems/catalog/fire-thumb.jpg';
import sliding from '../assets/systems/catalog/sliding.jpg';
import slidingThumb from '../assets/systems/catalog/sliding-thumb.jpg';
import railing from '../assets/systems/catalog/railing.jpg';
import railingThumb from '../assets/systems/catalog/railing-thumb.jpg';

export interface Spec { label: string; value: string; note?: string; } // note — мелкая подпись под значением
export interface System {
  title: string;
  thumb: ImageMetadata;   // миниатюра в списке
  image: ImageMetadata;   // картинка в большом окне (для систем без 3D-модели)
  model3d?: boolean;
  specs: Spec[];
  options?: string[];     // «Доступные опции»; если не задано — общий список systemOptions
}

// «Доступные опции» — пока одинаковые для всех систем
export const systemOptions = [
  'Выбор типа стеклопакета',
  'Выбор цвета профиля',
  'Выбор варианта утеплителя',
];

// сноска под характеристиками
export const systemsNote = 'Полный перечень доступных вариантов исполнения уточняйте у специалиста';

export const systems: System[] = [
  {
    title: 'Фасадные системы',
    thumb: facadeThumb, image: facade,
    specs: [
      { label: 'Профильная система', value: 'ALT F50', note: 'стоечно-ригельная' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Фасады жилых и общественных зданий' },
    ],
  },
  {
    title: 'Оконные системы',
    thumb: windowsThumb, image: windows,
    specs: [
      { label: 'Профильная система', value: 'ALT W77 HS', note: 'скрытая створка' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Окна жилых и общественных зданий' },
    ],
  },
  {
    title: 'Дверные системы',
    thumb: doorThumb, image: door,
    specs: [
      { label: 'Профильная система', value: 'W72HD', note: 'с термоизоляцией' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Габаритные двери с термоизоляцией' },
    ],
  },
  {
    title: 'Портальные системы',
    thumb: portalThumb, image: portal,
    specs: [
      { label: 'Профильная система', value: 'ALT SL160' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Панорамные выходы на террасу и балкон' },
    ],
  },
  {
    title: 'Противопожарные системы',
    thumb: fireThumb, image: fire,
    specs: [
      { label: 'Профильная система', value: 'ALT FR76' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Объекты с требованиями пожарной безопасности' },
    ],
  },
  {
    title: 'Балконные системы',
    thumb: slidingThumb, image: sliding,
    specs: [
      { label: 'Профильная система', value: 'ALT 100P' },
      { label: 'Материал', value: 'Алюминий' },
      { label: 'Применение', value: 'Балконы и лоджии, усиленная створка' },
    ],
  },
  {
    title: 'Ограждения',
    thumb: railingThumb, image: railing,
    specs: [
      { label: 'Профильная система', value: 'GB' },
      { label: 'Материал', value: 'Алюминий и стекло' },
      { label: 'Применение', value: 'Балконы, террасы, лестницы' },
    ],
  },
];
