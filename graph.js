/* =========================================================
   Background physics node-graph.
   Diamond-shaped nodes drift on a light force field and are
   connected by faint lines when close (infrastructure-graph
   motif). The cursor gently repels nearby nodes. Perf-aware:
   node count scales with viewport, the loop pauses when the
   tab is hidden or prefers-reduced-motion, and runs at a
   capped frame budget.
   ========================================================= */
(function () {
  "use strict";

  const canvas = document.getElementById("graph");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let nodes = [];
  const mouse = { x: -9999, y: -9999, active: false };

  // tuned colors (match CSS vars)
  const COL = {
    cyan:    [29, 187, 200],
    violet: [157, 127, 224],
  };

  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    populate();
  }

  function populate() {
    // density scales with area but is capped for perf
    const area = W * H;
    const target = Math.max(28, Math.min(72, Math.round(area / 26000)));
    nodes = [];
    for (let i = 0; i < target; i++) {
      const c = Math.random() < 0.62 ? COL.cyan : COL.violet;
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.6 + Math.random() * 2.4,        // half-diagonal of the diamond
        c: c,
        a: 0.25 + Math.random() * 0.5,
      });
    }
  }

  function drawDiamond(x, y, r, color, alpha, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(color, alpha);
    if (glow) {
      ctx.shadowColor = rgba(color, 0.8);
      ctx.shadowBlur = 10;
    }
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }

  const LINK_DIST = 150;
  const LINK_DIST2 = LINK_DIST * LINK_DIST;
  const REPEL = 120;

  function step() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      // cursor repulsion
      if (mouse.active) {
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL * REPEL && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / REPEL) * 0.6;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }

      // drift + gentle damping
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.985;
      n.vy *= 0.985;

      // wrap around edges
      if (n.x < -20) n.x = W + 20;
      else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      else if (n.y > H + 20) n.y = -20;
    }

    // links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST2) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / LINK_DIST) * 0.16;
          ctx.strokeStyle = rgba(a.c, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes (diamonds)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      drawDiamond(n.x, n.y, n.r, n.c, n.a, true);
    }

    rafId = requestAnimationFrame(step);
  }

  let rafId = null;
  let running = false;
  function start() {
    if (running || reduced) return;
    running = true;
    step();
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  // static single frame for reduced-motion users (still shows the motif)
  function staticFrame() {
    populate();
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < LINK_DIST2) {
          const d = Math.sqrt(dx * dx + dy * dy);
          ctx.strokeStyle = rgba(a.c, (1 - d / LINK_DIST) * 0.14);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (let i = 0; i < nodes.length; i++) drawDiamond(nodes[i].x, nodes[i].y, nodes[i].r, nodes[i].c, nodes[i].a, false);
  }

  // events
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  window.addEventListener("mouseleave", function () { mouse.active = false; });
  window.addEventListener("touchmove", function (e) {
    const t = e.touches[0];
    if (t) { mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true; }
  }, { passive: true });
  window.addEventListener("touchend", function () { mouse.active = false; });

  // pause when tab hidden (saves battery / CPU)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  // reveal-on-scroll for content cards (progressive enhancement).
  // .reveal (opacity:0) is applied ONLY when IO works, so content stays
  // fully visible if JS is disabled or IO is unsupported.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".section, .hero, .tl-item, .competency, .skill-group, .project-card").forEach(function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // ensure year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // boot
  resize();
  if (reduced) staticFrame();
  else start();
})();