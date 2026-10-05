import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/about")) setActiveLink("About Us");
    else if (location.pathname.startsWith("/blog")) setActiveLink("Blog");
    else if (location.pathname === "/") setActiveLink("Home");
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "Tutors", href: "/#tutors" },
    { name: "Programs", href: "/#programs" },
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
  ];

  const handleNavigate = useCallback(
    (link: { name: string; href: string }) => {
      setActiveLink(link.name);
      setIsOpen(false);
      if (link.href.startsWith("/#") || link.href.startsWith("#")) {
        const hash = link.href.includes("#")
          ? `#${link.href.split("#")[1]}`
          : link.href;
        if (window.location.pathname !== "/") {
          navigate(`/${hash}`);
          return;
        }
        document
          .querySelector(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate(link.href);
        // Immediate reset — ScrollToTopLayout also runs after paint
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    },
    [navigate],
  );

  return (
    <>
      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-[90%] max-w-4xl">
        <div
          className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300 ${
            scrolled
              ? "bg-background/95 backdrop-blur-xl shadow-xl shadow-primary/10 border border-primary/15"
              : "bg-background/90 backdrop-blur-md shadow-lg shadow-black/5 border border-border"
          }`}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate({ name: "Home", href: "#home" });
            }}
            className="flex items-center gap-2 shrink-0 pl-1"
          >
            <img
              src="/gygiLogo.jpg"
              alt="GYGI"
              className="h-8 w-8 rounded-full object-contain border border-primary/20"
            />
            <span className="hidden sm:inline text-base font-black text-foreground dark:text-foreground">
              GYGI<span className="text-primary">.</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(link);
                }}
                className={`text-sm font-semibold transition-colors ${
                  activeLink === link.name
                    ? "text-foreground dark:text-foreground"
                    : "text-gray-500 hover:text-primary dark:text-muted-foreground dark:hover:text-primary"
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate("/register")}
              className="hidden sm:inline-flex px-5 py-2 rounded-full bg-indigo-950 text-white text-sm font-bold hover:bg-primary transition-all shadow-md dark:bg-primary dark:hover:bg-primary/90"
            >
              Join Now
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[60]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl shadow-2xl border-t border-primary/15 transition-transform duration-500 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-1 pb-[env(safe-area-inset-bottom)]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(link);
              }}
              className="block px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            >
              {link.name}
            </a>
          ))}
          <div className="space-y-2 px-2 py-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Appearance
            </span>
            <ThemeToggle variant="segmented" className="w-full" />
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/register");
            }}
            className="w-full mt-2 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm"
          >
            Join Now
          </button>
        </div>
      </div>

      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Navbar;
