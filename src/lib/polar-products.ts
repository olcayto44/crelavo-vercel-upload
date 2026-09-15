export const POLAR_PRODUCT_IDS: Record<string, string> = {
  pro_24h_free_trial: "38046b05-d08a-425d-9c2d-ad94b5988022",
  business: "488d15e5-21b7-4e4b-98a1-c951f0ee6cd6",
  team: "4b6fc548-526e-474d-bd25-645fffbec1a5",
  ultra: "f64c4055-385d-46b6-8ddd-a46b2ed58435",
  live_sales_agent_starter: "57c819ee-dbb7-4da7-b6c4-aa770251f418",
  live_commerce_stream_pack: "09435fe5-0c04-4472-95e8-82d69afbaf49",
  autonomous_brand_agent: "b3b4f440-efa4-43a1-a144-6ce94163146d",
  growth_intelligence_starter: "648ed8a2-3f4f-4a70-89ce-942f0789ebf1",
  growth_intelligence_growth: "6d2bd4ce-1767-4abc-94ba-78fc2c99b530",
  growth_intelligence_enterprise: "8e11190c-20df-419e-92eb-3c4a8601aa18",
  topup_starter: "6d480048-3032-4f62-841e-e898ff8dbcab",
  topup_creator: "66299920-27ea-4ef4-84b6-26af147e3b51",
  topup_business: "a4b54f91-258a-4607-af0e-61de59e8bc2d",
  drone_location_video: "03e34a0f-dc2e-42dd-9004-5cfad726284a",
  drone_satellite_story: "909d45f9-e6ff-45f2-833e-8d7ae9b26b4d"
};

export function polarProductIdFor(internalProductId: string) {
  return POLAR_PRODUCT_IDS[internalProductId] ?? "";
}

export function internalProductIdForPolar(providerProductId: string) {
  return Object.entries(POLAR_PRODUCT_IDS).find(([, value]) => value === providerProductId)?.[0] ?? "";
}