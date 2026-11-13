// Кейсы для карусели «От идеи — к воплощению» на главной (4-й экран).
// Это отдельный список: страница «Объекты» и страницы объектов берутся из projects.ts и от него не зависят.
// Фото — из папки «для сайта», уменьшенные копии лежат в src/assets/cases.
// Подпись над названием — только то, что подтверждено материалами (названия папок и бриф).
import type { ImageMetadata } from 'astro';

import holms from '../assets/cases/holms.jpg';
import novopokrovskaya from '../assets/cases/novopokrovskaya.jpg';
import escape from '../assets/cases/escape.jpg';
import kamaz from '../assets/cases/kamaz.jpg';
import novokart from '../assets/cases/novokart.jpg';
import ncfm from '../assets/cases/ncfm.jpg';

export interface Case {
  title: string;          // перенос строки в карточке — через \n
  category: string;
  cover?: ImageMetadata;  // нет фото — карточка показывает фирменный паттерн
}

export const cases: Case[] = [
  { title: 'Холмс', category: 'Жилой комплекс', cover: holms },
  { title: 'Escape', category: 'Ресторан', cover: escape },
  { title: 'Центр КАМАЗ', category: 'Коммерческий объект', cover: kamaz },
  { title: 'Новокард', category: 'Коммерческий объект', cover: novokart },
  { title: 'НЦФМ Саров', category: 'Научный центр', cover: ncfm },
  { title: 'д. Новопокровское', category: 'Коттедж', cover: novopokrovskaya },
];
