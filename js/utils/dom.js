// Helpers mínimos de DOM. `h` crea elementos de forma declarativa:
//   h('button', { class: 'btn', onclick: fn }, 'Texto', otroNodo)

export const byId = id => document.getElementById(id);

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style') el.setAttribute('style', value);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child != null && child !== false) el.append(child.nodeType ? child : String(child));
  }
  return el;
}

/** Une clases condicionales: cx('a', cond && 'b') → 'a b'. */
export const cx = (...names) => names.filter(Boolean).join(' ');

export const isTypingTarget = el => /INPUT|TEXTAREA|SELECT/.test(el?.tagName || '');

/** Debounce simple. */
export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
