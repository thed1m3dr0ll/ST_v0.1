// Свой виджет админки «rich-text» — поле «Текст» у событий (config.yml → events → body).
// Кнопки: Ж (жирный), К (курсив), Ч (подчёркнутый) и цвет текста — только цвета брендбука и чёрный.
// Значение — короткий HTML: <p>, <br>, <b>, <i>, <u>, <span style="color:…">. Всё остальное (шрифты, размеры,
// чужие стили) отбрасывается; вставка из Word / с сайтов идёт простым текстом. На сайте HTML чистится ещё раз
// (src/data/events.ts), поэтому список цветов там должен совпадать с этим.
// Decap отдаёт React через глобальные createClass и h (React.createElement).
(function () {
  const COLORS = [
    { name: 'Зелёный мох', value: '#3d4a47' },
    { name: 'Мятно-бирюзовый', value: '#708a87' },
    { name: 'Пастельно-бирюзовый', value: '#99bab8' },
    { name: 'Чёрный', value: '#000000' },
  ];
  const ALLOWED = COLORS.map((c) => c.value);

  // rgb(61, 74, 71) / #3D4A47 / #000 → #3d4a47; не из списка — null
  function toHex(c) {
    if (!c) return null;
    c = String(c).trim().toLowerCase();
    const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) c = '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('');
    if (/^#[0-9a-f]{3}$/.test(c)) c = '#' + c.slice(1).split('').map((x) => x + x).join('');
    if (c === 'black') c = '#000000';
    return ALLOWED.includes(c) ? c : null;
  }

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const BLOCK = /^(p|div|h[1-6]|li|blockquote|pre|section|article)$/;
  const DROP = /^(script|style|template|iframe|object|embed|head|meta|link|title)$/;

  // Строчное содержимое: оформление оставляем, вложенные абзацы превращаем в перенос строки
  function inline(node) {
    let out = '';
    node.childNodes.forEach((n, i) => {
      if (n.nodeType === 3) { out += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (DROP.test(tag)) return;
      if (tag === 'br') { out += '<br>'; return; }
      let inner = inline(n);
      if (BLOCK.test(tag)) { out += (i > 0 && out && !out.endsWith('<br>') ? '<br>' : '') + inner; return; }
      const st = n.style || {};
      if (tag === 'b' || tag === 'strong' || +st.fontWeight >= 600 || st.fontWeight === 'bold') inner = `<b>${inner}</b>`;
      if (tag === 'i' || tag === 'em' || st.fontStyle === 'italic') inner = `<i>${inner}</i>`;
      if (tag === 'u' || /underline/.test(st.textDecoration || st.textDecorationLine || '')) inner = `<u>${inner}</u>`;
      const color = toHex(st.color) || toHex(n.getAttribute && n.getAttribute('color'));
      if (color && inner) inner = `<span style="color:${color}">${inner}</span>`;
      out += inner;
    });
    return out;
  }

  // Весь текст → ряд абзацев <p>
  function clean(html) {
    const root = document.createElement('div');
    root.innerHTML = html || '';
    const paras = [];
    let loose = document.createElement('div');
    const flush = () => { if (loose.childNodes.length) { paras.push(inline(loose)); loose = document.createElement('div'); } };
    Array.from(root.childNodes).forEach((n) => {
      const tag = n.nodeType === 1 ? n.tagName.toLowerCase() : '';
      if (tag === 'ul' || tag === 'ol') { flush(); n.querySelectorAll('li').forEach((li) => paras.push(inline(li))); }
      else if (BLOCK.test(tag)) { flush(); paras.push(inline(n)); }
      else loose.appendChild(n);
    });
    flush();
    const list = paras.map((p) => p.replace(/(<br>)+$/, ''));
    while (list.length && !list[list.length - 1].replace(/<[^>]+>|&nbsp;|\s/g, '')) list.pop();
    while (list.length && !list[0].replace(/<[^>]+>|&nbsp;|\s/g, '')) list.shift();
    return list.map((p) => `<p>${p || '<br>'}</p>`).join('');
  }

  const Control = createClass({
    getInitialState() { return { bold: false, italic: false, underline: false }; },

    componentDidMount() {
      this.el.innerHTML = this.props.value || '';
      this.onSel = () => {
        const s = document.getSelection();
        if (!s || !s.anchorNode || !this.el.contains(s.anchorNode)) return;
        this.setState({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
        });
      };
      document.addEventListener('selectionchange', this.onSel);
    },
    componentWillUnmount() { document.removeEventListener('selectionchange', this.onSel); },

    emit() { this.props.onChange(clean(this.el.innerHTML)); },

    run(cmd, arg) {
      this.el.focus();
      document.execCommand('styleWithCSS', false, false);
      document.execCommand(cmd, false, arg);
      this.emit();
      this.onSel();
    },

    onPaste(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    },

    render() {
      const btn = (cmd, label, title, cls) => h('button', {
        type: 'button', title, 'aria-label': title, 'aria-pressed': this.state[cmd],
        className: `rt__btn rt__btn--${cls}` + (this.state[cmd] ? ' is-on' : ''),
        onMouseDown: (e) => { e.preventDefault(); this.run(cmd); },
      }, label);

      return h('div', { className: 'rt' },
        h('div', { className: 'rt__bar' },
          btn('bold', 'Ж', 'Жирный (Ctrl+B)', 'b'),
          btn('italic', 'К', 'Курсив (Ctrl+I)', 'i'),
          btn('underline', 'Ч', 'Подчёркнутый (Ctrl+U)', 'u'),
          h('span', { className: 'rt__sep' }),
          h('span', { className: 'rt__label' }, 'Цвет:'),
          COLORS.map((c) => h('button', {
            key: c.value, type: 'button', title: c.name, 'aria-label': `Цвет: ${c.name}`,
            className: 'rt__color', style: { background: c.value },
            onMouseDown: (e) => { e.preventDefault(); this.run('foreColor', c.value); },
          })),
        ),
        h('div', {
          id: this.props.forID,
          className: `${this.props.classNameWrapper} rt__area`,
          contentEditable: true,
          suppressContentEditableWarning: true,
          ref: (el) => { this.el = el; },
          onInput: () => this.emit(),
          onPaste: this.onPaste,
          onFocus: () => { document.execCommand('defaultParagraphSeparator', false, 'p'); this.props.setActiveStyle(); },
          onBlur: () => { this.emit(); this.props.setInactiveStyle(); },
        }),
      );
    },
  });

  const Preview = createClass({
    render() { return h('div', { dangerouslySetInnerHTML: { __html: this.props.value || '' } }); },
  });

  CMS.registerWidget('rich-text', Control, Preview);
})();
