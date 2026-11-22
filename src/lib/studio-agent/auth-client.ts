import {createClient} from "@supabase/supabase-js";
import {isolatedDatabaseTarget} from "./environment-policy";
// Public-key authentication only; no service-role key used for session verification.
export function studioAuthClient(){const isolated=isolatedDatabaseTarget();return createClient(isolated?process.env.STUDIO_AGENT_TEST_DATABASE_URL!:process.env.NEXT_PUBLIC_SUPABASE_URL||"",isolated?process.env.STUDIO_AGENT_TEST_ANON_KEY||"":process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"",{auth:{persistSession:false,autoRefreshToken:false}});}