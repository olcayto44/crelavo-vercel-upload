import { DashboardAccountStyles } from "@/components/DashboardAccountStyles";
import { LiveSalesAgentStyles } from "@/components/LiveSalesAgentStyles";
import { LiveSalesControlCenter } from "@/components/LiveSalesControlCenter";

export default function DashboardLiveSalesAgentPage() {
  return (
    <main className="dashboard-standalone-service-page live-sales-agent-page assistant-full-page">
      <DashboardAccountStyles />
      <LiveSalesAgentStyles />
      <LiveSalesControlCenter />
    </main>
  );
}
