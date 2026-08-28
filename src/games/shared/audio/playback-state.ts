let unlocked = false;

export function markAudioUnlocked(): void {
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

export function resetAudioUnlockForTests(): void {
  unlocked = false;
}
