import { randomUUID } from "node:crypto";
import { ConversationError, type ConversationProject, type ConversationProvider, type ConversationStore, type TurnResponse, type Wallets } from "./conversation-contract";
import { createBriefFieldsSchema, evaluateRequirements, getCategoryContract } from "./requirements";

// Deterministic demonstration, NOT a semantic LLM or a live wallet.
export function createMockConversationProvider(): ConversationProvider {
  return {preflight(){},prepare(input) {return {inputUpperBound:200,async call() {
    const contract = getCategoryContract(input.project.categoryId);
    const briefPatch: Record<string,string> = {}, evidence: Record<string,string> = {};
    const add = (key:string,value:string,quote:string) => {if(createBriefFieldsSchema(contract.id).safeParse({[key]:value}).success){briefPatch[key]=value;evidence[key]=quote;}};
    if (!input.project.snapshot.fields.brief) add("brief",input.message,input.message.slice(0,1000));
    const brand = input.message.match(/(.{1,120}?)\s+adında\s+/i);
    if (brand && contract.id==="website") add("business_name",brand[1].trim(),brand[0]);
    const before = evaluateRequirements(input.project.snapshot).nextQuestion;
    if (before && before.fieldId!=="brief") {
      const field = contract.fields.find(field=>field.id===before.fieldId);
      if (field && !field.serverOnly && field.kind!=="references") {
        const value = field.options.find(value => value === input.message || value.replace(/_/g," ").toLowerCase()===input.message.toLowerCase()) ?? input.message;
        add(field.id,value,input.message.slice(0,1000));
      }
    }
    for (const field of contract.fields.filter(field=>!field.serverOnly && field.kind!=="references")) {
      const match=input.message.match(new RegExp("(?:^|\\n)"+field.id+"\\s*:\\s*([^\\n]+)","i"));
      if (match) add(field.id,match[1].trim(),match[0].trim().slice(0,1000));
    }
    const lower = input.message.toLowerCase();
    const operational = /üret|uret|render|onay|approve|generate|reviz|background|arka plan/.test(lower);
    const reply = input.uiLanguage === "tr" ? "Mock modunda bu bilgiyi brief'e ekledim. Bu gerçek AI yanıtı veya üretim değildir." : "I added this detail to the mock brief. This is not a real AI response or production.";
    return {output:{categoryId:contract.id,intent:operational?"request_production":"clarify",briefPatch,evidence,reply,question:null,toolCalls:[]},usage:{inputTokens:10,outputTokens:10}};
  }};}};
}
type RequestRow = {hash:string;projectId:string;state:string;reserve:number;message:string;result?:Parameters<ConversationStore["record"]>[2];response?:TurnResponse};
export class MemoryConversationStore implements ConversationStore {
  projects = new Map<string,ConversationProject>(); requests = new Map<string,RequestRow>(); events: string[] = [];
  constructor(public wallets: Wallets={assistant:{balance:1000,reserved:0,available:1000},production:{balance:0,reserved:0,available:0}}) {}
  create(userId:string,categoryId:string,title="Mock Studio projesi",seed?:Partial<ConversationProject>) {
    const project: ConversationProject={id:randomUUID(),userId,categoryId,title,productionId:null,snapshot:{categoryId,revision:0,fields:{}},messages:[],...seed};
    this.projects.set(project.id,structuredClone(project)); return project;
  }
  async load(userId:string,projectId:string,categoryId:string) {
    const project=this.projects.get(projectId); if(!project||project.userId!==userId||project.categoryId!==categoryId) throw new ConversationError("project_not_found",404); return structuredClone(project);
  }
  async reserve(input:Parameters<ConversationStore["reserve"]>[0]) {
    const key=input.userId+":"+input.requestId, existing=this.requests.get(key);
    if(existing) {if(existing.hash!==input.payloadHash||existing.projectId!==input.project.id) throw new ConversationError("request_payload_conflict",409);
      return {state:existing.state==="settled"?"settled" as const:existing.state==="result_ready"?"result_ready" as const:existing.state==="released"?"released" as const:"pending" as const,response:existing.response};}
    if([...this.requests.values()].some(row=>row.projectId===input.project.id&&!["settled","released"].includes(row.state))) throw new ConversationError("project_request_pending",409);
    if(this.wallets.assistant.available<input.reserveCredits) throw new ConversationError("insufficient_assistant_credits",402);
    this.wallets.assistant.reserved+=input.reserveCredits;this.wallets.assistant.available-=input.reserveCredits;
    this.requests.set(key,{hash:input.payloadHash,projectId:input.project.id,state:"reserved",reserve:input.reserveCredits,message:input.message});this.events.push("reserve");return {state:"fresh" as const};
  }
  async claim(userId:string,requestId:string) {const row=this.requests.get(userId+":"+requestId);if(row?.state!=="reserved")return false;row.state="dispatched";this.events.push("claim");return true;}
  async record(userId:string,requestId:string,result:Parameters<ConversationStore["record"]>[2]) {const row=this.requests.get(userId+":"+requestId)!;if(result.chargedCredits>row.reserve)throw new Error("charge_above_reserve");row.result=structuredClone(result);row.state="result_ready";this.events.push("record");}
  async settle(userId:string,requestId:string,mode:"real"|"mock") {
    const row=this.requests.get(userId+":"+requestId)!;if(row.response)return structuredClone(row.response);if(row.state!=="result_ready"||!row.result)throw new Error("not_ready");
    const result=row.result;this.wallets.assistant.balance-=result.chargedCredits;this.wallets.assistant.reserved-=row.reserve;this.wallets.assistant.available=this.wallets.assistant.balance-this.wallets.assistant.reserved;
    this.projects.set(result.project.id,structuredClone(result.project));row.state="settled";this.events.push("settle");
    row.response={ok:true,mode,project:result.project,reply:result.reply,requestId,chargedCredits:result.chargedCredits,chargedAccount:"assistant",wallets:structuredClone(this.wallets),blockedTools:result.blockedTools,executionReady:false,nextQuestion:result.nextQuestion};return structuredClone(row.response);
  }
  async release(userId:string,requestId:string) {const row=this.requests.get(userId+":"+requestId)!;if(!["reserved","dispatched"].includes(row.state))throw new Error("uncertain_cannot_release");this.wallets.assistant.reserved-=row.reserve;this.wallets.assistant.available+=row.reserve;row.state="released";this.events.push("release");}
  async uncertain(userId:string,requestId:string) {const row=this.requests.get(userId+":"+requestId)!;if(row.state==="dispatched")row.state="uncertain";this.events.push("uncertain");}
}
