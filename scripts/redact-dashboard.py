#!/usr/bin/env python3
"""
Hide vendor names in the dashboard screenshots and screen recordings before publishing.

  python3 scripts/redact-dashboard.py      (needs opencv-python-headless + Pillow)

Reads   ../portfolio-site-assets/dashboard/{screenshots,videos}
Writes  ../portfolio-site-assets/dashboard/redacted/   (outside the repo)

- "Zeffy" (a sample task title) is found by template matching against crops of
  the word taken from the screenshots themselves (scripts/redact-templates/*.png),
  then pixel-blurred. Video frames get the same treatment, with each hit also
  blurred in the 3 frames either side so nothing flashes during scrolls.
- The open-task list is cropped above its "No project" group instead.
- "Insperity" only appears further down the onboarding checklist, outside every
  frame used here, so nothing needed blurring for it.
Videos are re-encoded: H.264, CRF 26, no audio, +faststart.
"""
import cv2, numpy as np, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', 'portfolio-site-assets', 'dashboard'))
SHOTS, VIDS, OUT = f'{ROOT}/screenshots', f'{ROOT}/videos', f'{ROOT}/redacted'
TEMPLS = []
for n in ['t_link', 't_title', 't_toast', 't_list']:
    T = cv2.imread(f'{HERE}/redact-templates/{n}.png', 0)
    for s in [0.9, 0.95, 1.0, 1.05, 1.1]:
        TEMPLS.append(cv2.resize(T, None, fx=s, fy=s, interpolation=cv2.INTER_AREA))

def find(img, thr=0.68):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hits = []
    for t in TEMPLS:
        r = cv2.matchTemplate(gray, t, cv2.TM_CCOEFF_NORMED)
        for y, x in zip(*np.where(r >= thr)):
            hits.append((float(r[y, x]), int(x), int(y), t.shape[1], t.shape[0]))
    hits.sort(reverse=True); out = []
    for h in hits:
        if all(abs(h[1] - o[1]) > 20 or abs(h[2] - o[2]) > 12 for o in out): out.append(h)
    return out

def blur(img, hits, pad=6, k=1):
    H, W = img.shape[:2]
    for _, x, y, w, h in hits:
        x, y, w, h = x * k, y * k, w * k, h * k; p = pad * k
        x0, y0, x1, y1 = max(0, x - p), max(0, y - p), min(W, x + w + p), min(H, y + h + p)
        roi = img[y0:y1, x0:x1]
        small = cv2.resize(roi, (max(1, (x1 - x0) // 8), max(1, (y1 - y0) // 8)), interpolation=cv2.INTER_AREA)
        img[y0:y1, x0:x1] = cv2.GaussianBlur(cv2.resize(small, (x1 - x0, y1 - y0)), (9 * k | 1, 9 * k | 1), 0)
    return img

def shots():
    os.makedirs(OUT, exist_ok=True)
    for name in ['desktop-ask-otis-confirm-card', 'desktop-ask-otis-approved']:
        hits = find(cv2.imread(f'{SHOTS}/{name}.png'), 0.75)   # detect at 1x, blur the @2x master
        print(name, len(hits), 'hit(s)')
        cv2.imwrite(f'{OUT}/{name}@2x.png', blur(cv2.imread(f'{SHOTS}/{name}@2x.png'), hits, k=2))
    im = cv2.imread(f'{SHOTS}/desktop-tasks-open-list@2x.png')
    cv2.imwrite(f'{OUT}/desktop-tasks-open-list@2x.png', im[:CROP_TASKS_2X])
    for name in os.listdir(SHOTS):   # safety net: nothing else may contain a hit
        if name.endswith('.png') and '@2x' not in name and not name.startswith('phone'):
            if name[:-4] in ('desktop-ask-otis-confirm-card', 'desktop-ask-otis-approved', 'desktop-tasks-open-list'): continue
            if find(cv2.imread(f'{SHOTS}/{name}'), 0.75): print('WARNING: vendor name in', name)

CROP_TASKS_2X = 1484   # just below the "Winter grant cycle" group

def video(name):
    cap = cv2.VideoCapture(f'{VIDS}/{name}.mp4'); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        frames.append(f)
    H, W = frames[0].shape[:2]
    hits = [find(f) for f in frames]
    print(name, len(frames), 'frames,', sum(1 for h in hits if h), 'with a hit')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                          '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                          f'{OUT}/{name}.mp4'], stdin=subprocess.PIPE)
    for i, f in enumerate(frames):
        near = [h for j in range(max(0, i - 3), min(len(frames), i + 4)) for h in hits[j]]
        p.stdin.write(blur(f, near).tobytes())
    p.stdin.close(); p.wait()

if __name__ == '__main__':
    shots()
    if '--no-video' not in sys.argv:
        for v in ['opening-the-day', 'finishing-a-task', 'ask-otis-approve-suggestion', 'kiosk-clock-in']: video(v)
