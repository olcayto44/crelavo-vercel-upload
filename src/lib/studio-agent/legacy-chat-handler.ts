import {legacyAPIBlocked} from "./legacy-api-policy";
export async function handleLegacyChat(request:Request,deps:{authenticate:(request:Request)=>Promise<{id:string}>}){
 try{const user=await deps.authenticate(request);if(!user.id)throw Error("sign_in");return legacyAPIBlocked()!;}
 catch{return Response.json({ok:false,code:"sign_in",executionReady:false},{status:401,headers:{"Cache-Control":"no-store"}});}
}