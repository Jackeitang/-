import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile('public/listening-player.js', 'utf8');
const {createListeningPlayer} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
class Media extends EventTarget {
  currentTime = 0; readyState = 0; paused = true; playbackRate = 0.7;
  defaultPlaybackRate = 0.7; plays = 0;
  canPlayType() { return 'probably'; }
  play() { this.plays++; this.paused = false; this.dispatchEvent(new Event('playing')); return this.pending || Promise.resolve(); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  removeAttribute() { this.src = ''; }
  load() { this.loaded = true; }
  fire(type) { this.dispatchEvent(new Event(type)); }
}
const episode = {start: 6, end: 90, mediaUrl: 'https://prod.vodvideo.cbsnews.com/example.m3u8'};
function setup(audio = new Media(), Hls) {
  const states = []; let stops = 0;
  const player = createListeningPlayer({audio, episode, Hls, onState: (...state) => states.push(state), beforePlay: () => stops++});
  return {audio, player, states, stops: () => stops};
}
// Reset stale speed, preserve pitch on all supported engines, reject excessive slowdown.
for (const property of ['preservesPitch', 'webkitPreservesPitch', 'mozPreservesPitch']) {
  const audio = new Media(); audio[property] = false;
  const {player} = setup(audio);
  assert.equal(audio.playbackRate, 1); assert.equal(audio[property], true);
  assert.equal(player.setRate(0.9), 0.9); assert.equal(audio[property], true);
  assert.equal(player.setRate(0.7), 1); assert.equal(player.setRate(1), 1);
  player.destroy();
}
const unsupported = setup();
assert.equal(unsupported.player.supportsPitch, false);
assert.equal(unsupported.player.setRate(0.9), 1);
unsupported.player.destroy();

// Delayed metadata seeks into the chosen segment; replays and five-second review stay bounded.
const native = setup();
await native.player.play();
native.audio.readyState = 1; native.audio.fire('loadedmetadata');
assert.equal(native.audio.currentTime, 6); assert.equal(native.audio.src, episode.mediaUrl);
assert.equal(native.stops(), 1);
native.audio.currentTime = 25; native.player.pause();
await native.player.play(); assert.equal(native.audio.currentTime, 25);
await native.player.rewind(); assert.equal(native.audio.currentTime, 20);
native.audio.currentTime = 8; await native.player.rewind(); assert.equal(native.audio.currentTime, 6);
native.audio.currentTime = 90; native.audio.fire('timeupdate');
assert.equal(native.audio.paused, true); assert.equal(native.states.at(-1)[0], 'ended');
await native.player.rewind(); assert.equal(native.audio.currentTime, 85);
await native.player.play(true); assert.equal(native.audio.currentTime, 6);
native.player.destroy();

// Repeated clicks while loading pause instead of starting another asynchronous play.
const delayed = setup(); let finish;
delayed.audio.pending = new Promise(resolve => finish = resolve);
const pending = delayed.player.toggle();
delayed.player.toggle();
finish(); await pending;
assert.equal(delayed.audio.plays, 1); assert.equal(delayed.audio.paused, true);
delayed.player.destroy();

// Navigating away during load cannot resurrect audio or update the old screen.
const leaving = setup(); let release;
leaving.audio.pending = new Promise(resolve => release = resolve);
const loading = leaving.player.play(); leaving.player.destroy();
const count = leaving.states.length;
release(); await loading; leaving.audio.fire('timeupdate');
assert.equal(leaving.audio.paused, true); assert.equal(leaving.states.length, count);
assert.equal(leaving.audio.src, '');

// HLS starts at the clip boundary and a fatal failure gets a fresh single player on retry.
class Hls {
  static Events = {ERROR: 'error'}; static instances = [];
  static isSupported() { return true; }
  constructor(config) { this.config = config; Hls.instances.push(this); }
  on(event, handler) { this.handler = handler; }
  loadSource(url) { this.url = url; }
  attachMedia(audio) { this.audio = audio; }
  destroy() { this.destroyed = true; }
}
const streamAudio = new Media(); streamAudio.canPlayType = () => '';
const stream = setup(streamAudio, Hls);
await stream.player.play();
assert.equal(Hls.instances[0].config.startPosition, 6);
Hls.instances[0].handler('error', {fatal: true});
assert.equal(Hls.instances[0].destroyed, true); assert.equal(stream.audio.paused, true);
await stream.player.play(); assert.equal(Hls.instances.length, 2);
stream.player.destroy(); assert.equal(Hls.instances[1].destroyed, true);
console.log('PASS listening player: pitch, speed reset, clip bounds, replay, rewind, pending pause, navigation cleanup, HLS retry');
