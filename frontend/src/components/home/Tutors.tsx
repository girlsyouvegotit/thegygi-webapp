import { useState, useEffect, useCallback } from "react";
import {
  Headphones,
  ArrowUpRight,
  X,
  Mail,
  Phone,
  Send,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";

interface Facilitator {
  name: string;
  role: string;
  image: string;
  bio: string;
  expertise: string[];
  rating: number;
  reviews: number;
  accentColor: string;
}

const Tutors = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeFacilitator, setActiveFacilitator] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const facilitators: Facilitator[] = [
    {
      name: "Deborah Funmilayo",
      role: "Data Analysis Expert",
      image: "/frontend.jpg",
      bio: "User experience specialist and frontend engineering genius with a passion for teaching and mentoring aspiring developers across Africa.",
      expertise: ["Data Analysis", "Frontend", "UX Design"],
      rating: 4.9,
      reviews: 124,
      accentColor: "#c147e9",
    },
    {
      name: "Kofoworola Adetona",
      role: "UI/UX Design Lead",
      image: "/Kofo.jpg",
      bio: "Experienced in core design principles and visualization, helping students create beautiful and functional interfaces that users love.",
      expertise: ["UI Design", "UX Research", "Prototyping"],
      rating: 4.8,
      reviews: 98,
      accentColor: "#8B5CF6",
    },
    {
      name: "Tirenioluwa Adeyinka",
      role: "AI Prompt Engineering",
      image: "/tire.jpg",
      bio: "AI integration expert, building intelligent agents and LLM workflows that push the boundaries of what's possible with technology.",
      expertise: ["AI Engineering", "LLMs", "Automation"],
      rating: 4.9,
      reviews: 156,
      accentColor: "#A855F7",
    },
    {
      name: "Joy Sesi Ashidi",
      role: "Cybersecurity Specialist",
      image: "/joy.jpg",
      bio: "Prior experience in cybersecurity, ethical hacking, and digital safety education for the next generation of tech leaders.",
      expertise: ["Security", "Ethical Hacking", "Digital Safety"],
      rating: 4.7,
      reviews: 87,
      accentColor: "#7C3AED",
    },
    {
      name: "Daniel Nwadinkpa",
      role: "Full-Stack Developer",
      image: "/daniel.jpg",
      bio: "Full-stack developer with a passion for teaching and mentoring aspiring developers to build real-world applications.",
      expertise: ["React", "Node.js", "Databases"],
      rating: 4.7,
      reviews: 87,
      accentColor: "#6D28D9",
    },
  ];

  // Define handlers FIRST with useCallback
  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setIsAnimating(true);
    setTimeout(() => {
      setActiveFacilitator((prev) => (prev + 1) % facilitators.length);
      setIsAnimating(false);
    }, 300);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  }, [facilitators.length]);

  const handlePrev = useCallback(() => {
    setIsAutoPlaying(false);
    setIsAnimating(true);
    setTimeout(() => {
      setActiveFacilitator(
        (prev) => (prev - 1 + facilitators.length) % facilitators.length,
      );
      setIsAnimating(false);
    }, 300);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  }, [facilitators.length]);

  // Auto-rotate
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, handleNext]);

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) handleNext();
    if (touchStart - touchEnd < -75) handlePrev();
  };

  const current = facilitators[activeFacilitator];

  return (
    <section
      id="tutors"
      className="relative overflow-hidden bg-transparent py-16 sm:py-20 lg:py-28"
    >
      {/* Subtle background */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #c147e9 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[50vh] rounded-full blur-[150px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${current.accentColor}08 0%, transparent 70%)`,
          transition: "background 0.5s ease",
        }}
      />

      {/* Section Header */}
      <div className="relative z-10 text-center mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
          <span className="w-8 h-0.5 bg-primary rounded-full"></span>
          Meet the Facilitators
          <span className="w-8 h-0.5 bg-primary rounded-full"></span>
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-[1.02] tracking-[-0.03em]">
          Experienced People,
          <br />
          <span className="text-primary">Quality Results</span>
        </h1>
      </div>

      {/* Split Layout */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Image Side */}
          <div className="md:col-span-6 relative">
            <div
              className={`relative rounded-[32px] overflow-hidden border-2 border-white/20 transition-all duration-500 ${
                isAnimating
                  ? "opacity-0 translate-x-[-20px]"
                  : "opacity-100 translate-x-0"
              }`}
              style={{ boxShadow: `0 25px 60px ${current.accentColor}25` }}
            >
              <img
                src={current.image}
                alt={current.name}
                className="w-full h-[350px] sm:h-[400px] lg:h-[480px] object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x800?text=Facilitator";
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5"
                style={{
                  background: `linear-gradient(to right, ${current.accentColor}, transparent)`,
                }}
              ></div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full bg-white shadow-lg shadow-primary/20 border-2 border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 active:scale-90 transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full bg-white shadow-lg shadow-primary/20 border-2 border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 active:scale-90 transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex gap-1.5 flex-1 justify-center">
                {facilitators.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setActiveFacilitator(index);
                      setTimeout(() => setIsAutoPlaying(true), 8000);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeFacilitator
                        ? "w-8 bg-primary"
                        : "w-2 bg-primary/25 hover:bg-primary/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Details Side */}
          <div className="md:col-span-6">
            <div
              key={activeFacilitator}
              className={`bg-white rounded-[32px] border border-border p-6 sm:p-8 lg:p-10 transition-all duration-500 ${
                isAnimating
                  ? "opacity-0 translate-x-[20px]"
                  : "opacity-100 translate-x-0"
              }`}
              style={{ boxShadow: `0 25px 60px ${current.accentColor}15` }}
            >
              <Quote className="w-10 h-10 opacity-10 mb-4" />
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight mb-1"
                style={{ color: current.accentColor }}
              >
                {current.name}
              </h2>
              <p className="text-base sm:text-lg italic text-muted-foreground mb-4">
                {current.role}
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                {current.bio}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {current.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 rounded-full border border-primary/20 text-primary text-xs font-semibold bg-primary/[0.05] hover:bg-primary/10 transition-colors duration-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(current.rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-black text-foreground">
                  {current.rating}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({current.reviews} reviews)
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleNext}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/25"
                >
                  More
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
                >
                  <Headphones className="w-4 h-4" />
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex justify-center gap-3 mt-8">
          {facilitators.map((facilitator, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setActiveFacilitator(index);
                setTimeout(() => setIsAutoPlaying(true), 8000);
              }}
              className={`relative rounded-full overflow-hidden transition-all duration-300 ${
                index === activeFacilitator
                  ? "w-14 h-14 border-[3px] border-primary shadow-lg shadow-primary/30 scale-110"
                  : "w-10 h-10 border-2 border-white opacity-50 hover:opacity-100 hover:scale-105 shadow-md"
              }`}
            >
              <img
                src={facilitator.image}
                alt={facilitator.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/50x50?text=F";
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setContactModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-foreground">
                  Contact Us
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  We'd love to hear from you
                </p>
              </div>
              <div className="space-y-3">
                <a
                  href="mailto:girlsyougotit25@gmail.com"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-primary/5 transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    girlsyougotit25@gmail.com
                  </span>
                </a>
                <a
                  href="tel:+2349064950175"
                  className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-primary/5 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    +234 906 495 0175
                  </span>
                </a>
                <a
                  href={`mailto:girlsyougotit25@gmail.com?subject=Contact Inquiry`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send an Inquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Tutors;
