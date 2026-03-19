// ── CONFIG ───────────────────────────────────────────────────────
const CONFIG = {
  totalSlides: 11,
  countUpDuration: 1400,
};

const STREAM_CHARS = [
  'CVE-', '192.', 'AES-', 'NĐ85', 'KEV-', 'CVSS',
  '0x4A', 'P1::', 'SLA!', 'HIGH', 'CRIT', 'EPSS'
];

// ── DataStreamCanvas ─────────────────────────────────────────────
class DataStreamCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.columns = [];
    this.resize();
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const colCount = Math.floor(this.canvas.width / 20);
    this.columns = Array.from({length: colCount}, () => Math.random() * this.canvas.height);
  }
  draw() {
    this.ctx.fillStyle = 'rgba(1,11,23,0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(0,207,255,0.055)';
    this.ctx.font = '11px "Fira Code", monospace';
    for (let i = 0; i < this.columns.length; i++) {
      const char = STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)];
      this.ctx.fillText(char, i * 20, this.columns[i]);
      if (this.columns[i] > this.canvas.height && Math.random() > 0.975) this.columns[i] = 0;
      this.columns[i] += 11;
    }
  }
  start() {
    const step = () => { this.draw(); setTimeout(() => requestAnimationFrame(step), 130); };
    step();
  }
}

// ── NetworkCanvas ─────────────────────────────────────────────────
class NetworkCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.resize();
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const count = window.innerWidth < 768 ? 18 : 38;
    this.nodes = Array.from({length: count}, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      isAlert: Math.random() < 0.1
    }));
  }
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.nodes.length; i++) {
      const p = this.nodes[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = p.isAlert ? 'rgba(255,23,68,0.22)' : 'rgba(0,207,255,0.07)';
      this.ctx.fill();
      for (let j = i + 1; j < this.nodes.length; j++) {
        const p2 = this.nodes[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 130) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y); this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(0,207,255,${(0.07 - dist/1860).toFixed(3)})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }
  start() {
    const step = () => { this.draw(); requestAnimationFrame(step); };
    step();
  }
}

// ── Animation helpers ─────────────────────────────────────────────
function countUp(el, target, duration, suffix = '') {
  let startTime = null;
  const ease = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const step = (now) => {
    if (!startTime) startTime = now;
    const p = Math.min((now - startTime) / duration, 1);
    el.innerText = Math.floor(ease(p) * target).toLocaleString('vi-VN') + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.innerText = target.toLocaleString('vi-VN') + suffix;
  };
  requestAnimationFrame(step);
}

function staggerReveal(el, delay) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)';
  setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, delay);
}

function runEntranceAnimations(slide) {
  slide.querySelectorAll('[data-countup]').forEach(el => {
    countUp(el, parseFloat(el.dataset.countup), CONFIG.countUpDuration, el.dataset.suffix || '');
  });
  slide.querySelectorAll('[data-stagger]').forEach((el, i) => {
    staggerReveal(el, i * 90 + 150);
  });
}

// ── SlideShow — Scroll-based, manual only ────────────────────────
class SlideShow {
  constructor() {
    this.stage = document.getElementById('stage');
    this.slides = document.querySelectorAll('.slide');
    this.current = 0;
    this.isScrolling = false;
    this.animatedSlides = new Set();
    this.buildDots();
    this.updateUI(0);
    this.observeSlides();
    this.bindEvents();
    // Animate first slide immediately
    setTimeout(() => this.onSlideEnter(0), 300);
  }

  buildDots() {
    const container = document.getElementById('navDots');
    for (let i = 0; i < CONFIG.totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'nav-dot';
      dot.setAttribute('role', 'tab');
      dot.title = `Slide ${i + 1}`;
      dot.onclick = () => this.goTo(i);
      container.appendChild(dot);
    }
  }

  // IntersectionObserver: fire entrance anim when slide enters viewport
  observeSlides() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const idx = parseInt(entry.target.dataset.slide);
          this.current = idx;
          this.updateUI(idx);
          if (!this.animatedSlides.has(idx)) {
            this.onSlideEnter(idx);
          }
        }
      });
    }, { root: this.stage, threshold: 0.5 });

    this.slides.forEach(slide => observer.observe(slide));
  }

  onSlideEnter(idx) {
    this.animatedSlides.add(idx);
    const slide = document.getElementById(`slide-${idx}`);
    if (!slide) return;

    // Alert flash for Dashboard slide
    if (idx === 4) {
      this.stage.style.boxShadow = 'inset 0 0 120px rgba(255,23,68,0.4)';
      setTimeout(() => this.stage.style.boxShadow = 'none', 500);
    }
    runEntranceAnimations(slide);
  }

  goTo(idx) {
    const target = document.getElementById(`slide-${idx}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updateUI(idx) {
    document.getElementById('slideCounter').innerText =
      `${(idx + 1).toString().padStart(2, '0')} / ${CONFIG.totalSlides}`;
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
    // Vertical progress fill
    document.getElementById('progressFill').style.height =
      `${((idx + 1) / CONFIG.totalSlides) * 100}%`;
  }

  next() { this.goTo(Math.min(this.current + 1, CONFIG.totalSlides - 1)); }
  prev() { this.goTo(Math.max(this.current - 1, 0)); }

  bindEvents() {
    // Buttons
    document.getElementById('btnPrev').addEventListener('click', () => this.prev());
    document.getElementById('btnNext').addEventListener('click', () => this.next());

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
    });

    // Touch swipe (vertical)
    let touchStartY = 0;
    this.stage.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    this.stage.addEventListener('touchend', e => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 40) diff > 0 ? this.next() : this.prev();
    }, { passive: true });

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        window.dataStream && window.dataStream.resize();
        window.networkCanvas && window.networkCanvas.resize();
      }, 200);
    });
  }
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.dataStream = new DataStreamCanvas('canvas-datastream');
  window.networkCanvas = new NetworkCanvas('canvas-network');
  window.dataStream.start();
  window.networkCanvas.start();
  window.show = new SlideShow();
});