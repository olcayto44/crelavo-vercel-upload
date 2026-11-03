export async function blogAdminRequest(init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api/admin/blog", { ...init, credentials: "same-origin", cache: "no-store", signal: controller.signal });
    let data;
    try { data = await response.json(); } catch { throw new Error("Sunucu geçerli yanıt vermedi. Oturumunuzu ve bağlantınızı kontrol edin; metninizi koruyarak yeniden deneyin."); }
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "İşlem tamamlanamadı (HTTP " + response.status + ").");
    if (!data || !Array.isArray(data.posts) || !(data.revision === null || typeof data.revision === "string")) throw new Error("Sunucu yanıtı eksik. Metninizi koruyarak yazı listesini kontrol edin.");
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Sunucu 20 saniye içinde yanıt vermedi. Kayıt gerçekleşmiş olabilir; metninizi kopyalayıp yazı listesini kontrol edin.");
    throw error;
  } finally { clearTimeout(timer); }
}
