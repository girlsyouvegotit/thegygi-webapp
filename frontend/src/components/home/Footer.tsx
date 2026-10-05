import { useState, useCallback } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ArrowUp,
  X,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  PartyPopper,
  MapPin,
  Phone,
  Globe,
  Heart,
  Zap,
  Send,
  AlertCircle,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const GET_INVOLVED_INTERESTS = [
  "Volunteer",
  "Donate",
  "Partner with Us",
  "Become a Mentor",
] as const;

type GetInvolvedInterest = (typeof GET_INVOLVED_INTERESTS)[number];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");

  // Get Involved Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInterest, setModalInterest] = useState<GetInvolvedInterest | "">(
    "",
  );
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const resetGetInvolvedForm = useCallback(() => {
    setUserName("");
    setUserEmail("");
    setFormErrors({});
    setIsSubmitting(false);
  }, []);

  const openGetInvolvedModal = useCallback(
    (interest: GetInvolvedInterest) => {
      resetGetInvolvedForm();
      setModalInterest(interest);
      setModalOpen(true);
    },
    [resetGetInvolvedForm],
  );

  const closeGetInvolvedModal = useCallback(() => {
    setModalOpen(false);
    setModalInterest("");
    resetGetInvolvedForm();
  }, [resetGetInvolvedForm]);

  const handleNewsletter = useCallback(() => {
    setNewsletterError("");

    if (!newsletterEmail.trim()) {
      setNewsletterError("Email address is required");
      return;
    }

    if (!isValidEmail(newsletterEmail)) {
      setNewsletterError("Please enter a valid email address");
      return;
    }

    setShowNewsletterPopup(true);
    setNewsletterEmail("");

    // Reset after 5 seconds
    setTimeout(() => {
      setShowNewsletterPopup(false);
    }, 5000);
  }, [newsletterEmail, isValidEmail]);

  const handleModalSubmit = useCallback(async () => {
    const errors: { name?: string; email?: string } = {};

    if (!userName.trim()) {
      errors.name = "Name is required";
    }

    if (!userEmail.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(userEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!modalInterest) {
      toast.error("Please choose a Get Involved option again.");
      return;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/public/inquiries", {
        name: userName.trim(),
        email: userEmail.trim(),
        interest: modalInterest,
      });

      toast.success("Thanks! Our team will be in touch soon.");
      closeGetInvolvedModal();
    } catch (error) {
      console.error("Failed to submit inquiry:", error);
      toast.error("Could not send your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    userName,
    userEmail,
    modalInterest,
    isValidEmail,
    closeGetInvolvedModal,
  ]);

  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "About us", href: "#about" },
    { name: "Contact us", href: "#contact" },
    { name: "Programs", href: "#programs" },
  ];

  const companyLinks = [
    { name: "Mentorship", href: "#mentorship" },
    { name: "Live Classes", href: "#classes" },
    { name: "Community", href: "#community" },
    { name: "Impact", href: "#impact" },
  ];

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://www.instagram.com/p/CsE7mN-tXC8/",
    },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  ];

  const getInvolvedItems: {
    name: GetInvolvedInterest;
    icon: typeof Heart;
  }[] = [
    { name: "Volunteer", icon: Heart },
    { name: "Donate", icon: Zap },
    { name: "Partner with Us", icon: Globe },
    { name: "Become a Mentor", icon: HeartHandshake },
  ];

  return (
    <footer className="relative bg-[#050505] overflow-hidden">
      {/* ============================================ */}
      {/* LAYERED BACKGROUND EFFECTS */}
      {/* ============================================ */}

      {/* Glossy top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      {/* Large ambient glows */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[40vw] rounded-full bg-primary/[0.08] blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-700/[0.05] blur-[150px] pointer-events-none"></div>

      {/* Fine grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Curved decorative lines */}
      <svg
        className="absolute top-10 right-0 w-[700px] opacity-[0.03] pointer-events-none"
        viewBox="0 0 800 500"
        fill="none"
      >
        <path
          d="M800 200C700 80 600 30 500 60C400 90 350 180 250 200C150 220 80 160 0 80"
          stroke="#c147e9"
          strokeWidth="50"
          strokeLinecap="round"
        />
        <path
          d="M800 300C700 180 600 130 500 160C400 190 350 280 250 300C150 320 80 260 0 180"
          stroke="#e5b8f4"
          strokeWidth="25"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      <svg
        className="absolute bottom-20 left-0 w-[500px] opacity-[0.03] pointer-events-none"
        viewBox="0 0 600 400"
        fill="none"
      >
        <path
          d="M0 200C100 100 200 50 300 80C400 110 450 200 500 250C550 300 580 350 600 400"
          stroke="#c147e9"
          strokeWidth="35"
          strokeLinecap="round"
        />
      </svg>

      {/* ============================================ */}
      {/* FOOTER CONTENT */}
      {/* ============================================ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 sm:pt-20 lg:pt-24 pb-8">
        {/* Top Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-14 border-b border-white/[0.08]">
          {/* ============================================ */}
          {/* BRAND COLUMN - 4 cols */}
          {/* ============================================ */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative group">
                <img
                  src="/gygiLogo.jpg"
                  alt="GYGI"
                  className="h-11 w-11 object-contain rounded-xl border border-primary/40 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300"
                  loading="lazy"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-[#050505]"></span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                GYGI<span className="text-primary">.</span>
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
              GYGI is a full-service educational platform specializing in live
              learning, mentorship, and community-driven education across
              Africa.
            </p>

            {/* Contact Info */}
            <div className="space-y-2.5 mb-7">
              <a
                href="mailto:girlsyougotit25@gmail.com"
                className="flex items-center gap-2.5 text-gray-400 text-sm hover:text-primary transition-all duration-300 group"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
                  <Mail className="w-3 h-3" />
                </span>
                girlsyougotit25@gmail.com
              </a>
              <a
                href="tel:+2349064950175"
                className="flex items-center gap-2.5 text-gray-400 text-sm hover:text-primary transition-all duration-300 group"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300">
                  <Phone className="w-3 h-3" />
                </span>
                +234 906 495 0175
              </a>
              <p className="flex items-center gap-2.5 text-gray-400 text-sm">
                <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-primary" />
                </span>
                Lagos, Nigeria
              </p>
            </div>

            {/* Newsletter */}
            <div className="max-w-sm">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-full p-1.5 shadow-xl shadow-black/30 hover:border-primary/40 focus-within:border-primary/60 transition-all duration-300">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    setNewsletterError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNewsletter();
                    }
                  }}
                  className="flex-1 bg-transparent px-4 py-2 text-white placeholder:text-gray-500 text-sm focus:outline-none min-w-0"
                  aria-label="Email for newsletter"
                />
                <button
                  onClick={handleNewsletter}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 shrink-0 shadow-lg shadow-primary/30"
                  aria-label="Subscribe to newsletter"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              </div>
              {newsletterError && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  {newsletterError}
                </p>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* QUICK LINKS - 2 cols */}
          {/* ============================================ */}
          <div className="lg:col-span-2">
            <h4 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-5 relative inline-block">
              Quick Links
              <span className="absolute -bottom-1.5 left-0 w-10 h-[2px] bg-gradient-to-r from-primary to-transparent rounded-full"></span>
            </h4>
            <ul className="space-y-3 mt-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-primary text-sm transition-all duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary group-hover:w-3 transition-all duration-300"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ============================================ */}
          {/* COMPANY - 2 cols */}
          {/* ============================================ */}
          <div className="lg:col-span-2">
            <h4 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-5 relative inline-block">
              Company
              <span className="absolute -bottom-1.5 left-0 w-10 h-[2px] bg-gradient-to-r from-primary to-transparent rounded-full"></span>
            </h4>
            <ul className="space-y-3 mt-4">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-primary text-sm transition-all duration-300 inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-primary group-hover:w-3 transition-all duration-300"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ============================================ */}
          {/* SOCIAL - 2 cols */}
          {/* ============================================ */}
          <div className="lg:col-span-2">
            <h4 className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-5 relative inline-block">
              Social
              <span className="absolute -bottom-1.5 left-0 w-10 h-[2px] bg-gradient-to-r from-primary to-transparent rounded-full"></span>
            </h4>
            <ul className="space-y-3 mt-4">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-gray-400 hover:text-primary text-sm transition-all duration-300 group"
                  >
                    <span className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                      <link.icon className="w-3.5 h-3.5" />
                    </span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ============================================ */}
        {/* GET INVOLVED ROW */}
        {/* ============================================ */}
        <div className="flex flex-wrap items-center gap-2.5 mt-8">
          <span className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mr-2">
            Get Involved
          </span>
          <span className="hidden sm:block w-6 h-px bg-white/10"></span>
          {getInvolvedItems.map((item) => (
            <button
              key={item.name}
              onClick={() => openGetInvolvedModal(item.name)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-gray-300 text-xs font-medium hover:text-primary hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <item.icon className="w-3 h-3" />
              {item.name}
            </button>
          ))}
        </div>

        {/* ============================================ */}
        {/* BOTTOM BAR */}
        {/* ============================================ */}
        <div className="mt-8 flex items-center justify-center border-t border-white/[0.08] pt-6 sm:justify-start">
          <p className="text-xs text-gray-500">
            ©{currentYear} GYGI All rights reserved.
          </p>
        </div>

        {/* ============================================ */}
        {/* GIANT WATERMARK */}
        {/* ============================================ */}
        <div className="relative mt-10 pb-6">
          {/* Image watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/Banner_Yaba_Herbert%20Macaulay_2.jpg"
              alt="GYGI Watermark"
              className="w-[75%] max-w-[500px] h-auto object-cover rounded-2xl opacity-[0.03] grayscale"
              loading="lazy"
            />
          </div>

          {/* Giant Text */}
          <div className="relative">
            <h2
              className="text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] font-black leading-none tracking-tighter text-center select-none pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, #c147e9 0%, #e5b8f4 30%, #ffffff 50%, #e5b8f4 70%, #c147e9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 60px rgba(193, 71, 233, 0.4))",
              }}
            >
              G Y G I
            </h2>
          </div>

          {/* Bottom curved line */}
          <svg
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] opacity-10"
            viewBox="0 0 600 50"
            fill="none"
          >
            <path
              d="M0 25C100 5 200 5 300 25C400 45 500 45 600 25"
              stroke="#c147e9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* ============================================ */}
      {/* BACK TO TOP BUTTON */}
      {/* ============================================ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300"
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* ============================================ */}
      {/* NEWSLETTER SUCCESS POPUP */}
      {/* ============================================ */}
      {showNewsletterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNewsletterPopup(false)}
          ></div>
          <div className="relative bg-[#0D0D0D] rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-bounce-in border border-primary/20">
            <button
              onClick={() => setShowNewsletterPopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Close popup"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/30 text-primary mb-4">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              Successfully Subscribed!
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              You've successfully subscribed to the GYGI NGO Newsletter. Get
              ready for amazing updates!
            </p>
            <button
              onClick={() => setShowNewsletterPopup(false)}
              className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              Awesome!
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* GET INVOLVED MODAL */}
      {/* ============================================ */}
      {modalOpen && modalInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeGetInvolvedModal}
          ></div>
          <div className="relative bg-[#0D0D0D] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-bounce-in border border-primary/20">
            <button
              onClick={closeGetInvolvedModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/30 text-primary mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                {modalInterest} Inquiry
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Provide your details and we'll get back to you.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={`w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-white placeholder:text-gray-500 text-sm ${
                      formErrors.name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 focus:border-primary focus:ring-primary/20"
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={`w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-white placeholder:text-gray-500 text-sm ${
                      formErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-white/10 focus:border-primary focus:ring-primary/20"
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>
              <button
                onClick={handleModalSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : "Send Inquiry"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BOUNCE ANIMATION */}
      {/* ============================================ */}
      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.7);
          }
          50% {
            opacity: 1;
            transform: translateY(-15px) scale(1.05);
          }
          70% {
            transform: translateY(5px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
