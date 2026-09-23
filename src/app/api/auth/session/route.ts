import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/crelavo/sessionCookie";
export async function GET() { return NextResponse.json({ user: await getSessionUser() }); }
