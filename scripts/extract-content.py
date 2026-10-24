#!/usr/bin/env python3
"""One-time content port from the Adobe Portfolio export -> src/data/pages.json.

Usage: python3 scripts/extract-content.py [EXPORT_DIR]
EXPORT_DIR defaults to ../site-export (the folder with manifest.json + pages/*.html).
Walks each saved page's modules in document order (same walk as the export's
extract.py, so image indices line up with manifest.json) and keeps text as
lightly-sanitised HTML (paragraphs, sub-titles, links, bold, line breaks).
Requires: beautifulsoup4.
"""
import json, os, re, sys, html, urllib.parse
from bs4 import BeautifulSoup, NavigableString, Tag

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EXPORT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'site-export'))
man = json.load(open(os.path.join(EXPORT, 'manifest.json')))
pages_by_slug = {p['slug']: p for p in man['pages']}

def esc(s):
    return html.escape(s, quote=False)

def inline(node):
    """Inline HTML for a leaf block: keep links, bold (font-weight>=600), br."""
    out = []
    for ch in node.children:
        if isinstance(ch, NavigableString):
            out.append(esc(str(ch)))
            continue
        if not isinstance(ch, Tag):
            continue
        if ch.name == 'br':
            out.append('<br>')
        elif ch.name == 'a' and ch.get('href'):
            href = ch['href'].strip()
            if href.startswith('www.'):
                href = 'https://' + href
            ext = href.startswith('http')
            attrs = f' href="{html.escape(href)}"' + (' rel="noopener" target="_blank"' if ext else '')
            out.append(f'<a{attrs}>{inline(ch)}</a>')
        elif ch.name in ('b', 'strong') or re.search(r'font-weight:\s*(6|7|8)00', ch.get('style', '')):
            inner = inline(ch)
            out.append(f'<strong>{inner}</strong>' if inner.strip() else inner)
        elif ch.name in ('i', 'em'):
            out.append(f'<em>{inline(ch)}</em>')
        else:
            out.append(inline(ch))
    return ''.join(out)

BLOCK = ('div', 'p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li')

def blocks(node, acc):
    for ch in node.children:
        if isinstance(ch, NavigableString):
            if str(ch).strip():
                acc.append(('p', esc(str(ch).strip())))
            continue
        if not isinstance(ch, Tag):
            continue
        if ch.name in BLOCK and ch.find(BLOCK):
            # mixed container: emit its own inline runs then recurse
            run = []
            for g in ch.children:
                if isinstance(g, Tag) and (g.name in BLOCK):
                    if run:
                        t = ''.join(run).strip()
                        if re.sub(r'<br>|\s|&nbsp;', '', t):
                            acc.append(('p', t))
                        run = []
                    blocks(BeautifulSoup(f'<x>{g}</x>', 'html.parser').x, acc)
                else:
                    frag = BeautifulSoup(f'<x>{g}</x>', 'html.parser').x
                    run.append(inline(frag))
            if run:
                t = ''.join(run).strip()
                if re.sub(r'<br>|\s|&nbsp;', '', t):
                    acc.append(('p', t))
            continue
        cls = ch.get('class') or []
        t = inline(ch).strip()
        t = re.sub(r'(<br>\s*)+$', '', t)
        if not re.sub(r'<[^>]+>|\s|\xa0', '', t):
            continue
        kind = 'p'
        if 'title' in cls:
            kind = 'h2'
        elif 'sub-title' in cls:
            kind = 'h3'
        elif t.startswith('<strong>') and t.endswith('</strong>') and t.count('<strong>') == 1 and len(re.sub('<[^>]+>', '', t)) < 40:
            kind = 'h3'
            t = t[len('<strong>'):-len('</strong>')]
        acc.append((kind, t))

def rich_html(rt):
    acc = []
    blocks(rt, acc)
    # turn runs of 3+ short plain paragraphs into a list
    out, i = [], 0
    while i < len(acc):
        j = i
        while j < len(acc) and acc[j][0] == 'p' and len(re.sub('<[^>]+>', '', acc[j][1])) < 40 and '<a' not in acc[j][1]:
            j += 1
        if j - i >= 3:
            out.append('<ul class="taglist">' + ''.join(f'<li>{x[1]}</li>' for x in acc[i:j]) + '</ul>')
            i = j
            continue
        k, t = acc[i]
        out.append(f'<{k}>{t}</{k}>')
        i += 1
    h = ''.join(out).replace('\xa0', ' ')
    h = re.sub(r' {2,}', ' ', h)
    return h

def img_key(f):
    return os.path.splitext(f.split('images/', 1)[1])[0]  # e.g. wedding-photography/01-106b2676

