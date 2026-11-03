import { Fragment } from "react";
import { safeBlogUrl } from "@/lib/blog-posts";
function inline(text: string) {
  return text.split(/(\[[^\]\n]+\]\([^)\s]+\))/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return link && safeBlogUrl(link[2]) ? <a key={index} href={link[2]} rel={link[2].startsWith("https:") ? "noopener noreferrer" : undefined}>{link[1]}</a> : <Fragment key={index}>{part}</Fragment>;
  });
}
// No raw HTML: all text is escaped by React, including imported/pasted markup.
export function BlogArticleContent({ content }: { content: string }) {
  return <div className="service-seo-article">{content.split(/\r?\n\s*\r?\n/).filter(Boolean).map((block, index) => {
    const lines = block.split(/\r?\n/);
    return <section key={index} style={{ marginBottom: 20 }}>{lines.map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i}>{inline(line.slice(4))}</h3>;
      if (line.startsWith("## ")) return <h2 key={i}>{inline(line.slice(3))}</h2>;
      if (line.startsWith("- ")) return <ul key={i}><li>{inline(line.slice(2))}</li></ul>;
      return <p key={i} style={{ overflowWrap: "anywhere" }}>{inline(line)}</p>;
    })}</section>;
  })}</div>;
}
