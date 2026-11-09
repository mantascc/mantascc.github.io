const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '../aida/poliklinika.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

class Element {
  constructor() {
    this.listeners = {};
    this.attributes = {};
    this.textContent = '';
    this.value = 0;
    this.classes = new Set();
    this.classList = {
      add: value => this.classes.add(value),
      remove: value => this.classes.delete(value),
      toggle: (value, present) => present ? this.classes.add(value) : this.classes.delete(value)
    };
    this.style = { setProperty() {} };
    this.parentElement = { style: this.style };
  }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  dispatch(name) { return Promise.all((this.listeners[name] || []).map(listener => listener())); }
  setAttribute(name, value) { this.attributes[name] = value; }
}
function makeBuffer(channels = 1, length = 1000, sampleRate = 1000) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: n => data[n] };
}
function setup({ webAudio = true, fetch, decoded = makeBuffer() } = {}) {
  const elements = Object.fromEntries(['audio', 'toggle', 'seek', 'elapsed', 'duration', 'status', 'player'].map(id => [id, new Element()]));
  const audio = elements.audio;
  Object.assign(audio, { src: 'poliklinika.mp3', currentSrc: 'poliklinika.mp3', duration: decoded.duration, currentTime: 0, paused: true });
  audio.play = async () => { audio.paused = false; await audio.dispatch('play'); await audio.dispatch('playing'); };
  audio.pause = () => { audio.paused = true; audio.dispatch('pause'); };
  let fetches = 0;
  const contexts = [];
  class AudioContext extends Element {
    constructor() { super(); this.currentTime = 0; this.state = 'suspended'; this.sources = []; contexts.push(this); }
    async resume() { this.state = 'running'; }
    async decodeAudioData() { return decoded; }
    createBuffer(...args) { return makeBuffer(...args); }
    createBufferSource() {
      const source = { connect() {}, disconnect() { this.disconnected = true; }, start(when, offset) { this.when = when; this.offset = offset; }, stop() { this.stopped = true; } };
      this.sources.push(source); return source;
    }
  }
  const window = new Element();
  if (webAudio) window.AudioContext = AudioContext;
  const sandbox = vm.createContext({
    document: { getElementById: id => elements[id], querySelector: () => elements.player, documentElement: new Element() },
    window, fetch: (...args) => { fetches++; return fetch ? fetch(...args) : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }); },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}
  });
  vm.runInContext(script, sandbox);
  return { elements, contexts, window, fetches: () => fetches, transport: vm.runInContext('transport', sandbox), click: () => elements.toggle.dispatch('click') };
}

