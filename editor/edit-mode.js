/* Copy-edit mode for cameronkuey.com (MOCK).
   Loaded only when ?edit / #edit is present or sessionStorage "cm-edit" is "1" (see the tiny loader in Base.astro).
   Plain ES module, no dependencies, no build step. Edits live in this browser's localStorage and are exported as
   markdown + JSON for Job Buddy to apply to the source. Nothing here changes the site for normal visitors. */
if (!window.__cmEdit) {
(() => {
const LS_KEY = 'cm-edit:v1', UNDO_KEY = 'cm-edit:undo:v1', SS_KEY = 'cm-edit', JUMP_KEY = 'cm-edit:jump', HINT_KEY = 'cm-edit:hint';
const DELAY = 320; // ms a single click on a link/button waits, so a double-click can edit instead of navigate
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';

/* ---------- helpers ---------- */
const norm = (s) => String(s).replace(/[\s\u00A0]+/g, ' ').trim();
const pagePath = () => { let p = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/'); if (p.length > 1) p = p.replace(/\/+$/, ''); return p || '/'; };
const uiHost = () => document.getElementById('cm-edit-root');
const inUi = (t) => { const h = uiHost(); return !!(h && t && t.nodeType && (h === t || h.contains(t))); };
const cs = (el) => getComputedStyle(el);
const isInline = (el) => { const d = cs(el).display; return d === 'inline' || d === 'contents'; };
const hasLetters = (s) => /[\p{L}\p{N}]/u.test(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const el = (tag, props = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); } kids.forEach((c) => c != null && n.append(c)); return n; };

/* ---------- storage ---------- */
let edits = [];
let undo = [];
const readLS = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const loadStore = () => { const d = readLS(LS_KEY); edits = Array.isArray(d && d.edits) ? d.edits : []; const u = readLS(UNDO_KEY); undo = Array.isArray(u) ? u : []; };
const saveStore = () => { try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 1, edits })); localStorage.setItem(UNDO_KEY, JSON.stringify(undo.slice(-100))); } catch (e) { toast('Could not save edits in this browser: ' + e.message); } refreshUi(); };
loadStore();

/* ---------- text extraction ---------- */
const isDecor = (n) => {
  if (n.nodeType !== 1) return false;
  if (n.classList.contains('sr-only')) return true;
  if (/^(SVG|IMG|PICTURE|VIDEO|CANVAS|IFRAME|SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/i.test(n.tagName)) return true;
  if (n.getAttribute('aria-hidden') === 'true' && !hasLetters(n.textContent)) return true;
  return false;
};
function textOf(root) {
  let out = '';
  (function walk(n) {
    if (n.nodeType === 3) { out += n.nodeValue; return; }
    if (n.nodeType !== 1) return;
    if (n !== root && isDecor(n)) return;
    if (n.tagName === 'BR') { out += ' '; return; }
    if (n !== root) { const d = cs(n).display; if (d === 'none') return; if (d !== 'inline' && d !== 'contents') out += ' '; }
    n.childNodes.forEach(walk);
    if (n !== root) { const d = cs(n).display; if (d !== 'inline' && d !== 'contents') out += ' '; }
  })(root);
  return norm(out);
}

/* ---------- selector hint + stable key ---------- */
function nth(n) { const same = [...n.parentElement.children].filter((c) => c.tagName === n.tagName); return same.length > 1 ? `:nth-of-type(${same.indexOf(n) + 1})` : ''; }
function pathKey(n) { const parts = []; for (let c = n; c && c !== document.body && c.nodeType === 1; c = c.parentElement) parts.unshift(c.tagName.toLowerCase() + (c.parentElement ? `:nth-of-type(${[...c.parentElement.children].filter((x) => x.tagName === c.tagName).indexOf(c) + 1})` : '')); return 'body > ' + parts.join(' > '); }
function hint(n) {
  const parts = [];
  let c = n, depth = 0;
  while (c && c !== document.body && depth < 5) {
    const cls = (typeof c.className === 'string' ? c.className : '').split(/\s+/).filter((x) => x && !x.startsWith('cm-'))[0];
    let seg = c.tagName.toLowerCase() + (c.id ? '#' + c.id : cls ? '.' + cls : '') + (c.id ? '' : nth(c));
    parts.unshift(seg);
    if (c.id || ['MAIN', 'HEADER', 'FOOTER'].includes(c.tagName)) break;
    c = c.parentElement; depth++;
  }
  return parts.join(' > ');
}
function contextFor(node) {
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  let best = null;
  for (const h of hs) { if (h === node || h.contains(node) || node.contains(h)) continue; if (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) best = h; else break; }
  if (!best) return '';
  const sr = best.querySelector('.sr-only');
  const t = sr && norm(sr.textContent) ? norm(sr.textContent) : textOf(best);
  return t.length > 70 ? t.slice(0, 67) + '...' : t;
}

/* ---------- what can be edited ---------- */
const SKIP = [
  ['#cm-edit-root', 'ui'],
  ['.logo', 'The logo is not editable.'],
  ['.hx-rot, [data-titles]', 'The rotating hero line has its own editor: use the Rotating titles button.'],
  ['.hx-pp, .menu-btn, button[aria-pressed], .lb, dialog', 'Controls that the page labels itself are not editable.'],
  ['.hx-chip, [aria-live]', 'Live labels set by the page are not editable.'],
  ['.sr-only', 'Screen-reader-only text is not editable here.'],
  ['.skip', 'The skip link is not editable here.'],
  ['[hidden]', 'Hidden text is not editable.'],
  ['script, style, noscript, template', 'not text'],
];
const SKIP_SEL = SKIP.map((s) => s[0]).join(',');
const dynamic = new WeakSet();
const isDynamic = (n) => { for (let c = n; c; c = c.parentElement) if (dynamic.has(c)) return true; return false; };
function skipReason(n) {
  for (const [sel, why] of SKIP) if (n.closest(sel)) return why;
  if (isDynamic(n)) return 'This text is changed by the page while it runs, so it is not editable here.';
  return null;
}
function mixed(host) {
  return [...host.querySelectorAll('*')].some((c) => !isDecor(c) && !isInline(c) && cs(c).display !== 'none' && !c.closest('[aria-hidden="true"]') && norm(c.textContent) !== '' && !c.matches('br,wbr'));
}
function climb(start) {
  let cur = start;
  while (cur.parentElement && cur.parentElement !== document.body && isInline(cur)) {
    const p = cur.parentElement;
    if (![...p.children].every((c) => isInline(c) || c.tagName === 'BR' || isDecor(c))) break;
    cur = p;
  }
  return cur;
}
function resolve(start, textNode) {
  if (!start || start.nodeType !== 1) return { reason: null };
  const svgText = start.closest('svg') && start.closest('text, tspan');
  if (svgText) {
    const why = skipReason(svgText.ownerSVGElement || svgText);
    if (why && why !== 'ui') return { reason: why };
    const t = svgText.tagName.toLowerCase() === 'tspan' ? svgText : (svgText.querySelector('tspan') ? null : svgText);
    if (!t) return { reason: 'This label is built from several parts. Not editable here.' };
    return norm(t.textContent) ? { host: t, svg: true } : { reason: null };
  }
  const why = skipReason(start);
  if (why) return { reason: why === 'ui' || why === 'not text' ? null : why };
  let host = climb(start);
  const w2 = skipReason(host);
  if (w2) return { reason: w2 === 'ui' ? null : w2 };
  if (host.querySelector(SKIP_SEL)) {
    const bad = [...host.querySelectorAll(SKIP_SEL)].find((n) => !isDecor(n));
    if (bad) return { reason: skipReason(bad) && skipReason(bad) !== 'ui' ? skipReason(bad) : 'Mixed content. Not editable here.' };
  }
  if (mixed(host)) {
    // The block holds loose text next to other boxes: edit just that run of text.
    const tn = textNode && textNode.nodeType === 3 && textNode.parentElement && textNode.nodeValue.trim() ? textNode : [...start.childNodes].find((c) => c.nodeType === 3 && c.nodeValue.trim());
    if (tn && tn.parentElement && !skipReason(tn.parentElement) && hasLetters(tn.nodeValue)) return { textNode: tn };
    return { reason: 'This block mixes several layout boxes. Double-click the smaller text inside it.' };
  }
  if (!textOf(host)) return { reason: null };
  return { host };
}
const hasOwnText = (n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim());
function caretFrom(x, y) {
  try {
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); return p ? { node: p.offsetNode, offset: p.offset } : null; }
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); return r ? { node: r.startContainer, offset: r.startOffset } : null; }
  } catch {}
  return null;
}
function elementAtPoint(x, y, fallback) {
  const c = caretFrom(x, y);
  if (c && c.node) {
    const e = c.node.nodeType === 3 ? c.node.parentElement : c.node;
    if (e && !inUi(e) && fallback && (fallback.contains(e) || e.contains(fallback))) return { e, caret: c };
  }
  return { e: fallback, caret: null };
}

