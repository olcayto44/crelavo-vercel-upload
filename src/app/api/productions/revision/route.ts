import { createRevisionVoiceover } from "@/lib/providers/elevenlabs";
import { ProviderConfigError } from "@/lib/providers/types";
import { createVisualVideo } from "@/lib/providers/visuals";
import { suggestVoiceId } from "@/lib/voice-library";
import { supabaseAdmin } from "@/lib/supabase";

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

function isVoiceRevision(action: string, message: string, targetPart: string) {
  const text = `${action} ${message} ${targetPart}`.toLocaleLowerCase("tr-TR");
  return ["ses", "seslendirme", "voice", "dublaj", "ton", "erkek", "kadın", "kadin"].some((word) => text.includes(word));
}

function revisionVoiceScript(message: string, fallbackPrompt: unknown, fallbackTitle: unknown) {
  const trimmed = message.trim();
  if (trimmed.length >= 24) return trimmed;
  return String(fallbackPrompt ?? fallbackTitle ?? "Crelavo üretimi için yeni seslendirme hazırlanıyor.");
}

function isActiveProviderJob(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const provider = typeof record.provider === "string" && record.provider.length > 0;
  const status = String(record.status ?? "").toLowerCase();
  return provider && !["succeeded", "success", "completed", "complete", "done", "ready", "failed", "failure", "error", "canceled", "cancelled", "provider_failed"].includes(status);
}

function hasActiveAlternativeJob(alternatives: unknown[]) {
  return alternatives.some((item) => item && typeof item === "object" && isActiveProviderJob((item as Record<string, unknown>).visualJob));
}

