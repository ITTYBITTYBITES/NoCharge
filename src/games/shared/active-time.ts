export type Clock = () => number;

/** Accumulates only intervals explicitly marked active. */
export class ActiveTimeTracker {
  private accumulated = 0;
  private activeSince: number | null = null;

  constructor(private readonly now: Clock = () => performance.now()) {}

  start(): void {
    if (this.activeSince === null) this.activeSince = this.now();
  }

  pause(): void {
    if (this.activeSince === null) return;
    this.accumulated += Math.max(0, this.now() - this.activeSince);
    this.activeSince = null;
  }

  reset(): void {
    this.accumulated = 0;
    this.activeSince = null;
  }

  elapsedMs(): number {
    return this.accumulated + (this.activeSince === null ? 0 : Math.max(0, this.now() - this.activeSince));
  }

  isActive(): boolean {
    return this.activeSince !== null;
  }
}
