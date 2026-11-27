const assert=require("node:assert/strict"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {postAuthPath,safeReturnTo}=load("src/lib/crelavo/redirects.ts");
assert.equal(postAuthPath({isNew:false,returnTo:"/dashboard/billing"}),"/dashboard/billing");
assert.equal(postAuthPath({isNew:false,returnTo:"/dashboard/credits"}),"/dashboard/credits");
assert.equal(postAuthPath({isNew:true,returnTo:"/dashboard/studio/video?uiLang=tr"}),"/dashboard/studio/video?uiLang=tr");
assert.equal(postAuthPath({isNew:true}),"/dashboard/studio");
for(const p of ["https://evil.test","//evil.test","/\\evil.test","/auth/login","/auth/register","/join"])assert.equal(safeReturnTo(p),null,p);
const read=p=>fs.readFileSync(p,"utf8");assert(read("src/lib/crelavo/authConfig.ts").includes("SIGNUP_DISABLED = true"));assert(!read("src/app/auth/login/page.tsx").includes('redirect("/join")'));assert(read("src/app/join/page.tsx").includes("whop.com/checkout/"));assert(read("src/components/auth/AuthModal.tsx").includes("requestMagicLink"));assert(read("src/components/auth/AuthModal.tsx").includes("signInWithOAuth"));assert(read("src/app/api/auth/login-notification/route.ts").includes("auth.getUser(token)"));assert(!read("src/app/api/auth/login-notification/route.ts").includes("body.email"));assert(!read("src/lib/crelavo/sendMagicEmail.ts").includes("console.log"));console.log("PASS login routes, safe same-site returns, paid signup gate preserved, OTP/Google transport preserved, recipient verified; no live mail sent.");
