"use client";
import Link from "next/link";
import {useInboxUnread} from "@/lib/use-inbox-unread";
export function AdminSidebarAlert(){const state=useInboxUnread();return <Link href="/admin/inbox" className={`admin-sidebar-alert ${state?.unread?"has-alerts":""}`}><span className="admin-sidebar-alert-label">Okunmamış mesaj</span><strong className="admin-sidebar-alert-count" aria-live="polite">{state?.unread??"—"}</strong></Link>}
