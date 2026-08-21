import {
  CLEAR_GAME_DATA_FAILURE,
  CLEAR_GAME_DATA_SUCCESS,
  clearLocalGameData,
} from '../local-game-data';
import { formatPlayedAt } from './format';
import { getReadableBrowserStorage } from './readers';
import {
  buildLocalDashboard,
  NO_SAVED_RESULT_MESSAGE,
  STORAGE_BLOCKED_MESSAGE,
} from './summary';
import type { LocalDashboard, LocalGameMetric } from './types';

/**
 * My Arcade page controller.
 *
 * It reads local values once per render, writes the normalized model into the
 * DOM, and keeps nothing. The model is never stored, never uploaded, and never
 * added to page metadata or the URL.
 */

const UNAVAILABLE_METRIC_MESSAGE = 'Saved results are unavailable in this browser.';

function setText(element: Element | null, text: string): void {
  if (element) element.textContent = text;
}

function renderMetrics(container: HTMLElement, metrics: LocalGameMetric[], fallback: string): void {
  container.textContent = '';
  if (metrics.length === 0) {
    const message = document.createElement('p');
    message.className = 'ma-card__none';
    message.textContent = fallback;
    container.append(message);
    return;
  }

  const list = document.createElement('dl');
  list.className = 'ma-metrics';
  for (const metric of metrics) {
    const group = document.createElement('div');
    group.className = 'ma-metric';

    const term = document.createElement('dt');
    term.textContent = metric.label;

    const value = document.createElement('dd');
    const strong = document.createElement('strong');
    strong.textContent = metric.value;
    value.append(strong);
    if (metric.detail) {
      const detail = document.createElement('span');
      detail.className = 'ma-metric__detail';
      detail.textContent = metric.detail;
      value.append(detail);
    }

    group.append(term, value);
    list.append(group);
  }
  container.append(list);
}

function render(root: HTMLElement, dashboard: LocalDashboard, now: number): void {
  const loading = root.querySelector<HTMLElement>('[data-ma-loading]');
  const blocked = root.querySelector<HTMLElement>('[data-ma-blocked]');
  const empty = root.querySelector<HTMLElement>('[data-ma-empty]');
  const continueSection = root.querySelector<HTMLElement>('[data-ma-continue]');
  const continueList = root.querySelector<HTMLElement>('[data-ma-continue-list]');

  if (loading) loading.hidden = true;
  if (blocked) blocked.hidden = dashboard.storageAvailable;
  if (empty) empty.hidden = !(dashboard.storageAvailable && dashboard.isEmpty);

  // Continue playing: reuse the existing Recently Played record, newest first.
  const visibleRecent = dashboard.storageAvailable ? dashboard.recent : [];
  if (continueSection && continueList) {
    for (const entry of visibleRecent) {
      const item = continueList.querySelector<HTMLElement>(`[data-ma-recent="${CSS.escape(entry.gameId)}"]`);
      if (item) continueList.append(item);
    }
    for (const item of continueList.querySelectorAll<HTMLElement>('[data-ma-recent]')) {
      const entry = visibleRecent.find((candidate) => candidate.gameId === item.dataset.maRecent);
      item.hidden = !entry;
      const time = item.querySelector<HTMLTimeElement>('[data-ma-recent-time]');
      const wrapper = item.querySelector<HTMLElement>('[data-ma-recent-when]');
      if (!entry || !time || !wrapper) continue;
      const label = formatPlayedAt(entry.playedAt, now);
      if (label && entry.lastPlayedAt) {
        time.dateTime = entry.lastPlayedAt;
        time.textContent = label;
        wrapper.hidden = false;
      } else {
        // A timestamp that cannot form a real date is simply not shown.
        time.removeAttribute('datetime');
        time.textContent = '';
        wrapper.hidden = true;
      }
    }
    continueSection.hidden = visibleRecent.length === 0;
  }

  for (const summary of dashboard.games) {
    const card = root.querySelector<HTMLElement>(`[data-ma-card="${CSS.escape(summary.gameId)}"]`);
    if (!card) continue;
    const metrics = card.querySelector<HTMLElement>('[data-ma-metrics]');
    if (metrics) {
      renderMetrics(
        metrics,
        dashboard.storageAvailable ? summary.metrics : [],
        dashboard.storageAvailable ? NO_SAVED_RESULT_MESSAGE : UNAVAILABLE_METRIC_MESSAGE,
      );
    }
    const played = card.querySelector<HTMLElement>('[data-ma-card-played]');
    const playedTime = card.querySelector<HTMLTimeElement>('[data-ma-card-time]');
    if (played && playedTime) {
      const entry = visibleRecent.find((candidate) => candidate.gameId === summary.gameId);
      const label = entry ? formatPlayedAt(entry.playedAt, now) : undefined;
      if (entry?.lastPlayedAt && label) {
        playedTime.dateTime = entry.lastPlayedAt;
        playedTime.textContent = label;
        played.hidden = false;
      } else {
        playedTime.removeAttribute('datetime');
        playedTime.textContent = '';
        played.hidden = true;
      }
    }
  }

  root.setAttribute('aria-busy', 'false');
}

export function mountMyArcade(root: HTMLElement): void {
  const update = () => {
    // Storage is read fresh on every render; nothing is cached in storage.
    render(root, buildLocalDashboard(getReadableBrowserStorage()), Date.now());
  };

  update();

  const startClear = root.querySelector<HTMLButtonElement>('[data-ma-clear-start]');
  const confirmPanel = root.querySelector<HTMLElement>('[data-ma-clear-confirm]');
  const confirmButton = root.querySelector<HTMLButtonElement>('[data-ma-clear-confirm-button]');
  const cancelButton = root.querySelector<HTMLButtonElement>('[data-ma-clear-cancel]');
  const status = root.querySelector<HTMLElement>('[data-ma-clear-status]');

  const closeConfirm = () => {
    if (confirmPanel) confirmPanel.hidden = true;
    if (startClear) {
      startClear.hidden = false;
      startClear.setAttribute('aria-expanded', 'false');
    }
  };

  startClear?.addEventListener('click', () => {
    if (!confirmPanel) return;
    confirmPanel.hidden = false;
    startClear.setAttribute('aria-expanded', 'true');
    startClear.hidden = true;
    setText(status, '');
    confirmButton?.focus();
  });

  cancelButton?.addEventListener('click', () => {
    closeConfirm();
    setText(status, 'Nothing was removed.');
    startClear?.focus();
  });

  confirmButton?.addEventListener('click', () => {
    // Exactly the shared Privacy allowlist. Analytics consent and Google's own
    // Privacy & messaging storage are not in it and are never touched.
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      storage = undefined;
    }
    const cleared = clearLocalGameData(storage);
    closeConfirm();
    update();
    setText(status, cleared ? CLEAR_GAME_DATA_SUCCESS : CLEAR_GAME_DATA_FAILURE);
    startClear?.focus();
  });
}

export { STORAGE_BLOCKED_MESSAGE };
