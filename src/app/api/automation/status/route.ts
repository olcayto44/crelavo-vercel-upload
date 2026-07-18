import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig, enforceRouteBudget } from "@/lib/api-cost-guard";
import { computeProviderSuccessSpend } from "@/lib/credit-resolution";
import { customerEmailForProduction, sendProductionCompletionEmail } from "@/lib/production-email";
import { providerJobFromValue, runProviderJobLifecycle } from "@/lib/provider-jobs";
import { getProviderStatus } from "@/lib/providers/status";
import type { NormalizedProviderStatus } from "@/lib/providers/types";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

async function requireAutomationStatusAccess(request: Request, body: Record<string, unknown>, production: { user_id?: string | null }) {
  if (isAdminRequest(request, body)) return { ok: true as const };
  const productionUserId = String(production.user_id ?? "").trim();
  const userId = String(body.user_id ?? productionUserId).trim();
  if (!productionUserId || !userId || userId !== productionUserId) return { ok: false as const, response: adminRequiredResponse() };
  const verified = await requireVerifiedRequestUser(request, userId);
  if (!verified.ok) return verified;
  return { ok: true as const };
}

async function pollAlternativeJobs(alternatives: unknown[]) {
  const statuses: NormalizedProviderStatus[] = [];
  const updatedAlternatives = await Promise.all(alternatives.map(async (item) => {
    if (!item || typeof item !== "object") return item;
    const record = item as Record<string, unknown>;
    const job = providerJobFromValue(record.visualJob);
    if (!job) return item;
    try {
      const status = await getProviderStatus(job);
      statuses.push(status);
      if (status.status === "succeeded" && status.outputUrl) {
        return { ...record, status: "ready", preview_url: status.outputUrl, url: status.outputUrl, providerStatus: `${status.provider}_succeeded`, visualStatus: status };
      }
      if (status.status === "failed") {
        return { ...record, status: "provider_failed", providerError: status.error ?? "Provider job failed.", providerStatus: `${status.provider}_failed`, visualStatus: status };
      }
      return { ...record, status: `provider_${status.status}`, providerStatus: `${status.provider}_${status.status}`, visualStatus: status };
    } catch (error) {
      return { ...record, providerError: errorMessage(error, "Alternative provider polling failed") };
    }
  }));
  return { updatedAlternatives, statuses };
}

