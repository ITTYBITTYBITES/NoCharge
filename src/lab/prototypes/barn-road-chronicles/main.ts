/** Barn Road Chronicles — Act 1 runtime and Lab host integration. */
import { createCanvasStage } from '../../loop/canvas-stage';
import { createLoop } from '../../loop/raf-loop';
import { createLabHud } from '../../hud/lab-hud';
import { createAdLifecycle } from '../../ads/lifecycle';
import { createWebAudioGate, createInputGate } from '../../ads/gates';
import type { GameController, PauseReason } from '../../../games/shared/types';
import { BRC_VIEWS, createBarnRoadEngine, sanitizePlayerName, type BrcViewId } from './engine';
import './styles.css';

const ASSET = '/lab/barn-road-chronicles/assets';
const SCENES: Record<BrcViewId, { title: string; image: string; description: string }> = {
  'view-exterior': { title: 'Pine Valley · Barn Gate', image: 'barn-gate.jpg', description: 'A rain-dark barn waits beyond a locked gate.' },
  'view-outer-barn': { title: 'Pine Valley · Outer Barn', image: 'outer-barn.jpg', description: 'An old workshop, a silent tractor, and a breaker box.' },
  'view-chamber': { title: 'Pine Valley · Zen Chamber', image: 'zen-chamber.jpg', description: 'A hidden chamber lies beneath the barn.' },
  'view-restoration': { title: 'Pine Valley · Restoration Bay', image: 'restoration-bay.jpg', description: 'The hidden car is ready for a careful restoration.' },
  'view-finale': { title: 'Pine Valley · The Open Road', image: 'open-road.jpg', description: 'The road to Pine Valley opens at dawn.' },
};
const ITEMS = {
  magnifier: { id: 'magnifying-glass', name: 'Brass magnifying glass', icon: '⌕' },
  crank: { id: 'crank-handle', name: 'Cast-iron crank handle', icon: '⚙' },
  fuse: { id: 'glass-fuse', name: '30A glass fuse', icon: '◈' },
  knob: { id: 'radio-knob', name: 'Bakelite radio knob', icon: '◉' },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

export function mountBarnRoadChronicles(root: HTMLElement): GameController {
  const stage = root.querySelector<HTMLElement>('.lab-stage');
  const hudRoot = root.querySelector<HTMLElement>('[data-lab-hud]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pulse-canvas]');
  if (!stage || !canvas) throw new Error('Barn Road Chronicles is missing its Lab stage or canvas.');
  stage.dataset.brcStage = '';

  const viewport = document.createElement('main');
  viewport.id = 'game-viewport';
  viewport.dataset.view = 'view-exterior';
  viewport.setAttribute('aria-label', 'Barn Road Chronicles game');
  viewport.innerHTML = `
    <header id="hud-header">
      <strong class="brand">Barn Road Chronicles</strong>
      <div id="location-chip"><span class="dot"></span><span id="location-name">Pine Valley · Barn Gate</span></div>
      <div class="header-right"><button id="btn-reset" type="button">Reset demo</button><button id="btn-mute" type="button" aria-pressed="false">Mute</button></div>
    </header>
    <div class="scene-stack">
      ${BRC_VIEWS.map((id) => `<section class="scene-view${id === 'view-exterior' ? ' active' : ''}" id="${id}" aria-label="${SCENES[id].title}">
        <div class="background-layer"><img src="${ASSET}/scenes/${SCENES[id].image}" alt="${SCENES[id].description}" draggable="false"></div>
        <div class="scene-grade"></div><div class="hotspot-layer" data-hotspots="${id}"></div>
      </section>`).join('')}
      <canvas class="brc-particles" aria-hidden="true"></canvas>
      <section id="restoration-bay" aria-label="Apex Atom restoration">
        <div class="restore-copy"><span class="eyebrow">Restoration bay · 1958 Apex Atom</span><h1>Bring Silas's secret back to life</h1><p>Choose a tool, then scrub across the car. Complete all three passes to reveal the road.</p></div>
        <div class="car-workbench"><img id="atom-clean" src="${ASSET}/vehicles/apex-atom-clean.png" alt="Restored cyan Apex Atom"><img id="atom-dirty" src="${ASSET}/vehicles/apex-atom-dirty.png" alt="Rusty Apex Atom"><canvas id="dirt-canvas" aria-hidden="true"></canvas><canvas id="paint-canvas" aria-hidden="true"></canvas></div>
        <div id="restore-hud"><span>Restoration</span><strong data-progress>0%</strong><div class="progress-track"><i data-progress-bar></i></div></div>
        <div id="tool-dock" aria-label="Restoration tools"><button type="button" data-tool="scrub" class="selected">Nano-Scrub</button><button type="button" data-tool="sonic">Sonic Wave</button><button type="button" data-tool="paint">Quantum Paint</button></div>
        <button type="button" class="glass-button restore-exit" data-action="back-to-chamber">← Chamber</button>
      </section>
      <section id="finale-card" aria-label="Act one complete"><span class="eyebrow">Act one complete</span><h1>The road is yours.</h1><p>Uncle Silas's Apex Atom is ready. Pine Valley is waiting beyond the ridge.</p><button id="btn-pine-valley" type="button" class="glass-button">Drive toward Pine Valley</button><button type="button" class="text-button" data-action="back-to-restoration">Return to the workshop</button></section>
    </div>
    <footer id="inventory-bar"><div class="inventory-label">Your kit</div><div id="inventory-items" aria-live="polite"></div><span class="inventory-hint">Tap a glowing clue to investigate</span></footer>
    <div id="brc-modal" class="brc-modal" hidden><div class="modal-scrim" data-action="close-modal"></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button><div class="modal-content"></div></section></div>
    <div id="brc-toast" role="status" aria-live="polite"></div>`;
  stage.append(viewport);
  viewport.prepend(canvas);
  canvas.classList.add('brc-main-canvas');

  const engine = createBarnRoadEngine();
  const saved = (() => { try { return localStorage.getItem('brc_act1_state'); } catch { return null; } })();
  if (saved) { try { engine.loadSerialized(JSON.parse(saved)); } catch { /* Ignore stale/corrupt browser data. */ } }

  const modal = viewport.querySelector<HTMLElement>('#brc-modal')!;
  const modalContent = viewport.querySelector<HTMLElement>('.modal-content')!;
  const toast = viewport.querySelector<HTMLElement>('#brc-toast')!;
  const locationName = viewport.querySelector<HTMLElement>('#location-name')!;
  const inventory = viewport.querySelector<HTMLElement>('#inventory-items')!;
  const restoration = viewport.querySelector<HTMLElement>('#restoration-bay')!;
  const finale = viewport.querySelector<HTMLElement>('#finale-card')!;
  const cleanCar = viewport.querySelector<HTMLImageElement>('#atom-clean')!;
  const dirtyCar = viewport.querySelector<HTMLImageElement>('#atom-dirty')!;
  const particleCanvas = viewport.querySelector<HTMLCanvasElement>('.brc-particles')!;
  let currentTool = 'scrub';
  let muted = false;
  let destroyed = false;
  let paused = false;
  let toastTimer = 0;
  let audio: AudioContext | null = null;
  let audioGain: GainNode | null = null;
  const cleanup: Array<() => void> = [];
  const frequencies = { scrub: 220, sonic: 440, paint: 330 };

  const saveState = () => {
    try { localStorage.setItem('brc_act1_state', JSON.stringify(engine.state())); } catch { /* Storage may be disabled. */ }
  };
  const showToast = (message: string) => {
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
  };
  const playTone = (frequency = 520) => {
    if (muted) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') void audio.resume();
      audioGain ??= audio.createGain();
      audioGain.gain.setTargetAtTime(0.055, audio.currentTime, 0.015);
      audioGain.connect(audio.destination);
      const osc = audio.createOscillator();
      const envelope = audio.createGain();
      osc.type = 'sine'; osc.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, audio.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);
      osc.connect(envelope); envelope.connect(audioGain); osc.start(); osc.stop(audio.currentTime + 0.2);
    } catch { /* Web Audio is an enhancement, never a blocker. */ }
  };
  const openModal = (title: string, body: string, footer = '') => {
    modalContent.innerHTML = `<span class="eyebrow">Pine Valley · Field notes</span><h2 id="modal-title">${title}</h2>${body}${footer}`;
    modal.hidden = false;
    modal.querySelector<HTMLButtonElement>('.modal-close')?.focus();
  };
  const closeModal = () => { modal.hidden = true; };
  const transition = (id: BrcViewId) => {
    engine.switchView(id);
    render();
    saveState();
    playTone(620);
  };
  const addItem = (item: typeof ITEMS[keyof typeof ITEMS]) => {
    if (engine.addItem(item)) { showToast(`${item.name} added to your kit.`); playTone(740); }
    render(); saveState();
  };

  const hotspotMarkup = (id: string, label: string, x: number, y: number, color = '') =>
    `<button class="hotspot ${color}" type="button" data-hotspot="${id}" style="left:${(x * 100).toFixed(1)}%;top:${(y * 100).toFixed(1)}%" aria-label="Inspect ${label}"><span class="hotspot-ring"></span><span class="hotspot-label">${label}</span></button>`;

  const populateHotspots = () => {
    const exterior = viewport.querySelector<HTMLElement>('[data-hotspots="view-exterior"]')!;
    const barn = viewport.querySelector<HTMLElement>('[data-hotspots="view-outer-barn"]')!;
    const chamber = viewport.querySelector<HTMLElement>('[data-hotspots="view-chamber"]')!;
    exterior.innerHTML = hotspotMarkup('mailbox', 'Mailbox', 0.155, 0.575) + hotspotMarkup('padlock', 'Gate lock', 0.572, 0.545, 'amber');
    barn.innerHTML = hotspotMarkup('tool-chest', 'Tool chest', 0.175, 0.70) + hotspotMarkup('high-shelf', 'Coffee tin', 0.33, 0.34) + hotspotMarkup('breaker-box', 'Breaker box', 0.575, 0.395, 'amber') + hotspotMarkup('glovebox', 'Tractor glovebox', 0.695, 0.555) + hotspotMarkup('tractor', 'Tractor flywheel', 0.86, 0.42, 'amber');
    chamber.innerHTML = hotspotMarkup('desk', 'Silas’s letter', 0.195, 0.55) + hotspotMarkup('platform', 'Covered platform', 0.615, 0.46, 'amber');
  };

  const renderInventory = () => {
    inventory.innerHTML = engine.state().inventory.map((item) => `<button type="button" class="inventory-item" data-item="${escapeHtml(item.id)}" title="${escapeHtml(item.name)}"><span>${escapeHtml(item.icon)}</span>${escapeHtml(item.name)}</button>`).join('') || '<span class="empty-kit">Nothing collected yet</span>';
  };
  const render = () => {
    const state = engine.state();
    viewport.dataset.view = state.currentView;
    viewport.querySelectorAll<HTMLElement>('.scene-view').forEach((el) => el.classList.toggle('active', el.id === state.currentView));
    locationName.textContent = SCENES[state.currentView].title;
    restoration.classList.toggle('active', state.currentView === 'view-restoration');
    finale.classList.toggle('active', state.currentView === 'view-finale');
    const u = state.unlockedStates;
    const targets = viewport.querySelectorAll<HTMLElement>('[data-hotspot]');
    targets.forEach((button) => {
      const id = button.dataset.hotspot;
      const complete = (id === 'padlock' && u.padlockUnlocked) || (id === 'tool-chest' && engine.hasItem('crank-handle')) || (id === 'high-shelf' && engine.hasItem('glass-fuse')) || (id === 'glovebox' && engine.hasItem('radio-knob')) || (id === 'platform' && u.tarpRemoved);
      button.classList.toggle('is-complete', Boolean(complete));
    });
    viewport.querySelector('#floor-reveal')?.remove();
    if (state.currentView === 'view-outer-barn' && u.floorOpened) {
      const reveal = document.createElement('button'); reveal.id = 'floor-reveal'; reveal.className = 'floor-reveal'; reveal.dataset.hotspot = 'floor-reveal'; reveal.textContent = 'Descend to the hidden chamber'; reveal.style.cssText = 'left:50%;top:76%';
      viewport.querySelector('[data-hotspots="view-outer-barn"]')?.append(reveal);
    }
    renderInventory();
    const progress = state.restorationProgress;
    viewport.querySelector<HTMLElement>('[data-progress]')!.textContent = `${progress}%`;
    viewport.querySelector<HTMLElement>('[data-progress-bar]')!.style.width = `${progress}%`;
    dirtyCar.style.opacity = String(Math.max(0, 1 - progress / 100));
    if (progress >= 100) cleanCar.classList.add('restored'); else cleanCar.classList.remove('restored');
  };

  const showLetter = () => openModal('A letter from Uncle Silas', `<article id="letter-root" class="letter"><p>To whoever finds this,</p><p>If you made it beneath the barn, you already know I never could throw anything away. The Atom is yours to bring back to life. The key to its heart is patience — clean the frame, listen for the old frequency, and take the road home.</p><p>When the clock tower strikes dawn, meet me in Pine Valley.</p><p class="signature">— Silas, October 1958</p></article>`, '<button class="glass-button" data-action="close-modal">Keep the letter</button>');
  const openBreaker = () => {
    const state = engine.state().unlockedStates;
    openModal('The breaker box', `<p class="modal-lead">The hydraulic lift is dead. The glass fuse and radio tuner both need attention.</p><div class="socket-row"><button type="button" class="socket ${state.fuseInstalled ? 'filled' : ''}" data-action="install-fuse">${state.fuseInstalled ? 'Fuse seated ✓' : 'Seat 30A fuse'}</button><button type="button" class="socket ${state.radioKnobInstalled ? 'filled' : ''}" data-action="install-knob">${state.radioKnobInstalled ? 'Tuner knob fitted ✓' : 'Fit radio knob'}</button></div><label class="range-label" for="tuner-knob">Tune the transformer <span>60 Hz</span></label><div class="tuner-track"><i></i><input id="tuner-knob" type="range" min="0" max="100" value="20" aria-label="Transformer tuning"></div><p class="tune-readout" data-tune-readout>Find the quiet green band.</p><button type="button" class="glass-button" data-action="tune">Test the circuit</button>`, '<p class="modal-note">The right frequency is just above the middle of the dial.</p>');
  };
  const openTractor = () => openModal('The flywheel', `<p class="modal-lead">The lift has power. Give the flywheel three steady clockwise turns.</p><div class="flywheel" id="flywheel" role="button" tabindex="0" aria-label="Crank clockwise"><span>⟳</span><small data-turns>0 / 3 turns</small></div><button type="button" class="glass-button" data-action="crank">Crank clockwise</button>`, '<p class="modal-note">Click the wheel or crank button three times.</p>');
  const openPadlock = () => openModal('Four tumblers', `<p class="modal-lead">A date is scratched into the brass: October 1958.</p><div class="lock-digits" aria-label="Four digit combination">${[0, 1, 2, 3].map((n) => `<label><span>${['M','M','Y','Y'][n]}</span><select data-lock-digit="${n}" aria-label="Lock digit ${n + 1}">${Array.from({ length: 10 }, (_, i) => `<option value="${i}" ${i === 0 ? 'selected' : ''}>${i}</option>`).join('')}</select></label>`).join('')}</div><button type="button" class="glass-button" data-action="unlock">Try the combination</button><p class="modal-note">Hint: the postcard is dated 10 / 1958.</p>`);
  const openTarp = () => openModal('Untie the cover', `<p class="modal-lead">Four knots hold the canvas tight. Work from left to right.</p><div class="knot-row">${[0,1,2,3].map((n) => `<button type="button" class="knot" data-knot="${n}" aria-label="Untie knot ${n + 1}">⌁</button>`).join('')}</div><p class="tune-readout" data-knot-status>0 of 4 knots untied</p>`, '<p class="modal-note">Tap each knot to loosen it.</p>');

  populateHotspots();
  render();

  const onClick = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-hotspot], [data-action], [data-item], [data-tool], [data-knot], #btn-reset, #btn-mute, #btn-pine-valley');
    if (!target) return;
    const id = target.dataset.hotspot;
    if (id) {
      playTone(560);
      if (id === 'mailbox') openModal('A clue in the mailbox', `<p class="modal-lead">Inside: a brass magnifier and a postcard from Pine Valley, dated October 1958.</p><img class="postcard" src="${ASSET}/ui/postcard-1958.jpg" alt="A vintage Pine Valley postcard from 1958"><button class="glass-button" data-action="collect-magnifier">Take the magnifier</button>`);
      else if (id === 'padlock') engine.state().unlockedStates.padlockUnlocked ? transition('view-outer-barn') : openPadlock();
      else if (id === 'tool-chest') engine.hasItem('crank-handle') ? showToast('The tool chest is empty now.') : openModal('A useful old tool', '<p class="modal-lead">Beneath a canvas rag, you find a cast-iron crank handle.</p><button class="glass-button" data-action="collect-crank">Take the crank handle</button>');
      else if (id === 'high-shelf') engine.hasItem('glass-fuse') ? showToast('You found everything in the coffee tin.') : openModal('The coffee tin', '<p class="modal-lead">A spare 30A glass fuse is wrapped in a faded receipt.</p><button class="glass-button" data-action="collect-fuse">Take the glass fuse</button>');
      else if (id === 'breaker-box') openBreaker();
      else if (id === 'glovebox') engine.hasItem('radio-knob') ? showToast('The glovebox is empty now.') : openModal('The tractor glovebox', '<p class="modal-lead">A bakelite radio knob is tucked inside with a note: “Find the 60-cycle hum.”</p><button class="glass-button" data-action="collect-knob">Take the radio knob</button>');
      else if (id === 'tractor') engine.state().unlockedStates.floorOpened ? transition('view-chamber') : openTractor();
      else if (id === 'desk') showLetter();
      else if (id === 'platform') engine.state().unlockedStates.tarpRemoved ? transition('view-restoration') : openTarp();
      else if (id === 'floor-reveal') transition('view-chamber');
      return;
    }
    const action = target.dataset.action;
    if (action === 'close-modal') { closeModal(); return; }
    if (action === 'collect-magnifier') { addItem(ITEMS.magnifier); closeModal(); return; }
    if (action === 'collect-crank') { addItem(ITEMS.crank); closeModal(); return; }
    if (action === 'collect-fuse') { addItem(ITEMS.fuse); closeModal(); return; }
    if (action === 'collect-knob') { addItem(ITEMS.knob); closeModal(); return; }
    if (action === 'install-fuse') { if (engine.installFuse()) { playTone(400); showToast('Fuse seated.'); } else showToast('Find the spare fuse in the coffee tin first.'); openBreaker(); saveState(); return; }
    if (action === 'install-knob') { if (engine.installRadioKnob()) { playTone(400); showToast('Tuner knob fitted.'); } else showToast('Find the bakelite knob in the tractor glovebox first.'); openBreaker(); saveState(); return; }
    if (action === 'tune') {
      const value = Number(viewport.querySelector<HTMLInputElement>('#tuner-knob')?.value ?? 20) / 100;
      const ok = engine.tuneBreaker(value);
      const message = viewport.querySelector<HTMLElement>('[data-tune-readout]');
      if (ok) { if (message) message.textContent = 'A clean 60 Hz hum — power restored.'; showToast('The hydraulic lift is live!'); playTone(820); closeModal(); saveState(); }
      else if (!engine.state().unlockedStates.fuseInstalled || !engine.state().unlockedStates.radioKnobInstalled) { if (message) message.textContent = 'The socket needs both a fuse and a tuner knob.'; }
      else if (message) message.textContent = 'Static. Nudge the dial into the green band and try again.';
      return;
    }
    if (action === 'unlock') {
      const digits = [...viewport.querySelectorAll<HTMLSelectElement>('[data-lock-digit]')].map((select) => Number(select.value));
      if (engine.tryUnlockPadlock(digits)) { closeModal(); showToast('The gate swings open.'); transition('view-outer-barn'); }
      else showToast('The lock resists. Check the postcard date.'); saveState(); return;
    }
    if (action === 'crank') {
      const count = Number(viewport.querySelector<HTMLElement>('[data-turns]')?.dataset.count ?? 0) + 1;
      const countEl = viewport.querySelector<HTMLElement>('[data-turns]');
      if (countEl) { countEl.dataset.count = String(count); countEl.textContent = `${Math.min(count, 3)} / 3 turns`; }
      viewport.querySelector('#flywheel')?.classList.add('turning'); playTone(270 + count * 45);
      if (engine.completeCrank(count)) { closeModal(); render(); showToast('The barn floor opens beneath you.'); saveState(); }
      else if (!engine.state().unlockedStates.powerRestored) showToast('The flywheel will not move without power.');
      else if (!engine.hasItem('crank-handle')) showToast('You need a crank handle from the tool chest.');
      return;
    }
    if (action === 'back-to-chamber') { transition('view-chamber'); return; }
    if (action === 'back-to-restoration') { transition('view-restoration'); return; }
    if (action === 'tune') return;
    if (target.dataset.item) { showToast(engine.state().inventory.find((it) => it.id === target.dataset.item)?.name ?? 'In your kit'); return; }
    if (target.dataset.tool) { currentTool = target.dataset.tool; viewport.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('selected', button === target)); return; }
    if (target.dataset.knot !== undefined) {
      target.classList.add('untied'); target.setAttribute('disabled', 'true');
      const count = modalContent.querySelectorAll('.knot.untied').length;
      const status = modalContent.querySelector<HTMLElement>('[data-knot-status]'); if (status) status.textContent = `${count} of 4 knots untied`;
      playTone(330 + count * 80);
      if (count >= 4 && engine.releaseTarp(count)) { closeModal(); showToast('The tarp falls away. An Apex Atom, hidden for decades.'); saveState(); render(); }
      return;
    }
    if (target.id === 'btn-reset') { if (window.confirm('Reset Barn Road Chronicles and clear saved progress?')) { engine.restart(); saveState(); closeModal(); render(); showToast('Demo reset. Start again at the barn gate.'); } return; }
    if (target.id === 'btn-mute') { muted = !muted; target.setAttribute('aria-pressed', String(muted)); target.textContent = muted ? 'Unmute' : 'Mute'; if (audioGain && audio) audioGain.gain.setTargetAtTime(muted ? 0 : 0.055, audio.currentTime, 0.03); hudMuteSync(); return; }
    if (target.id === 'btn-pine-valley') { showToast('Act 1 complete — thanks for helping Silas.'); return; }
  };
  const hudMuteSync = () => {
    const button = hudRoot?.querySelector<HTMLButtonElement>('[data-lab-hud="mute"]');
    if (button) { button.setAttribute('aria-pressed', String(muted)); button.textContent = muted ? 'Unmute' : 'Mute'; }
  };
  const onInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.id !== 'tuner-knob') return;
    const output = viewport.querySelector<HTMLElement>('[data-tune-readout]');
    if (output) output.textContent = `Tuner: ${Math.round(Number(target.value) * 0.6)} Hz · ${Number(target.value) > 62 && Number(target.value) < 74 ? 'green band' : 'searching'}`;
  };
  const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); };
  viewport.addEventListener('click', onClick);
  viewport.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey);
  cleanup.push(() => viewport.removeEventListener('click', onClick), () => viewport.removeEventListener('input', onInput), () => document.removeEventListener('keydown', onKey));

  const paintCanvases = [viewport.querySelector<HTMLCanvasElement>('#dirt-canvas')!, viewport.querySelector<HTMLCanvasElement>('#paint-canvas')!];
  let restoring = false;
  let lastStrokeAt = 0;
  const restoreFromPointer = (event: PointerEvent) => {
    const bounds = cleanCar.getBoundingClientRect();
    if (!restoring || !bounds.width || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    const state = engine.state();
    const next = state.restorationProgress + (currentTool === 'sonic' ? 2 : currentTool === 'paint' ? 1.6 : 1.25);
    if (engine.setRestorationProgress(next)) { transition('view-finale'); showToast('Restored to 100% — the open road is waiting.'); }
    else render();
    const now = performance.now();
    if (now - lastStrokeAt > 75) { playTone(frequencies[currentTool as keyof typeof frequencies]); lastStrokeAt = now; }
    saveState();
  };
  const onPointerDown = (event: PointerEvent) => { if ((event.target as HTMLElement).closest('.car-workbench')) { restoring = true; (event.target as HTMLElement).setPointerCapture?.(event.pointerId); restoreFromPointer(event); } };
  const onPointerMove = (event: PointerEvent) => { if (event.buttons & 1) restoreFromPointer(event); };
  const onPointerUp = () => { restoring = false; };
  const workbench = viewport.querySelector<HTMLElement>('.car-workbench')!;
  workbench.addEventListener('pointerdown', onPointerDown); workbench.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp);
  cleanup.push(() => workbench.removeEventListener('pointerdown', onPointerDown), () => workbench.removeEventListener('pointermove', onPointerMove), () => window.removeEventListener('pointerup', onPointerUp));

  let dimensions = { width: 1, height: 1 };
  const paintDust = () => {
    const ctx = particleCanvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    const time = performance.now() / 1000;
    for (let i = 0; i < 26; i++) {
      const x = ((i * 73.13 + time * (5 + (i % 3))) % dimensions.width);
      const y = ((i * 43.71 - time * (4 + (i % 5)) + dimensions.height * 3) % dimensions.height);
      ctx.fillStyle = `rgba(210,225,220,${0.08 + (i % 4) * 0.035})`;
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.45, 0, Math.PI * 2); ctx.fill();
    }
  };
  const loop = createLoop({ update: (step) => engine.update(step), render: paintDust });
  const resize = () => {
    const rect = viewport.getBoundingClientRect(); dimensions = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    particleCanvas.width = Math.round(dimensions.width * dpr); particleCanvas.height = Math.round(dimensions.height * dpr);
    particleCanvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintCanvases.forEach((el) => { const b = el.getBoundingClientRect(); el.width = Math.max(1, Math.round(b.width * dpr)); el.height = Math.max(1, Math.round(b.height * dpr)); el.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0); });
  };
  const stageCanvas = createCanvasStage(canvas, { onResize: (size) => { dimensions = { width: size.width, height: size.height }; resize(); } });
  const observer = new ResizeObserver(resize); observer.observe(viewport);
  const lifecycle = createAdLifecycle({ loop, audio: createWebAudioGate(), input: createInputGate() });
  void lifecycle;
  const hud = hudRoot ? createLabHud({ root: hudRoot, loop, exitHref: '/', isMuted: () => muted, onToggleMute: (next) => { muted = next; if (audioGain && audio) audioGain.gain.setTargetAtTime(muted ? 0 : 0.055, audio.currentTime, 0.03); const btn = viewport.querySelector<HTMLButtonElement>('#btn-mute'); if (btn) { btn.setAttribute('aria-pressed', String(muted)); btn.textContent = muted ? 'Unmute' : 'Mute'; } } }) : null;
  const switchView = (id: string) => { if ((BRC_VIEWS as readonly string[]).includes(id)) transition(id as BrcViewId); };
  const resetState = () => { engine.restart(); saveState(); closeModal(); render(); };
  const api = { getState: () => engine.state(), switchView, saveState, resetState, showLetter, hideLetter: closeModal, sanitizePlayerName, layoutScene: resize, openBreaker, openTractor };
  (window as Window & { BRC?: typeof api }).BRC = api;

  resize(); loop.start();
  return {
    pause(reason?: PauseReason) { if (paused) return; paused = true; loop.stop(); if (reason !== 'ad') audio?.suspend().catch(() => undefined); },
    resume() { if (!paused || destroyed) return; paused = false; if (!muted) audio?.resume().catch(() => undefined); loop.start(); },
    isPaused: () => paused,
    restart() { resetState(); if (!paused) loop.start(); },
    destroy() {
      if (destroyed) return; destroyed = true; saveState(); loop.destroy(); stageCanvas.destroy(); observer.disconnect(); hud?.destroy(); lifecycle.release();
      cleanup.forEach((fn) => fn()); window.clearTimeout(toastTimer); audioGain?.disconnect(); void audio?.close().catch(() => undefined);
      delete (window as Window & { BRC?: typeof api }).BRC; viewport.remove();
    },
  };
}
