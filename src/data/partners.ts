// Партнёры и сертификаты.
// ВНИМАНИЕ: изображения сертификатов в макете — иллюстрации. Заменить на сканы реальных сертификатов.
import schuco from '../assets/certs/schuco.png';
import alutech from '../assets/certs/alutech.png';
import agc from '../assets/certs/agc.png';
import gu from '../assets/certs/gu.png';

export const partners = [
  { name: 'Schüco', status: 'Сертифицированный партнёр', cert: schuco, about: 'Немецкий производитель алюминиевых систем для окон, дверей и фасадов премиального сегмента.' },
  { name: 'Alutech', status: 'Официальный партнёр', cert: alutech, about: 'Группа компаний, производящая алюминиевые профильные системы для светопрозрачных конструкций.' },
  { name: 'AGC', status: 'Сертификат качества', cert: agc, about: 'Один из крупнейших мировых производителей архитектурного стекла.' },
  { name: 'GU', status: 'Сертификат партнёра', cert: gu, about: 'Производитель оконной и дверной фурнитуры, раздвижных и подъёмно-раздвижных механизмов.' },
];
