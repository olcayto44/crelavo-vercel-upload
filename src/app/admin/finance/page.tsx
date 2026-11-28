import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { AdminFinanceCards } from "@/components/AdminFinanceCards";
import { supabaseAdmin } from "@/lib/supabase";
import { productionReadinessScorePlan, providerCostLedgerPlan, providerQueueConcurrencyGuard } from "@/lib/launch-ops-readiness";

const financeGuardrails = [
  "Whop fulfilled amounts are shown separately from credit-derived estimates and manual credit activations.",
  "Reserved credits are shown as exposure until a production is finalized, refunded or sent to admin review.",
  "Provider/API cost estimates are simulations only, not verified expenses.",
  "Real provider spend should remain blocked until payment, credit reservation and provider readiness checks pass.",
  "Lemon remains postponed; Whop is the active payment path for finance reconciliation."
];

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const db=()=>supabaseAdmin();
  const now=new Date(),day=new Date(now.getTime()+3*3600000);day.setUTCHours(0,0,0,0);
  const since=(days:number)=>new Date(day.getTime()-3*3600000-(days-1)*86400000).toISOString();
  async function verifiedPeriod(days:number){
    try{
      const r=await db().from("payment_fulfillments").select("amount_usd,credits",{count:"exact"}).eq("status","fulfilled").gte("created_at",since(days)).limit(1000);
      if(r.error||!r.data||r.count!==r.data.length)return {days,count:r.error?null:r.count,revenue:null,credits:null};
      const total=(key:"amount_usd"|"credits")=>r.data.some(row=>row[key]==null||row[key]===""||!Number.isFinite(Number(row[key])))?null:r.data.reduce((sum,row)=>sum+Number(row[key]),0);
      return {days,count:r.count,revenue:total("amount_usd"),credits:total("credits")};
    }catch{return {days,count:null,revenue:null,credits:null}}
  }
  const periods=await Promise.all([1,7,30].map(verifiedPeriod));
  const fmt=(value:number|null,currency=false)=>value===null?"Veri yok":new Intl.NumberFormat("tr-TR",currency?{style:"currency",currency:"USD"}:{maximumFractionDigits:0}).format(value);
  return (
    <AdminShell title="Finans ve maliyet yönetimi" description="Whop ödeme kayıtları, kredi hareketleri ve sağlayıcı giderlerinin ayrı raporlanması.">
      <section className="card admin-wide-card">
        <span className="badge">Revenue / provider spend</span>
        <h2>Finance overview for launch-safe production spend</h2>
        <p style={{ color: "var(--muted)" }}>
          This page separates real payment API revenue from manual credit activations, tracks reserved credits, estimates provider/API spend, and keeps production margin visible before scaling traffic or provider usage.
        </p>
        <div className="admin-info-grid">
          <div><span>Revenue source</span><strong>Payment events</strong><small>Credit purchase events only; manual activations are separate</small></div>
          <div><span>Spend source</span><strong>Production credits</strong><small>Reserved/spent credits and provider cost estimates</small></div>
          <div><span>Provider guard</span><strong>Payment first</strong><small>No live provider job without credit/payment eligibility</small></div>
          <div><span>Payment mode</span><strong>Whop active</strong><small>Lemon integration stays last</small></div>
        </div>
      </section>

      <section className="card admin-wide-card"><h2>Whop ödeme kayıtları</h2><p>İstanbul saati. Fulfilled brüt kayıtları; banka tahsilatı, komisyon, iade ve vergi mutabakatı değildir. Eksik tutarlar veya 1.000 kaydı aşan toplamlar hesaplanmaz.</p>
      <div className="admin-table-wrap"><table className="table"><thead><tr><th>Dönem</th><th>Tamamlanan ödeme kaydı</th><th>Brüt kayıtlı tutar</th><th>Verilen kredi</th></tr></thead><tbody>{periods.map(p=><tr key={p.days}><td>{p.days===1?"Bugün":p.days+" gün"}</td><td>{fmt(p.count)}</td><td>{fmt(p.revenue,true)}</td><td>{fmt(p.credits)}</td></tr>)}</tbody></table></div>
      <div className="admin-info-grid"><div><span>Kesin API gideri</span><strong>Mutabakat gerekli</strong><small>Sağlayıcı faturası ile doğrulanmamış</small></div><div><span>Net kazanç</span><strong>Hesaplanmadı</strong><small>İadeler, komisyonlar, vergiler ve giderler gerekli</small></div></div>
      </section>
      <details className="card admin-wide-card"><summary>Eski kredi ve maliyet simülasyonu (tahmini, muhasebe raporu değil)</summary><AdminFinanceCards /></details>
      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Production readiness / credit burn</span>
        <h2>Production Readiness Score and Credit Burn Forecast</h2>
        <p style={{ color: "var(--muted)" }}>
          Score status: {productionReadinessScorePlan.status}. Finance should keep payment, reserve/spend, provider cost, queue pressure and forced-failure proof visible before paid traffic scales.
        </p>
        <div className="admin-info-grid">
          <div><span>Single-job cap</span><strong>{providerQueueConcurrencyGuard.defaults.maxSingleJobCredits.toLocaleString()} credits</strong><small>Block oversized jobs before provider spend</small></div>
          <div><span>Daily user cap</span><strong>{providerQueueConcurrencyGuard.defaults.dailyUserProductionCount} jobs</strong><small>Launch-safe production count limit</small></div>
          <div><span>Queue pressure</span><strong>{providerQueueConcurrencyGuard.defaults.maxConcurrentProviderJobs} concurrent jobs</strong><small>Raise only after controlled provider smoke tests pass</small></div>
          <div><span>Retry/backoff</span><strong>{providerQueueConcurrencyGuard.defaults.maxProviderRetries} retries</strong><small>{providerQueueConcurrencyGuard.defaults.backoffSeconds.join(" / ")} sec forecast windows</small></div>
        </div>
        <div className="admin-grid two-col" style={{ marginTop: 16 }}>
          <div className="mini-card">
            <h3>Score inputs</h3>
            <ul>{productionReadinessScorePlan.scoreInputs.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="mini-card">
            <h3>Score bands</h3>
            <ul>{productionReadinessScorePlan.scoreBands.map((item) => <li key={item.band}><strong>{item.band}</strong>: {item.meaning}</li>)}</ul>
          </div>
        </div>
        <div className="mini-card" style={{ marginTop: 16 }}>
          <h3>Credit Burn Forecast rules</h3>
          <ul>{productionReadinessScorePlan.creditBurnForecast.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Provider Cost Ledger / margin</span>
        <h2>Actual provider cost and margin tracking</h2>
        <p style={{ color: "var(--muted)" }}>{providerCostLedgerPlan.reviewGate}</p>
        <div className="admin-info-grid">
          {providerCostLedgerPlan.fields.map((field) => <div key={field}><span>Ledger field</span><strong>{field}</strong><small>{providerCostLedgerPlan.status}</small></div>)}
        </div>
        <ul>{providerCostLedgerPlan.marginRules.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Finance guardrails</span>
        <h2>What must be checked before scaling</h2>
        <ul>{financeGuardrails.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="url-action-center" style={{ marginTop: 14 }}>
          <Link className="btn" href="/admin/payments">Open automated payments</Link>
          <Link className="btn secondary" href="/admin/credits">Open credit operations</Link>
          <Link className="btn secondary" href="/admin/api-guard">Open API guard</Link>
          <Link className="btn secondary" href="/admin/providers">Open provider readiness</Link>
        </div>
      </section>
    </AdminShell>
  );
}
