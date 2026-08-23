import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import {
  createHandoffScreen,
  getPlayerNames,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import '../shared/pass-play-chrome.css';
import {
  buildStroke,
  DEFAULT_PASSES,
  isLastPass,
  normalizePoint,
  PASS_CHOICES,
  PICTURE_PALETTE,
  playerForPass,
  STROKE_WIDTH,
  strokeCounts,
  totalPasses,
  undoLastStroke,
  type PictureStroke,
} from './engine';
import './styles.css';

const GAME_ID = 'pass-the-picture';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountPassThePicture(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game ptp" style="--pp-accent:#facc15">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Passes per player">
          ${PASS_CHOICES.map(
            (passes) =>
              `<button type="button" class="pp-hud__mode" data-ptp-passes="${passes}" aria-pressed="${passes === DEFAULT_PASSES}">${passes} passes each</button>`,
          ).join('')}
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-ptp-status></p>
      </div>
      <div class="pp-stage">
        <div class="ptp__board">
          <div class="ptp__toolbar">
            <div class="ptp__palette" role="group" aria-label="Stroke color" data-ptp-palette></div>
            <div class="ptp__toolbar-actions">
              <button type="button" class="btn btn--ghost btn--sm" data-ptp-undo>Undo last stroke</button>
            </div>
          </div>
          <div class="ptp__canvas-frame" data-ptp-frame>
            <canvas
              class="ptp__canvas"
              data-ptp-canvas
              width="960"
              height="720"
              tabindex="0"
              role="img"
              aria-label="Shared drawing canvas. Drawing uses a pointer: press and drag to add one stroke. Keyboard players can change color, undo, and finish passes, but cannot draw strokes."
            ></canvas>
          </div>
          <p class="ptp__progress" data-ptp-progress></p>
        </div>
        <div class="pp-result" data-ptp-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker">Picture finished</p>
            <h2 class="pp-result__title">Your shared picture</h2>
            <p class="pp-result__detail" data-ptp-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-ptp-download>Download this picture</button>
              <button type="button" class="btn btn--ghost" data-ptp-new>Start a new picture</button>
            </div>
            <p class="ptp__download-note">The picture is saved as a PNG file on this device. Nothing is uploaded.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-ptp-status]')!;
  const progressEl = root.querySelector<HTMLElement>('[data-ptp-progress]')!;
  const paletteEl = root.querySelector<HTMLElement>('[data-ptp-palette]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-ptp-undo]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ptp-canvas]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-ptp-result]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-ptp-result-detail]')!;
  const downloadBtn = root.querySelector<HTMLButtonElement>('[data-ptp-download]')!;
  const newBtn = root.querySelector<HTMLButtonElement>('[data-ptp-new]')!;
  const passesButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ptp-passes]')];
  const stage = () => root.querySelector<HTMLElement>('.pp-stage')!;

  const context = canvas.getContext('2d')!;

  let paused = false;
  let passesPerPlayer = DEFAULT_PASSES;
  let pass = 0;
  let strokes: PictureStroke[] = [];
  let finished = false;
  let handoff: HandoffScreenController | null = null;
  let color: string = PICTURE_PALETTE[0];
  let drawing = false;
  let currentPoints: { x: number; y: number }[] = [];

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const renderProgress = () => {
    const [p1, p2] = strokeCounts(strokes);
    const names = getPlayerNames();
    progressEl.textContent = `Pass ${Math.min(pass + 1, totalPasses(passesPerPlayer))} of ${totalPasses(passesPerPlayer)} · ${names.p1} ${p1} ${p1 === 1 ? 'stroke' : 'strokes'} · ${names.p2} ${p2} ${p2 === 1 ? 'stroke' : 'strokes'}`;
  };

  const redraw = () => {
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = '#f7f3e9';
    context.fillRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = STROKE_WIDTH;
    for (const stroke of strokes) {
      context.strokeStyle = stroke.color;
      context.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    }
    canvas.setAttribute(
      'aria-label',
      strokes.length === 0
        ? 'Shared drawing canvas, currently blank. Drawing uses a pointer: press and drag to add one stroke. Keyboard players can change color, undo, and finish passes, but cannot draw strokes.'
        : `Shared drawing canvas with ${strokes.length} ${strokes.length === 1 ? 'stroke' : 'strokes'} so far. Drawing uses a pointer: press and drag to add one stroke.`,
    );
  };

  const buildPalette = () => {
    paletteEl.innerHTML = '';
    PICTURE_PALETTE.forEach((paletteColor, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ptp__color';
      button.dataset.ptpColor = paletteColor;
      button.setAttribute('aria-label', `Stroke color ${index + 1} of ${PICTURE_PALETTE.length}`);
      button.setAttribute('aria-pressed', String(paletteColor === color));
      button.style.setProperty('--ptp-swatch', paletteColor);
      button.addEventListener('click', () => {
        if (paused) return;
        color = paletteColor;
        for (const other of paletteEl.querySelectorAll('[data-ptp-color]')) {
          other.setAttribute('aria-pressed', String(other === button));
        }
      });
      paletteEl.appendChild(button);
    });
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  /**
   * The drawing is shared, not secret: the handoff keeps it visible through a
   * translucent backdrop while still blocking board input.
   */
  const showHandoff = (player: 1 | 2) => {
    closeHandoff();
    if (paused) return;
    const remaining = totalPasses(passesPerPlayer) - pass;
    handoff = createHandoffScreen(stage(), {
      playerTo: player,
      context: `One stroke, then it passes on · ${remaining} ${remaining === 1 ? 'pass' : 'passes'} left`,
      keepVisible: true,
      onContinue: () => {
        handoff = null;
        canvas.focus({ preventScroll: true });
      },
    });
  };

  const beginPass = (nextPass: number) => {
    pass = nextPass;
    finished = false;
    resultEl.hidden = true;
    renderProgress();
    status(
      `${playerName(getPlayerNames(), playerForPass(pass))} — press and drag on the canvas to add one stroke.`,
    );
    showHandoff(playerForPass(pass));
  };

  const finishPicture = () => {
    finished = true;
    const [p1, p2] = strokeCounts(strokes);
    const names = getPlayerNames();
    const detail = `${totalPasses(passesPerPlayer)} passes · ${names.p1} drew ${p1} ${p1 === 1 ? 'stroke' : 'strokes'}, ${names.p2} drew ${p2}.`;
    status(`Picture finished. ${detail}`);
    resultDetail.textContent = detail;
    resultEl.hidden = false;
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: `${passesPerPlayer} passes each`,
      result: 'shared',
      score: [p1, p2],
      finishedAt: Date.now(),
    });
    void play('win');
    downloadBtn.focus({ preventScroll: true });
  };

  const pointerPosition = (event: PointerEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    return normalizePoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (paused || finished || handoff || drawing) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    unlockAudio();
    drawing = true;
    currentPoints = [pointerPosition(event)];
    canvas.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drawing) return;
    event.preventDefault();
    currentPoints.push(pointerPosition(event));
    // Lightweight live preview of the in-progress stroke.
    redraw();
    const width = canvas.width;
    const height = canvas.height;
    context.strokeStyle = color;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    currentPoints.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drawing) return;
    event.preventDefault();
    drawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
    const points = buildStroke(currentPoints);
    currentPoints = [];
    const stroke: PictureStroke = { pass, player: playerForPass(pass), color, points };
    strokes = [...strokes, stroke];
    signalMeaningfulGameInteraction(root);
    void play('place');
    redraw();
    renderProgress();

    if (isLastPass(pass, passesPerPlayer)) {
      finishPicture();
      return;
    }
    status(`${playerName(getPlayerNames(), stroke.player)} added a stroke.`);
    beginPass(pass + 1);
  };

  const onUndo = () => {
    if (paused || drawing || finished) return;
    const undone = undoLastStroke(strokes);
    if (!undone) return;
    unlockAudio();
    strokes = [...undone.strokes];
    redraw();
    // The pass the undone stroke belonged to is replayed by its author.
    beginPass(undone.resumePass);
  };

  const onDownload = () => {
    // Local only: the canvas is serialized in this tab and handed to the
    // browser's own download. Nothing is uploaded or fetched. The link is
    // attached to the document first — detached-anchor clicks are unreliable
    // for downloads in some engines.
    try {
      const link = document.createElement('a');
      link.download = 'nocharge-pass-the-picture.png';
      link.href = canvas.toDataURL('image/png');
      link.className = 'ptp__download-link';
      root.appendChild(link);
      link.click();
      window.setTimeout(() => link.remove(), 0);
    } catch {
      status('The picture could not be saved in this browser.');
    }
  };

  const reset = (nextPasses?: number) => {
    if (nextPasses) passesPerPlayer = nextPasses;
    for (const button of passesButtons) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.ptpPasses) === passesPerPlayer));
    }
    strokes = [];
    closeHandoff();
    redraw();
    buildPalette();
    beginPass(0);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', () => {
    drawing = false;
    currentPoints = [];
    redraw();
  });
  // Keep strokes from scrolling the page on touch devices.
  canvas.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });

  undoBtn.addEventListener('click', onUndo);
  downloadBtn.addEventListener('click', onDownload);
  newBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    reset();
  });

  for (const button of passesButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      unlockAudio();
      reset(Number(button.dataset.ptpPasses));
    });
  }

  reset();

  return {
    destroy() {
      closeHandoff();
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
      drawing = false;
      currentPoints = [];
      redraw();
    },
    resume() {
      paused = false;
    },
    isPaused() {
      return paused;
    },
    restart() {
      reset();
    },
  };
}
