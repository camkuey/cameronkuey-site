#!/usr/bin/env python3
"""Apply copy edits exported from the site's edit mode (?edit) to the source files.

Usage:
  python3 scripts/apply-edits.py EDITS.json [--dry-run] [--root DIR] [--report out.json]

EDITS can be the downloaded .json, or the markdown that "Copy changes" puts on the clipboard
(the last fenced ```json block is used).

For every edit it searches the BEFORE text in src/**/*.astro, src/data/*.ts, src/data/*.json
(plus src/lib/*.ts, where the site-wide strings live):
  1. exact match,
  2. flexible match: whitespace, HTML entities (&amp; &nbsp; &rsquo; ...), curly vs straight quotes,
     \\uXXXX and backslash-escaped quotes inside JSON/TS strings,
  3. markup-tolerant match (text that spans <em>, <strong>, <br>, <a>...): reported only, never applied.
Status per edit:
  applied    exactly one whole-string match, replaced (or would be, with --dry-run)
  ambiguous  more than one match: files and lines are listed, nothing is touched
  manual     found only inside a longer string or across markup: location listed, nothing is touched
  not found  no match (the text may be built by code, or may already be applied)
Files are only written when an edit has exactly one match. Nothing is written with --dry-run.
"""
import argparse, glob, html.entities, json, os, re, sys

# ---------------------------------------------------------------- input
def load_edits(path):
    raw = open(path, encoding='utf-8').read()
    data = None
    try:
        data = json.loads(raw)
    except ValueError:
        blocks = re.findall(r"```json\s*\n(.*?)\n```", raw, re.S)
        if not blocks:
            sys.exit(f'{path}: not JSON and no fenced ```json block found')
        data = json.loads(blocks[-1])
    edits = data['edits'] if isinstance(data, dict) else data
    if not isinstance(edits, list):
        sys.exit('expected a list of edits')
    return edits

# ---------------------------------------------------------------- matching
def norm(s):
    return re.sub(r'[\s\u00a0]+', ' ', s).strip()

APOS = "'\u2019\u2018\u02bc"
DQ = '"\u201c\u201d'
def variants(c):
    """Alternatives for one character as it may appear in source."""
    alts = [re.escape(c)]
    cp = ord(c)
    if c in APOS:
        alts = [re.escape(x) for x in "'\u2019\u2018"] + ['&#39;', '&#x27;', '&apos;', '&rsquo;', '&lsquo;', '&#8217;', '&#x2019;', "\\\\'", r'\\u2019', r'\\u2018']
    elif c in DQ:
        alts = [re.escape(x) for x in '"\u201c\u201d'] + ['&quot;', '&ldquo;', '&rdquo;', '&#34;', '&#x22;', r'\\"', r'\\u201[cCdD]']
    elif c == '&':
        alts = ['&amp;', '&', '&#38;', '&#x26;']
    elif c == '<':
        alts = ['&lt;', '<']
    elif c == '>':
        alts = ['&gt;', '>']
    elif c == '/':
        alts = ['/', r'\\/']
    elif cp > 127:
        name = html.entities.codepoint2name.get(cp)
        if name: alts.append('&' + name + ';')
        alts += ['&#%d;' % cp, '&#x%x;' % cp, '&#X%X;' % cp]
        if cp < 0x10000: alts += [r'\\u%04x' % cp, r'\\u%04X' % cp]
    return '(?:' + '|'.join(dict.fromkeys(alts)) + ')'

def build(before, tags):
    ws = r'(?:\s|&nbsp;|&#160;|&#xa0;|\u00a0' + (r'|<[^>]*>' if tags else '') + r')+'
    gap = r'(?:<[^>]*>)*' if tags else ''
    parts = []
    for ch in before:
        parts.append(ws if ch == ' ' else variants(ch))
    return re.compile((gap).join(parts), re.S)

def flexible(before):  return build(before, False)
def tolerant(before):  return build(before, True)

PRE_OK = set(">'\"`}") 
POST_OK = set("<'\"`{")
def whole(text, s, e):
    i = s - 1
    while i >= 0 and text[i] in ' \t\r\n': i -= 1
    j = e
    while j < len(text) and text[j] in ' \t\r\n': j += 1
    pre = text[i] if i >= 0 else ''
    post = text[j] if j < len(text) else ''
    return (pre == '' or pre in PRE_OK) and (post == '' or post in POST_OK)

def lineno(text, pos):
    return text.count('\n', 0, pos) + 1

def find_all(text, pattern):
    if isinstance(pattern, str):
        out, i = [], 0
        while True:
            k = text.find(pattern, i)
            if k < 0: break
            out.append((k, k + len(pattern))); i = k + max(1, len(pattern))
        return out
    return [(m.start(), m.end()) for m in pattern.finditer(text)]

# ---------------------------------------------------------------- encoding the AFTER text
def frontmatter_end(text):
    if text.startswith('---'):
        m = re.search(r'\n---[ \t]*\n', text)
        if m: return m.end()
    return 0

