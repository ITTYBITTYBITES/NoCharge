import {
  advanceTileForFrame,
  cleanupOffscreenTiles,
  evaluateCheckpoint,
} from './checkpoint-rules';
import { INITIAL_PLAYER_COLOR, selectColorDirectly, type ColorId } from './color-selection';
import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { pick } from '../shared/utils';
import './styles.css';

const GAME_ID = 'color-flip';
const TURN_BASED_GAME_ID = 'color-flip-turn-based';

const COLORS = [
  { id: 'green', hex: '#0f9d58', shortcut: 'G' },
  { id: 'blue', hex: '#3b82f6', shortcut: 'B' },
  { id: 'amber', hex: '#f59e0b', shortcut: 'A' },
  { id: 'rose', hex: '#f43f5e', shortcut: 'R' },
] as const satisfies ReadonlyArray<{ id: ColorId; hex: string; shortcut: string }>;

type Tile = {
  id: number;
  x: number;
  y: number;
  previousY: number;
  color: ColorId;
  evaluated: boolean;
};

type ColorFlipTestApi = {
  setVisualScenario(config: {
    tiles: Array<{ x?: number; y: number; color: ColorId }>;
    speed?: number;
    playerX?: number;
    playerColor?: ColorId;
  }): void;
  getVisualState(): {
    alive: boolean;
    paused: boolean;
    score: number;
    playerColor: ColorId;
    tiles: Tile[];
  };
};

