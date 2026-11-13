// «Материалы для воплощения идей» — экран на странице «Архитекторам и дизайнерам» (вкладки «Стекло» / «Алюминий»).
// Фото готовит `node tools/prep-architects.cjs` (вертикальные 3:4): стекло — src/assets/architects/glass/<вид>/NN.jpg,
// алюминий — src/assets/architects/alu/<система>.jpg (пока рендеры профильных систем Alutech, позже заменить своими фото).
// Если у вида несколько фото — на сайте они лягут стопкой, которую листают мышкой.
import type { ImageMetadata } from 'astro';

export interface Material { title: string; images: ImageMetadata[]; }

const glassFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/architects/glass/*/*.jpg', { eager: true });
const aluFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/architects/alu/*.jpg', { eager: true });

const glassImages = (slug: string) => Object.keys(glassFiles)
  .filter((k) => k.includes(`/glass/${slug}/`))
  .sort()
  .map((k) => glassFiles[k].default);
const aluImage = (slug: string) => aluFiles[`../assets/architects/alu/${slug}.jpg`].default;

// Порядок в списке = порядок на сайте
export const glass: Material[] = [
  { title: 'Прозрачное', images: glassImages('clear') },
  { title: 'Матовое', images: glassImages('matte') },
  { title: 'Фигурное', images: glassImages('figured') },
  { title: 'Тонированное', images: glassImages('tinted') },
].filter((m) => m.images.length);

export const aluminium: Material[] = [
  { title: 'Фасадные системы', images: [aluImage('facade')] },
  { title: 'Оконные системы', images: [aluImage('window')] },
  { title: 'Дверные системы', images: [aluImage('door')] },
  { title: 'Портальные системы', images: [aluImage('portal')] },
  { title: 'Противопожарные системы', images: [aluImage('fire')] },
  { title: 'Раздвижные конструкции', images: [aluImage('sliding')] },
  { title: 'Ограждения', images: [aluImage('railing')] },
];