def run(slug):
    m = pages_by_slug[slug]
    soup = BeautifulSoup(open(os.path.join(EXPORT, 'pages', f'{slug}.html')).read(), 'html.parser')
    main = soup.find('main')
    imgs = m['images']; embeds = m['embeds']
    ic = [0]; ec = [0]
    out = []
    covers = []

    def take_img(layout, caption=None, w=None, h=None):
        im = imgs[ic[0]]; ic[0] += 1
        item = {'id': img_key(im['file']), 'src': im['file'], 'alt': im.get('alt') or '', 'caption': caption}
        if out and out[-1]['t'] == 'images' and out[-1]['layout'] == layout and not caption and not out[-1].get('captioned'):
            out[-1]['items'].append(item)
        else:
            out.append({'t': 'images', 'layout': layout, 'items': [item], 'captioned': bool(caption)})

    def walk(node):
        for el in node.children:
            if not isinstance(el, Tag):
                continue
            cls = el.get('class') or []
            if el.name == 'header' and 'page-header' in cls:
                continue
            if 'project-covers' in cls:
                for a in el.find_all('a', class_='project-cover'):
                    t = a.find(class_='title'); tt = t.get_text(strip=True) if t else ''
                    img = a.find('img'); entry = {'title': tt, 'href': a['href'], 'image': None}
                    if img is not None:
                        im = imgs[ic[0]]; ic[0] += 1
                        entry['image'] = {'id': img_key(im['file']), 'src': im['file'], 'alt': ''}
                    covers.append(entry)
                continue
            if 'project-module' in cls and 'module' in cls:
                if 'tree' in cls:
                    walk(el.find(class_='tree-wrapper') or el)
                elif 'text' in cls:
                    h = rich_html(el.find(class_='rich-text'))
                    if h:
                        out.append({'t': 'html', 'html': h})
                elif 'image' in cls:
                    cap = el.find(class_='module-caption')
                    take_img('single', cap.get_text(' ', strip=True) if cap else None)
                elif 'media_collection' in cls:
                    for it in el.find_all(class_='js-grid-item-container'):
                        take_img('grid', None, it.get('data-width'), it.get('data-height'))
                    if out and out[-1]['t'] == 'images':
                        out[-1]['captioned'] = True  # end of this grid module
                elif 'embed' in cls or 'video' in cls or 'audio' in cls:
                    ifr = el.find('iframe')
                    src = (ifr.get('src') or ifr.get('data-src')) if ifr else None
                    if not src:
                        v = el.find(['video', 'source', 'audio']); src = v.get('src') if v else None
                    cap = el.find(class_='module-caption')
                    if src:
                        e = embeds[ec[0]]; ec[0] += 1
                        dims = el.find(class_='embed-aspect-ratio')
                        ratio = None
                        if dims and 'padding-bottom' in dims.get('style', ''):
                            mm = re.search(r'padding-bottom:\s*([\d.]+)%', dims['style'])
                            ratio = float(mm.group(1)) if mm else None
                        mw = el.find(class_='embed-dimensions')
                        maxw = None
                        if mw:
                            mm = re.search(r'max-width:\s*(\d+)px', mw.get('style', ''))
                            maxw = int(mm.group(1)) if mm else None
                        blk = {'t': 'embed', 'kind': e['type'].split(' ')[0], 'embed': html.unescape(e['embed_url']),
                               'watch': e.get('watch_url'), 'title': e.get('title'),
                               'caption': cap.get_text(' ', strip=True) if cap else None, 'ratio': ratio, 'maxWidth': maxw}
                        if e.get('local_file'):
                            blk = {'t': 'video', 'src': e['local_file'], 'poster': e.get('poster_file'),
                                   'caption': blk['caption'], 'title': e.get('title')}
                        out.append(blk)
                elif 'button' in cls:
                    a = el.find('a')
                    out.append({'t': 'button', 'text': a.get_text(strip=True), 'href': a['href']})
                continue
            walk(el)
    walk(main)
    assert ic[0] == len(imgs), (slug, ic[0], len(imgs))
    assert ec[0] == len(embeds), (slug, ec[0], len(embeds))
    for b in out:
        b.pop('captioned', None)
    return {'slug': slug, 'title': m['title'], 'navLabel': m.get('nav_label') or m['title'],
            'category': m['category'], 'type': 'gallery' if m.get('is_category_landing') else 'project',
            'oldTitle': m.get('html_title'), 'blocks': out, 'covers': covers}

menu = man['site']['menu']
cat_slug = {c['title']: c['slug'] for c in menu}
pages = []
for p in man['pages']:
    r = run(p['slug'])
    r['categorySlug'] = cat_slug.get(r['category'])
    pages.append(r)
json.dump({'menu': menu, 'pages': pages}, open(os.path.join(ROOT, 'src', 'data', 'pages.json'), 'w'), indent=1, ensure_ascii=False)
print('pages', len(pages), 'images', sum(len(b['items']) for p in pages for b in p['blocks'] if b['t'] == 'images') + sum(1 for p in pages for c in p['covers'] if c['image']))
