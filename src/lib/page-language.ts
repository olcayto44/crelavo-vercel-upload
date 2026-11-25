export function pageLanguage(pathname: string): string {
  const prefix = pathname.split("/")[1];
  switch (prefix) {
    case "tr": return "tr-TR";
    case "de": return "de-DE";
    case "fr": return "fr-FR";
    case "zh": return "zh-Hans";
    default: return "en";
  }
}
