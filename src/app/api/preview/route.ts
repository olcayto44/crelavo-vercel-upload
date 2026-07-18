export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = String(body.prompt ?? "").trim();
    const style = String(body.style ?? "").trim();
    const category = String(body.category ?? "").trim();
    const materialType = String(body.premium_material_type ?? "").trim();
    const materialOption = String(body.premium_material_option ?? "").trim();

    if (!prompt) {
      return Response.json({ error: "Preview prompt is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY is missing. Add it before generating AI previews." }, { status: 500 });
    }

    const previewPrompt = [
      "Create a single polished visual preview image for an AI production request.",
      `Category: ${category || "AI production"}`,
      `Style: ${style || "clean cinematic"}`,
      materialType && materialType !== "No premium material" ? `Premium material: ${materialType} / ${materialOption}` : "Premium material: none",
      `User request: ${prompt}`,
      "Show the main look, materials, wardrobe/props/location if requested, and overall art direction.",
      "Do not include UI text, captions, watermarks, logos, or pricing information."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt: previewPrompt,
        size: "1024x1024",
        n: 1
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json({ error: data.error?.message ?? "Preview generation failed." }, { status: response.status });
    }

    const imageBase64 = data.data?.[0]?.b64_json;
    if (!imageBase64) {
      return Response.json({ error: "Preview image was not returned by the provider." }, { status: 502 });
    }

    return Response.json({ imageUrl: `data:image/png;base64,${imageBase64}`, prompt: previewPrompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate preview.";
    return Response.json({ error: message }, { status: 500 });
  }
}
