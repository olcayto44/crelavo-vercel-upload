import { readFileSync } from "node:fs";
import { join } from "node:path";

const workspace = readFileSync(join(process.cwd(), "src", "components", "AssistantWorkspace.tsx"), "utf8");
const assistantBox = readFileSync(join(process.cwd(), "src", "components", "AiAssistantBox.tsx"), "utf8");
const chatRoute = readFileSync(join(process.cwd(), "src", "app", "api", "assistant-chat", "route.ts"), "utf8");
const assistantPlanRoute = readFileSync(join(process.cwd(), "src", "app", "api", "assistant", "plan", "route.ts"), "utf8");
const assistantOrchestrateRoute = readFileSync(join(process.cwd(), "src", "app", "api", "assistant", "orchestrate", "route.ts"), "utf8");
const assistantUserContext = readFileSync(join(process.cwd(), "src", "lib", "assistant-user-context.ts"), "utf8");
const assistantConversationMigration = readFileSync(join(process.cwd(), "supabase", "migration_assistant_conversations.sql"), "utf8");
const adminAssistantPage = readFileSync(join(process.cwd(), "src", "app", "admin", "assistant", "page.tsx"), "utf8");
const adminAssistantViewer = readFileSync(join(process.cwd(), "src", "components", "AdminAssistantConversationsViewer.tsx"), "utf8");
const adminAssistantRoute = readFileSync(join(process.cwd(), "src", "app", "api", "admin", "assistant-conversations", "route.ts"), "utf8");
const adminMenu = readFileSync(join(process.cwd(), "src", "lib", "admin.ts"), "utf8");
const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
const productionPayload = readFileSync(join(process.cwd(), "src", "lib", "production-payload.ts"), "utf8");
const productionsRoute = readFileSync(join(process.cwd(), "src", "app", "api", "productions", "route.ts"), "utf8");
const productionWorkspace = readFileSync(join(process.cwd(), "src", "components", "ProductionWorkspace.tsx"), "utf8");
const adminProductionsTable = readFileSync(join(process.cwd(), "src", "components", "AdminProductionsTable.tsx"), "utf8");
const automaticDeliveryBuilder = readFileSync(join(process.cwd(), "src", "lib", "automatic-delivery-builder.ts"), "utf8");
const deliveryRoute = readFileSync(join(process.cwd(), "src", "app", "api", "productions", "[id]", "delivery", "route.ts"), "utf8");
const providerReadiness = readFileSync(join(process.cwd(), "src", "lib", "provider-readiness.ts"), "utf8");
const outputRegistry = readFileSync(join(process.cwd(), "src", "lib", "output-registry.ts"), "utf8");
const providerJobs = readFileSync(join(process.cwd(), "src", "lib", "provider-jobs.ts"), "utf8");
const automationStartRoute = readFileSync(join(process.cwd(), "src", "app", "api", "automation", "start", "route.ts"), "utf8");
const automationStatusRoute = readFileSync(join(process.cwd(), "src", "app", "api", "automation", "status", "route.ts"), "utf8");

const requiredWorkspaceTerms = [
  "googleStyleProductionReply",
  "publicConversationalReply(clean, activeLanguage",
  "Uzak chat alınamadı; güvenli yerel cevap gösterildi.",
  "Uzak chat cevabı alınamadı; güvenli yerel cevap gösterildi.",
  "safeConversationalFallbackReply",
  "isLegacyAssistantPlaceholderMessage",
  "cleanAssistantMessages",
  "Taslak hazır. Üretimi başlatma aşamasında giriş kontrol edilir.",
  "Taslak hazır. Seçenekleri aşağıda güncelledim.",
  "data-no-translate=\"true\"",
  "extractAssistantSignals",
  "Şunu yakaladım",
  "intent === \"start_confirmation\"",
  "hasNewSubjectAfterHadi",
  "içecek|icecek|tavuk",
    "Tamam, bunu yiyecek/içecek işi olarak hazırlıyorum.",
    "çözebilir misin|cozebilir misin",
  "sıkıntı|sikinti|problem",
"isGeneralInformationQuestion",
"informationalReply",
"hasQuestionSignal",
"hasProductionAction",
"normalizeTurkishQuery",
"mi|mu|nedir",
"ne yapabilirim",
"neler iyi gelir",
"kanser|kemoterapi|radyoterapi|ameliyat|onkoloji",
"burnum|burun|nose",
"Burun kanamasında genelde dik oturup",
"translate=\"no\"",
"autoCorrect=\"off\"",
"freeConversationalQuestion",
"requiredCredits = freeConversationalQuestion ? 0",
"if (requiredCredits > 0)",
"return \"consultation\";",
    "Dynamic Production Wizard",
  "New Dynamic Production Wizard",
  "Pazarlama ve Ticaret",
  "Video ve Hareket",
  "Avatar ve Klonlama",
  "Web, Uygulama ve Yazılım",
  "Marka, Görseller ve Dosyalar",
  "Alt kategoriler",
  "wizardCategoryGroups",
  "selectWizardCategory",
  "AI Video Generator",
  "Website Builder",
  "Advanced Talking Video",
  "Kalite / format",
  "3D animation",
  "Materyaller / references",
  "Upload material",
  "Tell Crelavo what you want to produce",
  "Write in the chat or pick a production type",
  "Continue / check credits",
  "firstVisibleWizardQuestion",
  "openDynamicWizardFromMessage",
  "requestDynamicWizardCredits",
  "Ne tür web sitesi?",
  "Ne tür video?",
  "Production credits required",
  "Wizard subject:",
  "Admin panelde ne yönetilsin?",
  "Video yapısı",
  "Admin panel kapsamı",
  "İyiyim, buradayım. Sen ne yapmak istiyorsun?",
  "Tabii, söyle. Ne istiyorsun?",
  "Selam, buradayım. Ne yapmak istediğini yazabilirsin.",
  "assistantVisibleReply",
  "nextVisibleMessages",
  "inputRef",
  "focusTextInputWithVoiceHint",
  "requestMicrophonePermission",
  "startRawMicrophoneFallback",
  "navigator.mediaDevices.getUserMedia({ audio: true })",
  "Mikrofon izni isteniyor...",
  "Dinleniyor... şimdi konuşun.",
  "voiceTimeoutRef",
  "handleVoiceNoTranscript",
  "Ses alındı ama metne çevrilemedi",
  "Algılanan metin:",
  "data-no-translate=\"true\"",
  "ref={inputRef}",
  "isLegacyVoiceErrorMessage",
  "cleanAssistantMessages(messages).map"
];