test('audio clock loops continuously without restarting or refetching', async () => {
  const t = setup(); await t.click();
  const context = t.contexts[0]; const source = context.sources[0];
  assert.equal(source.loop, true);
  context.currentTime = source.buffer.duration * 3 + 0.12;
  assert.ok(Math.abs(t.transport.currentTime - 0.12) < 1e-10);
  assert.equal(context.sources.length, 1); assert.equal(t.fetches(), 1); assert.equal(t.transport.paused, false);
});
test('30 ms seam is continuous and leaves the rest of every channel untouched', async () => {
  const decoded = makeBuffer(2);
  for (let c = 0; c < 2; c++) for (let i = 0; i < 1000; i++) decoded.getChannelData(c)[i] = Math.sin(i * 0.02 + c) * 0.5;
  const t = setup({ decoded }); await t.click();
  const result = t.contexts[0].sources[0].buffer;
  assert.equal(result.length, 970);
  for (let c = 0; c < 2; c++) {
    const input = decoded.getChannelData(c), output = result.getChannelData(c);
    assert.equal(output[0], input[970]); assert.equal(output[29], input[29]);
    assert.deepEqual(output.subarray(30), input.subarray(30, 970));
    assert.ok(Math.abs(output[0] - output[969]) < 0.011);
    assert.ok(output.every(value => Math.abs(value) <= 0.5));
  }
});
test('pause, resume and seeks retain position and stop old sources', async () => {
  const t = setup(); await t.click(); const context = t.contexts[0];
  context.currentTime = 0.4; await t.click();
  assert.equal(t.transport.currentTime, 0.4); assert.equal(t.transport.paused, true);
  assert.ok(context.sources[0].stopped && context.sources[0].disconnected);
  context.currentTime = 3; assert.equal(t.transport.currentTime, 0.4);
  await t.click(); assert.equal(context.sources[1].offset, 0.4);
  t.elements.seek.value = 0.7; await t.elements.seek.dispatch('input');
  assert.equal(context.sources[2].offset, 0.7); assert.ok(context.sources[1].stopped);
  t.transport.currentTime = t.transport.duration; assert.equal(t.transport.currentTime, 0);
});
test('pause while loading prevents playback and clears status', async () => {
  let release;
  const t = setup({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const firstClick = t.click(); assert.equal(t.transport.paused, false);
  await t.click(); release({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }); await firstClick;
  assert.equal(t.transport.paused, true); assert.equal(t.contexts[0].sources.length, 0); assert.equal(t.elements.status.textContent, '');
  await t.click(); assert.equal(t.contexts[0].sources.length, 1); assert.equal(t.fetches(), 1);
});
test('rapid play/pause/play creates only the newest source', async () => {
  let release;
  const t = setup({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const firstClick = t.click(); await t.click(); const thirdClick = t.click();
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }); await Promise.all([firstClick, thirdClick]);
  assert.equal(t.contexts[0].sources.length, 1); assert.equal(t.transport.paused, false); assert.equal(t.elements.status.textContent, '');
});
test('fetch failure reports an error and can retry', async () => {
  let ok = false;
  const t = setup({ fetch: async () => ({ ok, arrayBuffer: async () => new ArrayBuffer(0) }) });
  await t.click(); assert.equal(t.transport.paused, true); assert.match(t.elements.status.textContent, /Unable to play/);
  ok = true; await t.click(); assert.equal(t.transport.paused, false); assert.equal(t.fetches(), 2);
});
test('decoding failure is retryable', async () => {
  const t = setup(); const first = t.click();
  t.contexts[0].decodeAudioData = async () => { throw new Error('decode'); }; await first;
  assert.equal(t.transport.paused, true);
  t.contexts[0].decodeAudioData = async () => makeBuffer(); await t.click(); assert.equal(t.transport.paused, false);
});
test('navigation and audio interruption reset playback state', async () => {
  const t = setup(); await t.click(); await t.window.dispatch('pagehide'); assert.equal(t.transport.paused, true);
  await t.click(); t.contexts[0].state = 'interrupted'; await t.contexts[0].dispatch('statechange');
  assert.equal(t.transport.paused, true); assert.equal(t.elements.toggle.attributes['aria-label'], 'Play 001 poliklinika');
  await t.click(); assert.equal(t.transport.paused, false);
});
test('native audio remains functional when Web Audio is unavailable', async () => {
  const t = setup({ webAudio: false }); await t.click(); assert.equal(t.elements.audio.paused, false);
  await t.click(); assert.equal(t.elements.audio.paused, true); assert.equal(t.fetches(), 0);
});
test('very short buffers avoid invalid overlap lengths', async () => {
  const decoded = makeBuffer(1, 2, 1000); const t = setup({ decoded }); await t.click();
  assert.equal(t.contexts[0].sources[0].buffer, decoded);
});

test('interruption while loading cancels pending playback', async () => {
  let release;
  const t = setup({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const pending = t.click();
  t.contexts[0].state = 'interrupted'; await t.contexts[0].dispatch('statechange');
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }); await pending;
  assert.equal(t.transport.paused, true); assert.equal(t.contexts[0].sources.length, 0);
  assert.equal(t.elements.toggle.attributes['aria-label'], 'Play 001 poliklinika');
  assert.equal(t.elements.status.textContent, '');
  await t.click(); assert.equal(t.transport.paused, false); assert.equal(t.contexts[0].sources.length, 1);
});
