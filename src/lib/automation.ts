export type AutomationStep = {
  key: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
};

export type EcommerceAdPipeline = {
  providerStack: {
    brain: string;
    visuals: string[];
    voice: string;
    subtitles: string;
    editor: string[];
  };
  chain: string[];
  expectedOutput: string[];
};

export function createAutomationJobId() {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function initialAutomationSteps(): AutomationStep[] {
  return [
    { key: "queued", label: "Request received", status: "done" },
    { key: "strategy", label: "AI strategy and brief analysis", status: "pending" },
    { key: "materials", label: "Materials and product data processing", status: "pending" },
    { key: "member_approval", label: "Member choice or extra credit approval", status: "pending" },
    { key: "generation", label: "AI generation pipeline", status: "pending" },
    { key: "packaging", label: "Ready-to-use delivery package", status: "pending" },
    { key: "delivery", label: "One-click dashboard delivery", status: "pending" }
  ];
}

export function runningAutomationSteps(): AutomationStep[] {
  return initialAutomationSteps().map((step) => step.key === "strategy" ? { ...step, status: "running" } : step);
}

export function ecommerceAdAutomationSteps(): AutomationStep[] {
  return [
    { key: "queued", label: "Product link received", status: "done" },
    { key: "scrape_analyze", label: "Product scraping and GPT-4o campaign analysis", status: "pending" },
    { key: "script_storyboard", label: "30-second ad script and visual scenario", status: "pending" },
    { key: "visual_generation", label: "Runway/Kling product visual and video generation", status: "pending" },
    { key: "voiceover", label: "ElevenLabs voice-over generation", status: "pending" },
    { key: "subtitles", label: "Whisper subtitles and translation timing", status: "pending" },
    { key: "edit_render", label: "Shotstack/Remotion final video assembly", status: "pending" },
    { key: "delivery", label: "Preview, revision buttons and one-click delivery", status: "pending" }
  ];
}

export function runningEcommerceAdAutomationSteps(): AutomationStep[] {
  return ecommerceAdAutomationSteps().map((step) => step.key === "scrape_analyze" ? { ...step, status: "running" } : step);
}

export function ecommerceAdPipeline(): EcommerceAdPipeline {
  return {
    providerStack: {
      brain: "OpenAI GPT-4o",
      visuals: ["Runway Gen-3", "Kling AI"],
      voice: "ElevenLabs",
      subtitles: "OpenAI Whisper",
      editor: ["Shotstack", "Remotion"]
    },
    chain: [
      "Product link",
      "1. Product scraping and GPT-4o analysis",
      "2. Visual/video generation",
      "3. ElevenLabs voice-over",
      "4. Whisper subtitles and translation timing",
      "5. Shotstack/Remotion final edit",
      "Final ad video"
    ],
    expectedOutput: [
      "30-second MP4 ad video",
      "voice-over audio",
      "timed subtitles",
      "preview link",
      "small revision actions",
      "TikTok, Instagram, YouTube, LinkedIn, X and Meta export-ready delivery"
    ]
  };
}
