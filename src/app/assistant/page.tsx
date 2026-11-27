import {redirect} from "next/navigation";
import {customerStudioPath} from "@/lib/customer-studio-route";
export default async function AssistantPageRoute({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){redirect(customerStudioPath(await searchParams));}