/* ---------- state ---------- */
let touchDoubleAt = 0, editing = null, hoverEl = null, passThrough = false, pending = null, suppressClickUntil = 0, lastStart = 0, svgPop = null;
const selfMute = (fn) => { try { fn(); } finally { mo.takeRecords(); } };

/* ---------- dynamic text safety net ---------- */
const mo = new MutationObserver((recs) => {
  for (const r of recs) {
    if (editing && editing.host.contains(r.target)) continue;
    const n = r.target.nodeType === 3 ? r.target.parentElement : r.target;
    if (!n || inUi(n) || n === document.body || n === document.documentElement) continue;
    if (n.closest('.cm-editing')) continue;
    if (r.type === 'attributes') continue;
    dynamic.add(n);
  }
});

/* ---------- light-DOM css ---------- */
const style = el('style', { id: 'cm-edit-style' });
style.textContent = `
html[data-cm-edit]{touch-action:manipulation}
html[data-cm-edit] .cm-hover{outline:1px dashed rgba(27,26,24,.6)!important;outline-offset:3px;cursor:text}
html[data-cm-edit] .cm-edited{background-image:linear-gradient(rgba(214,190,150,.42),rgba(214,190,150,.42))!important;border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
html[data-cm-edit] .cm-editing{outline:2px solid #A32121!important;outline-offset:4px;cursor:text;caret-color:#A32121;text-overflow:clip!important}
html[data-cm-edit] .cm-flash{outline:3px solid #1B1A18!important;outline-offset:5px}
html[data-cm-edit] svg text.cm-hover{text-decoration:underline dashed;text-decoration-thickness:1px;text-underline-offset:4px;outline:none!important;cursor:text}
html[data-cm-edit] svg text.cm-edited{paint-order:stroke;stroke:rgba(214,190,150,.95);stroke-width:7px;stroke-linejoin:round;background-image:none!important}
html[data-cm-edit] svg text,html[data-cm-edit] svg tspan{pointer-events:all}
`;
document.head.appendChild(style);

