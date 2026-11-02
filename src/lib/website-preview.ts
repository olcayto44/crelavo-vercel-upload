export function websitePreviewDocument(source: string, anchor = '') {
  const safeAnchor = /^[a-zA-Z0-9_-]{0,100}$/.test(anchor) ? anchor : '';
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39; https:; script-src &#39;unsafe-inline&#39;; img-src data: blob: https:; font-src data: https:; connect-src &#39;none&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;; object-src &#39;none&#39;">';
  const bridge = '<script>document.addEventListener("click",function(event){var link=event.target.closest("a");if(!link)return;var href=link.getAttribute("href")||"";var parts=href.replace(/^\\.\\//,"").split("#");var page=parts[0];if(/^[a-z0-9][a-z0-9-]{0,79}\\.html$/.test(page)){event.preventDefault();parent.postMessage({type:"crelavo-website-page",page:page,anchor:parts[1]||""},"*");}});window.addEventListener("load",function(){var element=document.getElementById(' + JSON.stringify(safeAnchor) + ');if(element)element.scrollIntoView();});</script>';
  return source.replace(/<head\b[^>]*>/i, (head) => head + policy).replace(/<\/body>/i, () => bridge + '</body>');
}
