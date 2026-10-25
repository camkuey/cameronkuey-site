// Snapshot the Coffee Meets Bible RSS feed into src/data/podcast.json for the episode list on
// /coffee-meets-bible-podcast. Run `npm run podcast` after a new episode is published, then commit.
import { writeFile } from 'node:fs/promises';

const FEED = 'https://anchor.fm/s/16b6cf68/podcast/rss';
const OUT = new URL('../src/data/podcast.json', import.meta.url);

const xml = await (await fetch(FEED)).text();
const tag = (s, name) => {
  const m = s.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : '';
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '’').replace(/&nbsp;/g, ' ');
const plain = (html) => decode(decode(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const episodes = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
  const raw = decode(tag(it, 'title'));
  // "E17 - Reaching the Unreached in Asia - K" -> number 17, title, guest
  const parts = raw.split(' - ');
  const m = /^E\d+$/.test(parts[0]) ? [raw, parts[0].slice(1), parts[1], parts.length > 2 ? parts.slice(2).join(' - ') : undefined] : null;
  // itunes:duration is "hh:mm:ss", "mm:ss" or plain seconds
  const secs = tag(it, 'itunes:duration').split(':').reduce((t, x) => t * 60 + Number(x), 0);
  return {
    n: m ? +m[1] : null,
    title: m ? m[2].trim() : raw,
    guest: m?.[3]?.trim() ?? null,
    date: new Date(tag(it, 'pubDate')).toISOString().slice(0, 10),
    minutes: Math.round(secs / 60),
    summary: plain(tag(it, 'description')),
    audio: it.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ?? null,
  };
});

await writeFile(OUT, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), feed: FEED, episodes }, null, 2) + '\n');
console.log(`podcast.json: ${episodes.length} episodes`);