function updatedSteps(steps: unknown, finalStatus: NormalizedProviderStatus) {
  if (!Array.isArray(steps)) return steps;
  return steps.map((step) => {
    if (!step || typeof step !== "object") return step;
    const record = step as Record<string, unknown>;
    if (record.key === "edit_render") {
      return { ...record, status: finalStatus.status === "succeeded" ? "done" : finalStatus.status === "failed" ? "failed" : "running" };
    }
    if (record.key === "delivery" && finalStatus.status === "succeeded") return { ...record, status: "done" };
    return record;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const productionId = String(body.production_id ?? "").trim();
    const guardConfig = apiCostGuardConfig();
    const routeBudget = enforceRouteBudget(request, { route: "automation:status", userId: String(body.user_id ?? ""), ipLimit: guardConfig.automationStatusIpLimit, userLimit: guardConfig.automationStatusUserLimit, windowMs: 15 * 60 * 1000 });
    if (!routeBudget.ok) return routeBudget.response;
    if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: production, error } = await supabase
      .from("production_requests")
      .select("*")
      .eq("id", productionId)
      .single();

    if (error) throw error;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });
    const access = await requireAutomationStatusAccess(request, body, production);
    if (!access.ok) return access.response;

    const output = production.output_json && typeof production.output_json === "object"
      ? production.output_json as Record<string, unknown>
      : {};
    const visualLifecycle = await runProviderJobLifecycle(production, output.visualJob);
    const renderLifecycle = await runProviderJobLifecycle(production, output.renderJob);
    const visualStatus = visualLifecycle.normalizedStatus;
    const renderStatus = renderLifecycle.normalizedStatus;
    const existingAlternatives = Array.isArray(output.alternatives) ? output.alternatives : [];
    const { updatedAlternatives: polledAlternatives, statuses: alternativeStatuses } = await pollAlternativeJobs(existingAlternatives);
    const terminalStatus = renderStatus ?? visualStatus;

    if (!terminalStatus) {
      if (alternativeStatuses.length > 0) {
        const { data } = await supabase
          .from("production_requests")
          .update({
            generation_status: "alternative_provider_polling",
            output_json: { ...output, alternatives: polledAlternatives, alternativeStatuses, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry },
            updated_at: new Date().toISOString()
          })
          .eq("id", productionId)
          .select("*")
          .single();
        return Response.json({ production: data, visualStatus, renderStatus, alternativeStatuses });
      }
      return Response.json({ production, visualStatus, renderStatus, message: "No provider jobs found yet." });
    }

    if (terminalStatus.status === "failed") {
      const failureMessage = terminalStatus.error ?? "Provider job failed.";
      const creditResolution = {
        status: "admin_review_required",
        reason: "provider_failed",
        reservedCredits: production.reserved_credits ?? production.estimated_credits ?? null,
        instruction: "Provider failed. Admin must choose whether to refund credits, restart the job or deliver manually. No automatic refund was applied."
      };
      const { data } = await supabase
        .from("production_requests")
        .update({
          status: "failed",
          automation_status: "failed",
          generation_status: `${terminalStatus.provider}_failed`,
          error_message: failureMessage,
            output_json: { ...output, visualStatus, renderStatus, alternatives: polledAlternatives, alternativeStatuses, providerStatus: terminalStatus ? `${terminalStatus.provider}_${terminalStatus.status}` : output.providerStatus, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry, creditResolution },
          automation_steps: updatedSteps(production.automation_steps, terminalStatus),
          admin_notes: `Provider failed: ${failureMessage}. Credit resolution requires admin review; no automatic refund was applied.`,
          updated_at: new Date().toISOString()
        })
        .eq("id", productionId)
        .select("*")
        .single();

      return Response.json({ production: data, visualStatus, renderStatus });
    }

    const successfulStatus = renderStatus?.status === "succeeded" && renderStatus.outputUrl ? renderStatus : visualStatus?.status === "succeeded" && visualStatus.outputUrl ? visualStatus : null;
    if (successfulStatus) {
      const existingCreditResolution = output.creditResolution && typeof output.creditResolution === "object" ? output.creditResolution as Record<string, unknown> : null;
      let creditResolution = existingCreditResolution;
      let finalizedReservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;

      if (existingCreditResolution?.status !== "spent_reserved" && finalizedReservedCredits > 0) {
        const { data: balanceRow, error: balanceReadError } = await supabase
          .from("credit_balances")
          .select("balance, reserved")
          .eq("user_id", production.user_id)
          .maybeSingle();

        if (balanceReadError) throw balanceReadError;

        const balance = Number(balanceRow?.balance ?? 0) || 0;
        const reserved = Number(balanceRow?.reserved ?? 0) || 0;
        const creditDecision = computeProviderSuccessSpend({ balance, reserved, reservedCredits: finalizedReservedCredits, productionTitle: production.title ?? production.id });

        const { error: balanceUpdateError } = await supabase
          .from("credit_balances")
          .upsert({
            user_id: production.user_id,
            balance: creditDecision.nextBalance,
            reserved: creditDecision.nextReserved,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });

        if (balanceUpdateError) throw balanceUpdateError;

        if (creditDecision.event) {
          const { error: creditEventError } = await supabase
            .from("credit_events")
            .insert({ user_id: production.user_id, ...creditDecision.event });

          if (creditEventError) throw creditEventError;
        }

        creditResolution = creditDecision.creditResolution;
        finalizedReservedCredits = creditDecision.finalizedReservedCredits;
      } else if (existingCreditResolution?.status === "spent_reserved") {
        finalizedReservedCredits = Number(production.reserved_credits ?? 0) || 0;
      }

      const finalUrl = successfulStatus.outputUrl ?? "";
      const updatedAlternatives = polledAlternatives.length > 0
        ? polledAlternatives.map((item, index) => index === 0 && item && typeof item === "object" ? { ...(item as Record<string, unknown>), status: "ready", preview_url: finalUrl, url: finalUrl, description: "Real output generated by the provider is ready." } : item)
        : [{ id: "provider-output-1", title: "Provider output", status: "ready", description: "Real output generated by the provider is ready.", preview_url: finalUrl, url: finalUrl }];
      const { data } = await supabase
        .from("production_requests")
        .update({
          status: "ready",
          automation_status: "completed",
          generation_status: "final_video_ready",
          preview_url: finalUrl,
          delivery_link: finalUrl,
          delivery_zip_url: finalUrl,
          reserved_credits: finalizedReservedCredits,
          output_json: { ...output, visualStatus, renderStatus, finalVideoUrl: finalUrl, alternatives: updatedAlternatives, alternativeStatuses, providerStatus: `${successfulStatus.provider}_succeeded`, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry, creditResolution },
          automation_steps: updatedSteps(production.automation_steps, successfulStatus),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          admin_notes: "Final ad video is ready. Customer can preview, download or export."
        })
        .eq("id", productionId)
        .select("*")
        .single();

      let completionEmailResult: unknown = { skipped: true, reason: "Production update did not return a user id." };
      try {
        if (data?.user_id) {
          const customerEmail = await customerEmailForProduction(String(data.user_id));
          completionEmailResult = await sendProductionCompletionEmail({
            to: customerEmail,
            title: String(data.title ?? data.id ?? "Production"),
            productionId: String(data.id),
            deliveryUrl: data.delivery_link ?? finalUrl,
            previewUrl: data.preview_url ?? finalUrl,
            sourceFilesUrl: data.source_files_url ?? null,
            readmeUrl: data.readme_url ?? null
          });
        }
      } catch (emailError) {
        completionEmailResult = { skipped: true, reason: errorMessage(emailError, "Could not send production completion email") };
      }

      if (data?.id) {
        await supabase
          .from("production_requests")
          .update({ output_json: { ...(data.output_json ?? {}), completionEmailResult } })
          .eq("id", data.id);
      }

      return Response.json({ production: data ? { ...data, output_json: { ...(data.output_json ?? {}), completionEmailResult } } : data, visualStatus, renderStatus, finalVideoUrl: finalUrl, completionEmailResult });
    }

    const { data } = await supabase
      .from("production_requests")
      .update({
        generation_status: renderStatus ? `shotstack_${renderStatus.status}` : visualStatus ? `${visualStatus.provider}_${visualStatus.status}` : "provider_polling",
        output_json: { ...output, visualStatus, renderStatus, alternatives: polledAlternatives, alternativeStatuses, providerStatus: terminalStatus ? `${terminalStatus.provider}_${terminalStatus.status}` : output.providerStatus, providerLifecycle: { visual: visualLifecycle, render: renderLifecycle }, outputRegistry: renderLifecycle.outputRegistry.length ? renderLifecycle.outputRegistry : visualLifecycle.outputRegistry },
        automation_steps: updatedSteps(production.automation_steps, terminalStatus),
        updated_at: new Date().toISOString()
      })
      .eq("id", productionId)
      .select("*")
      .single();

    return Response.json({ production: data, visualStatus, renderStatus });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not poll automation status") }, { status: 500 });
  }
}
