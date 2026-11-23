/** Content languages; independent of the assistant conversation language. */
export const CONTENT_LANGUAGES = [
  {id:"en",label:"English"},{id:"tr",label:"Turkish"},{id:"de",label:"German"},
  {id:"fr",label:"French"},{id:"es",label:"Spanish"},{id:"it",label:"Italian"},
  {id:"pt",label:"Portuguese"},{id:"nl",label:"Dutch"},{id:"pl",label:"Polish"},
  {id:"ru",label:"Russian"},{id:"uk",label:"Ukrainian"},{id:"ar",label:"Arabic"},
  {id:"hi",label:"Hindi"},{id:"ja",label:"Japanese"},{id:"ko",label:"Korean"},
  {id:"zh",label:"Chinese"},{id:"id",label:"Indonesian"},{id:"vi",label:"Vietnamese"}
] as const;
export function normalizeContentLanguage(value: string): string {
  const key=value.trim().toLowerCase();
  return CONTENT_LANGUAGES.find(language=>language.id===key || language.label.toLowerCase()===key)?.id || "en";
}
export function contentLanguageLabel(value: string): string {
  return CONTENT_LANGUAGES.find(language=>language.id===normalizeContentLanguage(value))?.label || "English";
}