/* ---------- editing a text element ---------- */
const isWrap = (n) => n && n.nodeType === 1 && n.hasAttribute('data-cm-wrap');
function wrapTextNode(tn) {
  if (isWrap(tn.parentElement) && tn.parentElement.childNodes.length === 1) return tn.parentElement;
  const w = document.createElement('span'); w.setAttribute('data-cm-wrap', '');
  selfMute(() => { tn.parentNode.insertBefore(w, tn); w.appendChild(tn); });
  return w;
}
function unwrap(w) { if (!isWrap(w) || !w.parentNode) return; selfMute(() => { const t = document.createTextNode(w.textContent); w.replaceWith(t); }); }
function startEdit(host, caret, wrapped = false) {
  if (editing) return;
  lastStart = Date.now();
  clearHover();
  const startHtml = host.innerHTML, startText = textOf(host), startInner = innerTextOf(host);
  const decor = [...host.querySelectorAll('*')].filter(isDecor);
  decor.forEach((d) => d.setAttribute('contenteditable', 'false'));
  editing = { host, startHtml, startText, startInner, decor, wrapped, wasEdited: host.classList.contains('cm-edited'), done: false };
  host.classList.add('cm-editing');
  host.setAttribute('contenteditable', 'plaintext-only');
  if (host.contentEditable !== 'plaintext-only') host.setAttribute('contenteditable', 'true');
  host.setAttribute('spellcheck', 'true');
  const h = {
    keydown: (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); host.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false); }
    },
    beforeinput: (e) => { if (/^(insertParagraph|insertLineBreak|insertFromDrop|format)/.test(e.inputType)) e.preventDefault(); },
    paste: (e) => { e.preventDefault(); const t = ((e.clipboardData || window.clipboardData).getData('text/plain') || '').replace(/[\r\n\t]+/g, ' '); document.execCommand('insertText', false, t); },
    drop: (e) => e.preventDefault(),
    blur: () => finish(true),
  };
  editing.h = h;
  for (const [k, f] of Object.entries(h)) host.addEventListener(k, f);
  host.focus({ preventScroll: true });
  const sel = getSelection();
  try {
    const r = document.createRange();
    if (caret && caret.node && host.contains(caret.node)) { r.setStart(caret.node, caret.offset); r.collapse(true); }
    else { r.selectNodeContents(host); r.collapse(false); }
    sel.removeAllRanges(); sel.addRange(r);
  } catch {}
}
function finish(commit) {
  if (!editing || editing.done) return;
  const ed = editing; ed.done = true; editing = null;
  const { host } = ed;
  for (const [k, f] of Object.entries(ed.h)) host.removeEventListener(k, f);
  selfMute(() => {
    host.removeAttribute('contenteditable'); host.removeAttribute('spellcheck');
    ed.decor.forEach((d) => d.removeAttribute('contenteditable'));
    host.classList.remove('cm-editing');
    if (!commit) host.innerHTML = ed.startHtml;
  });
  const restore = () => { selfMute(() => { host.innerHTML = ed.startHtml; }); if (ed.wrapped && !ed.wasEdited) unwrap(host); };
  if (!commit) { restore(); getSelection().removeAllRanges(); return; }
  const after = textOf(host);
  if (after === ed.startText) { restore(); return; }
  if (!after) { restore(); toast('Text cannot be empty here. Ask Job Buddy to remove an element.'); return; }
  recordText(host, ed.startText, ed.startHtml, after, host.innerHTML, 'text', ed.startInner);
  getSelection().removeAllRanges();
}

function recordText(node, startText, startHtml, after, afterHtml, kind, startInner = '') {
  const page = pagePath(), wrapped = isWrap(node);
  const idx = wrapped ? [...node.parentNode.childNodes].indexOf(node) : undefined;
  const key = wrapped ? pathKey(node.parentElement) : pathKey(node), id = page + '|' + key + (wrapped ? '#' + idx : '');
  const now = new Date().toISOString();
  let rec = edits.find((e) => e.id === id);
  if (rec) {
    undo.push({ id, prev: { after: rec.after, afterHtml: rec.afterHtml } });
    rec.after = after; rec.afterHtml = afterHtml; rec.timestamp = now;
    if (rec.after === rec.before) { edits = edits.filter((e) => e !== rec); selfMute(() => applyRec(rec, 'before')); undo = undo.filter((u) => u.id !== id); saveStore(); toast('Back to the original text. Edit removed.'); return; }
  } else {
    undo.push({ id, prev: null });
    const it = startInner;
    rec = { id, page, key, idx, selector: wrapped ? hint(node.parentElement) + ' > text()' : hint(node), kind, before: startText, after, beforeHtml: startHtml, afterHtml, context: contextFor(node), timestamp: now };
    if (it && it !== startText) rec.innerText = it;
    edits.push(rec);
  }
  selfMute(() => node.classList.add('cm-edited'));
  saveStore();
  toast(`Saved. ${edits.length} pending edit${edits.length === 1 ? '' : 's'}.`);
}
function innerTextOf(node) { try { return norm(node.innerText || ''); } catch { return ''; } }

/* ---------- SVG label popover ---------- */
function editSvgText(t) {
  closePanels();
  const startText = norm(t.textContent), startHtml = t.innerHTML;
  const r = t.getBoundingClientRect();
  const input = el('input', { type: 'text', 'aria-label': 'Label text', value: startText });
  const pop = el('div', { class: 'pop', role: 'dialog', 'aria-label': 'Edit diagram label' },
    el('label', {}, 'Diagram label', input),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'solid', onclick: () => commit() }, 'Save'),
      el('button', { type: 'button', onclick: () => closePop() }, 'Cancel')));
  pop.style.left = Math.max(8, Math.min(innerWidth - 300, r.left)) + 'px';
  pop.style.top = Math.max(8, Math.min(innerHeight - 160, r.bottom + 8)) + 'px';
  const closePop = () => { pop.remove(); svgPop = null; };
  const commit = () => {
    const v = norm(input.value); closePop();
    if (!v || v === startText) return;
    selfMute(() => { t.textContent = v; });
    recordText(t, startText, startHtml, v, t.innerHTML, 'svg-text');
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.preventDefault(); closePop(); } });
  ui.shadow.appendChild(pop); svgPop = pop; input.focus(); input.select();
}