export function mountColorFlip(root: HTMLElement): GameController {
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
        <div class="cf__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-cf="mode">Turn-based mode</button>
        </div>
      </div>
      <p class="cf__hint" id="cf-instructions" data-cf="hint">Select Start, then choose Green, Blue, Amber, or Rose directly; G, B, A, and R are keyboard shortcuts. The chosen color appears in the player circle, and each tile is judged once at the dashed checkpoint. If the circle already matches, leave it unchanged or select the same color again. Clicking the moving canvas does not select a color.</p>
      <div class="cf__visual" data-cf="visual">
        <div class="cf__color-chooser" role="group" aria-labelledby="cf-color-chooser-label">
          <p class="cf__color-chooser-label" id="cf-color-chooser-label">Choose the player circle color</p>
          <div class="cf__color-choices">
            <button type="button" class="cf__color-choice" data-cf-color="green" aria-label="Set player color to Green" aria-keyshortcuts="G" aria-pressed="true" disabled>
              <span class="cf__choice-label"><span class="cf__choice-swatch cf__choice-swatch--green" aria-hidden="true"></span>G · Green</span>
              <span class="cf__choice-status" aria-hidden="true">✓ Selected</span>
            </button>
            <button type="button" class="cf__color-choice" data-cf-color="blue" aria-label="Set player color to Blue" aria-keyshortcuts="B" aria-pressed="false" disabled>
              <span class="cf__choice-label"><span class="cf__choice-swatch cf__choice-swatch--blue" aria-hidden="true"></span>B · Blue</span>
              <span class="cf__choice-status" aria-hidden="true">✓ Selected</span>
            </button>
            <button type="button" class="cf__color-choice" data-cf-color="amber" aria-label="Set player color to Amber" aria-keyshortcuts="A" aria-pressed="false" disabled>
              <span class="cf__choice-label"><span class="cf__choice-swatch cf__choice-swatch--amber" aria-hidden="true"></span>A · Amber</span>
              <span class="cf__choice-status" aria-hidden="true">✓ Selected</span>
            </button>
            <button type="button" class="cf__color-choice" data-cf-color="rose" aria-label="Set player color to Rose" aria-keyshortcuts="R" aria-pressed="false" disabled>
              <span class="cf__choice-label"><span class="cf__choice-swatch cf__choice-swatch--rose" aria-hidden="true"></span>R · Rose</span>
              <span class="cf__choice-status" aria-hidden="true">✓ Selected</span>
            </button>
          </div>
        </div>
        <div class="cf__stage" data-cf="stage">
          <canvas data-cf="canvas" width="360" height="480" aria-label="Moving Color Flip playfield. Use the nearby color buttons to select a color." aria-describedby="cf-instructions">Color Flip requires a browser with canvas support. Use the nearby Green, Blue, Amber, or Rose button to select a color.</canvas>
          <div class="cf__overlay" data-cf="overlay">
            <h2 data-cf="overlay-heading">Ready?</h2>
            <p data-cf="result" aria-live="polite"></p>
            <button type="button" class="btn" data-cf="again">Start</button>
          </div>
        </div>
      </div>
      <section class="cf__accessible" data-cf="accessible" aria-labelledby="cf-accessible-title" hidden>
        <h2 id="cf-accessible-title">Turn-based Color Flip</h2>
        <p>Match the announced tile without a moving canvas. Cycle your color, then step forward.</p>
        <div class="cf__accessible-state">
          <p>Current color: <strong data-cf="accessible-current">Green</strong></p>
          <p>Next tile: <strong data-cf="accessible-next">Green, G</strong></p>
          <p class="sr-only" data-cf="accessible-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
        </div>
        <div class="cf__accessible-actions">
          <button type="button" class="btn btn--ghost" data-cf="accessible-cycle">Cycle color</button>
          <button type="button" class="btn" data-cf="accessible-step">Step forward</button>
        </div>
        <div class="cf__accessible-result" data-cf="accessible-result" hidden>
          <p data-cf="accessible-result-text"></p>
          <button type="button" class="btn" data-cf="accessible-again">Play again</button>
        </div>
      </section>
    </div>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>('[data-cf="canvas"]')!;
  const scoreEl = root.querySelector<HTMLElement>('[data-cf="score"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-cf="best"]')!;
  const swatch = root.querySelector<HTMLElement>('[data-cf="swatch"]')!;
  const colorLabel = root.querySelector<HTMLElement>('[data-cf="color-label"]')!;
  const hint = root.querySelector<HTMLElement>('[data-cf="hint"]')!;
  const visual = root.querySelector<HTMLElement>('[data-cf="visual"]')!;
  const stage = root.querySelector<HTMLElement>('[data-cf="stage"]')!;
  const colorButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-cf-color]')];
  const overlay = root.querySelector<HTMLElement>('[data-cf="overlay"]')!;
  const overlayHeading = root.querySelector<HTMLElement>('[data-cf="overlay-heading"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-cf="result"]')!;
  const modeBtn = root.querySelector<HTMLButtonElement>('[data-cf="mode"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-cf="again"]')!;
  const accessible = root.querySelector<HTMLElement>('[data-cf="accessible"]')!;
  const accessibleCurrent = root.querySelector<HTMLElement>('[data-cf="accessible-current"]')!;
  const accessibleNext = root.querySelector<HTMLElement>('[data-cf="accessible-next"]')!;
  const accessibleAnnouncement = root.querySelector<HTMLElement>('[data-cf="accessible-announcement"]')!;
  const accessibleCycleBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-cycle"]')!;
  const accessibleStepBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-step"]')!;
  const accessibleResult = root.querySelector<HTMLElement>('[data-cf="accessible-result"]')!;
  const accessibleResultText = root.querySelector<HTMLElement>('[data-cf="accessible-result-text"]')!;
  const accessibleAgainBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-again"]')!;
  const ctx = canvas.getContext('2d')!;

  let best = loadScore(GAME_ID);
  bestEl.textContent = String(best);

  let score = 0;
  let turnBased = false;
  let turnBasedAlive = false;
  let turnBasedTarget: ColorId = INITIAL_PLAYER_COLOR;
  let playerColor: ColorId = INITIAL_PLAYER_COLOR;
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
  let paused = false;
  let nextTileId = 1;
  let controlledTestScenario = false;
  const testMode =
    navigator.webdriver && new URLSearchParams(window.location.search).get('colorFlipTest') === 'checkpoint';
  const testWindow = window as typeof window & { __NOCHARGE_COLOR_FLIP_TEST__?: ColorFlipTestApi };
  let testApi: ColorFlipTestApi | undefined;

  const TILE_H = 0.09;
  const TILE_W = 0.42;
  const PLAYER_R = 0.028;

  function colorHex(id: ColorId) {
    return COLORS.find((c) => c.id === id)!.hex;
  }

  function colorName(id: ColorId) {
    return id[0]!.toUpperCase() + id.slice(1);
  }

  function setPlayerColor(id: ColorId) {
    playerColor = id;
    const color = COLORS.find((candidate) => candidate.id === id)!;
    swatch.style.background = color.hex;
    colorLabel.textContent = colorName(id);
    accessibleCurrent.textContent = colorName(id);
    colorButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.cfColor === id));
    });
  }

  function setScore(n: number) {
    score = n;
    scoreEl.textContent = String(score);
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
  }

  function setTurnBasedTarget(id: ColorId) {
    turnBasedTarget = id;
    accessibleNext.textContent = `${colorName(id)}, ${id[0]!.toUpperCase()}`;
  }

  function updateVisualColorControls() {
    const disabled = paused || turnBased || !alive;
    colorButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  function updatePausedControls() {
    modeBtn.disabled = paused;
    updateVisualColorControls();
    accessibleCycleBtn.disabled = paused || !turnBasedAlive;
    accessibleStepBtn.disabled = paused || !turnBasedAlive;
  }

  function announceTurnBased(message: string) {
    accessibleAnnouncement.textContent = message;
  }

  function nextTurnBasedTarget() {
    const choices = COLORS.filter((color) => color.id !== turnBasedTarget);
    return pick(choices).id;
  }

  function startTurnBased() {
    cancelAnimationFrame(raf);
    alive = false;
    turnBasedAlive = true;
    best = loadScore(TURN_BASED_GAME_ID);
    bestEl.textContent = String(best);
    setScore(0);
    setPlayerColor(INITIAL_PLAYER_COLOR);
    setTurnBasedTarget(pick(COLORS).id);
    updatePausedControls();
    accessibleResult.hidden = true;
    announceTurnBased(
      `New turn-based run. Current color ${colorName(playerColor)}. Next tile ${colorName(turnBasedTarget)}.`,
    );
    if (!paused) accessibleCycleBtn.focus();
  }

  function enterTurnBased() {
    turnBased = true;
    visual.hidden = true;
    stage.hidden = true;
    accessible.hidden = false;
    modeBtn.textContent = 'Visual mode';
    hint.textContent =
      'Turn-based mode uses the fixed Green, Blue, Amber, Rose Cycle color control and has no moving-canvas timer.';
    startTurnBased();
  }

  function exitTurnBased() {
    turnBased = false;
    turnBasedAlive = false;
    accessible.hidden = true;
    visual.hidden = false;
    stage.hidden = false;
    modeBtn.textContent = 'Turn-based mode';
    hint.textContent =
      'Select Start, then choose Green, Blue, Amber, or Rose directly; G, B, A, and R are keyboard shortcuts. The chosen color appears in the player circle, and each tile is judged once at the dashed checkpoint. If the circle already matches, leave it unchanged or select the same color again. Clicking the moving canvas does not select a color.';
    best = loadScore(GAME_ID);
    bestEl.textContent = String(best);
    reset(false);
  }

  function cyclePlayerColor() {
    const index = COLORS.findIndex((color) => color.id === playerColor);
    setPlayerColor(COLORS[(index + 1) % COLORS.length]!.id);
  }

  function cycleTurnBasedColor() {
    if (paused || !turnBasedAlive) return;
    unlockAudio();
    cyclePlayerColor();
    announceTurnBased(`Current color ${colorName(playerColor)}. Next tile ${colorName(turnBasedTarget)}.`);
    void play('blip');
  }

  function stepTurnBased() {
    if (paused || !turnBasedAlive) return;
    unlockAudio();
    if (playerColor !== turnBasedTarget) {
      turnBasedAlive = false;
      best = saveScore(TURN_BASED_GAME_ID, score);
      bestEl.textContent = String(best);
      updatePausedControls();
      accessibleResultText.textContent = `Wrong color. Score ${score}. Best ${best}.`;
      accessibleResult.hidden = false;
      announceTurnBased(
        `Wrong color. You were ${colorName(playerColor)} and the tile was ${colorName(turnBasedTarget)}. Score ${score}. Best ${best}.`,
      );
      accessibleAgainBtn.focus();
      void play('win');
      return;
    }

    setScore(score + 1);
    best = saveScore(TURN_BASED_GAME_ID, score);
    bestEl.textContent = String(best);
    setTurnBasedTarget(nextTurnBasedTarget());
    announceTurnBased(`Correct. Score ${score}. Next tile ${colorName(turnBasedTarget)}.`);
    void play('pop');
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnTiles() {
    if (controlledTestScenario) return;
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
      tiles.push({
        id: nextTileId++,
        x,
        y: nextTileY,
        previousY: nextTileY,
        color,
        evaluated: false,
      });
      nextTileY -= TILE_H * 0.92;
    }
  }

  function reset(start = true) {
    cancelAnimationFrame(raf);
    tiles = [];
    nextTileY = 1.05;
    nextTileId = 1;
    controlledTestScenario = false;
    pathAngle = 0;
    playerX = 0.5;
    playerY = 0.78;
    speed = 0.14;
    setScore(0);
    setPlayerColor(INITIAL_PLAYER_COLOR);
    alive = start;
    updateVisualColorControls();
    lastTs = 0;
    spawnTiles();
    // Align the player onto the first few matching tiles.
    for (let i = 0; i < 8; i++) {
      if (tiles[i]) tiles[i]!.color = 'green';
    }
    resize();
    draw();

    if (start) {
      overlay.classList.remove('is-open');
      if (!paused) {
        colorButtons.find((button) => button.dataset.cfColor === playerColor)?.focus({ preventScroll: true });
        raf = requestAnimationFrame(loop);
      }
    } else {
      overlayHeading.textContent = 'Ready?';
      resultEl.textContent = 'The run begins when you select Start.';
      againBtn.textContent = 'Start';
      overlay.classList.add('is-open');
    }
  }

  function endGame() {
    if (!alive) return;
    alive = false;
    updateVisualColorControls();
    best = saveScore(GAME_ID, score);
    bestEl.textContent = String(best);
    overlayHeading.textContent = 'One wrong step';
    resultEl.textContent = `Score ${score}. Best ${best}.`;
    againBtn.textContent = 'Play again';
    overlay.classList.add('is-open');
    againBtn.focus();
    void play('win');
  }

  function selectVisualColor(requestedColor: ColorId) {
    if (turnBased || paused || !alive) return;
    unlockAudio();
    const nextColor = selectColorDirectly(playerColor, requestedColor, true);
    const changed = nextColor !== playerColor;
    setPlayerColor(nextColor);
    draw();
    if (changed) void play('blip');
  }

  function loop(ts: number) {
    if (paused) return;
    if (!alive) {
      draw();
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    // Scroll world toward the checkpoint (tiles move down in screen space).
    // Each tile retains its pre-frame position so crossing cannot be skipped,
    // including after a pause where lastTs is reset before movement resumes.
    const dy = speed * dt;
    tiles = tiles.map((tile) => advanceTileForFrame(tile, dy, false));
    nextTileY += dy;

    // Off-screen cleanup is deliberately score-neutral. Points are awarded only
    // by a successful, one-time checkpoint evaluation below.
    tiles = cleanupOffscreenTiles(tiles, 1.2).tiles;
    spawnTiles();

    // Preserve the gentle steering toward the nearest tile ahead.
    const ahead = tiles
      .filter((tile) => !tile.evaluated && tile.y < playerY && tile.y > playerY - 0.25)
      .sort((a, b) => b.y - a.y)[0];
    if (ahead) {
      playerX += (ahead.x - playerX) * Math.min(1, dt * 6);
    }

    // A tile is judged exactly once, when its center crosses the player's
    // dashed checkpoint line. Intermediate colors between crossings are safe.
    const horizontalTolerance = TILE_W / 2 + PLAYER_R;
    for (const tile of tiles) {
      const result = evaluateCheckpoint(tile, playerY, playerX, playerColor, horizontalTolerance);
      if (result.status === 'not-crossed' || result.status === 'already-evaluated') continue;

      tile.evaluated = true;
      if (result.status === 'correct') {
        setScore(score + result.scoreDelta);
        speed = Math.min(0.42, speed + 0.004);
        void play('pop');
      } else {
        endGame();
        break;
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

    // The player's center is the single checkpoint used for path and color
    // evaluation. Keep it visible independently of tile overlap.
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, playerY * h);
    ctx.lineTo(w, playerY * h);
    ctx.stroke();
    ctx.restore();

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
      ctx.fillStyle = '#04130e';
      ctx.font = `700 ${Math.max(12, Math.min(18, th * 0.42))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.color[0]!.toUpperCase(), t.x * w, t.y * h);
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
    ctx.fillStyle = '#04130e';
    ctx.font = `800 ${Math.max(11, pr)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerColor[0]!.toUpperCase(), px, py);
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

  const onKey = (event: KeyboardEvent) => {
    if (turnBased || paused || !alive || event.isComposing) return;
    if (event.ctrlKey || event.altKey || event.metaKey || event.getModifierState('OS')) return;

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.matches('input, textarea, select') || target.isContentEditable)
    ) {
      return;
    }

    const requestedColor = COLORS.find(
      (color) => color.shortcut.toLowerCase() === event.key.toLowerCase(),
    )?.id;
    if (!requestedColor) return;

    event.preventDefault();
    selectVisualColor(requestedColor);
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);

  colorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const requestedColor = button.dataset.cfColor as ColorId;
      selectVisualColor(requestedColor);
    });
  });
  modeBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    if (turnBased) exitTurnBased();
    else enterTurnBased();
  });
  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    reset();
  });
  accessibleCycleBtn.addEventListener('click', cycleTurnBasedColor);
  accessibleStepBtn.addEventListener('click', stepTurnBased);
  accessibleAgainBtn.addEventListener('click', () => {
    if (paused) return;
    startTurnBased();
  });

  // An opt-in deterministic seam lets browser tests position known tiles
  // without coupling gameplay to random generation or animation-frame races.
  // It is unavailable during ordinary play and does not change player input.
  if (testMode) {
    testApi = {
      setVisualScenario(config) {
        controlledTestScenario = true;
        nextTileY = -1;
        nextTileId = 1;
        playerX = config.playerX ?? 0.5;
        speed = config.speed ?? 0.14;
        setScore(0);
        if (config.playerColor !== undefined) setPlayerColor(config.playerColor);
        tiles = config.tiles.map((tile) => ({
          id: nextTileId++,
          x: tile.x ?? 0.5,
          y: tile.y,
          previousY: tile.y,
          color: tile.color,
          evaluated: false,
        }));
        lastTs = 0;
        draw();
      },
      getVisualState() {
        return {
          alive,
          paused,
          score,
          playerColor,
          tiles: tiles.map((tile) => ({ ...tile })),
        };
      },
    };
    testWindow.__NOCHARGE_COLOR_FLIP_TEST__ = testApi;
  }

  // Do not run behind the above-game ad before the player reaches the stage.
  reset(false);

  return {
    destroy() {
      alive = false;
      turnBasedAlive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      if (testApi && testWindow.__NOCHARGE_COLOR_FLIP_TEST__ === testApi) {
        delete testWindow.__NOCHARGE_COLOR_FLIP_TEST__;
      }
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      if (paused) return;
      paused = true;
      // Preserve visual positions and reset timing only when we resume. This
      // prevents a hidden-tab duration becoming one oversized animation step.
      cancelAnimationFrame(raf);
      raf = 0;
      lastTs = 0;
      updatePausedControls();
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastTs = 0;
      updatePausedControls();
      if (!turnBased && alive) raf = requestAnimationFrame(loop);
    },
    isPaused() {
      return paused;
    },
    restart() {
      if (turnBased) startTurnBased();
      else reset(false);
    },
  };
}
