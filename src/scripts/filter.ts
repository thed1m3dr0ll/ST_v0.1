// Фильтр карточек по категориям (страницы «Услуги» и «Объекты»).
// Кнопки: [data-filter="id"], карточки: [data-cats="id1 id2"], всё внутри [data-filter-root].
export function initFilter() {
  document.querySelectorAll<HTMLElement>('[data-filter-root]').forEach((root) => {
    const btns = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')];
    const cards = [...root.querySelectorAll<HTMLElement>('[data-cats]')];
    const empty = root.querySelector<HTMLElement>('[data-filter-empty]');
    btns.forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.filter!;
      btns.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
      let shown = 0;
      cards.forEach((c) => {
        const ok = id === 'all' || c.dataset.cats!.split(' ').includes(id);
        c.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }));
  });
}
