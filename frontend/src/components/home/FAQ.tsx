import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  GraduationCap,
  Users,
  Globe,
  Zap,
  Briefcase,
  Check,
  ArrowRight,
  X,
  MessageCircle,
  Award,
  Rocket,
  BookOpen,
} from "lucide-react";
import GygiAssistantModal from "@/components/home/GygiAssistantModal";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: React.ElementType;
  tag: string;
  accent: string;
  cardBg: string;
}

const faqItems: FAQItem[] = [
  {
    id: 1,
    question: "How do I join GYGI's programs?",
    answer:
      "Create your account, select your learning category, and get automatically enrolled with a mentor.",
    icon: GraduationCap,
    tag: "Get Started",
    accent: "#8B5CF6",
    cardBg: "#D8B4FE",
  },
  {
    id: 2,
    question: "Are the programs really free?",
    answer:
      "Yes! All GYGI programs are 100% free, funded through donations and partnerships.",
    icon: Heart,
    tag: "Free Access",
    accent: "#EC4899",
    cardBg: "#BEF264",
  },
  {
    id: 3,
    question: "How do live classes work?",
    answer:
      "Join real-time classes with tutors, interact, ask questions, and access recordings anytime.",
    icon: Zap,
    tag: "Live Learning",
    accent: "#F97316",
    cardBg: "#BAE6FD",
  },
  {
    id: 4,
    question: "Will I get a mentor?",
    answer:
      "Every student gets a mentor for personalized guidance, goal setting, and project reviews.",
    icon: Users,
    tag: "Mentorship",
    accent: "#3B82F6",
    cardBg: "#C4B5FD",
  },
  {
    id: 5,
    question: "What programs do you offer?",
    answer:
      "Web Dev, UI/UX, Data Science, AI Prompting, Cybersecurity, and Vocational Skills.",
    icon: Briefcase,
    tag: "Programs",
    accent: "#10B981",
    cardBg: "#FBCFE8",
  },
  {
    id: 6,
    question: "How do I connect with other students?",
    answer:
      "Every category has a community for chatting, sharing resources, and collaborating.",
    icon: Globe,
    tag: "Community",
    accent: "#F59E0B",
    cardBg: "#BFDBFE",
  },
  {
    id: 7,
    question: "Can I access materials after class?",
    answer:
      "Yes! Recordings, transcripts, and AI summaries are available in your dashboard.",
    icon: BookOpen,
    tag: "Resources",
    accent: "#14B8A6",
    cardBg: "#FDE68A",
  },
  {
    id: 8,
    question: "How do I track my progress?",
    answer:
      "Your dashboard shows attendance, quiz scores, assignments, and mentorship goals.",
    icon: Check,
    tag: "Progress",
    accent: "#6366F1",
    cardBg: "#DDD6FE",
  },
  {
    id: 9,
    question: "Will there be certifications after the course?",
    answer:
      "Yes! Upon completing any program, you'll receive a GYGI certificate of completion.",
    icon: Award,
    tag: "Certification",
    accent: "#F97316",
    cardBg: "#FED7AA",
  },
  {
    id: 10,
    question: "What happens after I complete a program?",
    answer:
      "After completion, you'll have access to our alumni community, job placement support, and continued mentorship.",
    icon: Rocket,
    tag: "After Graduation",
    accent: "#0EA5E9",
    cardBg: "#BAE6FD",
  },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [showGraduationModal, setShowGraduationModal] = useState(false);

  const totalSlides = faqItems.length;

  const goToSlide = useCallback(
    (index: number) => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex(((index % totalSlides) + totalSlides) % totalSlides);
        setIsAnimating(false);
      }, 350);
    },
    [totalSlides],
  );

  const handleNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const handlePrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const current = faqItems[activeIndex];
  const prevCard1 = faqItems[(activeIndex - 1 + totalSlides) % totalSlides];
  const prevCard2 = faqItems[(activeIndex - 2 + totalSlides) % totalSlides];
  const prevCard3 = faqItems[(activeIndex - 3 + totalSlides) % totalSlides];

  const openActiveCardAction = () => {
    if (current.id === 9) {
      setShowCertificationModal(true);
      return;
    }
    if (current.id === 10) {
      setShowGraduationModal(true);
      return;
    }
    handleNext();
  };

  const stackCards = [
    {
      item: prevCard3,
      index: (activeIndex - 3 + totalSlides) % totalSlides,
      className:
        "z-0 translate-x-16 sm:translate-x-20 -translate-y-10 sm:-translate-y-12 rotate-6",
      opacity: isAnimating ? 0.3 : 0.5,
      size: "w-[190px] sm:w-[230px] h-[300px] sm:h-[360px]",
    },
    {
      item: prevCard2,
      index: (activeIndex - 2 + totalSlides) % totalSlides,
      className:
        "z-10 translate-x-10 sm:translate-x-12 -translate-y-6 sm:-translate-y-8 rotate-3",
      opacity: isAnimating ? 0.4 : 0.65,
      size: "w-[190px] sm:w-[230px] h-[300px] sm:h-[360px]",
    },
    {
      item: prevCard1,
      index: (activeIndex - 1 + totalSlides) % totalSlides,
      className:
        "z-20 translate-x-4 sm:translate-x-4 -translate-y-2 sm:-translate-y-3 rotate-1",
      opacity: isAnimating ? 0.5 : 0.8,
      size: "w-[190px] sm:w-[230px] h-[300px] sm:h-[360px]",
    },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-transparent py-20 sm:py-24 lg:py-28">
      {/* GYGI Dot Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #c147e9 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* HEADER */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mb-10 sm:mb-14">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:items-start">
          <div className="text-center md:text-left max-w-xs text-sm text-gray-600 leading-relaxed">
            With real-time mentorship and personalized learning paths, grow
            confidently knowing every detail is taken care of.
          </div>
          <div className="text-center flex-1 w-full">
            <span className="inline-flex items-center justify-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
              <span className="w-8 h-0.5 bg-primary rounded-full"></span>
              FAQ
              <span className="w-8 h-0.5 bg-primary rounded-full"></span>
            </span>
            <h2 className="text-2xl font-black leading-[1.02] tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
              Questions That Help
            </h2>
          </div>
          <div className="text-center md:text-right max-w-xs text-sm text-gray-600 leading-relaxed">
            Explore new horizons with GYGI: free programs, personalized
            mentorship, and unforgettable learning adventures.
          </div>
        </div>
      </div>

      {/* CENTRAL SHOWCASE STAGE */}
      <div className="relative z-10 mx-auto flex h-[520px] w-full max-w-3xl items-center justify-center px-4 sm:h-[560px]">
        <div className="absolute left-2 sm:left-8 top-1/4 text-sm font-medium text-gray-400 uppercase tracking-wider hidden sm:block">
          discover
        </div>
        <div className="absolute left-10 sm:left-20 bottom-14 text-sm font-medium text-gray-400 uppercase tracking-wider hidden sm:block">
          learn
        </div>
        <div className="absolute right-2 sm:right-8 top-1/4 text-sm font-medium text-gray-400 uppercase tracking-wider hidden sm:block">
          grow
        </div>
        <div className="absolute right-10 sm:right-20 bottom-14 text-sm font-medium text-gray-400 uppercase tracking-wider hidden sm:block">
          repeat
        </div>

        <div className="relative flex h-[440px] w-[340px] items-center justify-center rounded-[36px] bg-[#F4F4F5] shadow-inner sm:h-[480px] sm:w-[560px]">
          {stackCards.map(({ item, index, className, opacity, size }) => (
            <div
              key={`${item.id}-${index}`}
              className={`faq-pastel-card absolute ${size} ${className} flex transform flex-col justify-between rounded-[24px] p-4 shadow-lg transition-all duration-500 sm:p-5`}
              style={{ background: item.cardBg, opacity }}
            >
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
                <span className="mb-2 block text-[11px] font-bold tracking-wider text-gray-700 uppercase sm:text-xs">
                  {item.tag}
                </span>
                <h3 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-[15px]">
                  {item.answer}
                </p>
              </div>
              <div className="mt-3 flex shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => goToSlide(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111827] text-white transition hover:scale-110 active:scale-95"
                  aria-label={`Open question: ${item.question}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Active card */}
          <div
            className={`faq-pastel-card absolute z-30 flex h-[330px] w-[220px] -translate-x-6 translate-y-2 -rotate-2 transform flex-col justify-between rounded-[24px] border border-white/40 p-4 shadow-xl transition-all duration-500 sm:h-[390px] sm:w-[260px] sm:-translate-x-8 sm:translate-y-3 sm:p-5 ${
              isAnimating ? "scale-90 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{ background: current.cardBg }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
              <span className="mb-2 block text-xs font-bold tracking-wider text-gray-700 uppercase sm:text-sm">
                {current.tag}
              </span>
              <h3 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
                {current.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:mt-3 sm:text-base">
                {current.answer}
              </p>
              {(current.id === 9 || current.id === 10) && (
                <p className="mt-2 text-xs font-semibold text-gray-600 sm:text-sm">
                  Tap the arrow for full details.
                </p>
              )}
            </div>
            <div className="mt-3 flex shrink-0 items-center justify-between">
              <span className="text-lg font-black text-gray-900 sm:text-xl">
                {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={openActiveCardAction}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white transition hover:scale-110 active:scale-95 sm:h-10 sm:w-10"
                aria-label={
                  current.id === 9
                    ? "Open certification details"
                    : current.id === 10
                      ? "Open graduation details"
                      : "Next question"
                }
              >
                {current.id === 9 ? (
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : current.id === 10 ? (
                  <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="relative z-10 flex items-center justify-center gap-4 mt-6">
        <button
          onClick={handlePrev}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:border-primary hover:text-primary hover:scale-110 active:scale-90 transition-all duration-300"
          aria-label="Previous question"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {faqItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === activeIndex ? "28px" : "7px",
                height: "7px",
                background: idx === activeIndex ? current.accent : "#D1D5DB",
              }}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#111827] flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all duration-300"
          aria-label="Next question"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* CTA BUTTON */}
      <div className="relative z-10 text-center mt-10">
        <button
          onClick={() => setShowChatModal(true)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/25"
        >
          <MessageCircle className="w-5 h-5" />
          Use Chat Bot
        </button>
      </div>

      {/* CERTIFICATION MODAL */}
      {showCertificationModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCertificationModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl animate-bounce-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCertificationModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg">
                  Certifications
                </h3>
                <p className="text-white/80 text-xs">
                  GYGI Certification Program
                </p>
              </div>
            </div>

            <div className="p-6">
              <h4 className="mb-3 text-lg font-bold text-foreground">
                Will there be certifications after the course?
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Yes! Upon completing any program, you'll receive a GYGI
                certificate of completion. For select programs, we also offer
                globally recognized certifications.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  "GYGI Certificate of Completion",
                  "Globally Recognized Certifications",
                  "Portfolio-Ready Credentials",
                ].map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  >
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowCertificationModal(false)}
                className="w-full py-3.5 rounded-full bg-[#F97316] text-white font-bold text-sm hover:bg-[#EA580C] transition-all duration-300"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRADUATION MODAL */}
      {showGraduationModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowGraduationModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl animate-bounce-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGraduationModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg">
                  After Graduation
                </h3>
                <p className="text-white/80 text-xs">Your Journey Continues</p>
              </div>
            </div>

            <div className="p-6">
              <h4 className="mb-3 text-lg font-bold text-foreground">
                What happens after I complete a program?
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                After completion, you'll have access to our alumni community,
                job placement support, and continued mentorship.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: Users, text: "Alumni Community Access" },
                  { icon: Briefcase, text: "Job Placement Support" },
                  { icon: Check, text: "Portfolio Reviews" },
                  { icon: Users, text: "Continued Mentorship" },
                ].map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                    >
                      <Icon className="w-5 h-5 text-sky-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {benefit.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              <a
                href="/after-graduation"
                className="block w-full rounded-full bg-[#0EA5E9] py-3.5 text-center text-sm font-bold text-white transition-all duration-300 hover:bg-[#0284C7]"
              >
                Explore After Graduation
              </a>
              <button
                type="button"
                onClick={() => setShowGraduationModal(false)}
                className="mt-2 w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <GygiAssistantModal
        open={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      {/* Bounce Animation */}
      <style>{`
        @keyframes bounce-in {
          0% { opacity: 0; transform: translateY(60px) scale(0.7); }
          50% { opacity: 1; transform: translateY(-15px) scale(1.05); }
          70% { transform: translateY(5px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </section>
  );
};

export default FAQ;
