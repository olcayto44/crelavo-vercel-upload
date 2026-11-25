export function studioPathCategory(path:string){const match=path.match(/^\/dashboard\/studio\/([a-z0-9-]+)\/?$/);return match?match[1].replace(/-/g,"_"):null}
export function isStudioConversationPath(path:string){return path==="/dashboard/studio"||path==="/dashboard/studio-v2"||studioPathCategory(path)!==null}
