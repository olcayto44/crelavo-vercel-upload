import { BrandKitPanel } from "@/components/BrandKitPanel";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default function BrandKitPage() {
  return (
    <DashboardToolLayout id="brand-kit">
      <span className="badge">Brand kit planning</span>
      <h1>Brand assets for production templates</h1>
      <p className="lead">Collect logo, color, font and brand direction so videos, websites, ads and social export packs can reuse the same visual identity.</p>
      <div className="btns"><a className="btn btn-out" href="/dashboard/create?type=Website&category=brand_kit">Start brand production</a></div>
      <BrandKitPanel />
    </DashboardToolLayout>
  );
}
