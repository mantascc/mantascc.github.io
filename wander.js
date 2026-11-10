(() => {
  const cursor = document.querySelector('.wanderer');
  const text = document.querySelector('main');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const margin = 24;
  const clearance = 42; // Includes the pointer and its glow, not just its center.
  let bounds, obstacle, position, journey;
  let pause = 1.8, elapsed = 0, previous = 0, frame = 0, trips = 0;
  const random = (min, max) => min + Math.random() * (max - min);
  const inside = p => p.x >= obstacle.left && p.x <= obstacle.right && p.y >= obstacle.top && p.y <= obstacle.bottom;
  const inBounds = p => p.x >= margin && p.x <= bounds.width - margin && p.y >= margin && p.y <= bounds.height - margin;
  // A quadratic stays inside the convex hull of its three control points.
  // Keeping that hull on one side of the padded text guarantees a clear path.
  const clearCurve = points => points.every(inBounds) && (
    points.every(p => p.x < obstacle.left) || points.every(p => p.x > obstacle.right) ||
    points.every(p => p.y < obstacle.top) || points.every(p => p.y > obstacle.bottom)
  );
  const point = () => ({ x: random(margin, bounds.width - margin), y: random(margin, bounds.height - margin) });
  function place() {
    cursor.style.transform = `translate3d(${position.x - 12}px, ${position.y - 12}px, 0)`;
  }
  function measure() {
    bounds = { width: innerWidth, height: innerHeight };
    const rect = text.getBoundingClientRect();
    obstacle = { left: rect.left - clearance, right: rect.right + clearance, top: rect.top - clearance, bottom: rect.bottom + clearance };
    journey = null;
    elapsed = 0;
    pause = 1.8;
    if (!position || inside(position) || !inBounds(position)) {
      position = { x: bounds.width * .72, y: bounds.height * .25 };
      for (let tries = 0; tries < 150 && (inside(position) || !inBounds(position)); tries++) position = point();
    }
    if (inside(position) || !inBounds(position)) { cursor.style.opacity = '0'; return; }
    place();
    cursor.style.opacity = reducedMotion.matches ? '0' : '.88';
  }
  function plan() {
    if (inside(position) || !inBounds(position)) return null;
    const longTrip = trips % 3 === 2;
    const minimum = Math.min(longTrip ? 150 : 55, Math.min(bounds.width, bounds.height) * .2);
    for (let tries = 0; tries < 160; tries++) {
      const end = point();
      const distance = Math.hypot(end.x - position.x, end.y - position.y);
      if (distance < minimum || (!longTrip && distance > 320)) continue;
      const bend = random(-distance * .22, distance * .22);
      const control = { x: (position.x + end.x) / 2 - (end.y - position.y) / distance * bend, y: (position.y + end.y) / 2 + (end.x - position.x) / distance * bend };
      if (!clearCurve([position, control, end])) continue;
      return { start: { ...position }, control, end, duration: Math.max(3.8, distance / random(30, 43)) };
    }
    return null;
  }
  function tick(now) {
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now;
    if (!journey) {
      pause -= dt;
      if (pause <= 0) {
        journey = plan();
        elapsed = 0;
        if (!journey) pause = 2;
      }
    } else {
      elapsed += dt;
      const progress = Math.min(1, elapsed / journey.duration);
      const t = progress * progress * (3 - 2 * progress);
      const u = 1 - t;
      const { start, control, end } = journey;
      position = { x: u*u*start.x + 2*u*t*control.x + t*t*end.x, y: u*u*start.y + 2*u*t*control.y + t*t*end.y };
      place();
      if (progress === 1) { journey = null; trips++; pause = trips % 3 === 0 ? random(3.5, 5.5) : random(1.6, 3.2); }
    }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    previous = 0;
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(measure).observe(text);
  addEventListener('resize', measure);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', () => { measure(); resume(); });
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
  resume();
})();
