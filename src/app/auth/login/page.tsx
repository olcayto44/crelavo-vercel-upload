import type {Metadata} from "next";
export const metadata:Metadata={title:"Sign in | Crelavo",description:"Sign in securely to your Crelavo workspace."};
import {Header} from "@/components/Header";
import {AuthEntry} from "@/components/auth/AuthEntry";
import {postAuthPath} from "@/lib/crelavo/redirects";
export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string;returnTo?:string}>}){
 const query=await searchParams;const candidate=typeof query.next==="string"?query.next:typeof query.returnTo==="string"?query.returnTo:undefined;
 return <><Header/><AuthEntry next={postAuthPath({isNew:false,returnTo:candidate})}/></>;
}
