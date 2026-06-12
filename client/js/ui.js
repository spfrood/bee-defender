'use strict';

const UI = (() => {

  const SCREEN_IDS = [
    'screen-start',
    'screen-intro',
    'screen-game',
    'screen-result',
    'screen-leaderboard'
  ];

  const USERNAME_RE = /^[A-Za-z0-9 _-]{1,20}$/;

  let _toastTimeout = null;

  function showScreen(id) {
    SCREEN_IDS.forEach(sid => {
      document.getElementById(sid).classList.toggle('active', sid === id);
    });
  }

  // Clone the button before attaching a listener so stale listeners
  // from previous rounds never fire
  function _rewire(id, cb) {
    if (!cb) return;
    const el = document.getElementById(id);
    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    fresh.addEventListener('click', cb, { once: true });
  }

  function showStart(onPlay) {
    showScreen('screen-start');
    _rewire('btn-play', onPlay);
  }

  function showIntro(levelConfig, onBegin) {
    showScreen('screen-intro');
    document.getElementById('intro-level-num').textContent = levelConfig.levelNum;
    document.getElementById('intro-bees').textContent = levelConfig.beeCount;
    document.getElementById('intro-time').textContent = formatTime(levelConfig.survivalTime);
    document.getElementById('intro-ink').textContent = Math.round(levelConfig.inkLimit) + 'px';
    document.getElementById('intro-hint').textContent = levelConfig.hint;
    _rewire('btn-begin', onBegin);
  }

  function showGame() {
    showScreen('screen-game');
  }

  function showResult(outcome, data, cbs) {
    showScreen('screen-result');

    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const scoreEl = document.getElementById('result-score');
    const btnNext = document.getElementById('btn-next');
    const form = document.getElementById('score-submit-form');

    if (outcome === 'win') {
      title.textContent = 'Level ' + data.level + ' Survived!';
      title.style.color = 'var(--accent-amber)';
      message.textContent = 'The dog is safe. Time left: ' +
        formatTime(data.timeRemaining) + ' · Ink left: ' +
        Math.round(data.inkRemaining) + 'px';
      scoreEl.textContent = data.score.toLocaleString();
      btnNext.style.display = '';
      form.style.display = '';
    } else {
      title.textContent = 'The Bees Got Through!';
      title.style.color = 'var(--danger)';
      message.textContent = 'Level ' + data.level + ' — try a tighter barrier.';
      scoreEl.textContent = '';
      btnNext.style.display = 'none';
      form.style.display = 'none'; // scores only recorded on win
    }

    _rewire('btn-next', cbs.onNext);
    _rewire('btn-retry', cbs.onRetry);
    _rewire('btn-leaderboard', cbs.onLeaderboard);

    _rewire('btn-share', async () => {
      const result = await Share.shareResult(data.seed, data.level, data.score, data.username);
      if (result.method === 'clipboard') {
        toast('Link copied to clipboard!');
      } else if (result.method === 'share') {
        toast('Shared!');
      } else if (result.method === 'manual') {
        toast('Copy this link: ' + result.url, 6000);
      }
      // cancelled: no toast
    });

    if (outcome === 'win') {
      const input = document.getElementById('username-input');
      const saved = sessionStorage.getItem('bd_username');
      if (saved) input.value = saved;
      _rewireSubmit(data, input);
    }
  }

  // {once:true} consumes the listener, so re-arm after a failed validation
  function _rewireSubmit(data, input) {
    _rewire('btn-submit-score', async () => {
      const username = input.value.trim();
      if (!USERNAME_RE.test(username)) {
        toast('Name must be 1–20 letters, numbers, spaces, - or _');
        _rewireSubmit(data, input);
        return;
      }
      const res = await Leaderboard.submitScore(username, data.score, data.level);
      if (res && typeof res.rank === 'number') {
        sessionStorage.setItem('bd_username', username);
        toast('Score submitted! You are rank #' + res.rank);
      } else {
        toast('Could not submit score. Try again later.');
      }
    });
  }

  function showLeaderboard(onBack, highlightUsername, highlightScore) {
    showScreen('screen-leaderboard');
    Leaderboard.render(highlightUsername, highlightScore);
    _rewire('btn-leaderboard-back', onBack);
  }

  // ---------- HUD ----------

  function updateTimer(remaining, total) {
    const frac = total > 0 ? clamp(remaining / total, 0, 1) : 0;
    const fill = document.getElementById('timer-bar-fill');
    fill.style.width = (frac * 100) + '%';
    let color;
    if (frac > 0.5) {
      color = lerpColor('#f5c518', '#4a9e2f', (frac - 0.5) * 2);
    } else {
      color = lerpColor('#cc3333', '#f5c518', frac * 2);
    }
    fill.style.backgroundColor = color;
    document.getElementById('timer-value').textContent = formatTime(remaining);
  }

  function updateInk(remaining, total) {
    const frac = total > 0 ? clamp(remaining / total, 0, 1) : 0;
    const fill = document.getElementById('ink-bar-fill');
    fill.style.width = (frac * 100) + '%';
    fill.style.backgroundColor = frac < 0.2 ? '#cc3333' : '#f5c518';
    document.getElementById('ink-value').textContent = Math.round(remaining) + 'px';
  }

  function updateBeeCount(alive, total) {
    document.getElementById('bee-count').textContent = '\u{1F41D} ' + alive + '/' + total;
  }

  function setLevelHUD(levelNum) {
    document.getElementById('hud-level').textContent = 'Level ' + levelNum;
  }

  function setDangerLevel(level) {
    const canvas = document.getElementById('game-canvas');
    document.documentElement.style.setProperty('--danger-alpha', String(level));
    canvas.classList.toggle('danger', level > 0.01);
  }

  // ---------- Toast ----------

  function toast(msg, durationMs = 2800) {
    const el = document.getElementById('toast');
    if (_toastTimeout) {
      clearTimeout(_toastTimeout);
      _toastTimeout = null;
    }
    el.textContent = msg;
    el.classList.add('show');
    _toastTimeout = setTimeout(() => {
      el.classList.remove('show');
      _toastTimeout = null;
    }, durationMs);
  }

  return {
    showScreen,
    showStart,
    showIntro,
    showGame,
    showResult,
    showLeaderboard,
    updateTimer,
    updateInk,
    updateBeeCount,
    setLevelHUD,
    setDangerLevel,
    toast
  };
})();
