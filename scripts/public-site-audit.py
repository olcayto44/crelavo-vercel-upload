"""Read-only public Crelavo sitemap audit. No credentials, no external redirects."""
import concurrent.futures, collections, json, os, re, ssl, time
import urllib.request, urllib.parse, urllib.error
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

BASE="https://www.crelavo.com"
MAX_BYTES=5*1024*1024
def allowed(url):
    u=urllib.parse.urlsplit(url)
    return u.scheme=="https" and u.netloc=="www.crelavo.com" and not u.username and not u.password and not any(u.path==p or u.path.startswith(p+"/") for p in ("/admin","/api","/dashboard","/auth"))
class SameSite(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if not allowed(newurl): raise ValueError("redirect_outside_public_site")
        return super().redirect_request(req,fp,code,msg,headers,newurl)
opener=urllib.request.build_opener(SameSite())
def fetch(url):
    if not allowed(url): raise ValueError("not_public")
    req=urllib.request.Request(url,headers={"User-Agent":"Crelavo-Owner-SEO-Audit/1.0","Accept":"text/html,application/xml"})
    with opener.open(req,timeout=15) as res:
        data=res.read(MAX_BYTES+1)
        if len(data)>MAX_BYTES: raise ValueError("response_too_large")
        return res.status,res.geturl(),data.decode("utf-8","replace")
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.title=[];self.h1=[];self.description="";self.canonical=[];self.lang=[];self.noindex=False;self.missing_alt=0;self.active="";self.in_script=False;self.schema=[];self.schema_text=""
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ("title","h1"): self.active=tag
        if tag=="meta":
            if a.get("name","").lower()=="description": self.description=a.get("content","")
            if a.get("name","").lower() in ("robots","googlebot") and "noindex" in a.get("content","").lower():self.noindex=True
        if tag=="link":
            rel=a.get("rel","").lower().split()
            if "canonical" in rel:self.canonical.append(a.get("href",""))
            if "alternate" in rel and a.get("hreflang"):self.lang.append(a["hreflang"])
        if tag=="img" and "alt" not in a:self.missing_alt+=1
        if tag=="script" and a.get("type")=="application/ld+json":self.in_script=True;self.schema_text=""
    def handle_data(self,data):
        if self.active=="title":self.title.append(data)
        if self.active=="h1":self.h1.append(data)
        if self.in_script:self.schema_text+=data
    def handle_endtag(self,tag):
        if tag==self.active:self.active=""
        if tag=="script" and self.in_script:
            try:json.loads(self.schema_text);self.schema.append(True)
            except (ValueError,TypeError):self.schema.append(False)
            self.in_script=False
def audit(url):
    row={"url":url,"issues":[]}
    try:
        status,final,html=fetch(url);p=Page();p.feed(html)
        title=" ".join("".join(p.title).split());description=" ".join(p.description.split())
        row.update(status=status,final=final,title=title,description=description,canonical=p.canonical,hreflang=len(p.lang),h1=" ".join(p.h1)[:200],schemas=len(p.schema),missing_alt=p.missing_alt)
        if final!=url:row["issues"].append("redirect")
        if not title:row["issues"].append("missing_title")
        if len(title)>75:row["issues"].append("long_title_review")
        if not description:row["issues"].append("missing_description")
        if not p.h1:row["issues"].append("missing_h1")
        if p.canonical!=[url]:row["issues"].append("canonical_review")
        if p.noindex:row["issues"].append("noindex_in_sitemap")
        if p.missing_alt:row["issues"].append("missing_alt")
        if False in p.schema:row["issues"].append("invalid_json_ld")
    except urllib.error.HTTPError as e:row.update(status=e.code);row["issues"].append("http_error")
    except Exception as e:row["issues"].append("fetch_or_parse_error");row["error_type"]=type(e).__name__
    return row
def main():
    _,_,xml=fetch(BASE+"/sitemap.xml")
    doc=ET.fromstring(xml)
    urls=list(dict.fromkeys(el.text for el in doc.findall(".//{*}loc") if el.text))
    if len(urls)>600 or not urls:raise SystemExit("unexpected sitemap size")
    valid=[u for u in urls if allowed(u)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(audit,valid))
    titles=collections.Counter(r.get("title","") for r in rows if r.get("title"))
    desc=collections.Counter(r.get("description","") for r in rows if r.get("description"))
    for r in rows:
        if r.get("title") and titles[r["title"]]>1:r["issues"].append("duplicate_title")
        if r.get("description") and desc[r["description"]]>1:r["issues"].append("duplicate_description")
    counts=collections.Counter(i for r in rows for i in r["issues"])
    summary={"target":BASE,"audited":len(rows),"sitemap_urls":len(urls),"excluded":len(urls)-len(valid),"http_200":sum(r.get("status")==200 for r in rows),"issues":dict(counts),"rows_without_hreflang":sum(r.get("status")==200 and not r.get("hreflang") for r in rows)}
    print(json.dumps(summary,ensure_ascii=False,indent=2))
    with open("crelavo-site-audit.json","w",encoding="utf-8") as f:json.dump({"summary":summary,"pages":rows},f,ensure_ascii=False,indent=2)
    for r in rows:
        if r["issues"]:print(r["url"],r.get("status","unavailable"),",".join(r["issues"]))
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as f:f.write("## Public sitemap audit\n\n```json\n"+json.dumps(summary,ensure_ascii=False,indent=2)+"\n```\n")
if __name__=="__main__":main()
