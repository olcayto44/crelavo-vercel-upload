import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { findPaymentProduct } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase";

const CREDIT_VALUE = Number(process.env.CREDIT_VALUE_USD ?? 0.1);
const TARGET_COST_RATIO = Number(process.env.TARGET_COST_RATIO ?? 0.3);

function withinDays(date: string, days: number) {
  const created = new Date(date).getTime();
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return created >= start;
}

function noteValue(note: string | null | undefined, key: string) {
  const parts = String(note ?? "").split("|").map((item) => item.trim());
  const match = parts.find((item) => item.toLowerCase().startsWith(`${key.toLowerCase()}=`));
  return match ? match.slice(key.length + 1).trim() : "";
}

function paymentProductName(packageId: string) {
  const product = findPaymentProduct(packageId);
  return product?.name ?? (packageId || "Unknown package");
}

function paymentProductRevenueUsd(packageId: string, credits: number) {
  const product = findPaymentProduct(packageId);
  return Number(product?.priceUsd ?? credits * CREDIT_VALUE) || 0;
}

function periodSums(createdAt: string, revenueUsd: number) {
  return {
    todayRevenueUsd: withinDays(createdAt, 1) ? revenueUsd : 0,
    weeklyRevenueUsd: withinDays(createdAt, 7) ? revenueUsd : 0,
    monthlyRevenueUsd: withinDays(createdAt, 30) ? revenueUsd : 0
  };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const supabase = supabaseAdmin();
    const { data: events, error } = await supabase
      .from("credit_events")
      .select("user_id, type, amount, note, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: productions, error: productionError } = await supabase
      .from("production_requests")
      .select("production_type, package_id, status, reserved_credits, estimated_credits, request_metadata, output_json, created_at");

    if (productionError) throw productionError;

    const purchaseEvents = events?.filter((event) => event.type === "purchase") ?? [];
    const manualEvents = events?.filter((event) => event.type === "adjustment") ?? [];
    const paymentLinkActivationEvents = manualEvents.filter((event) => {
      const note = String(event.note ?? "").toLowerCase();
      return note.includes("payment link") || note.includes("receipt=") || note.includes("invoice=");
    });
    const spendEvents = events?.filter((event) => event.type === "spend") ?? [];
    const reserveEvents = events?.filter((event) => event.type === "reserve") ?? [];
    const refundEvents = events?.filter((event) => event.type === "refund") ?? [];

    const sum = (items: typeof events) => items?.reduce((total, item) => total + (item.amount ?? 0), 0) ?? 0;
    const sumWithin = (items: typeof events, days: number) => sum(items?.filter((item) => withinDays(item.created_at, days)) ?? []);

    const soldCredits = sum(purchaseEvents);
    const manualCredits = sum(manualEvents);
    const paymentLinkActivatedCredits = sum(paymentLinkActivationEvents);
    const paymentLinkActivationCount = paymentLinkActivationEvents.length;
    const spentCredits = sum(spendEvents);
    const reservedCredits = sum(reserveEvents) - sum(refundEvents) - spentCredits;

    const revenue = soldCredits * CREDIT_VALUE;
    const todayRevenue = sumWithin(purchaseEvents, 1) * CREDIT_VALUE;
    const weeklyRevenue = sumWithin(purchaseEvents, 7) * CREDIT_VALUE;
    const monthlyRevenue = sumWithin(purchaseEvents, 30) * CREDIT_VALUE;

    const packageSalesRows = purchaseEvents.map((event) => {
      const packageId = noteValue(event.note, "package") || "unknown_package";
      const billing = noteValue(event.note, "billing") || "unknown";
      const whopPayment = noteValue(event.note, "whop_payment") || noteValue(event.note, "payment") || "";
      const membership = noteValue(event.note, "membership") || "";
      const credits = Number(event.amount ?? 0) || 0;
      const revenueUsd = paymentProductRevenueUsd(packageId, credits);
      return {
        userId: String(event.user_id ?? "unknown_user"),
        packageId,
        packageName: paymentProductName(packageId),
        billing,
        credits,
        revenueUsd: Number(revenueUsd.toFixed(2)),
        whopPayment,
        membership,
        createdAt: event.created_at,
        ...periodSums(event.created_at, revenueUsd)
      };
    });

    const packageSalesMap = new Map<string, { packageId: string; packageName: string; count: number; credits: number; revenueUsd: number; todayRevenueUsd: number; weeklyRevenueUsd: number; monthlyRevenueUsd: number }>();
    packageSalesRows.forEach((sale) => {
      const current = packageSalesMap.get(sale.packageId) ?? { packageId: sale.packageId, packageName: sale.packageName, count: 0, credits: 0, revenueUsd: 0, todayRevenueUsd: 0, weeklyRevenueUsd: 0, monthlyRevenueUsd: 0 };
      current.count += 1;
      current.credits += sale.credits;
      current.revenueUsd += sale.revenueUsd;
      current.todayRevenueUsd += sale.todayRevenueUsd;
      current.weeklyRevenueUsd += sale.weeklyRevenueUsd;
      current.monthlyRevenueUsd += sale.monthlyRevenueUsd;
      packageSalesMap.set(sale.packageId, current);
    });
    const packageSalesSummary = Array.from(packageSalesMap.values())
      .map((row) => ({
        ...row,
        revenueUsd: Number(row.revenueUsd.toFixed(2)),
        todayRevenueUsd: Number(row.todayRevenueUsd.toFixed(2)),
        weeklyRevenueUsd: Number(row.weeklyRevenueUsd.toFixed(2)),
        monthlyRevenueUsd: Number(row.monthlyRevenueUsd.toFixed(2))
      }))
      .sort((a, b) => b.revenueUsd - a.revenueUsd || b.count - a.count);
    const recentPackageSales = packageSalesRows.slice(0, 20).map((sale) => ({
      userId: sale.userId,
      packageId: sale.packageId,
      packageName: sale.packageName,
      billing: sale.billing,
      credits: sale.credits,
      revenueUsd: sale.revenueUsd,
      whopPayment: sale.whopPayment,
      membership: sale.membership,
      createdAt: sale.createdAt
    }));

    const estimatedCost = spentCredits * CREDIT_VALUE * TARGET_COST_RATIO;
    const estimatedGrossProfit = revenue - estimatedCost;
    const margin = revenue > 0 ? Math.round((estimatedGrossProfit / revenue) * 100) : 0;

    const productionRows = productions ?? [];
    const productionProfitRows = productionRows.map((production) => {
      const requestMetadata = production.request_metadata && typeof production.request_metadata === "object" ? production.request_metadata as Record<string, unknown> : {};
      const outputPlan = requestMetadata.outputPlan && typeof requestMetadata.outputPlan === "object" ? requestMetadata.outputPlan as Record<string, unknown> : {};
      const profitEstimate = outputPlan.profitEstimate && typeof outputPlan.profitEstimate === "object" ? outputPlan.profitEstimate as Record<string, unknown> : null;
      const reserved = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
      const revenueUsd = Number(profitEstimate?.estimatedRevenueUsd ?? reserved * CREDIT_VALUE) || 0;
      const providerCostUsd = Number(profitEstimate?.estimatedProviderCostUsd ?? revenueUsd * TARGET_COST_RATIO) || 0;
      const grossProfitUsd = Number(profitEstimate?.estimatedGrossProfitUsd ?? revenueUsd - providerCostUsd) || 0;
      const packageId = String(production.package_id ?? "unknown_package");
      return {
        packageId,
        productionType: String(production.production_type ?? "production"),
        status: String(production.status ?? ""),
        reservedCredits: reserved,
        revenueUsd,
        providerCostUsd,
        grossProfitUsd,
        marginPercent: revenueUsd > 0 ? Math.round((grossProfitUsd / revenueUsd) * 100) : 0,
        hasApiBreakdown: Boolean(profitEstimate?.providerCostLines)
      };
    });
    const productionRevenue = productionProfitRows.reduce((total, row) => total + row.revenueUsd, 0);
    const estimatedApiCost = productionProfitRows.reduce((total, row) => total + row.providerCostUsd, 0);
    const productionGrossProfit = productionProfitRows.reduce((total, row) => total + row.grossProfitUsd, 0);
    const productionMargin = productionRevenue > 0 ? Math.round((productionGrossProfit / productionRevenue) * 100) : 0;
    const apiBreakdownProductionCount = productionProfitRows.filter((row) => row.hasApiBreakdown).length;
    const packageMap = new Map<string, { packageId: string; productionType: string; count: number; reservedCredits: number; revenueUsd: number; providerCostUsd: number; grossProfitUsd: number }>();
    productionProfitRows.forEach((row) => {
      const current = packageMap.get(row.packageId) ?? { packageId: row.packageId, productionType: row.productionType, count: 0, reservedCredits: 0, revenueUsd: 0, providerCostUsd: 0, grossProfitUsd: 0 };
      current.count += 1;
      current.reservedCredits += row.reservedCredits;
      current.revenueUsd += row.revenueUsd;
      current.providerCostUsd += row.providerCostUsd;
      current.grossProfitUsd += row.grossProfitUsd;
      packageMap.set(row.packageId, current);
    });
    const topProductionPackages = Array.from(packageMap.values())
      .map((row) => ({
        ...row,
        revenueUsd: Number(row.revenueUsd.toFixed(2)),
        providerCostUsd: Number(row.providerCostUsd.toFixed(2)),
        grossProfitUsd: Number(row.grossProfitUsd.toFixed(2)),
        marginPercent: row.revenueUsd > 0 ? Math.round((row.grossProfitUsd / row.revenueUsd) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count || b.revenueUsd - a.revenueUsd)
      .slice(0, 6);

    const resolutionRows = productionRows.map((production) => {
      const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
      const creditResolution = outputJson.creditResolution && typeof outputJson.creditResolution === "object" ? outputJson.creditResolution as Record<string, unknown> : null;
      return {
        status: String(creditResolution?.status ?? ""),
        spentCredits: Number(creditResolution?.spentCredits ?? 0) || 0,
        refundedCredits: Number(creditResolution?.refundedCredits ?? 0) || 0,
        releasedReservedCredits: Number(creditResolution?.releasedReservedCredits ?? 0) || 0,
        reservedCredits: Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0
      };
    });
    const countResolution = (status: string) => resolutionRows.filter((row) => row.status === status).length;
    const sumResolution = (field: "spentCredits" | "refundedCredits" | "releasedReservedCredits") => resolutionRows.reduce((total, row) => total + row[field], 0);
    const pendingCreditReviews = countResolution("admin_review_required");
    const spentReservedProductions = countResolution("spent_reserved");
    const refundedReservedProductions = countResolution("refunded_reserved");
    const cancelledHalfSpentProductions = countResolution("cancelled_half_spent");
    const pendingReviewReservedCredits = resolutionRows.filter((row) => row.status === "admin_review_required").reduce((total, row) => total + row.reservedCredits, 0);

    return Response.json({
      creditValue: CREDIT_VALUE,
      targetCostRatio: TARGET_COST_RATIO,
      revenue,
      todayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      soldCredits,
      manualCredits,
      paymentLinkActivatedCredits,
      paymentLinkActivationCount,
      spentCredits,
      reservedCredits: Math.max(0, reservedCredits),
      pendingCreditReviews,
      pendingReviewReservedCredits,
      spentReservedProductions,
      refundedReservedProductions,
      cancelledHalfSpentProductions,
      finalizedSpentCredits: sumResolution("spentCredits"),
      finalizedRefundedCredits: sumResolution("refundedCredits"),
      finalizedReleasedReservedCredits: sumResolution("releasedReservedCredits"),
      estimatedCost,
      estimatedGrossProfit,
      margin,
      productionRevenue: Number(productionRevenue.toFixed(2)),
      estimatedApiCost: Number(estimatedApiCost.toFixed(2)),
      productionGrossProfit: Number(productionGrossProfit.toFixed(2)),
      productionMargin,
      apiBreakdownProductionCount,
      totalProductionCount: productionProfitRows.length,
      topProductionPackages,
      packageSalesSummary,
      recentPackageSales
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load finance metrics";
    return Response.json({ error: message }, { status: 500 });
  }
}
