import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore } from '../shared/storage';
import { pick } from '../shared/utils';
import './styles.css';

const GAME_ID = 'color-flip';

const COLORS = [
  { id: 'green', hex: '#0f9d58' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'rose', hex: '#f43f5e' },
] as const;

type ColorId = (typeof COLORS)[number]['id'];

type Tile = {
  x: number;
  y: number;
  color: ColorId;
};

export function mountColorFlip(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="cf">
      <div class="cf__hud">
        <div class="cf__stats">
          <span>Score <strong data-cf="score">0</strong></span>
          <span>Best <strong data-cf="best">0</strong></span>
        </div>
        <div class="cf__color">
          <span class="cf__swatch" data-cf="swatch"></span>
          <span data-cf="color-label">Green</span>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" data-cf="restart">New</button>
      </div>
      <p class="cf__hint">Tap anywhere to flip your color. Only step on matching tiles.</p>
      <div class="cf__stage">
        <canvas data-cf="canvas" width="360" height="480" aria-label="Color Flip playfield"></canvas>
        <div class="cf__overlay" data-cf="overlay" role="status">
          <h2>One wrong step</h2>
          <p data-cf="result"></p>
          <button type="button" class="btn" data-cf="again">Play again</button>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-cf="canvas"]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-cf="score"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-cf="best"]')!;
  const swatch = root.querySelector<HTMLElement>('[data-cf="swatch"]')!;
  const colorLabel = root.querySelector<HTMLElement>('[data-cf="color-label"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-cf="overlay"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-cf="result"]')!;
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-cf="restart"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-cf="again"]')!;
  const ctx = canvas.getContext('2d')!;

  let best = loadScore(GAME_ID);
  bestEl.textContent = String(best);

  let score = 0;
  let playerColor: ColorId = 'green';
  let playerX = 0.5;
  let playerY = 0.78;
  let speed = 0.12; // world units per second (y decreases = forward)
  let tiles: Tile[] = [];
  let alive = false;
  let raf = 0;
  let lastTs = 0;
  let pathAngle = 0;
  let nextTileY = 1.05;
  let dpr = 1;

  const TILE_H = 0.09;
  const TILE_W = 0.42;
  const PLAYER_R = 0.028;

  function colorHex(id: ColorId) {
    return COLORS.find((c) => c.id === id)!.hex;
  }

  function setPlayerColor(id: ColorId) {
    playerColor = id;
    const c = COLORS.find((x) => x.id === id)!;
    swatch.style.background = c.hex;
    colorLabel.textContent = c.id[0]!.toUpperCase() + c.id.slice(1);
  }

  function setScore(n: number) {
    score = n;
    scoreEl.textContent = String(score);
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnTiles() {
    while (nextTileY > -0.2) {
      pathAngle += (Math.random() - 0.5) * 0.7;
      pathAngle = Math.max(-0.9, Math.min(0.9, pathAngle));
      const x = 0.5 + Math.sin(pathAngle) * 0.22;
      // Prefer matching color sometimes so the game is fair
      let color: ColorId;
      if (Math.random() < 0.45) {
        color = playerColor;
      } else {
        color = pick(COLORS).id;
      }
      // Ensure variety
      if (tiles.length && tiles[tiles.length - 1]!.color === color && Math.random() < 0.5) {
        color = pick(COLORS.filter((c) => c.id !== color)).id;
      }
      tiles.push({ x, y: nextTileY, color });
      nextTileY -= TILE_H * 0.92;
    }
  }

  function reset() {
    cancelAnimationFrame(raf);
    tiles = [];
    nextTileY = 1.05;
    pathAngle = 0;
    playerX = 0.5;
    playerY = 0.78;
    speed = 0.14;
    setScore(0);
    setPlayerColor('green');
    overlay.classList.remove('is-open');
    alive = true;
    lastTs = 0;
    spawnTiles();
    // Align player onto first few matching tiles
    for (let i = 0; i < 8; i++) {
      if (tiles[i]) tiles[i]!.color = 'green';
    }
    resize();
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    if (!alive) return;
    alive = false;
    best = saveScore(GAME_ID, score);
    bestEl.textContent = String(best);
    resultEl.textContent = `Score ${score}. Best ${best}.`;
    overlay.classList.add('is-open');
    void play('win');
  }

  function flipColor() {
    if (!alive) return;
    unlockAudio();
    const idx = COLORS.findIndex((c) => c.id === playerColor);
    const next = COLORS[(idx + 1) % COLORS.length]!;
    setPlayerColor(next.id);
    void play('blip');
  }

  function loop(ts: number) {
    if (!alive) {
      draw();
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    // Scroll world toward player (tiles move down in screen space = y increases)
    const dy = speed * dt;
    for (const t of tiles) t.y += dy;
    nextTileY += dy;

    // Remove off-screen tiles, award score
    const before = tiles.length;
    tiles = tiles.filter((t) => t.y < 1.2);
    const passed = before - tiles.length;
    if (passed > 0) {
      setScore(score + passed);
      speed = Math.min(0.42, speed + passed * 0.004);
    }

    spawnTiles();

    // Player gently steers toward nearest tile ahead
    const ahead = tiles
      .filter((t) => t.y < playerY && t.y > playerY - 0.25)
      .sort((a, b) => b.y - a.y)[0];
    if (ahead) {
      playerX += (ahead.x - playerX) * Math.min(1, dt * 6);
    }

    // Collision: tile under player
    const under = tiles.find(
      (t) =>
        Math.abs(t.y - playerY) < TILE_H * 0.55 &&
        Math.abs(t.x - playerX) < TILE_W * 0.55,
    );

    if (under) {
      if (under.color !== playerColor) {
        endGame();
      }
    } else {
      // Off path
      const near = tiles.some(
        (t) => Math.abs(t.y - playerY) < TILE_H * 0.7 && Math.abs(t.x - playerX) < TILE_W * 0.75,
      );
      if (!near && tiles.some((t) => t.y > playerY - 0.15)) {
        // grace at start
        if (score > 2) endGame();
      }
    }

    draw();
    if (alive) raf = requestAnimationFrame(loop);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // subtle grid
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, w, h);

    for (const t of tiles) {
      const tw = TILE_W * w;
      const th = TILE_H * h * 0.95;
      const x = t.x * w - tw / 2;
      const y = t.y * h - th / 2;
      const hex = colorHex(t.color);
      ctx.fillStyle = hex;
      ctx.globalAlpha = 0.9;
      roundRect(ctx, x, y, tw, th, 10);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, tw, th, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // player
    const px = playerX * w;
    const py = playerY * h;
    const pr = PLAYER_R * Math.min(w, h) * 3.2;
    ctx.beginPath();
    ctx.arc(px, py, pr + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = colorHex(playerColor);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.stroke();
  }

  function roundRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      flipColor();
    }
  };

  const onPointer = (e: PointerEvent) => {
    e.preventDefault();
    flipColor();
  };

  canvas.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);

  restartBtn.addEventListener('click', () => {
    unlockAudio();
    reset();
  });
  againBtn.addEventListener('click', () => {
    unlockAudio();
    reset();
  });

  reset();

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', resize);
    root.innerHTML = '';
  };
}

const mountEl = document.querySelector<HTMLElement>('[data-game-root="color-flip"]');
if (mountEl) mountColorFlip(mountEl);
