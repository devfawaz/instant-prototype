(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const money = (n, decimals = 2) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  /* ---------- Load: staggered reveal, bar growth, count-up ---------- */
  document.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('.hbar-fill').forEach((el, j) => el.style.setProperty('--j', j));

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const render = (v) => { el.textContent = prefix + money(v, decimals) + suffix; };
    if (reduceMotion) return render(target);
    const duration = 1300;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      render(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    render(0);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
    document.querySelectorAll('[data-count]').forEach(countUp);
  });

  /* ---------- Info tooltips ---------- */
  const tip = document.getElementById('tip');

  function placeBelow(floating, anchorRect, gap) {
    const margin = 8;
    const w = floating.offsetWidth;
    const h = floating.offsetHeight;
    let left = anchorRect.left + anchorRect.width / 2 - w / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    let top = anchorRect.bottom + gap;
    if (top + h > window.innerHeight - margin) top = anchorRect.top - gap - h;
    floating.style.left = `${left}px`;
    floating.style.top = `${top}px`;
  }

  function showTip(anchor, text) {
    tip.textContent = text;
    tip.classList.add('is-visible');
    placeBelow(tip, anchor.getBoundingClientRect(), 2);
  }
  const hideTip = () => tip.classList.remove('is-visible');

  document.querySelectorAll('.info').forEach((btn) => {
    const show = () => showTip(btn, btn.dataset.tip);
    btn.addEventListener('mouseenter', show);
    btn.addEventListener('focus', show);
    btn.addEventListener('mouseleave', hideTip);
    btn.addEventListener('blur', hideTip);
  });

  document.querySelectorAll('.hbar').forEach((bar) => {
    const fill = bar.querySelector('.hbar-fill');
    const pct = Math.round(parseFloat(bar.dataset.share) * 100);
    bar.addEventListener('mouseenter', () =>
      showTip(fill, `${pct}% of revenue this period`));
    bar.addEventListener('mouseleave', hideTip);
  });

  document.querySelector('.body-wrapper').addEventListener('scroll', hideTip, { passive: true });

  /* ---------- Live earnings ticker ---------- */
  const liveEl = document.getElementById('live-value');
  const updatedEl = document.getElementById('last-updated');
  let live = 1248.57;
  let lastBump = null;

  setInterval(() => {
    live += 4 + Math.random() * 38;
    liveEl.textContent = '$' + money(live);
    liveEl.classList.add('is-bumped');
    setTimeout(() => liveEl.classList.remove('is-bumped'), 700);
    lastBump = Date.now();
    updatedEl.textContent = 'Last updated just now';
  }, 9000);

  setInterval(() => {
    if (!lastBump) return;
    const mins = Math.floor((Date.now() - lastBump) / 60000);
    if (mins >= 1) updatedEl.textContent = `Last updated ${mins} min ago`;
  }, 15000);

  /* ---------- Revenue over time chart ---------- */
  const plot = document.getElementById('graph-plot');
  const svgHost = document.getElementById('graph-svg');
  const guide = document.getElementById('graph-guide');
  const point = document.getElementById('graph-point');
  const earned = document.getElementById('earned');
  const earnedDate = document.getElementById('earned-date');
  const earnedTotal = document.getElementById('earned-total');
  const earnedFlow = document.getElementById('earned-flow');

  const FLOWS = ['Add to Cart Abandonment', 'Checkout Abandonment', 'Email'];
  const PEAK_VALUE = 28354.38;
  const START = new Date(2025, 2, 16);

  fetch('assets/graph-line.svg')
    .then((r) => r.text())
    .then((markup) => {
      svgHost.innerHTML = markup;
      const svg = svgHost.querySelector('svg');
      svg.querySelectorAll('path').forEach((p) => p.setAttribute('vector-effect', 'non-scaling-stroke'));
      if (!reduceMotion) {
        svg.classList.add('is-drawing');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          svg.classList.remove('is-drawing');
          svg.classList.add('is-drawn');
        }));
      }
      initChart(svg);
    })
    .catch(() => {
      svgHost.innerHTML = '<img src="assets/graph-line.svg" alt="" width="1137.81" height="238.408" style="width:100%;height:100%">';
    });

  function initChart(svg) {
    const vb = svg.viewBox.baseVal;
    const line = svg.querySelector('#Vector_2');
    // The path is absolute M/L/H/V segments; walk them to recover each day's vertex.
    const verts = [];
    let cx = 0;
    let cy = 0;
    line.getAttribute('d').replace(/([MLHV])([^MLHVZ]*)/gi, (_, cmd, args) => {
      const n = args.trim().split(/[\s,]+/).map(Number);
      if (cmd === 'H') cx = n[0];
      else if (cmd === 'V') cy = n[0];
      else { cx = n[0]; cy = n[1]; }
      verts.push({ x: cx, y: cy });
    });

    const baseline = 237.926;
    const peakY = Math.min(...verts.map((v) => v.y));
    const days = verts.map((v, i) => {
      const date = new Date(START);
      date.setDate(START.getDate() + i);
      const isPeak = v.y === peakY;
      const raw = ((baseline - v.y) / (baseline - peakY)) * PEAK_VALUE;
      const value = isPeak ? PEAK_VALUE : Math.round(raw) + ((i * 37) % 100) / 100;
      const r = (i * 7) % 5;
      return {
        ...v,
        label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        value,
        flow: isPeak ? FLOWS[0] : FLOWS[r < 3 ? 0 : r - 2],
      };
    });

    let active = -1;

    function geometry() {
      const plotRect = plot.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      return {
        plotRect,
        sx: svgRect.width / vb.width,
        sy: svgRect.height / vb.height,
        ox: svgRect.left - plotRect.left,
      };
    }

    function show(i) {
      active = i;
      const d = days[i];
      const g = geometry();
      const px = d.x * g.sx + g.ox;
      const py = d.y * g.sy;
      guide.style.left = `${px}px`;
      point.style.left = `${px}px`;
      point.style.top = `${py}px`;
      plot.classList.add('is-hover');

      earnedDate.textContent = d.label;
      earnedTotal.textContent = '$' + money(d.value);
      earnedFlow.textContent = d.flow;
      earned.classList.add('is-visible');
      const anchor = {
        left: g.plotRect.left + px,
        width: 0,
        top: g.plotRect.top + py - 13,
        bottom: g.plotRect.top + py + 13,
      };
      placeBelow(earned, anchor, 0);
    }

    function hide() {
      active = -1;
      plot.classList.remove('is-hover');
      earned.classList.remove('is-visible');
    }

    function nearest(clientX) {
      const g = geometry();
      const x = (clientX - g.plotRect.left - g.ox) / g.sx;
      let best = 0;
      for (let i = 1; i < days.length; i++) {
        if (Math.abs(days[i].x - x) < Math.abs(days[best].x - x)) best = i;
      }
      return best;
    }

    plot.tabIndex = 0;
    plot.addEventListener('pointermove', (e) => {
      const i = nearest(e.clientX);
      if (i !== active) show(i);
    });
    plot.addEventListener('pointerleave', hide);
    plot.addEventListener('focus', () => show(active < 0 ? days.length - 1 : active));
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(Math.max(0, active - 1));
      else if (e.key === 'ArrowRight') show(Math.min(days.length - 1, active + 1));
      else return;
      e.preventDefault();
    });
    window.addEventListener('resize', () => { if (active >= 0) show(active); });
    document.querySelector('.body-wrapper').addEventListener('scroll', hide, { passive: true });
  }
})();
