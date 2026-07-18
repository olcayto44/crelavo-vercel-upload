export type DeliveryCreditRate = {
  key: string;
  label: string;
  credits: number;
  active: boolean;
};

export type DeliveryCreditRatesConfig = {
  rates: DeliveryCreditRate[];
};

export const defaultDeliveryCreditRates: DeliveryCreditRate[] = [
  { key: "readme", label: "README / setup note delivery", credits: 75, active: true },
  { key: "thumbnail", label: "Thumbnail / cover export", credits: 150, active: true },
  { key: "subtitle_file", label: "Separate subtitle file delivery", credits: 200, active: true },
  { key: "final_mp4", label: "Final MP4 delivery validation", credits: 200, active: true },
  { key: "final_zip", label: "Final ZIP packaging", credits: 300, active: true },
  { key: "pdf", label: "PDF / document export", credits: 350, active: true },
  { key: "brand_kit", label: "Brand kit asset package", credits: 500, active: true },
  { key: "deployment_guide", label: "Deployment / setup guide", credits: 500, active: true },
  { key: "multi_platform_package", label: "Multi-platform export package", credits: 900, active: true },
  { key: "source_code_media", label: "Source code package — media/general", credits: 1200, active: true },
  { key: "editable_files", label: "Editable project/source files", credits: 1500, active: true },
  { key: "admin_panel", label: "Admin panel delivery scope", credits: 1800, active: true },
  { key: "4k_export", label: "4K / high-resolution export", credits: 1800, active: true },
  { key: "source_code_project", label: "Source code package — web/app/admin", credits: 2500, active: true }
];

export const defaultDeliveryCreditRatesConfig: DeliveryCreditRatesConfig = {
  rates: defaultDeliveryCreditRates
};

export function normalizeDeliveryCreditRates(input: unknown): DeliveryCreditRatesConfig {
  const source = input && typeof input === "object" && Array.isArray((input as Record<string, unknown>).rates)
    ? (input as Record<string, unknown>).rates
    : defaultDeliveryCreditRates;

  const defaultByKey = new Map(defaultDeliveryCreditRates.map((rate) => [rate.key, rate]));
  const normalized = (source as unknown[])
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const key = String(item.key ?? "").trim();
      const fallback = defaultByKey.get(key);
      return {
        key,
        label: String(item.label ?? fallback?.label ?? key).trim(),
        credits: Math.max(0, Math.round(Number(item.credits ?? fallback?.credits ?? 0) || 0)),
        active: item.active === undefined ? Boolean(fallback?.active ?? true) : Boolean(item.active)
      };
    })
    .filter((item) => item.key && item.label);

  const merged = [...normalized];
  for (const fallback of defaultDeliveryCreditRates) {
    if (!merged.some((item) => item.key === fallback.key)) merged.push(fallback);
  }

  return { rates: merged };
}

export function deliveryRateMap(config?: DeliveryCreditRatesConfig | null) {
  const rates = normalizeDeliveryCreditRates(config ?? defaultDeliveryCreditRatesConfig).rates;
  return new Map(rates.filter((rate) => rate.active).map((rate) => [rate.key, rate]));
}
