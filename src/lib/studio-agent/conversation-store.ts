import { supabaseAdmin } from "@/lib/supabase";
import { ConversationError, ProjectSchema, type ConversationProject, type ConversationStore, type Reservation, type TurnResponse, type Wallets } from "./conversation-contract";
import { createBriefFieldsSchema } from "./requirements";
import { CONTENT_LANGUAGES } from "@/lib/crelavo/languages";
type DB = ReturnType<typeof supabaseAdmin>;
export async function studioRPC(db: DB, name: string, args: Record<string,unknown>) {
  const {data,error} = await db.rpc(name,args);
  if (error) {
    const message = String(error.message);
    const code = ["budget_exhausted","rate_limit","budget_policy_mismatch","insufficient_assistant_credits","request_payload_conflict","project_changed_reload","project_request_pending","project_not_found"].find(code => message.includes(code));
    throw new ConversationError(code || "studio_storage_unavailable",code==="rate_limit"?429:code==="budget_exhausted"?402:code==="insufficient_assistant_credits"?402:code==="project_not_found"?404:code?409:503);
  }
  return data;
}
export async function legacyWebsiteMemory(db: DB,userId: string,productionId?: string) {
  if (!productionId) return {fields:{},messages:[],title:"Studio projesi",productionId:null};
  const {data,error} = await db.from("production_requests").select("id,title,output_json").eq("id",productionId).eq("user_id",userId).eq("production_type","website").maybeSingle();
  if (error || !data) throw new ConversationError("project_not_found",404);
  const old = data.output_json?.websiteAssistant;
  const legacy = old?.brief ?? {};
  const candidates: Record<string,unknown> = {
    brief:legacy.brief,business_name:legacy.brand,audience:legacy.audience,site_type:typeof legacy.siteType==="string"?legacy.siteType.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/_$/g,""):undefined,
    design_style:typeof legacy.style==="string"?legacy.style.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/_$/g,""):undefined,
    pages:Array.isArray(legacy.pages)?legacy.pages.join(", "):undefined,features_and_integrations:Array.isArray(legacy.features)?legacy.features.join(", "):undefined,
    language:CONTENT_LANGUAGES.find(language=>language.id===legacy.locale || language.label.toLowerCase()===String(legacy.locale).toLowerCase())?.label.toLowerCase(),
  };
  const fields: Record<string,string|string[]> = {};
  const schema = createBriefFieldsSchema("website");
  for (const [key,value] of Object.entries(candidates)) {
    const parsed = schema.safeParse({[key]:value});
    if (parsed.success && value !== undefined) fields[key] = value as string;
  }
  const messages = Array.isArray(old?.messages) ? old.messages.filter((item: {role?:string;content?:string}) => ["user","assistant"].includes(item.role || "") && typeof item.content==="string" && item.content.length>0 && item.content.length<=6000).slice(-30) : [];
  return {fields,messages,title:String(data.title).slice(0,160),productionId};
}
export function createDatabaseConversationStore(db: DB): ConversationStore & {create(userId:string,categoryId:string,title?:string,productionId?:string):Promise<ConversationProject>;list(userId:string,categoryId:string):Promise<unknown>;wallets(userId:string):Promise<Wallets>} {
  const load = async(userId:string,projectId:string,categoryId:string) => {
    const {data,error} = await db.from("studio_agent_projects").select("*").eq("id",projectId).eq("user_id",userId).eq("category_id",categoryId).maybeSingle();
    if (error) throw new ConversationError("studio_storage_unavailable");
    if (!data) throw new ConversationError("project_not_found",404);
    const messages = await db.from("studio_agent_messages").select("role,content").eq("project_id",projectId).eq("user_id",userId).eq("category_id",categoryId).order("id",{ascending:false}).limit(50);
    if (messages.error) throw new ConversationError("studio_storage_unavailable");
    return ProjectSchema.parse({id:data.id,userId:data.user_id,categoryId:data.category_id,title:data.title,productionId:data.production_id,
      snapshot:{categoryId,revision:Number(data.revision),fields:data.brief},messages:[...(messages.data ?? [])].reverse()});
  };
  return {
    load,
    async create(userId,categoryId,title,productionId) {
      const initial = await legacyWebsiteMemory(db,userId,productionId);
      const id = await studioRPC(db,"studio_agent_create_project",{p_user:userId,p_category:categoryId,p_title:title||initial.title,p_production:productionId||null,p_brief:initial.fields,p_messages:initial.messages});
      return load(userId,String(id),categoryId);
    },
    async list(userId,categoryId) {
      const {data,error} = await db.from("studio_agent_projects").select("id,title,category_id,production_id,updated_at").eq("user_id",userId).eq("category_id",categoryId).order("updated_at",{ascending:false}).limit(50);
      if (error) throw new ConversationError("studio_storage_unavailable"); return data;
    },
    async wallets(userId) { return await studioRPC(db,"studio_agent_wallets",{p_user:userId}) as Wallets; },
    async reserve(input) { return await studioRPC(db,"studio_agent_budget_reserve",{p_user:input.userId,p_project:input.project.id,p_category:input.project.categoryId,p_request:input.requestId,p_hash:input.payloadHash,p_units:input.reserveCredits,p_tariff:input.tariffVersion,p_message:input.message,p_revision:input.project.snapshot.revision,p_policy:input.cost?.policy,p_input:input.cost?.inputBound,p_output:input.cost?.outputBound}) as Reservation; },
    async claim(userId,requestId) { return Boolean(await studioRPC(db,"studio_agent_budget_claim",{p_user:userId,p_request:requestId})); },
    async record(userId,requestId,result) { await studioRPC(db,"studio_agent_budget_record",{p_user:userId,p_request:requestId,p_result:result,p_usage:result.usage,p_units:result.chargedCredits,p_receipt:result.receipt}); },
    async settle(userId,requestId,mode) { return await studioRPC(db,"studio_agent_budget_settle",{p_user:userId,p_request:requestId,p_mode:mode}) as TurnResponse; },
    async release(userId,requestId) { await studioRPC(db,"studio_agent_budget_release",{p_user:userId,p_request:requestId}); },
    async uncertain(userId,requestId) { await studioRPC(db,"studio_agent_uncertain",{p_user:userId,p_request:requestId}); },
  };
}