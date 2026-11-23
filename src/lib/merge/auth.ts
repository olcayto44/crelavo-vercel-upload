import { getAdmin } from "./config.ts";
export async function requireUser(req: Request): Promise<{id:string}|null> {
 const token=/^Bearer\s+(.+)$/i.exec(req.headers.get("authorization")??"")?.[1];
 if(!token)return null; const {data,error}=await getAdmin().auth.getUser(token);
 return error||!data.user?null:{id:data.user.id};
}
