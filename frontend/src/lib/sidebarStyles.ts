/** Shared floating sidebar shell sizing — border/radius/shadow come from `variant="floating"`. */
export const FLOATING_SIDEBAR_CLASS =
  "my-3 h-[calc(100svh-1.5rem)] overflow-hidden";

/** Soft active item + left rail marker so the current page is obvious. */
export const SIDEBAR_ITEM_ACTIVE =
  "relative bg-primary/12 font-semibold text-primary shadow-[inset_3px_0_0_0_var(--primary)] hover:bg-primary/15 hover:text-primary data-[active=true]:bg-primary/12 data-[active=true]:font-semibold data-[active=true]:text-primary";

export const SIDEBAR_ITEM_IDLE =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

/** Exact match for dashboard roots; prefix match for nested routes. */
export function navItemIsActive(
  pathname: string,
  url: string,
  opts?: { exact?: boolean },
): boolean {
  if (opts?.exact) return pathname === url;
  if (
    url === "/dashboard" ||
    url.endsWith("/dashboard") ||
    url === "/super-admin"
  ) {
    return pathname === url;
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}
