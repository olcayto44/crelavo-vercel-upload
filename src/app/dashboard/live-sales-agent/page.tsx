import { DashboardAccountStyles } from "@/components/DashboardAccountStyles";
import { DashboardFooter } from "@/components/DashboardFooter";
import { LiveSalesAgentStyles } from "@/components/LiveSalesAgentStyles";
import { LiveSalesControlCenter } from "@/components/LiveSalesControlCenter";

export default function DashboardLiveSalesAgentPage() {
  return (
    <main className="dashboard-standalone-service-page live-sales-agent-page assistant-full-page">
      <LiveSalesAgentStyles />
      <DashboardAccountStyles footer={<DashboardFooter />}>
        <LiveSalesControlCenter />
      </DashboardAccountStyles>
    </main>
  );
}
