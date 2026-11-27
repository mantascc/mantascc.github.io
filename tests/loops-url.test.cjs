const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../aida/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(hash = '') {
  const events = {}, pushes = [], loaded = [];
  const location = { hash };
  const context = vm.createContext({
    location, history: { pushState(_, __, hash) { pushes.push(hash); location.hash = hash; } },
    addEventListener: (event, fn) => { events[event] = fn; },
    closeIndex() {}, renderTracks() {}, stopSource() {}, toggle() {},
    load: async t => { loaded.push(t.n); return true; }
  });
  vm.runInContext(script.slice(script.indexOf('const TRACKS'), script.indexOf('const PAL')), context);
  vm.runInContext(script.slice(script.indexOf('const trackFromHash'), script.indexOf('const B =')), context);
  vm.runInContext('let playing = false, paused = 0, duration = track.dur;', context);
  vm.runInContext(script.slice(script.indexOf('async function select'), script.indexOf('const step =')), context);
  return { context, events, pushes, loaded, location, current: () => vm.runInContext('track.n', context) };
}
test('shared numeric hashes select the corresponding loop on load', () => {
  for (const n of ['001', '002', '003', '004']) assert.equal(setup('#' + n).current(), n);
});
test('empty and unknown hashes fall back to the first loop', () => {
  for (const hash of ['', '#999', '#warning', '#%']) assert.equal(setup(hash).current(), '001');
});
test('selecting a loop updates the share URL without duplicate history entries', async () => {
  const t = setup('#001');
  await vm.runInContext('select(TRACKS[3])', t.context);
  assert.equal(t.current(), '004'); assert.deepEqual(t.pushes, ['#004']);
  await vm.runInContext('select(TRACKS[3])', t.context);
  assert.deepEqual(t.pushes, ['#004']);
});
test('hash navigation selects and loads a loop without pushing more history', async () => {
  const t = setup('#004'); t.location.hash = '#002';
  await t.events.hashchange();
  assert.equal(t.current(), '002'); assert.deepEqual(t.loaded, ['002']); assert.deepEqual(t.pushes, []);
});
test('legacy loops links preserve the selected loop and query when redirecting', () => {
  const legacy = fs.readFileSync(path.join(__dirname, '../aida/loops.html'), 'utf8');
  let target;
  vm.runInNewContext(legacy.match(/<script>([\s\S]*?)<\/script>/)[1], {
    location: { search: '?source=share', hash: '#004', replace: url => { target = url; } }
  });
  assert.equal(target, '/aida/?source=share#004');
});
