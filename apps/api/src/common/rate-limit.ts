/**
 * Limitator de rată simplu, în memorie (SPEC §4: max 5 mesaje / IP / oră).
 * Fără dependențe externe și fără stare partajată între instanțe — suficient
 * pentru un formular public care oricum răspunde `{ ok: true }` la depășire.
 */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    /** peste câte chei se face curățenia generală */
    private readonly pruneAfter = 2000,
  ) {}

  /** `true` dacă cererea se încadrează în limită (și o contorizează). */
  take(key: string): boolean {
    const now = Date.now();
    const since = now - this.windowMs;

    if (this.hits.size > this.pruneAfter) this.prune(since);

    const recent = (this.hits.get(key) ?? []).filter((at) => at > since);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  private prune(since: number): void {
    for (const [key, timestamps] of this.hits) {
      const recent = timestamps.filter((at) => at > since);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }
}
