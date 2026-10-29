/** Preview navigation never grants or impersonates an authenticated session. */
export function businessPreviewHref(href: string) {
  if (href === "/biz/register") return "/preview/biz";
  if (href === "/biz" || href.startsWith("/biz/") || href.startsWith("/biz?"))
    return "/preview" + href;
  if (href.startsWith("/chat/"))
    return (
      "/preview/biz/chat?thread=" +
      encodeURIComponent(decodeURIComponent(href.slice(6)))
    );
  if (href.startsWith("/category/")) return "/preview/biz/store";
  if (href === "/profile") return "/preview/biz/profile";
  return href;
}
