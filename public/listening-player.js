// News always uses the publisher's recording. Voice-picker settings never apply.
export function createListeningPlayer({audio, episode, Hls, onState, beforePlay = () => {}}) {
  let hls = null, initialized = false, disposed = false;
  let rate = 1, wantsPlay = false, needsStart = true, revision = 0;
  const listeners = [];
  const pitchKeys = ['preservesPitch', 'webkitPreservesPitch', 'mozPreservesPitch'];
  const supportsPitch = pitchKeys.some(key => key in audio);
  const emit = (state, message) => { if (!disposed) onState(state, message); };
  const on = (event, handler) => {
    audio.addEventListener(event, handler);
    listeners.push([event, handler]);
  };
  function applyRate() {
    for (const key of pitchKeys) if (key in audio) audio[key] = true;
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
  }
  function seekStart() {
    if (audio.readyState < 1) return;
    audio.currentTime = episode.start;
    needsStart = false;
  }
  function fail(message) {
    wantsPlay = false;
    revision++;
    audio.pause();
    hls?.destroy();
    hls = null;
    initialized = false;
    needsStart = true;
    emit('error', message);
  }
  function init() {
    if (initialized) return;
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = episode.mediaUrl;
    } else if (Hls?.isSupported()) {
      hls = new Hls({startPosition: episode.start});
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) fail('官方音频暂时无法播放，请重试或打开 CBS 官方播放器。');
      });
      hls.loadSource(episode.mediaUrl);
      hls.attachMedia(audio);
    } else {
      throw Error('此浏览器不支持新闻流，请打开 CBS 官方播放器。');
    }
    initialized = true;
  }
  applyRate();
  on('loadedmetadata', () => {
    applyRate();
    if (needsStart) seekStart();
  });
  on('playing', () => {
    if (!wantsPlay) { audio.pause(); return; }
    applyRate();
    emit('playing');
  });
  on('pause', () => { if (!wantsPlay) emit('paused'); });
  on('waiting', () => { if (wantsPlay) emit('loading', '正在缓冲官方音频…'); });
  on('error', () => fail('官方音频暂时无法播放，请重试或打开 CBS 官方播放器。'));
  on('timeupdate', () => {
    if (needsStart) return;
    if (audio.currentTime >= episode.end) {
      wantsPlay = false;
      revision++;
      audio.pause();
      needsStart = true;
      emit('ended', '片段结束。现在说说你听到了什么。');
    } else if (wantsPlay) {
      emit('progress', `已听 ${Math.max(0, Math.floor(audio.currentTime - episode.start))} / ${episode.end - episode.start} 秒`);
    }
  });
  function pause() {
    wantsPlay = false;
    revision++;
    audio.pause();
    emit('paused');
  }
  async function play(restart = false) {
    if (disposed || (wantsPlay && !restart)) return;
    const attempt = ++revision;
    wantsPlay = true;
    beforePlay();
    try {
      init();
      if (restart || audio.currentTime < episode.start || audio.currentTime >= episode.end) needsStart = true;
      if (needsStart) seekStart();
      applyRate();
      emit('loading', '正在载入官方音频…');
      await audio.play();
      if (disposed || !wantsPlay) audio.pause();
    } catch (error) {
      if (disposed || attempt !== revision) return;
      wantsPlay = false;
      emit('error', error.message || '播放失败，请重试或打开 CBS 官方播放器。');
    }
  }
  return {
    supportsPitch,
    play,
    pause,
    toggle() { return wantsPlay ? pause() : play(); },
    rewind() {
      if (audio.readyState >= 1) {
        audio.currentTime = Math.max(episode.start, Math.min(episode.end, audio.currentTime) - 5);
        needsStart = false;
      }
      return play();
    },
    setRate(value) {
      // Large time stretching makes speech sound metallic even with pitch correction.
      rate = supportsPitch && Number(value) === 0.9 ? 0.9 : 1;
      applyRate();
      return rate;
    },
    destroy() {
      disposed = true;
      wantsPlay = false;
      revision++;
      for (const [event, handler] of listeners) audio.removeEventListener(event, handler);
      audio.pause();
      hls?.destroy();
      hls = null;
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
