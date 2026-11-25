const fs=require("node:fs"),assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const route=read("src/lib/category-public-routes.ts"), pairs=[...route.matchAll(/"([^"]+)": "(\/[^"]+)"/g)].map(m=>[m[1],m[2]]);
assert.equal(pairs.length,37);assert.equal(new Set(pairs.map(p=>p[1])).size,37);
const profile=JSON.parse(read("src/lib/category-search-profiles.ts").split("Record<string,SearchProfile>=")[1].trim().replace(/;$/,""));
const ids=new Set(pairs.map(p=>p[0]));assert.equal(Object.keys(profile).length,37);
for(const [id,path] of pairs){assert(!path.startsWith("/dashboard"));const p=profile[id];assert(p&&p.question&&p.answer&&p.h1);assert.equal(new Set(p.related).size,4);assert(p.related.every(k=>ids.has(k)&&k!==id));}
const page=read("src/components/CategoryDetailPage.tsx");assert(page.includes("categorySearchProfiles[id]")&&page.includes("categoryWorkspace(id)")&&page.includes("searchProfile.question"));
console.log("Category search coverage: 37 distinct routes, 37 FAQ profiles, 148 related links, all valid IDs.");