def encode_after(after, path, text, s, e):
    """Write AFTER the way the source around the match writes strings."""
    ext = os.path.splitext(path)[1]
    matched = text[s:e]
    uses_entities = bool(re.search(r'&(?:amp|lt|gt|quot|#38|#x26);', matched))
    i = s - 1
    pre_ch = text[i] if i >= 0 else ''
    post_ch = text[e] if e < len(text) else ''
    quoted = pre_ch in '\'"`' and pre_ch == post_ch
    in_front = ext == '.astro' and s < frontmatter_end(text)
    def html_text(v):
        v = v.replace('<', '&lt;')
        if uses_entities: v = v.replace('&', '&amp;')
        if ext == '.astro': v = v.replace('{', '&#123;').replace('}', '&#125;')
        return v
    if ext == '.json':
        if quoted and pre_ch == '"':
            inner = after
            # a JSON string that holds markup (or entities) is html; a plain string is not
            if uses_entities: inner = inner.replace('&', '&amp;').replace('<', '&lt;')
            return json.dumps(inner, ensure_ascii=False)[1:-1]
        return json.dumps(html_text(after), ensure_ascii=False)[1:-1]   # html text inside a longer JSON string
    if quoted:
        is_attr = pre_ch == '"' and ext == '.astro' and not in_front and i > 0 and text[i - 1] == '='
        if is_attr:
            v = after.replace('"', '&quot;')
            return v.replace('&', '&amp;') if uses_entities else v
        v = after.replace('\\', '\\\\').replace(pre_ch, '\\' + pre_ch).replace('\n', ' ')
        if pre_ch == '`': v = v.replace('${', '\\${')
        return v
    if ext == '.astro':
        return html_text(after)
    return after.replace('\\', '\\\\')

# ---------------------------------------------------------------- the search
def source_files(root):
    pats = ['src/**/*.astro', 'src/data/*.ts', 'src/data/*.json', 'src/lib/*.ts']
    seen, out = set(), []
    for p in pats:
        for f in sorted(glob.glob(os.path.join(root, p), recursive=True)):
            if f not in seen: seen.add(f); out.append(f)
    return out

def page_hint(root, page):
    cands = []
    if page == '/': cands.append('src/pages/index.astro')
    else:
        cands.append('src/pages' + page + '.astro')
        if page.count('/') == 1: cands.append('src/pages/[slug].astro')
    return {os.path.join(root, c) for c in cands}

def classify(files, texts, before):
    """Return (tier, [(file, s, e, is_whole)]) for the first tier that has any whole-string hit; else best partials."""
    jb = json.dumps(before, ensure_ascii=False)[1:-1]
    tiers = [('exact', lambda f: [before] + ([jb] if f.endswith('.json') and jb != before else [])),
             ('flexible', lambda f: [flexible(before)]),
             ('markup-tolerant', lambda f: [tolerant(before)])]
    partial_any = None
    for name, mk in tiers:
        hits = []
        for f in files:
            seen = set()
            for pat in mk(f):
                for s, e in find_all(texts[f], pat):
                    if (s, e) in seen: continue
                    seen.add((s, e))
                    hits.append((f, s, e, whole(texts[f], s, e)))
        wholes = [h for h in hits if h[3]]
        if wholes: return name, wholes
        if hits and partial_any is None: partial_any = (name, hits)
    return (partial_any or (None, []))

def loc(root, texts, h):
    f, s, e = h[0], h[1], h[2]
    ln = lineno(texts[f], s)
    line = texts[f].splitlines()[ln - 1].strip()
    return f'{os.path.relpath(f, root)}:{ln}', (line[:110] + ('...' if len(line) > 110 else ''))

