(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highscoreEl = document.getElementById('highscore');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  const tileSize = 20;
  const gridSize = Math.floor(canvas.width / tileSize);
  const speedInitialMsPerStep = 120;

  const colors = {
    grid: '#2c1212',
    dragonStart: '#ffdd8f',
    dragonMid: '#ff8f4f',
    dragonEnd: '#8c1f1f',
    dragonOutline: '#2f0505',
    foodCore: '#ffe38f',
    foodCorona: '#ff6d34',
    foodSpark: 'rgba(255,213,130,0.55)',
    bg1: '#1a0808',
    bg2: '#090203',
    overlay: 'rgba(0,0,0,0.45)',
    pause: '#ffae5c',
    gameOver: '#ff6f6f',
  };

  /** @typedef {{x:number,y:number}} Vec2 */

  let snake = [];
  /** @type {Vec2} */
  let food = { x: 10, y: 10 };
  /** @type {Vec2} */
  let direction = { x: 1, y: 0 };
  /** @type {Vec2[]} */
  let directionQueue = [];
  let score = 0;
  let highscore = Number(localStorage.getItem('snake_highscore') || '0');
  let isPaused = false;
  let isGameOver = false;
  let stepIntervalMs = speedInitialMsPerStep;
  let lastStepAt = 0;
  let lastFlameEmit = 0;
  let lastParticleTime = null;

  const particles = [];

  class Particle {
    constructor(x, y, vx, vy, life, colorStops) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.life = life;
      this.maxLife = life;
      this.colorStops = colorStops;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
    }

    draw(ctx) {
      if (this.life <= 0) return;
      const t = 1 - this.life / this.maxLife;
      const color = sampleGradient(this.colorStops, clamp01(t));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const size = 16 * (this.life / this.maxLife);
      const gradient = ctx.createRadialGradient(this.x, this.y, size * 0.1, this.x, this.y, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x - size, this.y - size, size * 2, size * 2);
      ctx.restore();
    }
  }

  function initializeGame() {
    snake = [
      { x: 6, y: 14 },
      { x: 5, y: 14 },
      { x: 4, y: 14 },
    ];
    direction = { x: 1, y: 0 };
    directionQueue = [];
    score = 0;
    isPaused = false;
    isGameOver = false;
    stepIntervalMs = speedInitialMsPerStep;
    particles.length = 0;
    spawnFood();
    updateScoreUI();
  }

  function updateScoreUI() {
    scoreEl.textContent = String(score);
    highscoreEl.textContent = String(highscore);
    pauseBtn.textContent = isPaused ? '▶︎ ادامه' : '⏸︎ مکث';
  }

  function spawnFood() {
    while (true) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      const onSnake = snake.some(seg => seg.x === x && seg.y === y);
      if (!onSnake) {
        food = { x, y };
        return;
      }
    }
  }

  function enqueueDirection(newDir) {
    const lastDir = directionQueue[directionQueue.length - 1] || direction;
    if (lastDir.x + newDir.x === 0 && lastDir.y + newDir.y === 0) return;
    directionQueue.push(newDir);
  }

  function step() {
    if (isPaused || isGameOver) return;

    if (directionQueue.length) {
      direction = directionQueue.shift();
    }

    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };

    if (next.x < 0) next.x = gridSize - 1;
    if (next.x >= gridSize) next.x = 0;
    if (next.y < 0) next.y = gridSize - 1;
    if (next.y >= gridSize) next.y = 0;

    if (snake.some((seg, i) => i > 0 && seg.x === next.x && seg.y === next.y)) {
      gameOver();
      return;
    }

    const ate = next.x === food.x && next.y === food.y;
    snake.unshift(next);
    if (ate) {
      score += 10;
      stepIntervalMs = Math.max(55, stepIntervalMs - 3);
      burstFood(next);
      spawnFood();
    } else {
      snake.pop();
    }
    updateScoreUI();
  }

  function gameOver() {
    isGameOver = true;
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('snake_highscore', String(highscore));
    }
    updateScoreUI();
  }

  function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    updateScoreUI();
  }

  function restart() {
    initializeGame();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, colors.bg1);
    grad.addColorStop(1, colors.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colors.grid;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      const p = i * tileSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(canvas.width, p);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = 'rgba(255,136,68,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const x = (i * 87) % canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + 40,
        canvas.height * 0.25,
        x - 20,
        canvas.height * 0.6,
        x + 14,
        canvas.height
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDragon(timestamp) {
    if (snake.length === 0) return;
    const points = snake.map(s => ({
      x: s.x * tileSize + tileSize / 2,
      y: s.y * tileSize + tileSize / 2,
    }));

    // Wings near the neck (index 2) with flap animation
    if (points.length > 3) {
      const flap = Math.sin(timestamp / 180) * 0.6 + 0.7; // 0.1..1.3
      drawWings(points[2], points[1], flap);
    }

    // Body (tapered ellipses + dorsal spikes)
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const ang = Math.atan2(dy, dx);
      const t = i / Math.max(1, points.length - 1);
      const bodyRadius = tileSize * (0.55 - t * 0.35); // taper
      const fill = dragonGradient(t);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);

      // main segment (elliptical)
      const rx = bodyRadius * 1.1;
      const ry = bodyRadius * 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      const grad = ctx.createLinearGradient(-rx, 0, rx, 0);
      grad.addColorStop(0, fill);
      grad.addColorStop(1, 'rgba(30,5,5,0.9)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.dragonOutline;
      ctx.stroke();

      // dorsal spikes every 3rd segment (skip head)
      if (i % 3 === 0 && i !== 0) {
        ctx.save();
        ctx.rotate(Math.PI / 2); // normal
        ctx.fillStyle = 'rgba(255,224,160,0.9)';
        ctx.beginPath();
        ctx.moveTo(0, -ry * 0.2);
        ctx.lineTo(ry * 0.9, -ry * 1.6);
        ctx.lineTo(-ry * 0.9, -ry * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Head last so it overlays
    const head = points[0];
    const neck = points[1] || head;
    const dAng = Math.atan2(head.y - neck.y, head.x - neck.x);
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(dAng);
    ctx.fillStyle = colors.dragonStart;
    ctx.strokeStyle = colors.dragonOutline;
    ctx.lineWidth = 1.6;
    drawDragonHead(direction);
    ctx.restore();
  }

  function drawFood(timestamp) {
    const x = food.x * tileSize + tileSize / 2;
    const y = food.y * tileSize + tileSize / 2;
    const radius = tileSize * 0.38;
    const pulse = 1 + Math.sin(timestamp / 220) * 0.12;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.1);
    glow.addColorStop(0, 'rgba(255,230,170,0.9)');
    glow.addColorStop(0.5, 'rgba(255,96,38,0.55)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 2.2, y - radius * 2.2, radius * 4.4, radius * 4.4);

    const ember = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * pulse);
    ember.addColorStop(0, colors.foodCore);
    ember.addColorStop(1, colors.foodCorona);
    ctx.fillStyle = ember;
    ctx.beginPath();
    ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = colors.foodSpark;
    for (let i = 0; i < 3; i++) {
      const angle = (timestamp / 340 + i * 2) % (Math.PI * 2);
      const sx = x + Math.cos(angle) * radius * 1.4;
      const sy = y + Math.sin(angle) * radius * 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawOverlayText(text, color = '#ffffff') {
    ctx.save();
    ctx.fillStyle = colors.overlay;
    ctx.fillRect(0, canvas.height / 2 - 42, canvas.width, 84);
    ctx.font = '800 30px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 12);
    ctx.restore();
  }

  function drawParticles(timestamp) {
    const now = timestamp / 1000;
    const prev = lastParticleTime ?? now;
    const dt = Math.min(0.06, now - prev);
    lastParticleTime = now;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(dt);
      if (p.life <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }
  }

  function draw(timestamp) {
    drawBackground();
    drawFood(timestamp);
    drawDragon(timestamp);
    emitHeadFlame(timestamp);
    drawParticles(timestamp);
    if (isPaused && !isGameOver) {
      drawOverlayText('مکث', colors.pause);
    }
    if (isGameOver) {
      drawOverlayText('پایان بازی - ↻ شروع دوباره', colors.gameOver);
    }
  }

  function gameLoop(timestamp) {
    if (!lastStepAt) lastStepAt = timestamp;
    const delta = timestamp - lastStepAt;
    if (delta >= stepIntervalMs) {
      step();
      lastStepAt = timestamp;
    }
    draw(timestamp);
    requestAnimationFrame(gameLoop);
  }

  // ---- Visual helpers ----

  function drawScale(size, t) {
    const squish = 1 - Math.sin(t * Math.PI) * 0.18;
    ctx.scale(squish, 1);
    roundedRect(-size / 2, -size / 2, size, size, size * 0.35);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.moveTo(-size * 0.4, 0);
    ctx.quadraticCurveTo(0, size * 0.45, size * 0.4, 0);
    ctx.stroke();
  }

  function drawDragonHead(dir) {
    const angle = Math.atan2(dir.y, dir.x);
    ctx.rotate(angle);

    // Skull
    ctx.beginPath();
    ctx.moveTo(tileSize * 0.40, 0);
    ctx.quadraticCurveTo(tileSize * 0.26, tileSize * 0.30, -tileSize * 0.06, tileSize * 0.24);
    ctx.quadraticCurveTo(-tileSize * 0.42, 0, -tileSize * 0.06, -tileSize * 0.24);
    ctx.quadraticCurveTo(tileSize * 0.26, -tileSize * 0.30, tileSize * 0.40, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jaw (open slightly)
    ctx.beginPath();
    ctx.moveTo(tileSize * 0.18, tileSize * 0.10);
    ctx.quadraticCurveTo(tileSize * 0.28, tileSize * 0.18, tileSize * 0.36, tileSize * 0.08);
    ctx.strokeStyle = 'rgba(255,220,160,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Horns
    ctx.strokeStyle = '#f9eccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-tileSize * 0.08, -tileSize * 0.22);
    ctx.lineTo(-tileSize * 0.30, -tileSize * 0.58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-tileSize * 0.08, tileSize * 0.22);
    ctx.lineTo(-tileSize * 0.30, tileSize * 0.58);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#ffd95a';
    ctx.beginPath();
    ctx.arc(tileSize * 0.2, -tileSize * 0.12, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tileSize * 0.2, tileSize * 0.12, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Muzzle highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(tileSize * 0.14, 0);
    ctx.lineTo(tileSize * 0.3, 0);
    ctx.stroke();
  }

  function drawWings(pivot, toward, flap) {
    const dx = pivot.x - toward.x;
    const dy = pivot.y - toward.y;
    const ang = Math.atan2(dy, dx);
    const span = tileSize * 2.2;
    const len = tileSize * (2.2 + 0.5 * flap);

    ctx.save();
    ctx.translate(pivot.x, pivot.y);
    ctx.rotate(ang);
    const grad = ctx.createLinearGradient(0, 0, 0, len);
    grad.addColorStop(0, 'rgba(255,210,150,0.75)');
    grad.addColorStop(1, 'rgba(120,20,10,0.85)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = colors.dragonOutline;
    ctx.lineWidth = 1;

    // left wing
    ctx.save();
    ctx.rotate(-flap * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-span * 0.4, len * 0.3, -span, len);
    ctx.lineTo(-span * 0.2, len * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // right wing
    ctx.save();
    ctx.scale(1, -1);
    ctx.rotate(-flap * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-span * 0.4, len * 0.3, -span, len);
    ctx.lineTo(-span * 0.2, len * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function emitHeadFlame(timestamp) {
    if (!snake.length || isPaused || isGameOver) return;
    if (timestamp - lastFlameEmit < 45) return;
    lastFlameEmit = timestamp;
    const head = snake[0];
    spawnFlameTrail(head, direction);
  }

  function spawnFlameTrail(head, dir) {
    const cx = head.x * tileSize + tileSize / 2;
    const cy = head.y * tileSize + tileSize / 2;
    const base = 0.18;
    for (let i = 0; i < 4; i++) {
      const jitter = (Math.random() - 0.5) * tileSize * 0.6;
      particles.push(
        new Particle(
          cx + jitter,
          cy + jitter,
          (-dir.x * base + (Math.random() - 0.5) * 0.08) * tileSize,
          (-dir.y * base + (Math.random() - 0.5) * 0.08) * tileSize,
          0.5 + Math.random() * 0.4,
          ['#ffefb0', '#ff9138', 'rgba(90,12,5,0.05)']
        )
      );
    }
  }

  function burstFood(pos) {
    const cx = pos.x * tileSize + tileSize / 2;
    const cy = pos.y * tileSize + tileSize / 2;
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = (0.2 + Math.random() * 0.35) * tileSize;
      particles.push(
        new Particle(
          cx,
          cy,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.7 + Math.random() * 0.4,
          ['#fff2b0', '#ff9430', 'rgba(90,12,5,0.1)']
        )
      );
    }
  }

  function dragonGradient(t) {
    if (t < 0.4) {
      return lerpColor(colors.dragonStart, colors.dragonMid, t / 0.4);
    }
    return lerpColor(colors.dragonMid, colors.dragonEnd, (t - 0.4) / 0.6);
  }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function sampleGradient(stops, t) {
    if (stops.length === 1) return stops[0];
    const step = 1 / (stops.length - 1);
    const idx = Math.min(stops.length - 2, Math.floor(t / step));
    const localT = (t - idx * step) / step;
    return lerpColor(stops[idx], stops[idx + 1], localT);
  }

  function lerpColor(a, b, t) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    const alpha = ca.a + (cb.a - ca.a) * t;
    return `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
  }

  function parseColor(color) {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const int = parseInt(hex, 16);
      return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
        a: 1,
      };
    }
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match) return { r: 255, g: 255, b: 255, a: 1 };
    const parts = match[1].split(',').map(v => Number(v.trim()));
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts[3] ?? 1,
    };
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  // ---- Input ----

  const keyToDir = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.code === 'Space') {
      togglePause();
      return;
    }
    const k = e.key.toLowerCase();
    const dir = keyToDir[e.key] || keyToDir[k];
    if (dir) {
      enqueueDirection(dir);
      e.preventDefault();
    }
    if ((e.key === 'r' || e.key === 'R') && isGameOver) {
      restart();
    }
  });

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });
  restartBtn.addEventListener('click', () => {
    restart();
  });

  document.querySelectorAll('.mobile-controls .pad').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-dir');
      if (dir === 'up') enqueueDirection({ x: 0, y: -1 });
      if (dir === 'down') enqueueDirection({ x: 0, y: 1 });
      if (dir === 'left') enqueueDirection({ x: -1, y: 0 });
      if (dir === 'right') enqueueDirection({ x: 1, y: 0 });
    });
  });

  (function enableSwipe(el) {
    let sx = 0, sy = 0, swiping = false;
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; swiping = true;
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      const t = e.touches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) > 24) {
        if (adx > ady) {
          enqueueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
        } else {
          enqueueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
        }
        swiping = false;
      }
    }, { passive: true });
    el.addEventListener('touchend', () => {
      swiping = false;
    });
  })(canvas);

  // Bootstrap
  highscoreEl.textContent = String(highscore);
  initializeGame();
  requestAnimationFrame(gameLoop);
})();

