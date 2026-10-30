"use client";

import { useSearchParams } from "next/navigation";
import { AssistantWorkspace } from "@/components/AssistantWorkspace";

export default function AssistantWorkspaceRoute() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || type;
  const idea = searchParams.get("idea") || "";
  const mode = searchParams.get("mode") || "";
  const providerTestPreset = searchParams.get("providerTest") === "1";

  return (
    <AssistantWorkspace
      key={`${type}|${category}|${idea}|${mode}|${providerTestPreset ? "1" : "0"}`}
      initialIdea={idea}
      initialCategory={category}
      initialMode={mode}
      providerTestPreset={providerTestPreset}
    />
  );
}
