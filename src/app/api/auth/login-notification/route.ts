import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {rateLimit,rateLimitResponse} from "@/lib/security";
function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const token=bearerTokenFromRequest(request);
  if(!token)return Response.json({error:"Sign in required."},{status:401});
  let email="",fullName="Crelavo user",uid="";
  try{const {data,error}=await supabaseAdmin().auth.getUser(token);const user=data.user;if(error||!user?.id||!user.email||!(user.email_confirmed_at||user.confirmed_at))return Response.json({error:"Verified session required."},{status:401});email=cleanText(user.email,180).toLowerCase();uid=user.id;fullName=cleanText(user.user_metadata?.full_name,140)||fullName;}catch{return Response.json({error:"Session verification unavailable."},{status:503});}
  const limit=rateLimit({key:"login-notice:"+uid,limit:3,windowMs:3600000});if(!limit.allowed)return rateLimitResponse(limit.resetAt);

  if (!isEmail(email)) {
    return Response.json({ error: "Valid email is required." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ skipped: true, reason: "RESEND_API_KEY is not configured." });
  }

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const now = new Date().toISOString();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Crelavo account sign-in notice",
      text: [
        `Hello ${fullName},`,
        "",
        "Your Crelavo account was signed in successfully.",
        `Time: ${now}`,
        "",
        "If this was you, no action is needed. If you did not sign in, reset your password immediately from the Crelavo login page."
      ].join("\n")
    })
  });

  if (!response.ok) {
    return Response.json({ skipped: true, reason: "Email provider rejected the login notification." });
  }

  return Response.json({ sent: true });
}
