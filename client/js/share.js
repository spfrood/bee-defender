'use strict';

const Share = (() => {

  function buildShareUrl(seed, levelNum, score) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('level', levelNum);
    url.searchParams.set('seed', seed);
    return url.toString();
  }

  function parseShareUrl() {
    const params = new URLSearchParams(window.location.search);
    const levelRaw = params.get('level');
    const seedRaw = params.get('seed');
    let levelNum = null;
    let seed = null;
    if (levelRaw !== null) {
      const n = Number(levelRaw);
      if (Number.isInteger(n) && n > 0 && Number.isFinite(n)) levelNum = n;
    }
    if (seedRaw !== null) {
      const s = Number(seedRaw);
      if (Number.isInteger(s) && s > 0 && Number.isFinite(s)) seed = s;
    }
    return { levelNum, seed };
  }

  function clearShareUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }

  async function shareResult(seed, levelNum, score, username) {
    const url = buildShareUrl(seed, levelNum, score);
    const who = username ? username : 'I';
    const text = who + ' scored ' + score.toLocaleString() +
      ' on level ' + levelNum + ' of Bee Defender! Can you beat it?';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bee Defender', text, url });
        return { method: 'share' };
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { method: 'cancelled' };
        }
        // fall through to clipboard
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text + '\n' + url);
        return { method: 'clipboard' };
      } catch (err) {
        // fall through to manual
      }
    }

    return { method: 'manual', url, text };
  }

  return { buildShareUrl, parseShareUrl, clearShareUrl, shareResult };
})();
