"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FreeTool } from "@/lib/free-tools";

function cleanInput(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function topic(input: string) {
  return cleanInput(input) || "your product or idea";
}

function generateOutputs(tool: FreeTool, input: string) {
  const idea = topic(input);

  switch (tool.slug) {
    case "tiktok-hook-generator":
      return [
        `Nobody tells you this about ${idea}...`,
        `I tried ${idea} so you do not have to.`,
        `If you care about ${idea}, watch this before you scroll.`,
        `The fastest way to understand ${idea} in 15 seconds.`
      ];
    case "ai-prompt-generator":
      return [
        `Create a clear, high-converting production concept for ${idea}. Include the target audience, visual direction, key benefits, required assets and final delivery format.`,
        `Turn ${idea} into a structured AI production brief with sections for goal, style, content, output files, revision notes and CTA.`,
        `Generate a premium marketing asset for ${idea} with a concise concept, scene plan, copy direction and delivery-ready export notes.`
      ];
    case "product-description-generator":
      return [
        `${idea} helps customers solve a specific problem with a simple, practical and easy-to-understand solution. It is designed for buyers who want reliable results without extra complexity.`,
        `Present ${idea} as a benefit-led product: highlight the main problem, show the transformation, explain the key features and finish with a direct buying reason.`,
        `Short version: ${idea} gives customers a faster, cleaner and more confident way to get the result they want.`
      ];
    case "youtube-title-generator":
      return [
        `I Tested ${idea} — Here Is What Happened`,
        `How ${idea} Works in Real Life`,
        `Before You Try ${idea}, Watch This`,
        `The Simple ${idea} Strategy Nobody Explains`
      ];
    case "instagram-caption-generator":
      return [
        `Building something around ${idea}? Start simple, show the value, and make every post lead to one clear next step.`,
        `${idea} is not just an idea — it is a way to move faster, explain better and launch with more confidence.`,
        `New drop: ${idea}. Clear value, clean execution, and a delivery path built for real output.`
      ];
    case "hashtag-generator":
      return [
        `#${idea.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()} #aitools #digitalproduct #contentcreator #startup`,
        `#productlaunch #smallbusiness #ecommerce #marketingtools #growth`,
        `#aigenerator #socialmedia #brandbuilding #onlinebusiness #creatorbusiness`
      ];
    case "business-name-generator":
      return [
        `${idea.split(" ")[0] || "Nova"} Studio`,
        `Bright ${idea.split(" ")[0] || "Launch"}`,
        `${idea.split(" ")[0] || "Core"} Works`,
        `LaunchGrid`,
        `ProductPilot`
      ];
    case "landing-page-copy-generator":
      return [
        `Headline: Launch ${idea} faster with a clear production-ready workflow.`,
        `Subheadline: Turn your idea into a structured page, content package and delivery path without starting from a blank screen.`,
        `CTA: Start your ${idea} project today.`,
        `Section idea: Show the problem, explain the outcome, list the deliverables, then invite the user to start production.`
      ];
    case "ad-copy-generator":
      return [
        `Stop wasting time trying to explain ${idea}. Turn it into a clear offer, a simple message and a delivery-ready campaign.`,
        `${idea} made simple: show the value, build trust, and give customers one clear reason to act now.`,
        `Need a faster way to launch ${idea}? Start with a production plan, then turn it into real assets.`
      ];
    case "ecommerce-ad-script-generator":
      return [
        `Script 1 — Problem/Solution\nHook: "Still trying to make people understand why ${idea} is worth buying?"\nBody: Show the buyer problem, reveal the product, then highlight the strongest benefit in one clear visual moment.\nCTA: "Turn this product into a short AI ad video with Crelavo."`,
        `Script 2 — UGC Product Demo\nHook: "I found a faster way to explain ${idea} in one short video."\nBody: Start with the product page or product image, show the main feature, add a quick proof point, then show the desired result.\nCTA: "Use this script as your Crelavo video brief."`,
        `Script 3 — Offer Angle\nHook: "If you sell ${idea}, this is the ad angle I would test first."\nBody: Lead with the audience pain point, explain the offer, show what changes after buying, then add urgency or a simple next step.\nCTA: "Create the preview video and campaign assets in Crelavo."`
      ];
    case "review-to-ad-script-generator":
      return [
        `Script 1 — Testimonial Proof\nHook: "A real customer said this about ${idea}."\nBody: Open with the review quote, show the buyer problem, connect the testimonial to the strongest product benefit, then add a simple proof visual.\nCTA: "Turn this review into a Crelavo testimonial ad video."`,
        `Script 2 — UGC Reaction\nHook: "I did not expect ${idea} to get this kind of reaction."\nBody: Read the approved customer feedback in a natural creator voice, show the product or result, then explain why the review matters to new buyers.\nCTA: "Use this review as your next short-form ad brief."`,
        `Script 3 — Social Proof Offer\nHook: "Before you buy ${idea}, listen to what customers notice first."\nBody: Pull one trust-building line from the review, pair it with product visuals, then close with the offer or next step.\nCTA: "Create a review-led AI video campaign in Crelavo."`
      ];
    case "ad-reference-analyzer":
      return [
        `Reference Ad Blueprint for ${idea}\nHook type: Problem-first or curiosity-first opening in the first 3 seconds.\nPacing: Fast cuts, short proof moment, then direct CTA.\nSafe transfer: Keep only the marketing structure; rebuild visuals, copy, voice, music and product shots from your own brand assets.`,
        `Copyright-Safe Re-Creator Plan\n1. Extract the ad's hook, scene rhythm and CTA logic.\n2. Rewrite every line for your product and buyer.\n3. Replace all footage, logos, music, faces and voice with original Crelavo assets.\n4. Generate 3 fresh ad variations for testing.`,
        `Localization-Ready Variation Plan\nSource structure: ${idea}\nUS/UK: direct problem-solution hook.\nDE: practical proof and clear product utility.\nFR: premium routine and design-led phrasing.\nES/PT: energetic social proof and simple CTA.\nNext step: send this blueprint into Crelavo Assistant Workspace.`
      ];
    case "ad-performance-score-checker":
      return [
        `Ad Score: 82/100\nStrong: The idea for ${idea} can work because it has a clear product angle and can be explained quickly.\nFix first: Put the main benefit in the first 3 seconds, make the CTA visible, and add one proof point such as a review, result or before/after.\nProduction next step: turn this score into a tighter Crelavo campaign brief with one improved hook, one proof shot and one clear CTA.`,
        `Hook Score: 78/100\nFirst 3 Seconds: Start with the buyer problem before showing ${idea}.\nCTA Clarity: Use one action only, such as "Start preview" or "Try the product video workflow."\nPlatform Fit: Best for TikTok/Reels if the first sentence is shorter and more direct.\nUpgrade path: create 3 improved ad angles before spending video production credits.`,
        `Conversion Checklist\n1. Show the product or result immediately.\n2. Add social proof or a trust line.\n3. Keep subtitles large and high contrast.\n4. End with one direct CTA.\nNext step: send this checklist into Crelavo Assistant Workspace for an AI + human QA campaign plan and preview video direction.`
      ];
    case "tiktok-ad-script-generator":
      return [
        `Hook: "If you are working on ${idea}, this will save you time."\nScene 1: Show the problem.\nScene 2: Show the result.\nCTA: "Try it and turn it into a full production package."`,
        `Hook: "I found a faster way to create ${idea}."\nDemo: Show before/after.\nProof: Mention speed and delivery.\nCTA: "Open the assistant to build the full version."`
      ];
    case "youtube-shorts-script-generator":
      return [
        `0-3s: Introduce ${idea} with a strong hook.\n3-15s: Explain the main benefit.\n15-25s: Show an example.\n25-30s: Add a clear CTA.`,
        `Start with the problem, reveal ${idea}, show the quick win, and end with "build the full version in Crelavo."`
      ];
    case "ecommerce-product-idea-generator":
      return [
        `${idea} starter product bundle for a specific niche audience.`,
        `A premium version of ${idea} with better packaging, clearer benefits and social video angles.`,
        `${idea} accessory or add-on product that can be sold with a simple product page and TikTok ad.`
      ];
    case "startup-idea-generator":
      return [
        `A SaaS tool that helps teams manage ${idea} from idea to delivery.`,
        `A marketplace for people who need ${idea} services faster and with clearer output tracking.`,
        `An AI assistant that turns ${idea} requests into structured workflows, deliverables and client-ready packages.`
      ];
    case "seo-meta-title-generator":
      return [
        `${idea} — Fast, Clear and Production-Ready`,
        `Best ${idea} Tool for Creators and Small Businesses`,
        `${idea}: Create Better Outputs Faster`
      ];
    case "brand-slogan-generator":
      return [
        `${idea}, made simple.`,
        `Launch faster with ${idea}.`,
        `Create more with less friction.`,
        `From idea to delivery.`
      ];
    default:
      return tool.sampleOutputs.map((output) => `${output}: ${idea}`);
  }
}

function assistantUrl(tool: FreeTool, input: string, selectedOutput: string) {
  const idea = [
    `${tool.title} result`,
    input.trim() ? `Original input: ${input.trim()}` : "",
    selectedOutput ? `Selected result: ${selectedOutput}` : "",
    tool.slug === "ad-reference-analyzer" ? "Turn this reference blueprint into a copyright-safe Crelavo Ad Re-Creator brief with original visuals, rewritten copy, new voice/music and localization-ready variations." : tool.slug === "ad-performance-score-checker" ? "Turn this score into a stronger Crelavo campaign brief with improved hooks, proof points, CTA direction and preview video plan." : "Turn this into a full Crelavo production package with deliverables, preview, final files and revision path."
  ].filter(Boolean).join("\n\n");
  const base = new URL(tool.assistantHref, "http://localhost");
  base.searchParams.set("idea", idea);
  base.searchParams.set("source", "free-tool");
  base.searchParams.set("tool", tool.slug);
  return `${base.pathname}?${base.searchParams.toString()}`;
}

export function FreeToolGenerator({ tool }: { tool: FreeTool }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState("");
  const outputs = useMemo(() => generateOutputs(tool, input), [tool, input]);
  const activeOutput = selectedOutput || outputs[0] || "";
  const workspaceHref = assistantUrl(tool, input, activeOutput);
  const registerHref = `/auth/register?next=${encodeURIComponent(workspaceHref)}`;
  const loginHref = `/auth/login?next=${encodeURIComponent(workspaceHref)}`;

  return (
    <section className="card admin-wide-card free-tool-generator" style={{ marginTop: 18 }}>
        <span className="badge">{["ad-performance-score-checker", "ad-reference-analyzer"].includes(tool.slug) ? "Free lead magnet" : "Free generator"}</span>
        <h2>{tool.slug === "ad-reference-analyzer" ? "Analyze a winning ad reference safely" : tool.slug === "ad-performance-score-checker" ? "Score your ad before spending budget" : "Generate results instantly"}</h2>
        {tool.slug === "ad-reference-analyzer" ? <p style={{ color: "var(--muted)" }}>Paste a reference ad link, transcript or notes. Crelavo extracts only the marketing structure — hook, pacing, scene order and CTA — then routes you toward a fresh original ad for your own product.</p> : null}
        {tool.slug === "ad-performance-score-checker" ? <p style={{ color: "var(--muted)" }}>Paste a hook, script, offer or product video idea. The free score shows what to fix first, then the selected result can become a stronger Crelavo campaign brief.</p> : null}
      <div className="field">
        <label>{tool.placeholder}</label>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={tool.placeholder} rows={4} />
      </div>
      <button className="btn" type="button" onClick={() => { setSubmitted(true); setSelectedOutput(""); }} style={{ marginTop: 12 }}>Generate free results</button>

      {submitted ? (
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {outputs.map((output, index) => (
            <div className="card admin-category-card" key={output}>
              <span className="badge">{activeOutput === output ? "Selected result" : "Generated result"}</span>
              <p style={{ whiteSpace: "pre-line" }}>{output}</p>
              <button className="btn secondary" type="button" onClick={() => setSelectedOutput(output)} style={{ marginTop: 10 }}>{activeOutput === output ? "Selected for production" : `Use result ${index + 1}`}</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {tool.sampleOutputs.map((output) => (
            <div className="card admin-category-card" key={output}>
              <span className="badge">Example</span>
              <p>{output}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card admin-wide-card" style={{ marginTop: 16 }}>
        <span className="badge">Next step</span>
        <h2>{["ecommerce-ad-script-generator", "review-to-ad-script-generator"].includes(tool.slug) ? "Turn this script into an AI video with Crelavo" : tool.slug === "ad-reference-analyzer" ? "Turn this blueprint into an original ad variation" : tool.slug === "ad-performance-score-checker" ? "Turn this score into a stronger ad campaign" : "Turn the selected result into a production request"}</h2>
        <p style={{ color: "var(--muted)", whiteSpace: "pre-line" }}>{activeOutput}</p>
        <div className="workspace-action-note" style={{ marginTop: 12 }}>
          {tool.slug === "ad-reference-analyzer" ? "This reference analyzer is the entry point for AI Ad Re-Creator. Assistant Workspace turns the blueprint into a copyright-safe brief with rewritten copy, original visuals, new voice/music, localization notes and production guardrails." : tool.slug === "ad-performance-score-checker" ? "This free score is the entry point. Assistant Workspace turns the weak spots into a campaign brief, improved hooks, CTA direction, proof points, credit estimate and preview video plan. On real campaign days, this page can also route users toward a valid hidden preview code without promising fake discounts." : "Free tools are the starting point. Assistant Workspace turns the selected result into a full production request with delivery plan, credits and final package options."}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href={workspaceHref}>Start production with this result</Link>
          {tool.slug === "ad-performance-score-checker" ? <Link className="btn secondary" href="/dashboard/payment?package=business&billing=monthly&campaign=free-ad-score-preview">Start Business preview from this score</Link> : null}
          {tool.slug === "ad-performance-score-checker" ? <Link className="btn secondary" href="/dashboard/payment?package=team&billing=yearly&campaign=free-ad-score-team-preview">Open Team preview path</Link> : null}
          <Link className="btn secondary" href={registerHref}>Create account and keep this result</Link>
          <Link className="btn secondary" href={loginHref}>Sign in and continue</Link>
          <Link className="btn secondary" href="/dashboard/credits">Get free credits</Link>
          <Link className="btn secondary" href="/pricing">Credit packages</Link>
          <Link className="btn secondary" href="/free-tools">All free tools</Link>
        </div>
        <small style={{ color: "var(--muted)", display: "block", marginTop: 10 }}>The Assistant Workspace will open with your input and selected result already included. If you buy credits through Whop checkout or another active payment provider, use the same email as your Crelavo account.</small>
      </div>
    </section>
  );
}
