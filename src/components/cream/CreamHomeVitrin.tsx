import Link from "next/link";
import { whopFreeTrialCheckoutUrl } from "@/lib/whop";
import styles from "./CreamHomeVitrin.module.css";

const goals = [
  ["01", "International", "Localize product ads and campaign direction for another market.", "/dashboard/assistant-workspace?intent=international"],
  ["02", "Ad scorer", "Score an existing ad before production credits move.", "/free-tools/ad-performance-score-checker"],
  ["03", "From scratch", "Create a product video, landing page or campaign pack.", "/dashboard/assistant-workspace?intent=scratch"],
] as const;

export default function CreamHomeVitrin() {
  return <section className={styles.page} aria-label="Crelavo live sales introduction">
    <div className={styles.island}>
      <div className={styles.heroCopy}><p className={styles.kicker}>For hosts selling physical goods live</p><h2 className={styles.display}>Don&apos;t lose<br/>live orders.</h2><p className={styles.lead}>Launch your 24/7 AI Live Sales Agent in 60 seconds. First 24 hours free.</p><div className={styles.actions}><a className={styles.primary} href={whopFreeTrialCheckoutUrl}>Start 24-hour trial</a><Link className={styles.secondary} href="/pricing">See pricing</Link></div></div>
      <div className={styles.visual}><img src="/images/cream/home-checklist.png" alt="Live sales order checklist" /></div>
    </div>
    <div className={styles.goals}>{goals.map(([num,title,text,href]) => <Link className={styles.card} href={href} key={num}><span className={styles.number}>{num}</span><h3>{title}</h3><p>{text}</p></Link>)}</div>
    <div className={styles.section}><p className={styles.kicker}>Live Sales Agent</p><h2>The SKU stays on camera. The agent captures the order.</h2><div className={styles.three}><article><b>1</b><h3>SKU on the floor</h3><p>The physical product stays in frame.</p></article><article><b>2</b><h3>Order captured</h3><p>Shipping is asked while you talk.</p></article><article><b>3</b><h3>Dashboard delivery</h3><p>Preview and final files stay together.</p></article></div></div>
    <div className={styles.section}><p className={styles.kicker}>Trust</p><h2>Credits, refund, cancel — in Whop.</h2><p className={styles.lead}>Existing billing, credit ledger and legal flows remain unchanged.</p></div>
  </section>;
}