import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {WebsiteCmsDemo} from "./WebsiteCmsDemo";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Website müşteri paneli – örnek proje",robots:{index:false,follow:false}};
export default function Page(){if(!websiteDesignPilotEnabled())notFound();return <WebsiteCmsDemo/>;}
