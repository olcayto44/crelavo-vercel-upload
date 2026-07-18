import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabase";

export type StoredSampleComment = {
  id: string;
  sampleId: string;
  parentCommentId?: string | null;
  author: string;
  role: "user" | "admin";
  text: string;
  likes?: number;
  createdAt: string;
  replies?: StoredSampleComment[];
};

type SampleEngagementPayload = {
  comments?: StoredSampleComment[];
  likes?: Record<string, number>;
  shares?: Record<string, number>;
};

const CONFIG_KEY = "sample_engagement";
const LOCAL_STORE_PATH = path.join(process.cwd(), ".data", "sample-engagement.json");

function defaultPayload(): Required<SampleEngagementPayload> {
  return { comments: [], likes: {}, shares: {} };
}

function normalizePayload(value: SampleEngagementPayload | null | undefined): Required<SampleEngagementPayload> {
  return {
    comments: Array.isArray(value?.comments) ? value.comments : [],
    likes: value?.likes && typeof value.likes === "object" ? value.likes : {},
    shares: value?.shares && typeof value.shares === "object" ? value.shares : {}
  };
}

async function loadLocalEngagement() {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, "utf8");
    return normalizePayload(JSON.parse(raw) as SampleEngagementPayload);
  } catch {
    return defaultPayload();
  }
}

async function saveLocalEngagement(payload: Required<SampleEngagementPayload>) {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
}

export async function loadSampleEngagement(): Promise<Required<SampleEngagementPayload>> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();
    if (error || !data?.value) return await loadLocalEngagement();
    return normalizePayload(data.value as SampleEngagementPayload);
  } catch {
    return await loadLocalEngagement();
  }
}

export async function saveSampleEngagement(payload: Required<SampleEngagementPayload>) {
  try {
    const { error } = await supabaseAdmin()
      .from("platform_configs")
      .upsert({
        key: CONFIG_KEY,
        value: payload,
        description: "Public sample detail likes, comments and replies",
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
    if (!error) return;
  } catch {
    // Fall back to local persistence below.
  }
  await saveLocalEngagement(payload);
}

export function commentsForSample(payload: Required<SampleEngagementPayload>, sampleId: string) {
  const flat = payload.comments.filter((comment) => comment.sampleId === sampleId);
  const byParent = new Map<string, StoredSampleComment[]>();
  for (const comment of flat) {
    const key = comment.parentCommentId ?? "root";
    byParent.set(key, [...(byParent.get(key) ?? []), comment]);
  }
  function attachReplies(comment: StoredSampleComment): StoredSampleComment {
    return { ...comment, replies: (byParent.get(comment.id) ?? []).map(attachReplies) };
  }
  return (byParent.get("root") ?? []).map(attachReplies);
}

export function createStoredComment(input: {
  sampleId: string;
  parentCommentId?: string | null;
  author: string;
  role: "user" | "admin";
  text: string;
}) {
  return {
    id: randomUUID(),
    sampleId: input.sampleId,
    parentCommentId: input.parentCommentId ?? null,
    author: input.author,
    role: input.role,
    text: input.text,
    likes: 0,
    createdAt: new Date().toISOString(),
    replies: []
  } satisfies StoredSampleComment;
}
