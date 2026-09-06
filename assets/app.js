(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // ------------------------------------------------------------
  // 1) Active section navigation
  // ------------------------------------------------------------
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = `#${visible[0].target.id}`;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      },
      { rootMargin: '-20% 0px -62% 0px', threshold: [0, 0.05, 0.2] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  // ------------------------------------------------------------
  // 2) Action Horizon vs Execution Horizon
  // ------------------------------------------------------------
  const actionCells = document.getElementById('actionCells');
  const executionSlider = document.getElementById('executionHorizon');
  const executionValue = document.getElementById('executionValue');
  const executeCount = document.getElementById('executeCount');
  const discardCount = document.getElementById('discardCount');
  const MODEL_ACTION_HORIZON = 40;

  if (actionCells && executionSlider) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < MODEL_ACTION_HORIZON; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'action-cell';
      cell.dataset.i = `a${i}`;
      cell.setAttribute('aria-label', `action step ${i}`);
      fragment.appendChild(cell);
    }
    actionCells.appendChild(fragment);

    const updateExecution = () => {
      const n = clamp(Number(executionSlider.value), 1, MODEL_ACTION_HORIZON);
      [...actionCells.children].forEach((cell, index) => {
        cell.classList.toggle('executed', index < n);
      });
      executionValue.value = String(n);
      executionValue.textContent = String(n);
      executeCount.textContent = String(n);
      discardCount.textContent = String(MODEL_ACTION_HORIZON - n);
    };

    executionSlider.addEventListener('input', updateExecution);
    updateExecution();
  }

  // ------------------------------------------------------------
  // 3) Flow Matching concept simulator
  //    This deliberately visualizes the straight interpolation used in the
  //    training code: x_t = (1-t) epsilon + t A.
  //    It is NOT a browser reimplementation of the trained GR00T policy.
  // ------------------------------------------------------------
  const flowSlider = document.getElementById('flowSlider');
  const flowTime = document.getElementById('flowTime');
  const noiseLine = document.getElementById('noiseLine');
  const targetLine = document.getElementById('targetLine');
  const currentLine = document.getElementById('currentLine');

  const NUM_ACTION_STEPS = 40;
  const X_MIN = 50;
  const X_MAX = 760;
  const Y_CENTER = 140;

  // Deterministic pseudo-random generator: stable visualization on every load.
  const seededNoise = (() => {
    let seed = 247031;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  })();

  const noise = Array.from({ length: NUM_ACTION_STEPS }, () => {
    const a = seededNoise() - 0.5;
    const b = seededNoise() - 0.5;
    return (a + b) * 105;
  });

  // A smooth target trajectory. The exact curve is pedagogical only.
  const target = Array.from({ length: NUM_ACTION_STEPS }, (_, i) => {
    const p = i / (NUM_ACTION_STEPS - 1);
    return (
      Math.sin(p * Math.PI * 2.1) * 43 +
      Math.sin(p * Math.PI * 0.9 + 0.7) * 21 +
      (p - 0.5) * 24
    );
  });

  const toPolyline = (values) =>
    values
      .map((value, i) => {
        const x = X_MIN + (i / (NUM_ACTION_STEPS - 1)) * (X_MAX - X_MIN);
        const y = Y_CENTER - value;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const renderFlow = (t) => {
    if (!currentLine) return;
    const values = noise.map((eps, i) => (1 - t) * eps + t * target[i]);
    currentLine.setAttribute('points', toPolyline(values));
    if (flowTime) flowTime.textContent = `t = ${t.toFixed(2)}`;
  };

  if (flowSlider && noiseLine && targetLine && currentLine) {
    noiseLine.setAttribute('points', toPolyline(noise));
    targetLine.setAttribute('points', toPolyline(target));

    flowSlider.addEventListener('input', () => {
      renderFlow(Number(flowSlider.value) / 100);
    });
    renderFlow(Number(flowSlider.value) / 100);
  }

  // Keyboard convenience: left/right arrows step the flow simulator by 0.05.
  if (flowSlider) {
    flowSlider.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const delta = event.key === 'ArrowRight' ? 5 : -5;
      flowSlider.value = String(clamp(Number(flowSlider.value) + delta, 0, 100));
      flowSlider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
})();
