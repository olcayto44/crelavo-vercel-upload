"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RequireFreeAccount } from "./RequireFreeAccount";
import { StudioAccountGate } from "./StudioAccountGate";
export function DashboardAccountGate({children}:{children:ReactNode}) {
 const pathname=usePathname();
 return pathname==="/dashboard/studio-v2"||pathname?.startsWith("/dashboard/studio-v2/") ? <StudioAccountGate>{children}</StudioAccountGate> : <RequireFreeAccount>{children}</RequireFreeAccount>;
}