/* ---------- applying records to the DOM ---------- */
function sanitize(html) {
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('script,iframe,object,embed,style,link,meta,base,form').forEach((n) => n.remove());
  t.content.querySelectorAll('*').forEach((n) => [...n.attributes].forEach((a) => { if (/^on/i.test(a.name) || (/^(href|src|xlink:href)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name); }));
  return t.innerHTML;
}
function locate(rec) {
  if (rec.page !== pagePath() || !rec.key) return null;
  let n = null; try { n = document.querySelector(rec.key); } catch {}
  if (n && rec.idx !== undefined) { const c = n.childNodes[rec.idx]; if (!c) return null; return c.nodeType === 3 ? wrapTextNode(c) : isWrap(c) ? c : null; }
  return n;
}
function applyRec(rec, which) {
  if (rec.kind === 'rotating-titles') return;
  const n = locate(rec); if (!n) return false;
  let text = which === 'after' ? rec.after : rec.before;
  if (rec.idx !== undefined && rec.beforeHtml != null) { const bh = rec.beforeHtml.replace(/&nbsp;/g, ' '); text = (/^\s/.test(bh) ? ' ' : '') + text + (/\s$/.test(bh) ? ' ' : ''); }
  const html = which === 'after' ? rec.afterHtml : rec.beforeHtml;
  if (rec.kind === 'svg-text') n.textContent = text;
  else if (n.children.length === 0 || html == null) n.textContent = text;
  else n.innerHTML = sanitize(html);
  if (which === 'after') n.classList.add('cm-edited'); else { n.classList.remove('cm-edited'); if (isWrap(n)) unwrap(n); }
  return true;
}
function applyAllForPage() {
  selfMute(() => {
    edits.filter((e) => e.page === pagePath() && e.kind !== 'rotating-titles').forEach((rec) => {
      const n = locate(rec); if (!n) { rec.stale = true; return; }
      const cur = n instanceof SVGElement ? norm(n.textContent) : textOf(n);
      if (cur === rec.before || cur === rec.after) { rec.stale = false; applyRec(rec, 'after'); } else rec.stale = true;
    });
  });
}

/* ---------- export ---------- */
const sortedPages = () => { const m = new Map(); edits.forEach((e) => { if (!m.has(e.page)) m.set(e.page, []); m.get(e.page).push(e); }); return [...m.entries()].sort((a, b) => (a[0] === '/' ? -1 : b[0] === '/' ? 1 : a[0].localeCompare(b[0]))); };
const q = (s) => JSON.stringify(s);
function publicRec(e) {
  const o = { page: e.page, selector: e.selector, before: e.before, after: e.after, context: e.context, timestamp: e.timestamp };
  if (e.kind && e.kind !== 'text') o.kind = e.kind;
  if (e.kind === 'rotating-titles') { o.beforeList = e.beforeList; o.afterList = e.afterList; }
  if (e.beforeHtml && /</.test(e.beforeHtml) && e.kind !== 'rotating-titles') { o.beforeHtml = e.beforeHtml; o.afterHtml = e.afterHtml; }
  if (e.innerText) o.innerText = e.innerText;
  return o;
}
function exportObj() { return { site: location.origin, exportedAt: new Date().toISOString(), count: edits.length, edits: edits.map(publicRec) }; }
function exportMarkdown() {
  const pages = sortedPages();
  const lines = [`# Copy edits for ${location.host || 'the site'}`, '', `${edits.length} edit${edits.length === 1 ? '' : 's'} across ${pages.length} page${pages.length === 1 ? '' : 's'}. Apply each BEFORE -> AFTER in the source. Text is shown as rendered (whitespace collapsed, line breaks as spaces).`, ''];
  pages.forEach(([p, list]) => {
    lines.push(`## ${p}`);
    list.forEach((e) => {
      const near = e.context ? `near: '${e.context.replace(/'/g, '’')}'` : 'near: top of page';
      if (e.kind === 'rotating-titles') {
        const b = e.beforeList, a = e.afterList;
        lines.push(`- [${near}] ROTATING HERO TITLES (${b.length} -> ${a.length}). Replace the whole list, in this order:`);
        a.forEach((t, i) => lines.push(`    ${i + 1}. ${t}`));
        const removed = b.filter((t) => !a.includes(t)), added = a.filter((t) => !b.includes(t));
        if (removed.length) lines.push(`    removed: ${removed.map(q).join(', ')}`);
        if (added.length) lines.push(`    added: ${added.map(q).join(', ')}`);
      } else lines.push(`- [${near}] BEFORE: ${q(e.before)} -> AFTER: ${q(e.after)}`);
    });
    lines.push('');
  });
  lines.push('```json', JSON.stringify(exportObj(), null, 2), '```', '');
  return lines.join('\n');
}
async function copyChanges() {
  if (!edits.length) { toast('No edits yet. Double-click any text to start.'); return; }
  const text = exportMarkdown();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {}
  if (!ok) { const ta = el('textarea', { style: 'position:fixed;opacity:0;left:-9999px' }); document.body.appendChild(ta); ta.value = text; ta.select(); try { ok = document.execCommand('copy'); } catch {} ta.remove(); }
  if (ok) toast(`Copied ${edits.length} change${edits.length === 1 ? '' : 's'} as markdown and JSON.`);
  else { openExport(text); toast('Clipboard blocked. Copy from the box instead.'); }
}
function downloadJson() {
  if (!edits.length) { toast('No edits yet. Double-click any text to start.'); return; }
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const name = `site-edits-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(exportObj(), null, 2)], { type: 'application/json' })), download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Downloaded ${name}.`);
}

