/* ============================================================
   ANIMASI.JS — Partikel, counter, scroll reveal, dll.
   ============================================================ */

/* ---------- 1. PARTIKEL KANVAS ---------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('particles');
  if (!canvas || reduce) return;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, parts = [];

  const COLORS = ['99,102,241', '168,85,247', '6,182,212'];

  function resize() {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    const count = window.innerWidth < 768 ? 32 : 68;
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .28 * dpr,
      vy: (Math.random() - .5) * .28 * dpr,
      r: (Math.random() * 1.6 + 1) * dpr,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  const LINK = 140 * dpr;

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.c + ',.55)';
      ctx.fill();

      for (let j = i + 1; j < parts.length; j++) {
        const q = parts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(99,102,241,' + (0.16 * (1 - d / LINK)) + ')';
          ctx.lineWidth = dpr * 0.8;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  frame();
})();

/* ---------- 2. CURSOR SPOTLIGHT ---------- */
(function () {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;
  if (window.matchMedia('(hover: none)').matches) {
    glow.style.display = 'none';
    return;
  }

  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty;

  window.addEventListener('mousemove', e => {
    tx = e.clientX;
    ty = e.clientY;
  });

  (function loop() {
    cx += (tx - cx) * .12;
    cy += (ty - cy) * .12;
    glow.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    requestAnimationFrame(loop);
  })();
})();

/* ---------- 3. SCROLL PROGRESS ---------- */
(function () {
  const bar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ---------- 4. REVEAL ON SCROLL ---------- */
(function () {
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -60px 0px' });

  items.forEach(el => io.observe(el));
})();

/* ---------- 5. COUNTER ANGKA ---------- */
(function () {
  const nums = document.querySelectorAll('.counter');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const t0 = performance.now();

      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('id-ID') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);

      io.unobserve(el);
    });
  }, { threshold: .5 });

  nums.forEach(n => io.observe(n));
})();

/* ---------- 6. PROGRESS BAR ---------- */
(function () {
  const bars = document.querySelectorAll('.bar[data-fill]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const bar = en.target;
      const span = bar.querySelector('span');
      setTimeout(() => {
        span.style.width = bar.dataset.fill + '%';
      }, 150);
      io.unobserve(bar);
    });
  }, { threshold: .4 });

  bars.forEach(b => io.observe(b));
})();

/* ---------- 7. TILT 3D ---------- */
(function () {
  const card = document.querySelector('.tilt-card');
  if (!card || window.matchMedia('(hover: none)').matches) return;

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    card.style.setProperty('--ry', ((px - .5) * 14).toFixed(2) + 'deg');
    card.style.setProperty('--rx', ((.5 - py) * 12).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  });

  card.addEventListener('mouseleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
})();

/* ---------- 8. MAGNETIC BUTTON ---------- */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .22;
      const y = (e.clientY - r.top - r.height / 2) * .35;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
    });
  });
})();

/* ---------- 9. RIPPLE CLICK ---------- */
(function () {
  document.querySelectorAll('.ripple').forEach(el => {
    el.addEventListener('click', e => {
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement('span');
      span.className = 'rip';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - r.left - size / 2) + 'px';
      span.style.top = (e.clientY - r.top - size / 2) + 'px';
      el.appendChild(span);
      setTimeout(() => span.remove(), 700);
    });
  });
})();

/* ---------- 10. TYPEWRITER ---------- */
(function () {
  const el = document.getElementById('typeTarget');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const words = ['Anda.', 'tanpa batas ruang.', 'lebih terstruktur.', 'penuh insight.'];
  let w = 0, i = 0, deleting = false;

  function step() {
    const word = words[w];
    el.textContent = word.slice(0, i);

    if (!deleting && i < word.length) {
      i++;
      setTimeout(step, 70);
    } else if (!deleting && i === word.length) {
      deleting = true;
      setTimeout(step, 1800);
    } else if (deleting && i > 0) {
      i--;
      setTimeout(step, 35);
    } else {
      deleting = false;
      w = (w + 1) % words.length;
      setTimeout(step, 320);
    }
  }
  step();
})();
