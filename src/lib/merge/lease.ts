import { LeaseLostError } from "./errors.ts";

export interface LeaseOptions {
  /** DB'deki lease süresi (ms). */
  leaseMs: number;
  /** Heartbeat aralığı (ms). Genelde leaseMs / 4-6. */
  intervalMs: number;
}

/**
 * İş boyunca lease'i canlı tutar ve kaybı tespit edince `signal`'ı abort eder.
 * İndirme (fetch) ve FFmpeg bu sinyale bağlıdır, yani lease kaybında ikisi de durur.
 *
 * Lease kaybı iki yoldan anlaşılır:
 *  1) Heartbeat RPC'si false döner (DB sahipliği başka worker'a vermiş / iş artık bizim değil).
 *  2) Self-fence: heartbeat uzun süredir yenilenemiyor (ağ/DB sorunu). Lease süresinin %70'i dolunca
 *     biz kendimiz duruyoruz; böylece lease DB'de bitip başka worker devralmadan ÖNCE çalışmayı kesiyoruz
 *     ve aynı iş iki yerde birden çalışmıyor.
 */
export class LeaseGuard {
  private readonly controller = new AbortController();
  private timer?: NodeJS.Timeout;
  private lastOkAt = Date.now();
  private busy = false;

  private readonly beat: () => Promise<boolean>;
  private readonly opts: LeaseOptions;
  constructor(beat: () => Promise<boolean>, opts: LeaseOptions) {
    this.beat=beat;this.opts=opts;
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }
  get lost(): boolean {
    return this.controller.signal.aborted;
  }

  start(): void {
    this.lastOkAt = Date.now();
    this.timer = setInterval(() => void this.tick(), this.opts.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Dışarıdan iptal (örn. worker kapanışı). reason olarak verilen hata signal.reason olur. */
  abort(reason: unknown): void {
    if (!this.controller.signal.aborted) this.controller.abort(reason);
    this.stop();
  }

  /** Kritik adımlardan (yükleme, DB'ye tamamlandı yazma) önce çağırın. */
  throwIfLost(): void {
    if(Date.now()-this.lastOkAt>this.opts.leaseMs*0.7)this.lose("Lease do?rulanamad?");
    if (this.controller.signal.aborted) throw this.controller.signal.reason ?? new LeaseLostError();
  }

  private lose(reason: string): void {
    this.abort(new LeaseLostError(reason));
  }

  private async tick(): Promise<void> {
    if (this.lost) return;
    // Watchdog: heartbeat takılsa bile (busy) süre dolunca kendimizi durdururuz.
    if (Date.now() - this.lastOkAt > this.opts.leaseMs * 0.7) {
      return this.lose("Heartbeat uzun süredir yenilenemedi (self-fence)");
    }
    if (this.busy) return;
    this.busy = true;
    try {
      const sentAt=Date.now();
      const ok = await this.beat();
      if (this.lost) return;
      if (!ok) return this.lose("Lease sahipliği kaybedildi");
      this.lastOkAt = sentAt;
    } catch {
      // Geçici hata: bir sonraki tick tekrar dener; süre dolarsa watchdog keser.
    } finally {
      this.busy = false;
    }
  }
}