for (const term of requiredWorkspaceTerms) {
  if (!workspace.includes(term) && !chatRoute.includes(term)) throw new Error(`Assistant conversation smoke missing term: ${term}`);
}

for (const term of ["delivery_requirements", "deliveryRequirementsFromSelection", "wantsSourceCode", "wantsZip", "wantsFinalVideo"]) {
  if (!productionPayload.includes(term)) throw new Error(`Production payload delivery requirement missing term: ${term}`);
}

for (const term of ["deliveryRequirements", "delivery_requirements"]) {
  if (!productionsRoute.includes(term)) throw new Error(`Productions API delivery requirement missing term: ${term}`);
}

for (const term of ["Requested delivery requirements", "Customer-selected files and package outputs", "deliveryRequirementFormats"]) {
  if (!productionWorkspace.includes(term)) throw new Error(`Production workspace delivery requirement missing term: ${term}`);
}

for (const term of ["Delivery requirements control", "Generate ZIP", "deliveryRequirementFormats", "deliveryReadyStatus", "deliveryBasePath", "Provider readiness", "Provider config needed"]) {
  if (!adminProductionsTable.includes(term)) throw new Error(`Admin productions delivery control missing term: ${term}`);
}

for (const term of ["providerRequirementsForProduction", "providerReadinessSummary", "waiting_provider_config", "canStartRealProvider", "Video/generation provider"]) {
  if (!providerReadiness.includes(term)) throw new Error(`Provider readiness missing term: ${term}`);
}

for (const term of ["buildOutputRegistry", "OutputRegistryItem", "final_video", "subtitle_file", "source_code", "outputRegistrySummary"]) {
  if (!outputRegistry.includes(term)) throw new Error(`Output registry missing term: ${term}`);
}

for (const term of ["runProviderJobLifecycle", "checkProviderJobStatus", "collectProviderOutputs", "providerJobFromValue", "lifecycleStatusFromProvider", "providerLifecycleFromJobs", "isActiveProviderJob"]) {
  if (!providerJobs.includes(term)) throw new Error(`Provider job abstraction missing term: ${term}`);
}

for (const term of ["providerReadinessSummary", "waiting_provider_config", "Waiting for provider/API configuration", "provider_readiness", "outputRegistry", "providerLifecycleFromJobs", "providerLifecycle"]) {
  if (!automationStartRoute.includes(term)) throw new Error(`Automation start provider readiness missing term: ${term}`);
}

for (const term of ["Provider readiness", "isWaitingProviderConfig", "real provider/API configuration is still missing", "Output registry", "Expected and generated delivery files"]) {
  if (!productionWorkspace.includes(term)) throw new Error(`Production workspace provider readiness missing term: ${term}`);
}

for (const term of ["Output registry", "Expected and generated files for this delivery package"]) {
  if (!adminProductionsTable.includes(term)) throw new Error(`Admin productions output registry missing term: ${term}`);
}

for (const term of ["buildDeliveryEntries", "plannedDeliveryFileList", "admin-panel/admin-requirements.md", "media/subtitles-template.srt", "brand-kit/brand-guide.md", "delivery_requirements", "generated_files", "output_registry"]) {
  if (!automaticDeliveryBuilder.includes(term)) throw new Error(`Automatic delivery builder missing term: ${term}`);
}

