"use client";
// Both private pilot and paid draft use the exact same editor. Keep isolated
// endpoint defaults; production callers pass their authenticated endpoint.
export {WebsiteDesignPilot,normalizeEditableDesign,type EditableDesign} from "./WebsiteDesignPilot";