/* ---------- undo / revert / clear ---------- */
function undoLast() {
  const u = undo.pop();
  if (!u) { toast('Nothing to undo.'); return; }
  const rec = edits.find((e) => e.id === u.id);
  if (!rec) { saveStore(); return undoLast(); }
  if (rec.kind === 'rotating-titles') { if (u.prev) { rec.afterList = u.prev.afterList; rec.after = rec.afterList.join('\n'); } else edits = edits.filter((e) => e !== rec); }
  else if (u.prev) { rec.after = u.prev.after; rec.afterHtml = u.prev.afterHtml; selfMute(() => applyRec(rec, 'after')); }
  else { edits = edits.filter((e) => e !== rec); selfMute(() => applyRec(rec, 'before')); }
  saveStore(); toast('Undid the last edit.');
}
function revertRec(rec) {
  edits = edits.filter((e) => e !== rec); undo = undo.filter((u) => u.id !== rec.id);
  selfMute(() => applyRec(rec, 'before')); saveStore(); toast('Reverted.');
}
let clearArmed = 0;
function clearAll() {
  const btn = ui.shadow.querySelector('[data-act="clear"]');
  if (!edits.length) { toast('Nothing to clear.'); return; }
  if (!clearArmed || Date.now() - clearArmed > 4000) { clearArmed = Date.now(); btn.textContent = 'Confirm clear?'; setTimeout(() => { if (btn.textContent === 'Confirm clear?') { btn.textContent = 'Clear'; clearArmed = 0; } }, 4000); return; }
  const all = edits.slice(); edits = []; undo = [];
  selfMute(() => all.forEach((r) => applyRec(r, 'before'))); clearArmed = 0; btn.textContent = 'Clear'; saveStore(); toast('Cleared all edits.');
}

