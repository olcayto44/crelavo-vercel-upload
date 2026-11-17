export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve,reject)=>{
    if (signal.aborted) { reject(new Error("poll_aborted")); return; }
    const abort=()=>{ clearTimeout(timer); signal.removeEventListener("abort",abort); reject(new Error("poll_aborted")); };
    const timer=setTimeout(()=>{ signal.removeEventListener("abort",abort); resolve(); },ms);
    signal.addEventListener("abort",abort,{once:true});
  });
}
export function createProductionPollingRegistry() {
  let sequence=0;
  const loops=new Map<string,{id:number;controller:AbortController}>();
  return {
    begin(key:string) { if(loops.has(key))return null; const entry={id:++sequence,controller:new AbortController()}; loops.set(key,entry); return entry; },
    current(key:string,id:number) { return loops.get(key)?.id===id && !loops.get(key)?.controller.signal.aborted; },
    finish(key:string,id:number) { const entry=loops.get(key); if(entry?.id===id){entry.controller.abort();loops.delete(key);} },
    cancelAll() { for(const entry of loops.values())entry.controller.abort();loops.clear();sequence++; }
  };
}
