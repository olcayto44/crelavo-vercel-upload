const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

if (!HEYGEN_API_KEY) {
  console.error("Missing HEYGEN_API_KEY environment variable.");
  process.exit(1);
}

async function main() {
  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": HEYGEN_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      video_setting: { ratio: "16:9", output_format: "mp4" },
      clips: [{
        avatar_id: "Daisy-waist-20220505",
        input_text: "Merhaba Crelavo dünyasına hoş geldiniz!",
        avatar_style: "normal"
      }]
    })
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log("HTTP status:", response.status);
  console.log("Response:", data);
}

main().catch((error) => {
  console.error("Request failed:", error);
  process.exit(1);
});