/* ---------- UI (shadow DOM so the site css cannot touch it) ---------- */
const ui = {};
const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0}
.bar,.panel,.pop,.toast{font-family:"Jost",system-ui,sans-serif;color:#1B1A18;font-size:14px;line-height:1.4}
.bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#FAF8F4;border-top:1px solid #1B1A18;box-shadow:0 -6px 24px rgba(60,44,28,.12);display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;padding:8px 16px}
.id{display:flex;align-items:center;gap:10px;font:500 11.5px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.dot{width:8px;height:8px;border-radius:50%;background:#A32121;flex:none}
.count{font:400 11.5px/1 ${MONO};letter-spacing:.08em;text-transform:none;color:#6B665E}
.count b{color:#A32121;font-weight:600}
.hint{font:400 11px/1.3 ${MONO};color:#6B665E;letter-spacing:.02em;margin-left:auto;padding-right:4px}
.actions{display:flex;flex-wrap:wrap;gap:6px}
button,.link{font:500 11px/1 ${MONO};letter-spacing:.1em;text-transform:uppercase;background:transparent;color:#1B1A18;border:1px solid #1B1A18;border-radius:999px;padding:9px 13px;cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center}
button:hover,.link:hover{background:#F0EBE4}
button:focus-visible,.link:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid #1B1A18;outline-offset:2px}
button.solid{background:#1B1A18;color:#FAF8F4}
button.solid:hover{background:#3a3733}
.m-only{display:none}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--bar-h,52px) + 12px);z-index:2147483001;background:#1B1A18;color:#FAF8F4;font:400 12px/1.4 ${MONO};padding:9px 14px;border-radius:8px;max-width:min(92vw,560px);box-shadow:0 6px 20px rgba(0,0,0,.25)}
.toast[hidden]{display:none}
.panel{position:fixed;right:16px;bottom:calc(var(--bar-h,52px) + 12px);z-index:2147483000;width:min(460px,calc(100vw - 32px));max-height:min(70vh,640px);display:flex;flex-direction:column;background:#FAF8F4;border:1px solid #1B1A18;border-radius:12px;box-shadow:0 12px 40px rgba(60,44,28,.28)}
.panel[hidden]{display:none}
.ph{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid #DDD5C9}
.ph h2{font:500 12px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase}
.pb{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:12px}
.pg h3{font:500 11.5px/1.3 ${MONO};letter-spacing:.06em;color:#1B1A18;word-break:break-all;margin-bottom:8px}
.pg ul{list-style:none;display:flex;flex-direction:column;gap:10px}
.it{border:1px solid #DDD5C9;border-radius:8px;padding:10px 12px;background:#FFFDF9}
.ctx{font:400 11px/1.3 ${MONO};color:#6B665E;margin-bottom:6px}
.bf,.af{font-size:14px;overflow-wrap:anywhere}
.bf{color:#6B665E;text-decoration:line-through;text-decoration-color:rgba(107,102,94,.5)}
.af{margin-top:2px}
.lbl{font:500 10px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#6B665E;margin-right:6px}
.row{display:flex;flex-wrap:wrap;gap:6px}
.it .row{margin-top:10px}
.it .row button,.it .row .link{padding:7px 11px;font-size:10.5px}
.empty{color:#6B665E;font-size:14px}
details{font-size:13px;color:#4a463f;border-top:1px solid #DDD5C9;padding-top:10px}
summary{cursor:pointer;font:500 11px/1.3 ${MONO};letter-spacing:.1em;text-transform:uppercase}
details ul{margin:8px 0 0 18px;display:block}details li{margin-bottom:4px}
textarea{width:100%;min-height:220px;resize:vertical;font:400 13px/1.5 ${MONO};background:#FFFDF9;color:#1B1A18;border:1px solid #1B1A18;border-radius:8px;padding:10px}
input[type=text]{width:100%;font:400 14px/1.4 "Jost",system-ui,sans-serif;background:#FFFDF9;color:#1B1A18;border:1px solid #1B1A18;border-radius:8px;padding:9px 10px}
label{display:flex;flex-direction:column;gap:6px;font:500 11px/1.3 ${MONO};letter-spacing:.08em;text-transform:uppercase}
.note{font-size:13px;color:#6B665E;text-transform:none;letter-spacing:0;font-family:"Jost",system-ui,sans-serif;font-weight:400}
.pop{position:fixed;z-index:2147483002;width:min(300px,calc(100vw - 16px));background:#FAF8F4;border:1px solid #1B1A18;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 30px rgba(60,44,28,.3)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@media (max-width:760px){
  .bar{padding:8px 12px;gap:6px 10px}
  .hint{display:none}
  .id{gap:8px;font-size:11px}
  .m-only{display:inline-flex}
  .d-only{display:none}
  .id .count .long{display:none}
  .more{margin-left:auto}
  .bar .actions{display:none;width:100%;display:none}
  .bar.open .actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .bar.open .actions button{justify-content:center}
  .panel{left:8px;right:8px;width:auto;max-height:62vh}
}
`;
function buildUi() {
  const host = el('div', { id: 'cm-edit-root' });
  const shadow = host.attachShadow({ mode: 'open' });
  const tbtn = (act, label, cls = '', extra = {}) => el('button', { type: 'button', 'data-act': act, class: cls, ...extra }, label);
  const hasRot = !!document.querySelector('.hx-rot[data-titles]');
  const bar = el('div', { class: 'bar', role: 'region', 'aria-label': 'Edit mode toolbar' },
    el('div', { class: 'id' }, el('span', { class: 'dot', 'aria-hidden': 'true' }), el('strong', { text: 'Edit mode' }),
      el('span', { class: 'count' }, el('b', { 'data-n': '' , text: '0' }), el('span', { class: 'long', 'data-label': '', text: ' pending edits' }))),
    el('p', { class: 'hint', text: 'Double-click text to edit. Enter saves, Esc cancels.' }),
    tbtn('copy', 'Copy changes', 'solid m-only', { 'aria-label': 'Copy changes' }),
    tbtn('more', 'Actions', 'm-only more', { 'aria-expanded': 'false', 'aria-controls': 'cm-actions' }),
    el('div', { class: 'actions', id: 'cm-actions' },
      tbtn('copy', 'Copy changes', 'solid d-only', { title: 'Cmd/Ctrl+Shift+C' }),
      tbtn('download', 'Download .json'),
      tbtn('review', 'Review list', '', { 'aria-haspopup': 'dialog' }),
      hasRot ? tbtn('titles', 'Rotating titles', '', { 'aria-haspopup': 'dialog' }) : null,
      tbtn('undo', 'Undo last'),
      tbtn('clear', 'Clear'),
      tbtn('exit', 'Exit')),
  );
  const toastEl = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite', hidden: '' });
  const panel = el('div', { class: 'panel', role: 'dialog', 'aria-label': 'Edit panel', hidden: '' });
  shadow.append(el('style', { text: CSS }), bar, toastEl, panel);
  ui.host = host; ui.shadow = shadow; ui.bar = bar; ui.toast = toastEl; ui.panel = panel;
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.act;
    if (a !== 'clear') { const c = shadow.querySelector('[data-act="clear"]'); c.textContent = 'Clear'; clearArmed = 0; }
    if (a === 'copy') copyChanges();
    else if (a === 'download') downloadJson();
    else if (a === 'review') openReview(b);
    else if (a === 'titles') openTitles(b);
    else if (a === 'undo') undoLast();
    else if (a === 'clear') clearAll();
    else if (a === 'exit') exitMode();
    else if (a === 'more') { const o = bar.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); b.textContent = o ? 'Close' : 'Actions'; sizeBar(); }
    if (a !== 'more' && a !== 'review' && a !== 'titles' && bar.classList.contains('open')) { bar.classList.remove('open'); const m = bar.querySelector('[data-act="more"]'); m.setAttribute('aria-expanded', 'false'); m.textContent = 'Actions'; sizeBar(); }
  });
  document.body.appendChild(host);
  const ro = new ResizeObserver(sizeBar); ro.observe(bar); ui.ro = ro;
  sizeBar();
}
function sizeBar() {
  const h = Math.ceil(ui.bar.getBoundingClientRect().height);
  ui.host.style.setProperty('--bar-h', h + 'px');
  [ui.bar, ui.toast, ui.panel].forEach((n) => n.style.setProperty('--bar-h', h + 'px'));
  document.body.style.paddingBottom = h + 'px';
}
let toastTimer = 0;
function toast(msg, ms = 3800) { if (!ui.toast) return; ui.toast.textContent = msg; ui.toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (ui.toast.hidden = true), ms); }
function refreshUi() {
  if (!ui.shadow) return;
  const n = edits.length;
  ui.shadow.querySelector('[data-n]').textContent = String(n);
  ui.shadow.querySelector('[data-label]').textContent = n === 1 ? ' pending edit' : ' pending edits';
  ui.shadow.querySelectorAll('[data-act="undo"],[data-act="clear"]').forEach((b) => b.setAttribute('aria-disabled', String(!n)));
  if (panelKind === 'review') renderReview();
}

/* ---------- panels ---------- */
let panelKind = null, panelOpener = null;
function closePanels() { if (svgPop) { svgPop.remove(); svgPop = null; } if (ui.panel && !ui.panel.hidden) { ui.panel.hidden = true; ui.panel.replaceChildren(); const o = panelOpener; panelKind = null; panelOpener = null; if (o && o.isConnected) o.focus(); } }
function openPanel(kind, title, opener) {
  closePanels();
  panelKind = kind; panelOpener = opener || null;
  const close = el('button', { type: 'button', 'aria-label': 'Close panel', onclick: closePanels }, 'Close');
  const body = el('div', { class: 'pb' });
  ui.panel.replaceChildren(el('div', { class: 'ph' }, el('h2', { text: title }), close), body);
  ui.panel.setAttribute('aria-label', title);
  ui.panel.hidden = false;
  return { body, close };
}
let reviewBody = null;
function openReview(opener) { const { body, close } = openPanel('review', 'Review list', opener); reviewBody = body; renderReview(); close.focus(); }
function renderReview() {
  if (!reviewBody) return;
  reviewBody.replaceChildren();
  if (!edits.length) reviewBody.append(el('p', { class: 'empty', text: 'No edits yet. Double-click any text on the page to change it.' }));
  sortedPages().forEach(([p, list]) => {
    const ul = el('ul');
    list.forEach((e) => {
      const here = e.page === pagePath();
      const go = el('a', { class: 'link', href: e.page, 'data-jump': e.id }, 'Go to');
      go.addEventListener('click', (ev) => {
        if (here) { ev.preventDefault(); jumpTo(e); }
        else sessionStorage.setItem(JUMP_KEY, e.id);
      });
      const li = el('li', { class: 'it' },
        el('p', { class: 'ctx', text: e.context ? `near: ${e.context}` : 'near: top of page' }),
        e.kind === 'rotating-titles'
          ? el('p', { class: 'af' }, el('span', { class: 'lbl', text: 'Titles' }), `${e.beforeList.length} before, ${e.afterList.length} after`)
          : el('div', {}, el('p', { class: 'bf' }, el('span', { class: 'lbl', text: 'Before' }), e.before), el('p', { class: 'af' }, el('span', { class: 'lbl', text: 'After' }), e.after)),
        el('div', { class: 'row' }, el('button', { type: 'button', onclick: () => revertRec(e) }, 'Revert'), go));
      ul.append(li);
    });
    reviewBody.append(el('section', { class: 'pg' }, el('h3', { text: `${p} (${list.length})` }), ul));
  });
  const d = el('details', {}, el('summary', { text: 'Not editable here' }),
    el('ul', {},
      ...['The logo and the Pause, Play and Menu buttons',
        'The rotating hero line (use the Rotating titles button)',
        'Image alt text, page title and meta description',
        'Text baked into images and video',
        'Text drawn by CSS (numbers and arrows)',
        'Labels that a script changes while the page runs'].map((t) => el('li', { text: t }))));
  reviewBody.append(d);
}
function jumpTo(rec) {
  closePanels();
  const n = rec.kind === 'rotating-titles' ? document.querySelector('.hx-rot') : locate(rec);
  if (!n) { toast('Could not find that element on this page.'); return; }
  n.scrollIntoView({ block: 'center', behavior: 'smooth' });
  n.classList.add('cm-flash'); setTimeout(() => n.classList.remove('cm-flash'), 1800);
}
function openExport(text) {
  const { body, close } = openPanel('export', 'Copy manually');
  const ta = el('textarea', { readonly: '', 'aria-label': 'Exported changes' }); ta.value = text;
  body.append(el('p', { class: 'empty', text: 'Select all and copy this text, then send it to Job Buddy.' }), ta);
  close.focus(); ta.focus(); ta.select();
}

/* ---------- rotating titles panel ---------- */
const origTitles = (() => { try { return JSON.parse(document.querySelector('.hx-rot[data-titles]').dataset.titles).map(([a, r]) => norm(a + ' ' + r)); } catch { return null; } })();
function openTitles(opener) {
  if (!origTitles) return;
  const { body, close } = openPanel('titles', 'Rotating titles', opener);
  const rec = edits.find((e) => e.id === '/|rotating-titles' && e.page === pagePath());
  const ta = el('textarea', { 'aria-label': 'Rotating titles, one per line' }); ta.value = (rec ? rec.afterList : origTitles).join('\n');
  const staticEl = document.querySelector('.hx-st .hx-u');
  const sInput = staticEl ? el('input', { type: 'text', 'aria-label': 'Static headline line', value: textOf(staticEl) }) : null;
  const count = el('p', { class: 'note' });
  const upd = () => { const n = ta.value.split('\n').map(norm).filter(Boolean).length; count.textContent = `${n} title${n === 1 ? '' : 's'}. One per line, in the order they rotate. Start each with a or an.`; };
  ta.addEventListener('input', upd); upd();
  const save = () => {
    const list = ta.value.split('\n').map(norm).filter(Boolean);
    if (list.length < 2) { toast('Keep at least two titles.'); return; }
    const same = list.length === origTitles.length && list.every((t, i) => t === origTitles[i]);
    const id = '/|rotating-titles';
    const ex = edits.find((e) => e.id === id);
    if (same) { if (ex) { edits = edits.filter((e) => e !== ex); undo = undo.filter((u) => u.id !== id); } }
    else if (ex) { undo.push({ id, prev: { afterList: ex.afterList } }); ex.afterList = list; ex.after = list.join('\n'); ex.timestamp = new Date().toISOString(); }
    else { undo.push({ id, prev: null }); edits.push({ id, page: '/', key: '.hx-rot', selector: 'h1#h .hx-rot[data-titles] (const titles in src/pages/index.astro)', kind: 'rotating-titles', before: origTitles.join('\n'), after: list.join('\n'), beforeList: origTitles, afterList: list, context: 'Hero headline', timestamp: new Date().toISOString() }); }
    if (sInput && staticEl) {
      const v = norm(sInput.value), st = textOf(staticEl);
      if (v && v !== st) { selfMute(() => { const bh = staticEl.innerHTML; staticEl.textContent = v; recordText(staticEl, st, bh, v, staticEl.innerHTML, 'text'); }); }
    }
    saveStore(); closePanels();
    toast(same && !ex ? 'No change to the titles.' : 'Saved. The live rotation keeps the old list; the new one goes in the export.');
  };
  body.append(
    el('label', {}, 'One title per line', ta),
    count,
    ...(sInput ? [el('label', {}, 'Static headline line', sInput, el('span', { class: 'note', text: 'Shown to visitors with reduced motion or without scripts. Reads as: I’m a ...' }))] : []),
    el('div', { class: 'it row' }, el('button', { type: 'button', class: 'solid', onclick: save }, 'Save titles'),
      el('button', { type: 'button', onclick: () => { ta.value = origTitles.join('\n'); upd(); } }, 'Reset list'),
      el('button', { type: 'button', onclick: closePanels }, 'Cancel')));
  ta.focus(); ta.setSelectionRange(0, 0); ta.scrollTop = 0;
}

/* ---------- pointer and keyboard handling ---------- */
let hoverBox = null;
function clearHover() { if (hoverEl) { hoverEl.classList.remove('cm-hover'); hoverEl = null; } if (hoverBox) hoverBox.hidden = true; }
function showBox(tn) {
  if (!hoverBox) { hoverBox = el('div', { id: 'cm-hover-box', 'aria-hidden': 'true' }); hoverBox.style.cssText = 'position:fixed;pointer-events:none;z-index:2147482000;border:1px dashed rgba(27,26,24,.6);border-radius:2px'; document.body.appendChild(hoverBox); }
  const r = document.createRange(); r.selectNodeContents(tn); const b = r.getBoundingClientRect();
  Object.assign(hoverBox.style, { left: b.left - 3 + 'px', top: b.top - 3 + 'px', width: b.width + 6 + 'px', height: b.height + 6 + 'px' }); hoverBox.hidden = false;
}
document.addEventListener('mouseover', (e) => {
  if (editing || inUi(e.target) || !(e.target instanceof Element)) { clearHover(); return; }
  const t = e.target;
  const svgT = t.closest('svg') && t.closest('text,tspan');
  let h = null, tn = null;
  if (svgT) { const r = resolve(svgT); h = r.host || null; }
  else if (hasOwnText(t) || (isInline(t) && t.textContent.trim())) {
    const r = resolve(t); h = r.host || null;
    if (r.textNode) { const c = caretFrom(e.clientX, e.clientY); tn = c && c.node && c.node.nodeType === 3 && c.node.parentElement === t ? c.node : r.textNode; }
  }
  if (h === hoverEl && !tn) { if (hoverBox) hoverBox.hidden = true; return; }
  clearHover();
  if (h) { hoverEl = h; h.classList.add('cm-hover'); } else if (tn) showBox(tn);
}, true);
document.addEventListener('mouseleave', clearHover);
addEventListener('scroll', () => { if (hoverBox) hoverBox.hidden = true; }, { passive: true });

function onDouble(x, y, target, ev) {
  if (!(target instanceof Element) || inUi(target)) return;
  if (editing && editing.host.contains(target)) return; // let the browser select a word while editing
  if (!ev ? false : Date.now() - touchDoubleAt < 700) return; // a native dblclick that follows a touch double-tap
  cancelPending();
  suppressClickUntil = Date.now() + 700;
  const { e: at, caret } = elementAtPoint(x, y, target);
  const r = resolve(at, caret && caret.node);
  if (r.textNode) { if (ev && ev.preventDefault) ev.preventDefault(); const w = wrapTextNode(r.textNode); startEdit(w, caret && caret.node === r.textNode ? { node: r.textNode, offset: caret.offset } : null, true); return; }
  if (r.host) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (r.svg) { getSelection().removeAllRanges(); editSvgText(r.host); }
    else startEdit(r.host, caret);
  } else if (r.reason && target.closest('main, header, footer, body') && hasLetters(at.textContent || '')) toast('Not editable here: ' + r.reason);
}
document.addEventListener('dblclick', (e) => onDouble(e.clientX, e.clientY, e.target, e), true);
let lastTap = { t: 0, x: 0, y: 0 };
document.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'touch' || inUi(e.target)) return;
  const now = Date.now();
  if (now - lastTap.t < 380 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 28) { lastTap.t = 0; onDouble(e.clientX, e.clientY, e.target, null); touchDoubleAt = Date.now(); }
  else lastTap = { t: now, x: e.clientX, y: e.clientY };
}, true);

function cancelPending() { if (pending) { clearTimeout(pending.timer); pending = null; } }
/* Single click on a link or button waits a moment (so a double-click can edit instead of navigating), then goes through.
   Alt, Cmd, Ctrl or Shift clicks go through immediately. */
document.addEventListener('click', (e) => {
  if (passThrough || inUi(e.target) || !(e.target instanceof Element)) return;
  if (editing && editing.host.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  const a = e.target.closest('a[href], button, summary, [role="button"], [data-embed]');
  if (!a) return;
  if (Date.now() < suppressClickUntil || e.detail >= 2) { e.preventDefault(); e.stopImmediatePropagation(); cancelPending(); return; }
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault(); e.stopImmediatePropagation(); cancelPending();
  pending = { timer: setTimeout(() => { pending = null; passThrough = true; try { a.click(); } finally { passThrough = false; } }, DELAY) };
}, true);

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); copyChanges(); return; }
  if (e.key === 'Escape' && !editing && (panelKind || svgPop)) { closePanels(); }
}, true);
addEventListener('storage', (e) => { if (e.key === LS_KEY || e.key === UNDO_KEY) { loadStore(); applyAllForPage(); refreshUi(); } });
addEventListener('beforeunload', () => { if (editing) finish(true); });

/* ---------- lifecycle ---------- */
function exitMode() {
  if (editing) finish(true);
  try { sessionStorage.removeItem(SS_KEY); } catch {}
  location.reload();
}
function init() {
  try { const u = new URL(location.href); let ch = false; if (u.searchParams.has('edit')) { u.searchParams.delete('edit'); ch = true; } if (u.hash === '#edit') { u.hash = ''; ch = true; } if (ch) history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
  document.documentElement.setAttribute('data-cm-edit', '');
  buildUi();
  applyAllForPage();
  mo.observe(document.body, { childList: true, characterData: true, subtree: true });
  addEventListener('load', () => { selfMute(applyAllForPage); }, { once: true });
  refreshUi();
  const jump = sessionStorage.getItem(JUMP_KEY);
  if (jump) { sessionStorage.removeItem(JUMP_KEY); const rec = edits.find((e) => e.id === jump); if (rec) setTimeout(() => jumpTo(rec), 350); }
  if (!sessionStorage.getItem(HINT_KEY)) { sessionStorage.setItem(HINT_KEY, '1'); toast('Edit mode on. Double-click text to edit (double-tap on touch). Single click still follows links.', 6000); }
}
window.__cmEdit = { get edits() { return edits; }, exportMarkdown, exportObj, resolve, version: 1 };
init();
})();
}
