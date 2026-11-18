// Export the user's current landing copy as a script-free board BODY fragment.
// Only the playable game is framed; all editorial content belongs to the board.
import { readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = await readFile(path.join(root, 'landing-embed/index.html'), 'utf8');
const { document } = parseHTML(source);
const main = document.querySelector('main');
const originalSections = [...main.children].filter(e => e.tagName === 'SECTION');
const normalize = text => text.replace(/\s+/g, ' ').trim();
const copyBefore = originalSections.map(e => normalize(e.textContent));
const sectionIds = originalSections.map(e => e.id || e.className);
const origin = 'https://traceback-game-promo.exactsunbird8.chatgpt.site';
const base = `${origin}/promotion/landing-embed/`;
const gameUrl = `${origin}/?embed=1`;
const article = document.createElement('div');
article.id = 'tb-board-top';
article.append(document.querySelector('.site-header'), main, document.querySelector('.site-footer'));

// Existing page scripts never execute inside the groupware editor.
for (const element of article.querySelectorAll('[data-reveal], [data-parallax]')) {
  element.removeAttribute('data-reveal');
  element.removeAttribute('data-parallax');
}
for (const element of article.querySelectorAll('[id]')) element.id = `tb-board-${element.id}`;
for (const element of article.querySelectorAll('[aria-labelledby]')) {
  element.setAttribute('aria-labelledby', element.getAttribute('aria-labelledby').split(' ').map(x => `tb-board-${x}`).join(' '));
}
for (const element of article.querySelectorAll('[src], [href], [poster]')) {
  for (const attr of ['src', 'href', 'poster']) {
    const value = element.getAttribute(attr);
    if (!value) continue;
    if (value.startsWith('#')) element.setAttribute(attr, `#tb-board-${value.slice(1)}`);
    else element.setAttribute(attr, new URL(value, base).href);
  }
}
for (const link of article.querySelectorAll('.js-play')) {
  link.href = '#tb-board-live-game';
  link.removeAttribute('data-play-url-target');
  link.setAttribute('aria-label', '본문의 실제 게임 화면으로 이동');
}
// Match the status text normally supplied by the original script.
for (const status of article.querySelectorAll('[data-play-status]')) status.textContent = '페이지 안에서 게임 실행';

function css(selector, value) {
  for (const element of article.querySelectorAll(selector)) element.setAttribute('style', `${element.getAttribute('style') || ''}${value};`);
}
article.setAttribute('style', "display:block;width:100%;max-width:1280px;margin:0 auto;padding:0;box-sizing:border-box;background:#071014;color:#f2efe7;font-family:'Malgun Gothic','Apple SD Gothic Neo',Arial,sans-serif;font-size:16px;line-height:1.7;word-break:keep-all;overflow-wrap:break-word;text-align:left;");
css('*', 'box-sizing:border-box');
css('div, main, section, header, footer, nav, article, figure, figcaption', 'min-width:0');
css('p, h1, h2, h3, figure, ol', 'margin:0');
css('a', 'color:inherit;text-decoration:none;cursor:pointer');
css('img', 'display:block;width:100%;max-width:100%;height:auto;border:0');
css('section', 'display:block;position:relative;padding:60px 5%;padding:clamp(32px,5vw,64px) 5%');
css('.section-dark', 'background:#081216;color:#f2efe7');
css('.section-light', 'background:#f2efe7;color:#071014');
css('h1, h2', 'font-family:Arial,\'Malgun Gothic\',sans-serif;font-weight:900;letter-spacing:-.055em;line-height:1.15;word-break:keep-all;overflow-wrap:break-word');
css('h1', 'font-size:64px;font-size:clamp(36px,6vw,88px);max-width:1000px;margin:22px 0');
css('h2', 'font-size:46px;font-size:clamp(30px,4.5vw,64px);margin:24px 0');
css('h1 > span, h2 > span, h2 > em', 'display:block');
css('h1 > span:last-child, h2 > em, h2 > span', 'color:#ff6b58;font-style:normal');
css('.body-copy, .hero-deck, .purpose-lead', 'font-size:17px;line-height:1.9;max-width:780px;margin:22px 0;color:inherit');
css('.eyebrow, .section-stamp', 'display:flex;flex-wrap:wrap;align-items:center;gap:16px;color:inherit;opacity:.75;font-family:Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:.11em;line-height:1.6');
css('.kicker', 'margin:26px 0 16px;color:#efbf54;font-size:14px;font-weight:700;letter-spacing:.08em');
css('.site-header', 'position:static;display:flex;align-items:center;flex-wrap:wrap;gap:20px;justify-content:space-between;padding:22px 5%;background:#071014;color:#f2efe7;border-bottom:1px solid #354045');
css('.brand', 'display:inline-flex;align-items:center;gap:12px;font-size:24px;font-weight:800');
css('.brand-mark', 'display:inline-block;padding:9px 11px;background:#e84635;color:#071014;font-size:13px');
css('.site-nav', 'display:flex;flex-wrap:wrap;gap:18px;font-size:11px;letter-spacing:.1em');
css('.header-cta', 'display:inline-block;border:1px solid #b0b9b9;padding:10px 16px;font-size:13px');
css('.hero-actions, .finale-actions', 'display:flex;flex-wrap:wrap;align-items:center;gap:20px;margin:30px 0');
css('.button', 'display:inline-block;padding:15px 23px;background:#ff5b45;color:#071014;border:1px solid #ff5b45;font-size:15px;font-weight:800;text-decoration:none');
css('.text-link, .backup-play-link', 'display:inline-block;color:#efbf54;text-decoration:underline;text-underline-offset:5px');
css('.hero-note, .hero-scroll', 'position:static;margin-top:28px;color:#bac5c5;font:11px/1.6 Consolas,monospace;letter-spacing:.15em');
css('.hero-content', 'position:relative;min-height:0;padding:32px 0');
// Keep cinematic art as a static background; avoid scripts, fixed layers and viewport heights.
for (const [section, media, shade] of [
  ['.hero', '.hero-media', 'linear-gradient(90deg,rgba(4,10,12,.94),rgba(4,10,12,.40))'],
  ['.story', '.story-backdrop', 'linear-gradient(90deg,rgba(4,10,12,.96),rgba(4,10,12,.74))'],
  ['.chase', '.chase-media', 'linear-gradient(90deg,rgba(242,239,231,.97),rgba(242,239,231,.66))'],
  ['.behind', '.behind-art', 'linear-gradient(90deg,rgba(4,10,12,.97),rgba(4,10,12,.87))'],
  ['.finale', '.finale-bg', 'linear-gradient(90deg,rgba(4,10,12,.96),rgba(4,10,12,.73))']
]) {
  const img = article.querySelector(`${media} img`);
  if (img) { css(section, `background-image:${shade},url('${img.src}');background-size:cover;background-position:center`); img.parentElement.remove(); }
}
for (const selector of ['.hero-wash','.hero-grid','.story-overlay','.chase-scan','.finale-glow','.flow-art']) article.querySelector(selector)?.remove();
css('.film-stage', 'margin-top:28px');
css('.film-card', 'padding:8px;background:#fff;border-radius:12px;box-shadow:0 14px 40px #0003');
css('video', 'display:block;width:100%;height:auto;aspect-ratio:16/9;background:#050b0d;border-radius:6px');
css('.film-bar', 'display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:12px;color:#303f43;font:11px/1.5 Consolas,monospace');
css('.film-note', 'margin:18px 0;color:#b8c5c7;font-size:13px');
css('.purpose-layout', 'display:flex;flex-wrap:wrap;align-items:center;gap:32px');
css('.purpose-copy', 'flex:1 1 400px');
css('.purpose-visual', 'flex:1 1 430px;background:#ded9cb;border-radius:8px');
css('.purpose-visual > span', 'display:block;padding:12px 16px;color:#4b5353;font:11px/1.5 Consolas,monospace');
css('.purpose-uses, .value-grid, .story-beats, .timeline', 'display:flex;flex-wrap:wrap;gap:18px;margin-top:36px');
css('.purpose-use, .value-card, .story-beat', 'flex:1 1 260px;padding:26px;border-top:3px solid #ff5b45;background:#ffffff08');
css('.purpose-use', 'background:#e7e2d7');
css('.value-card', 'background:#14252b');
css('.purpose-use small, .value-card small, .stage-proof-card small', 'display:block;color:#e84635;font:700 11px/1.6 Consolas,monospace;letter-spacing:.06em');
css('.purpose-use strong, .value-card strong, .story-beat strong', 'display:block;font-size:25px;line-height:1.4;letter-spacing:-.04em;margin:18px 0 12px');
css('.purpose-use p, .value-card p, .story-beat p', 'font-size:15px;line-height:1.8');
css('.beat-no, .timeline-index', 'display:block;color:#ff6b58;font:700 13px/1.5 Consolas,monospace');
css('.flow-rail', 'padding:0;list-style:none;margin:34px 0');
css('.flow-step', 'display:block;border-left:3px solid #ff5b45;padding:16px 0 16px 24px;margin:10px 0');
css('.flow-step > span', 'display:inline-block;color:#ff6b58;font:700 13px/1.5 Consolas,monospace;margin-right:16px');
css('.flow-step > strong', 'font-size:25px');
css('.flow-step > p', 'margin-top:10px;max-width:850px;font-size:15px;line-height:1.8');
css('.flow-takeaway', 'padding:22px 0;border-top:1px solid #35474c;border-bottom:1px solid #35474c;line-height:2;font-size:14px;color:#efbf54');
css('.flow-takeaway i', 'font-style:normal;margin:0 8px');
css('.stage-proof', 'margin-top:48px');
css('.stage-proof-heading', 'display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;margin:0 0 24px');
css('.stage-proof-heading > span', 'color:#ff6b58;font:700 11px/1.5 Consolas,monospace');
css('.stage-proof-heading > b', 'font-size:21px');
css('.stage-proof-card', 'display:flex;flex-wrap:wrap;align-items:center;gap:0;margin:26px 0;background:#f2efe7;color:#071014;border:1px solid #c8c4bb;border-radius:8px');
css('.stage-proof-card:nth-child(even)', 'flex-direction:row-reverse');
css('.stage-proof-card > img', 'flex:1 1 560px;width:100%;height:auto;min-width:0;object-fit:contain;background:#081216;border-radius:7px');
css('.stage-proof-card figcaption', 'flex:1 1 270px;padding:28px');
css('.stage-proof-card strong', 'display:block;font-size:31px;line-height:1.3;margin:12px 0');
css('.stage-proof-card figcaption > span', 'display:block;font-size:15px;line-height:1.8');
css('.stage-proof-details', 'padding-left:20px;margin-top:16px;font-size:14px;line-height:1.9');
css('.chase-hud', 'display:flex;flex-wrap:wrap;gap:20px;margin-top:30px');
css('.chase-hud > div', 'padding:18px;background:#ffffffc9;border:1px solid #d3cbbd');
css('.chase-hud small', 'display:block;font:11px/1.6 Consolas,monospace');
css('.chase-hud b', 'display:block;font:700 24px/1.6 Consolas,monospace');
css('.timeline-item', 'display:flex;flex:1 1 230px;gap:20px;padding:24px 20px;border-top:2px solid #ff5b45;background:#14252b');
css('.timeline-item strong', 'display:block;font-size:25px;line-height:1.5');
css('.timeline-item p', 'margin-top:12px;font-size:15px;line-height:1.8');
css('.finale-frames', 'display:flex;flex-wrap:wrap;gap:24px;margin-top:30px');
css('.finale-frames figure', 'flex:1 1 400px;margin:0;border:1px solid #ffffff88;background:#081216');
css('.finale-frames figcaption', 'padding:12px;color:#b9c5c5;font:11px/1.5 Consolas,monospace');
css('.live-game-frame', 'margin-top:32px');
css('.live-game-bar', 'display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;padding:16px 20px;border:1px solid #fff;color:#f2efe7;background:#14252b;font-size:13px');
css('.live-game-bar a', 'color:#efbf54;text-decoration:underline');
css('.live-game-callout', 'display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;padding:18px 20px;background:#efbf54;color:#071014;font-size:15px');
// Padding ratio survives older editors that do not keep aspect-ratio declarations.
css('.live-game-viewport', 'position:relative;display:block;width:100%;height:0;padding:0 0 56.25%;background:#050b0d;outline:5px solid #fff;outline-offset:-1px');
css('.live-game-viewport iframe', 'position:absolute;top:0;left:0;display:block;width:100%;height:100%;border:0;background:#050b0d');
css('.live-game-frame > p', 'margin:22px 0 0;color:#bac5c5;font-size:14px');
css('.play-status', 'display:block;font-size:12px;color:#bac5c5');
css('.site-footer', 'padding:26px 5%;background:#050b0d;color:#bac5c5;font-size:12px');
css('.footer-inner', 'display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between');
const frame = article.querySelector('iframe');
frame.src = gameUrl;
frame.setAttribute('allowfullscreen', '');
frame.setAttribute('loading', 'lazy');
frame.setAttribute('scrolling', 'no');
// The fallback is visible even when groupware removes the video element entirely.
const video = article.querySelector('video');
const fallback = video.querySelector('a').cloneNode(true);
fallback.setAttribute('style', 'display:inline-block;margin-top:16px;color:#efbf54;font-size:13px;text-decoration:underline;');

const copyAfter = [...main.children].filter(e => e.tagName === 'SECTION').map(e => normalize(e.textContent));
copyAfter.forEach((text, i) => {
  const expected = copyBefore[i].replace('플레이 주소 설정 필요', '페이지 안에서 게임 실행');
  assert.equal(text, expected, `Editorial copy changed in section ${sectionIds[i]}`);
});
video.closest('.film-stage').append(fallback);
assert.equal(article.querySelectorAll('iframe').length, 1);
assert.equal(frame.src, gameUrl);
assert.equal(article.querySelectorAll('script, style, link').length, 0);
for (const el of article.querySelectorAll('[src], [poster]')) {
  for (const attr of ['src', 'poster']) {
    const url = el.getAttribute(attr);
    if (!url) continue;
    assert(url.startsWith('https://'), `Non-public media URL: ${url}`);
    if (url.startsWith(`${origin}/promotion/assets/`)) await access(path.join(root, 'assets', decodeURIComponent(new URL(url).pathname.split('/').pop())));
  }
}
// Prefix classes as well as IDs so the fragment cannot clash with board chrome.
for (const el of article.querySelectorAll('[class]')) el.className = el.className.split(/\s+/).map(x => `tb-board-${x}`).join(' ');
const fragment = '<!-- 게시판 HTML 모드에 전체 붙여넣기: 본문은 펼쳐지고 게임만 iframe입니다. -->\n' + article.outerHTML + '\n';
const board = path.join(root, 'board');
try { await access(path.join(board, 'landing-iframe-legacy.html')); } catch { await copyFile(path.join(board, 'iframe-embed.html'), path.join(board, 'landing-iframe-legacy.html')); }
await writeFile(path.join(board, 'iframe-embed.html'), fragment);
await writeFile(path.join(board, 'board-public.html'), fragment);
await writeFile(path.join(board, 'board-preview.html'), '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TraceBack 게시판 본문 미리보기</title></head><body style="margin:0;background:#fff">' + fragment + '</body></html>');
console.log(JSON.stringify({source:'promotion/landing-embed/index.html',sections:sectionIds.length,editorialCopyPreserved:true,iframes:1,inlineOnly:true,bytes:Buffer.byteLength(fragment),output:'promotion/board/iframe-embed.html'}, null, 2));
