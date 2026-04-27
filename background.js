(() => {
  const desktopCFG = {
    density: 2.3,
    minAgents: 80,
    maxAgents: 600,
    agentSize: 2,
    speed: 0.18,
    jitter: 0.35,
    linkDist: 60,
    linkAlphaNear: 0.6,
    linkAlphaFar: 0.02,
    dotAlphaIdle: 0.18,
    dotAlphaActive: 1.0,
    bgColor: '#0f0f12'
  };

  const mobileCFG = {
    density: 2.0,
    minAgents: 30,
    maxAgents: 120,
    agentSize: 2,
    speed: 0.12,
    jitter: 0.25,
    linkDist: 60,
    linkAlphaNear: 0.7,
    linkAlphaFar: 0.05,
    dotAlphaIdle: 0.22,
    dotAlphaActive: 1.0,
    bgColor: '#0f0f12'
  };

  const isMobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
  const CFG = isMobile ? mobileCFG : desktopCFG;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  let W = 0, H = 0, dpr = 1;
  let agents = [];
  let rafId = null;

  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createAgents();
  }

  function computeAgentCount() {
    const raw = Math.round((W * H) / 10000 * CFG.density);
    return Math.max(CFG.minAgents, Math.min(CFG.maxAgents, raw));
  }

  function createAgents() {
    const count = computeAgentCount();
    agents = Array.from({ length: count }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      vx: rand(-1, 1) * CFG.speed,
      vy: rand(-1, 1) * CFG.speed,
      active: 0
    }));
  }

  function stepAgents() {
    for (const a of agents) {
      a.vx += rand(-CFG.jitter, CFG.jitter) * 0.02;
      a.vy += rand(-CFG.jitter, CFG.jitter) * 0.02;

      const s = Math.hypot(a.vx, a.vy) || 1e-6;
      if (s > CFG.speed) {
        a.vx = (a.vx / s) * CFG.speed;
        a.vy = (a.vy / s) * CFG.speed;
      }

      a.x += a.vx;
      a.y += a.vy;

      if (a.x < -2) a.x = W + 2;
      if (a.x > W + 2) a.x = -2;
      if (a.y < -2) a.y = H + 2;
      if (a.y > H + 2) a.y = -2;

      a.active = 0;
    }
  }

  function drawLinks() {
    const cutoff = CFG.linkDist;
    const cutoff2 = cutoff * cutoff;
    ctx.lineWidth = 1;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= cutoff2) {
          const t = Math.sqrt(d2) / cutoff;
          const alpha = CFG.linkAlphaNear + (CFG.linkAlphaFar - CFG.linkAlphaNear) * t;
          ctx.strokeStyle = `rgba(230,230,230,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          const strength = 1 - t;
          if (strength > a.active) a.active = strength;
          if (strength > b.active) b.active = strength;
        }
      }
    }
  }

  function drawAgents() {
    const s = CFG.agentSize;
    for (const a of agents) {
      const alpha = CFG.dotAlphaIdle + (CFG.dotAlphaActive - CFG.dotAlphaIdle) * a.active;
      ctx.fillStyle = `rgba(230,230,230,${alpha})`;
      ctx.fillRect(Math.round(a.x) - 1, Math.round(a.y) - 1, s, s);
    }
  }

  function clear() {
    ctx.fillStyle = CFG.bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  function frame() {
    clear();
    stepAgents();
    drawLinks();
    drawAgents();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId == null) rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduceMotion) start();
  });

  resize();

  if (reduceMotion) {
    clear();
    drawLinks();
    drawAgents();
  } else {
    start();
  }
})();