for (const term of ["buildDeliveryEntries", "buildDeliveryZip(buildDeliveryEntries(data))"]) {
  if (!deliveryRoute.includes(term)) throw new Error(`Delivery route is not using generated delivery entries: ${term}`);
}

for (const term of ["focusAssistantPrompt", "requestAssistantMicrophonePermission", "startAssistantRawMicrophoneFallback", "navigator.mediaDevices.getUserMedia({ audio: true })", "Requesting microphone permission...", "Listening... speak now.", "voiceTimeoutRef", "handleAssistantVoiceNoTranscript", "Audio was captured but could not be converted to text", "Detected text:", "data-no-translate=\"true\""]) {
  if (!assistantBox.includes(term)) throw new Error(`AI assistant box voice fallback missing term: ${term}`);
}

const forbiddenChatSpam = [
  "Bu üretim isteğini hazırlayabilirim; fakat üretim akışına geçmek için giriş yapman gerekiyor.",
  "I can prepare this production request, but you need to log in before starting the production flow.",
  "Use the credits button below to continue.",
  "Your free assistant credits are running low. Credits may be required soon.",
  "Tamam. Bunu konuşmalı video işi olarak hazırlıyorum.",
  "Bu üretim talebini hazırlayabilirim, ancak üretim sürecini başlatmadan önce giriş yapmanız gerekiyor.",
  "üretim sürecini başlatmadan önce giriş",
  "Prepare assistant workspace production options for",
  "Ses alınamadı. Lütfen tekrar dene veya yazarak gönder.",
  "Ses kaydı alınamadı. Yazı alanı hazır",
  "Voice command could not be captured. Please type your idea.",
  "Voice command is not supported in this browser yet.",
  "Ses kaydı alınamadı. Lütfen tekrar deneyin veya komutunuzu yazın."
];

for (const term of forbiddenChatSpam) {
  if (workspace.includes(term) || assistantBox.includes(term)) throw new Error(`Assistant conversation still contains spammy chat text: ${term}`);
}

if (workspace.includes("setMessages([...nextMessages")) {
  throw new Error("Assistant conversation can still overwrite the visible chat reply from a later branch.");
}

if (!workspace.includes("/api/assistant-chat") || !workspace.includes("nextMessages.concat({ role: \"assistant\", content: reply })")) {
  throw new Error("Assistant chat should call the conversational API and replace the temporary local reply with the real assistant reply.");
}

if (!nextConfig.includes("microphone=(self)")) {
  throw new Error("Permissions-Policy blocks microphone access; expected microphone=(self).");
}

if (nextConfig.includes("microphone=()")) {
  throw new Error("Permissions-Policy still disables microphone access.");
}

for (const term of ["Do not mention login, email verification or credits unless the user asks about payment/credits or existing delivery access", "Keep replies short, friendly and useful"]) {
  if (!chatRoute.includes(term)) throw new Error(`Assistant chat route missing system prompt guard: ${term}`);
}

for (const term of ["loadAssistantUserContext", "buildAssistantUserContextPrompt", "Growth Intelligence requests", "Open productions", "Available production credits"]) {
  if (!assistantUserContext.includes(term) && !chatRoute.includes(term) && !assistantPlanRoute.includes(term) && !assistantOrchestrateRoute.includes(term)) throw new Error(`Assistant user context missing term: ${term}`);
}

for (const route of [chatRoute, assistantPlanRoute, assistantOrchestrateRoute]) {
  if (!route.includes("buildAssistantUserContextPrompt") || !route.includes("loadAssistantUserContext")) throw new Error("Assistant route is missing user context injection.");
}

for (const term of ["assistant_conversations", "assistant_messages", "conversation_id", "assistant_workspace", "clipora_assistant_workspace_messages", "local_reply"] ) {
  if (!assistantConversationMigration.includes(term) && !chatRoute.includes(term) && !workspace.includes(term)) throw new Error(`Assistant conversation persistence missing term: ${term}`);
}

for (const term of ["GET(request: Request)", "ensureAssistantConversation", "assistant_messages", "conversation_id"]) {
  if (!chatRoute.includes(term)) throw new Error(`Assistant chat route missing persistence term: ${term}`);
}

for (const term of ["Assistant Conversations", "/admin/assistant"]) {
  if (!adminMenu.includes(term)) throw new Error(`Admin menu missing assistant conversations term: ${term}`);
}

for (const term of ["AdminAssistantConversationsViewer", "Conversation history viewer"]) {
  if (!adminAssistantPage.includes(term)) throw new Error(`Admin assistant page missing term: ${term}`);
}

for (const term of ["Load assistant conversations", "Conversation detail", "/api/admin/assistant-conversations"]) {
  if (!adminAssistantViewer.includes(term)) throw new Error(`Admin assistant viewer missing term: ${term}`);
}

for (const term of ["assistant_conversations", "assistant_messages", "conversation_id", "isAdminRequest"]) {
  if (!adminAssistantRoute.includes(term)) throw new Error(`Admin assistant conversations API missing term: ${term}`);
}

console.log("assistant-conversation-smoke ok");
