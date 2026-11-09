const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '../aida/players.js'), 'utf8');

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
  const makeElements = () => Object.fromEntries(['audio', 'toggle', 'seek', 'elapsed', 'duration', 'status', 'player'].map(id => [id, new Element()]));
  const elements = makeElements();
  const second = makeElements();
  const audio = elements.audio;
  Object.assign(audio, { src: 'poliklinika.mp3', currentSrc: 'poliklinika.mp3', duration: decoded.duration, currentTime: 0, paused: true });
  audio.play = async () => { audio.paused = false; await audio.dispatch('play'); await audio.dispatch('playing'); };
  audio.pause = () => { audio.paused = true; audio.dispatch('pause'); };
  Object.assign(second.audio, { src: 'garsas.mp3', duration: 1, currentTime: 0, paused: true });
  const roots = [elements, second].map((items, i) => ({ dataset: { title: i ? '002 garsas' : '001 poliklinika', ...(i ? {loopSrc: 'garsas-loop.wav'} : {}) }, classList: new Element().classList, querySelector: selector => items[selector === '.player' ? 'player' : selector.match(/data-role="([^"]+)"/)[1]] }));
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
    document: { querySelectorAll: () => roots }, location: {protocol: 'https:'},
    window, fetch: (...args) => { fetches++; return fetch ? fetch(...args) : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }); },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}
  });
  vm.runInContext(script, sandbox);
  return { elements, contexts, window, fetches: () => fetches, second, clickSecond: () => second.toggle.dispatch('click'), click: () => elements.toggle.dispatch('click') };
}


test('switching tracks stops the previous audio and uses the prepared Garsas loop unchanged', async () => {
  const t = setup(); await t.click();
  assert.equal(t.contexts[0].sources[0].loop, true);
  await t.clickSecond();
  assert.equal(t.contexts[0].sources[0].stopped, true);
  assert.equal(t.elements.toggle.attributes['aria-label'], 'Play 001 poliklinika');
  assert.equal(t.second.toggle.attributes['aria-label'], 'Pause 002 garsas');
  assert.equal(t.contexts[1].sources[0].buffer.length, 1000);
  assert.equal(t.contexts[1].sources[0].loop, true);
});
test('switching while loading never starts the abandoned track', async () => {
  const releases = [];
  const t = setup({fetch: () => new Promise(resolve => releases.push(resolve))});
  const first = t.click(); const second = t.clickSecond();
  for (const resolve of releases) resolve({ok: true, arrayBuffer: async () => new ArrayBuffer(0)});
  await Promise.all([first, second]);
  assert.equal(t.contexts[0].sources.length, 0);
  assert.equal(t.contexts[1].sources.length, 1);
  assert.equal(t.elements.status.textContent, '');
});
test('seeking and resuming retain the requested position', async () => {
  const t = setup(); await t.clickSecond();
  t.second.seek.value = 0.7; await t.second.seek.dispatch('input');
  assert.equal(t.contexts[0].sources[1].offset, 0.7);
  assert.equal(t.contexts[0].sources[0].stopped, true);
  await t.clickSecond(); await t.clickSecond();
  assert.equal(t.contexts[0].sources[2].offset, 0.7);
});
test('load failures report an error and can retry', async () => {
  let ok = false;
  const t = setup({fetch: async () => ({ok, arrayBuffer: async () => new ArrayBuffer(0)})});
  await t.clickSecond(); assert.match(t.second.status.textContent, /Unable to play/);
  ok = true; await t.clickSecond();
  assert.equal(t.contexts[0].sources.length, 1);
  assert.equal(t.second.status.textContent, '');
});