function hasDuplicateVoiceRequest(voiceJobs: unknown[], message: string, selectedVoiceId: string) {
  const normalized = message.trim().toLocaleLowerCase("tr-TR");
  return voiceJobs.some((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    const existingMessage = String(record.message ?? "").trim().toLocaleLowerCase("tr-TR");
    return existingMessage === normalized && record.selectedVoiceId === selectedVoiceId && ["ready", "queued"].includes(String(record.status ?? ""));
  });
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function providerSpendGuard(production: Record<string, unknown>, requestMetadata: Record<string, unknown>) {
  const reservedCredits = Number(production.reserved_credits ?? 0) || 0;
  const estimatedCredits = Number(production.estimated_credits ?? 0) || 0;
  const previewAccess = objectValue(requestMetadata.previewAccess);
  const previewOnly = previewAccess.previewOnly === true || previewAccess.downloadAccess === "closed" || previewAccess.downloadsOpen === false;
  if (previewOnly) {
    return { ok: false as const, reason: "preview_only_downloads_closed", reservedCredits, estimatedCredits };
  }
  if (reservedCredits <= 0 || (estimatedCredits > 0 && reservedCredits < estimatedCredits)) {
    return { ok: false as const, reason: "payment_or_credit_required", reservedCredits, estimatedCredits };
  }
  return { ok: true as const, reservedCredits, estimatedCredits };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productionId = String(body.production_id ?? "").trim();
    const userId = String(body.user_id ?? "").trim();
    const targetPart = String(body.target_part ?? "Genel üretim").trim();
    const action = String(body.action ?? "Revize iste").trim();
    const message = String(body.message ?? "").trim();

    if (!productionId || !userId || !message) {
      return Response.json({ error: "production_id, user_id and message are required." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: production, error: productionError } = await supabase
      .from("production_requests")
      .select("id, user_id, title, prompt, production_type, status, automation_status, output_json, request_metadata, estimated_credits, reserved_credits")
      .eq("id", productionId)
      .eq("user_id", userId)
      .single();

    if (productionError) throw productionError;
    if (!production) return Response.json({ error: "Production not found." }, { status: 404 });
    if (["cancelled", "failed"].includes(String(production.status ?? ""))) {
      return Response.json({ error: "This production cannot receive revision requests." }, { status: 400 });
    }

    const revision = {
      id: `rev_${Date.now()}`,
      targetPart,
      action,
      message,
      status: "queued",
      requestedAt: new Date().toISOString()
    };

    const outputJson = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
    const requestMetadata = production.request_metadata && typeof production.request_metadata === "object" ? production.request_metadata as Record<string, unknown> : {};
    const existingRevisions = Array.isArray(outputJson.revisionRequests) ? outputJson.revisionRequests : [];
    const existingMetadataRevisions = Array.isArray(requestMetadata.revisionRequests) ? requestMetadata.revisionRequests : [];
    const existingAlternatives = Array.isArray(outputJson.alternatives) ? outputJson.alternatives : [];
    const lowerAction = action.toLowerCase();
    const lowerMessage = message.toLowerCase();
    let nextAlternatives = existingAlternatives;
    let selectedAlternative = outputJson.selectedAlternative ?? null;
    const pendingOutputActions = Array.isArray(outputJson.pendingOutputActions) ? outputJson.pendingOutputActions : [];
    const existingVoiceJobs = Array.isArray(outputJson.voiceJobs) ? outputJson.voiceJobs : [];
    const providerGuard = providerSpendGuard(production as Record<string, unknown>, requestMetadata);
    const nextPendingAction = {
      id: revision.id,
      targetPart,
      action,
      message,
      status: lowerAction.includes("seç") ? "applied" : "queued",
      requestedAt: revision.requestedAt
    };
    let nextVoiceJobs = existingVoiceJobs;
    let voiceAudioUrl = typeof outputJson.voiceAudioUrl === "string" ? outputJson.voiceAudioUrl : "";

    if (isVoiceRevision(action, message, targetPart)) {
      const selectedVoiceId = suggestVoiceId(message || action || targetPart);
      if (hasDuplicateVoiceRequest(existingVoiceJobs, message, selectedVoiceId)) {
        nextPendingAction.status = "already_running";
      } else {
        const voiceJob: Record<string, unknown> = {
          id: `voice-${Date.now()}`,
          sourceRevisionId: revision.id,
          status: "queued",
          message,
          requestedAt: revision.requestedAt,
          provider: "elevenlabs",
          selectedVoiceId
        };
        if (!providerGuard.ok) {
          voiceJob.status = "payment_or_credit_required";
          voiceJob.providerError = "Paid voice revision was not started before payment, credit reservation and preview eligibility were confirmed.";
          voiceJob.providerGuard = providerGuard;
          nextPendingAction.status = "payment_or_credit_required";
        } else {
          try {
            const result = await createRevisionVoiceover({
              productionId,
              revisionId: revision.id,
              script: revisionVoiceScript(message, production.prompt, production.title),
              voiceDirection: message || action,
              voiceId: selectedVoiceId
            });
            voiceJob.status = "ready";
            voiceJob.audioUrl = result.audioUrl;
            voiceJob.voice = result.voice;
            voiceAudioUrl = result.audioUrl;
            nextPendingAction.status = "ready";
          } catch (voiceError) {
            voiceJob.status = voiceError instanceof ProviderConfigError ? "provider_config_missing" : "provider_failed";
            voiceJob.providerError = errorMessage(voiceError, "Ses provider işi başlatılamadı");
            nextPendingAction.status = "queued";
          }
        }
        nextVoiceJobs = [...nextVoiceJobs, voiceJob];
      }
    }

    if (lowerAction.includes("seç") || lowerMessage.includes("seçilsin")) {
      selectedAlternative = targetPart;
      nextAlternatives = existingAlternatives.map((item) => item && typeof item === "object" ? {
        ...(item as Record<string, unknown>),
        selected: String((item as Record<string, unknown>).title ?? (item as Record<string, unknown>).id) === targetPart
      } : item);
    }

    const voiceRevision = isVoiceRevision(action, message, targetPart);
    const activeVisualJob = isActiveProviderJob(outputJson.visualJob) || isActiveProviderJob(outputJson.renderJob) || hasActiveAlternativeJob(existingAlternatives);
    if (!voiceRevision && (lowerAction.includes("alternatif") || lowerAction.includes("yeniden") || lowerMessage.includes("başka") || lowerMessage.includes("yeniden"))) {
      const revisionAlternative: Record<string, unknown> = {
        id: `rev-alt-${Date.now()}`,
        title: `${targetPart} revize alternatifi`,
        status: activeVisualJob ? "already_running" : "revision_queued",
        description: message,
        preview_url: "",
        sourceRevisionId: revision.id
      };
      if (activeVisualJob) {
        revisionAlternative.providerNote = "A new paid revision job was not opened before the active provider job completed.";
        nextPendingAction.status = "already_running";
      } else if (!providerGuard.ok) {
        revisionAlternative.status = "payment_or_credit_required";
        revisionAlternative.providerNote = "A new paid revision job was not opened before payment, credit reservation and preview eligibility were confirmed.";
        revisionAlternative.providerGuard = providerGuard;
        nextPendingAction.status = "payment_or_credit_required";
      } else {
        try {
          if (["video", "campaign", "music_video", "stickman_animation", "localization"].includes(String(production.production_type))) {
            const visualJob = await createVisualVideo({
              scenes: [message || String(production.prompt ?? production.title ?? "Crelavo revize üretimi")],
              productImageUrls: [],
              durationSeconds: 8,
              style: String(requestMetadata.style ?? production.title ?? "Crelavo revision")
            });
            revisionAlternative.status = "provider_job_created";
            revisionAlternative.visualJob = visualJob;
          }
        } catch (providerError) {
          revisionAlternative.providerError = errorMessage(providerError, "Provider revizyon job başlatılamadı");
        }
      }
      nextAlternatives = [...nextAlternatives, revisionAlternative];
    }

    const { data, error } = await supabase
      .from("production_requests")
      .update({
        automation_status: "revision_requested",
        generation_status: "member_revision_requested",
        output_json: {
          ...outputJson,
          currentStep: `${targetPart}: ${action}`,
          selectedAlternative,
          alternatives: nextAlternatives,
          voiceAudioUrl,
          voiceJobs: nextVoiceJobs,
          pendingOutputActions: [...pendingOutputActions, nextPendingAction],
          revisionRequests: [...existingRevisions, revision]
        },
        request_metadata: {
          ...requestMetadata,
          revisionRequests: [...existingMetadataRevisions, revision]
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", productionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return Response.json({ production: data, revision });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not save revision request") }, { status: 500 });
  }
}
