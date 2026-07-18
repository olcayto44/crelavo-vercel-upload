const blockedContentPatterns = [
  /m[uü]stehcen/i,
  /a[cç][ıi]k\s*sa[cç][ıi]k/i,
  /sapk[ıi]n/i,
  /porn/i,
  /porno/i,
  /explicit\s*sex/i,
  /sexual\s*content/i,
  /nudity/i,
  /nude/i,
  /çıplak/i,
  /ciplak/i,
  /erotik/i,
  /ensest/i,
  /incest/i,
  /tecav[üu]z/i,
  /rape/i,
  /minor\s*sexual/i,
  /child\s*sexual/i,
  /çocuk.*cinsel/i,
  /cinsel.*çocuk/i,
  /şiddetli\s*cinsel/i,
  /sexual\s*violence/i
];

export const blockedProductionMessage = "Crelavo'da müstehcen, açık saçık, sapkın, cinsel şiddet içeren veya yasa dışı/zararlı üretim talepleri oluşturulamaz. Lütfen güvenli, ticari ve yayınlanabilir bir üretim talebi yaz.";

export function validateProductionSafety(values: unknown[]) {
  const text = values
    .map((value) => Array.isArray(value) ? value.join(" ") : String(value ?? ""))
    .join(" ")
    .toLowerCase();

  const blocked = blockedContentPatterns.some((pattern) => pattern.test(text));
  return blocked ? { ok: false as const, message: blockedProductionMessage } : { ok: true as const };
}
