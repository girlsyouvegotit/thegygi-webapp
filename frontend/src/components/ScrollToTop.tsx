import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router";

/**
 * Resets window scroll on every pathname change so navigations
 * (e.g. Navbar → Blog) don't land on the previous page's footer.
 * Hash links still scroll to their target after the page mounts.
 */
export function ScrollToTopLayout() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = window.requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ block: "start" });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      });
      return () => window.cancelAnimationFrame(id);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return <Outlet />;
}

export default ScrollToTopLayout;
