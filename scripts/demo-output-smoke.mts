import { buildDemoAutomationOutput } from "../src/lib/demo-automation.ts";

function assertIncludes(values: string[], expected: string, label: string) {
  if (!values.some((value) => value.includes(expected))) {
    throw new Error(`${label}: expected one item to include ${expected}, got ${values.join(" | ")}`);
  }
}

function sceneTitles(output: ReturnType<typeof buildDemoAutomationOutput>) {
  return Array.isArray(output.scenePlan) ? output.scenePlan.map((item) => String(item.title ?? "")) : [];
}

const ecommerceOutput = buildDemoAutomationOutput({
  id: "prod-web-1",
  title: "E-commerce website",
  prompt: "E-ticaret sitesi istiyorum, Shopify tarzı ürün sayfası ve sepet olsun",
  production_type: "website",
  request_metadata: {
    style: "E-commerce Product",
    features: "Kaynak dosya teslimi, Final ZIP, README",
    targetPlatform: "Dashboard teslim, ZIP kaynak, Shopify, WooCommerce",
    projectWorkflow: {
      modules: "Web sitesi, E-ticaret ürün paketi, Marketplace listeleme, Admin panel",
      technicalStack: "Next.js / React responsive website",
      sourceDelivery: "source_zip"
    },
    commerceWorkflow: {
      storePlatform: "Shopify",
      storeAssetGoal: "E-ticaret ürün paketi, Marketplace listeleme"
    },
    outputPlan: { outputCount: 1 }
  }
}, "job-web-1");

const ecommerceTitles = sceneTitles(ecommerceOutput);
assertIncludes(ecommerceTitles, "E-commerce sitemap", "ecommerce site map");
assertIncludes(ecommerceTitles, "Product listing", "ecommerce product page");
assertIncludes(ecommerceTitles, "Cart/checkout", "ecommerce checkout");
assertIncludes(ecommerceTitles, "Store admin", "ecommerce admin");
assertIncludes(ecommerceTitles, "Source ZIP", "ecommerce source package");
assertIncludes([String(ecommerceOutput.script)], "Store platform: Shopify", "ecommerce script store platform");

const mobileOutput = buildDemoAutomationOutput({
  id: "prod-mobile-1",
  title: "Mobile app",
  prompt: "Mobil uygulama istiyorum, Expo kaynak dosyası ve admin panel olsun",
  production_type: "mobile_app",
  request_metadata: {
    style: "App demo",
    features: "Kaynak dosya teslimi, Final ZIP, README",
    targetPlatform: "Dashboard teslim, ZIP kaynak",
    projectWorkflow: {
      modules: "Mobil app, Admin panel",
      technicalStack: "Expo / React Native starter",
      sourceDelivery: "source_zip"
    },
    outputPlan: { outputCount: 1 }
  }
}, "job-mobile-1");

const mobileTitles = sceneTitles(mobileOutput);
assertIncludes(mobileTitles, "Mobile screen map", "mobile screen map");
assertIncludes(mobileTitles, "Navigation", "mobile navigation");
assertIncludes(mobileTitles, "Expo source", "mobile source plan");
assertIncludes([String(mobileOutput.script)], "Technical structure: Expo / React Native starter", "mobile script technical stack");

console.log("demo-output-smoke ok");
