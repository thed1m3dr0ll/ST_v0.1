// Юридические документы сайта: адрес страницы и короткое название для списков (подвал, «Другие документы»).
// Сам текст — src/content/docs/<id>.md (админка → «Документы»).
export const docs = [
  { id: 'privacy', href: '/privacy/', label: 'Политика обработки персональных данных' },
  { id: 'cookies', href: '/cookies/', label: 'Политика использования файлов cookie' },
  { id: 'consent', href: '/consent/', label: 'Согласие на обработку персональных данных' },
  { id: 'consent-candidates', href: '/consent-candidates/', label: 'Согласие на обработку персональных данных соискателя' },
] as const;

export type DocId = (typeof docs)[number]['id'];

export const docHref = (id: DocId) => docs.find((d) => d.id === id)!.href;
