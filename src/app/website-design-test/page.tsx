import {notFound} from "next/navigation";import type {Metadata} from "next";import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";import {WebsiteDesignPilot} from "./IsolatedWebsiteDesignPilot";
export const dynamic="force-dynamic";export const metadata:Metadata={title:"Website responsive design pilot",robots:{index:false,follow:false}};
export default function Page(){if(!websiteDesignPilotEnabled())notFound();return <WebsiteDesignPilot/>;}
