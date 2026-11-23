import { advancedCanvasState } from "./assistant-core";
import type { ConversationProject } from "./conversation-contract";
import { evaluateRequirements } from "./requirements";
export function studioPlanningState(project:ConversationProject) {
 const result=evaluateRequirements(project.snapshot,{acceptedDefaults:[]});
 return {briefRevision:project.snapshot.revision,missingFields:result.missing.map(item=>item.fieldId),state:result.missing.map(item=>item.fieldId).length?"collecting":"draft_ready",planState:project.advanced?advancedCanvasState(project)?.planState:"not_generated",approved:project.advanced?advancedCanvasState(project)?.approved:false,advanced:advancedCanvasState(project),executionReady:false};
}