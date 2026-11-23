/** Kod ve yeniden denenebilirlik bilgisi taşıyan iş hatası. */
export class MergeError extends Error {
  public readonly code: string;
  public readonly retriable: boolean;
  constructor(
    code: string,
    message: string,
    /** true: iş kuyruğa geri alınıp tekrar denenebilir. false: doğrudan failed. */
    retriable = false,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.code=code;
    this.retriable=retriable;
    this.name = "MergeError";
    if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
  }
}

/** Worker lease'ini kaybetti: sessizce dur, işi başka worker devralır. DB'ye failed yazılmaz. */
export class LeaseLostError extends Error {
  constructor(message = "Worker lease kaybedildi") {
    super(message);
    this.name = "LeaseLostError";
  }
}

export function errorInfo(err: unknown): { code: string; message: string; retriable: boolean } {
  if (err instanceof MergeError) return { code: err.code, message: err.message, retriable: err.retriable };
  const message = err instanceof Error ? err.message : String(err);
  // Beklenmeyen hata: bir kez daha denemeye değer (ağ, geçici I/O); deneme sınırı DB'de.
  return { code: "UNEXPECTED", message: message.slice(0, 500), retriable: true };
}
