#!/usr/bin/env python3
"""Link checker for the built site: every internal href/src/srcset in dist/ must
resolve, and every URL from the old Adobe Portfolio site must exist.
Usage: npm run build && python3 scripts/check-links.py"""
import os, re, sys, html
from urllib.parse import urlparse, unquote
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')
OLD = ['home','contact','photography','wedding-photography','engagement-proposals','family-photoshoots','graduation-photoshoots','video-production','promotional-corporate','documentaries','commercials-social-media-ads','wedding-videography','work','the-money-maker-app','klema-web-pages','klema-ios-app','foodfriend-ios-app','cosie-co','cec-building','the-cultivation-project','graphic-design','5-years-of-the-cultivation-project','autonomous-vehicle-demonstration','logos-flyers-signs','presentations-workshops','audio-production','coffee-meets-bible-podcast']
NEW = ['', 'experience', 'projects', 'creative', 'contact', 'operations', 'ai-builds', 'case-studies', 'case-studies/internal-dashboard', 'case-studies/documentation', 'case-studies/circles-scheduling', 'case-studies/contract-automation', 'case-studies/growth-roadmap']

def resolve(path):
    p = unquote(path).lstrip('/')
    cands = [p, p + '.html', os.path.join(p, 'index.html')] if p else ['index.html']
    return any(os.path.isfile(os.path.join(ROOT, c)) for c in cands)

bad, n, ext = [], 0, set()
for dp, _, fs in os.walk(ROOT):
    for f in fs:
        if not f.endswith('.html'): continue
        page = os.path.relpath(os.path.join(dp, f), ROOT)
        s = open(os.path.join(dp, f), encoding='utf8').read()
        urls = re.findall(r'(?:href|src|poster|data-embed)="([^"]+)"', s)
        for ss in re.findall(r'srcset="([^"]+)"', s):
            urls += [x.strip().split(' ')[0] for x in ss.split(',')]
        for u in urls:
            u = html.unescape(u)
            if u.startswith(('mailto:', 'tel:', '#', 'data:')): continue
            if u.startswith(('http://', 'https://', '//')):
                ext.add(u); continue
            n += 1
            if not resolve(urlparse(u).path): bad.append((page, u))
missing = [s for s in OLD + NEW if not resolve('/' + s)]
print(f'internal links checked: {n}; broken: {len(bad)}; external URLs: {len(ext)}')
for b in bad[:50]: print('  BROKEN', *b)
print(f'old slugs present: {len(OLD) - len([m for m in missing if m in OLD])}/{len(OLD)}; new pages present: {len(NEW) - len([m for m in missing if m in NEW])}/{len(NEW)}')
for m in missing: print('  MISSING /' + m)
if '-v' in sys.argv:
    for u in sorted(ext): print('  ext', u)
sys.exit(1 if bad or missing else 0)