# ---------------------------------------------------------------- rotating hero titles
def apply_titles(root, texts, edit, dry):
    before, after = edit.get('beforeList') or [], edit.get('afterList') or []
    cands = [f for f in texts if f.endswith('.astro') and re.search(r'const titles = \[', texts[f])]
    if len(cands) != 1:
        return 'not found', f'expected exactly one "const titles = [...]" in an .astro file, found {len(cands)}', None
    f = cands[0]; t = texts[f]
    m = re.search(r"const titles = \[(.*?)\];", t, re.S)
    cur = [norm(x.replace("\\'", "'")) for x in re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))]
    if cur != [norm(x) for x in before]:
        if cur == [norm(x) for x in after]: return 'not found', f'titles in {os.path.relpath(f, root)} already match the new list (already applied?)', None
        return 'not found', f'the titles in {os.path.relpath(f, root)} differ from the exported BEFORE list ({len(cur)} in source vs {len(before)} exported)', None
    body = ', '.join("'" + x.replace('\\', '\\\\').replace("'", "\\'") + "'" for x in after)
    new = t[:m.start()] + f'const titles = [{body}];' + t[m.end():]
    ln = lineno(t, m.start())
    texts[f] = new
    return 'applied', f'{os.path.relpath(f, root)}:{ln} ({len(before)} -> {len(after)} titles)', (f, new)

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description='Apply exported copy edits to the Astro source.')
    ap.add_argument('edits', help='exported .json (or the markdown block copied from edit mode)')
    ap.add_argument('--root', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'), help='project root (default: parent of scripts/)')
    ap.add_argument('--dry-run', action='store_true', help='report only, write nothing')
    ap.add_argument('--report', help='also write a JSON report to this path')
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    edits = load_edits(a.edits)
    files = source_files(root)
    if not files: sys.exit(f'no source files under {root}/src')
    orig = {f: open(f, encoding='utf-8').read() for f in files}
    texts = dict(orig)
    report, counts = [], {'applied': 0, 'ambiguous': 0, 'manual': 0, 'not found': 0, 'skipped': 0}
    for n, ed in enumerate(edits, 1):
        before, after = norm(ed.get('before', '')), norm(ed.get('after', ''))
        tag = f"[{n}/{len(edits)}] {ed.get('page', '?')}"
        entry = {'n': n, 'page': ed.get('page'), 'before': ed.get('before'), 'after': ed.get('after')}
        if ed.get('kind') == 'rotating-titles':
            status, detail, _ = apply_titles(root, texts, ed, a.dry_run)
            counts[status] += 1; entry.update(status=status, detail=detail)
            print(f"{status.upper():9} {tag} rotating hero titles: {detail}")
            report.append(entry); continue
        if not before or before == after:
            counts['skipped'] += 1; entry.update(status='skipped', detail='empty or unchanged'); report.append(entry)
            print(f"SKIPPED   {tag} nothing to change"); continue
        tier, hits = classify(files, texts, before)
        show = lambda s: (s if len(s) <= 90 else s[:87] + '...')
        head = f"{tag} {json.dumps(show(before), ensure_ascii=False)} -> {json.dumps(show(after), ensure_ascii=False)}"
        likely = page_hint(root, ed.get('page', ''))
        if not hits:
            hit_after = [h for h in classify(files, texts, after)[1] if h[3]] if after else []
            note = ''
            if hit_after:
                l, _ = loc(root, texts, hit_after[0]); note = f' The AFTER text is already present at {l} (already applied?).'
            counts['not found'] += 1; entry.update(status='not found', detail=note.strip())
            print(f"NOT FOUND {head}\n          The text is not in src/ as written (it may be built by code, or contain markup).{note}")
        elif tier == 'markup-tolerant' or not any(h[3] for h in hits):
            counts['manual'] += 1
            locs = [loc(root, texts, h) for h in hits]
            entry.update(status='manual', tier=tier, locations=[l for l, _ in locs])
            why = 'spans markup (<em>, <a>, <br>...)' if tier == 'markup-tolerant' else 'only found inside a longer string'
            print(f"MANUAL    {head}\n          {why}; not changed. Edit by hand:")
            for l, line in locs: print(f"            {l}  {line}")
        elif len(hits) > 1:
            counts['ambiguous'] += 1
            locs = [(loc(root, texts, h), h[0] in likely) for h in hits]
            entry.update(status='ambiguous', tier=tier, locations=[l for (l, _), _ in locs])
            print(f"AMBIGUOUS {head}\n          {len(hits)} matches ({tier}); not changed:")
            for (l, line), lk in locs: print(f"            {l}{'  <- page file' if lk else ''}  {line}")
        else:
            f, s, e, _ = hits[0]
            enc = encode_after(after, f, texts[f], s, e)
            new = texts[f][:s] + enc + texts[f][e:]
            if f.endswith('.json'):
                try: json.loads(new)
                except ValueError as ex:
                    counts['manual'] += 1; entry.update(status='manual', detail=f'result would not be valid JSON: {ex}')
                    print(f"MANUAL    {head}\n          replacing in {os.path.relpath(f, root)} would break the JSON; not changed."); report.append(entry); continue
            l, _ = loc(root, texts, hits[0])
            others = [(g, x, y, False) for g in files for x, y in find_all(texts[g], before) if not (g == f and x == s) and not whole(texts[g], x, y)]
            texts[f] = new
            counts['applied'] += 1; entry.update(status='applied', tier=tier, location=l)
            print(f"APPLIED   {head}\n          {l} ({tier} match){' [dry run]' if a.dry_run else ''}")
            if others:
                entry['also_inside_longer_text'] = [loc(root, orig, h)[0] for h in others]
                print('          Note: the same words also appear inside longer text (not changed), e.g. an sr-only or meta copy:')
                for h in others[:4]: print(f"            {loc(root, orig, h)[0]}  {loc(root, orig, h)[1]}")
        report.append(entry)
    changed = [f for f in files if texts[f] != orig[f]]
    if not a.dry_run:
        for f in changed:
            with open(f, 'w', encoding='utf-8') as fh: fh.write(texts[f])
    print('\nSummary: ' + ', '.join(f'{v} {k}' for k, v in counts.items() if v) + (f'. {"Would change" if a.dry_run else "Changed"} {len(changed)} file(s): ' + ', '.join(os.path.relpath(f, root) for f in changed) if changed else '. No files changed.'))
    if a.report:
        json.dump(report, open(a.report, 'w'), indent=2, ensure_ascii=False)

if __name__ == '__main__':
    main()
