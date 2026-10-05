import { useState, useRef, useCallback } from "react";
import {
  Code2,
  Layout,
  Database,
  Wrench,
  ShieldCheck,
  Bot,
  X,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Award,
} from "lucide-react";

interface Program {
  id: number;
  title: string;
  icon: React.ElementType;
  desc: string;
  tags: string[];
  detailedDesc: string;
  youtubeUrl: string;
  image: string;
  students: string;
  duration: string;
  level: string;
  accent: string;
}

const programs: Program[] = [
  {
    id: 1,
    title: "Web Development",
    icon: Code2,
    desc: "Build modern, scalable web applications using the latest frameworks and technologies.",
    tags: ["React", "Node.js", "Cloud"],
    detailedDesc:
      "Our Web Development program equips students with both frontend and backend skills. You'll learn HTML, CSS, JavaScript, React for interactive UIs, and Node.js with Express for server-side logic.",
    youtubeUrl: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
    image: "/tech1.jpg",
    students: "2,500+",
    duration: "12 weeks",
    level: "Beginner Friendly",
    accent: "#3B82F6",
  },
  {
    id: 2,
    title: "UI/UX Design",
    icon: Layout,
    desc: "Create intuitive, user-centered digital experiences from research to high-fidelity prototypes.",
    tags: ["Figma", "Usability", "Prototyping"],
    detailedDesc:
      "This course covers the entire design process: user research, wireframing, prototyping, visual design, and usability testing.",
    youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
    image: "/Kofo.jpg",
    students: "1,800+",
    duration: "10 weeks",
    level: "All Levels",
    accent: "#EC4899",
  },
  {
    id: 3,
    title: "Data Science",
    icon: Database,
    desc: "Extract insights and build predictive models using Python, SQL, and machine learning.",
    tags: ["Python", "ML", "Big Data"],
    detailedDesc:
      "Our Data Science track teaches you to collect, clean, analyze, and visualize data using Python, SQL, and machine learning.",
    youtubeUrl: "https://www.youtube.com/watch?v=ua-CiDNNj30",
    image: "/frontend.jpg",
    students: "2,200+",
    duration: "14 weeks",
    level: "Intermediate",
    accent: "#10B981",
  },
  {
    id: 4,
    title: "Vocational Skills",
    icon: Wrench,
    desc: "Hands-on training in practical trades like shoemaking, resin art, and crafts.",
    tags: ["Resin Art", "Crafts"],
    detailedDesc:
      "This program focuses on entrepreneurial and artisanal skills including shoemaking, resin art, beadwork, and tailoring.",
    youtubeUrl: "",
    image: "/skillUp.jpg",
    students: "950+",
    duration: "8 weeks",
    level: "All Levels",
    accent: "#F97316",
  },
  {
    id: 5,
    title: "Cyber Security",
    icon: ShieldCheck,
    desc: "Protect systems and networks with ethical hacking, threat analysis, and defense strategies.",
    tags: ["Ethical Hacking", "Cryptography", "Risk"],
    detailedDesc:
      "Learn to defend against cyber threats including network security, encryption, penetration testing, and incident response.",
    youtubeUrl: "https://www.youtube.com/watch?v=z5nj9UF2SrM",
    image: "/joy.jpg",
    students: "1,500+",
    duration: "12 weeks",
    level: "Intermediate",
    accent: "#8B5CF6",
  },
  {
    id: 6,
    title: "AI Prompting",
    icon: Bot,
    desc: "Leverage AI to automate workflows, build intelligent agents, and integrate LLMs.",
    tags: ["RPA", "LLMs", "Agents"],
    detailedDesc:
      "This cutting-edge program covers RPA, building AI agents, and integrating large language models into applications.",
    youtubeUrl: "https://www.youtube.com/watch?v=hfIUstzHs9A",
    image: "/tire.jpg",
    students: "3,000+",
    duration: "8 weeks",
    level: "Beginner Friendly",
    accent: "#F59E0B",
  },
];

const Programs = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const cardWidth = 240;
  const totalSlides = programs.length;

  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollRef.current) {
        const clampedIndex = Math.max(0, Math.min(index, totalSlides - 1));
        const scrollPosition = clampedIndex * cardWidth - cardWidth;
        scrollRef.current.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
        setActiveIndex(clampedIndex);
      }
    },
    [totalSlides],
  );

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const index = Math.round((scrollLeft + cardWidth) / cardWidth);
      const clampedIndex = Math.max(0, Math.min(index, totalSlides - 1));
      setActiveIndex(clampedIndex);
    }
  };

  const current = programs[activeIndex];

  return (
    <section
      id="programs"
      className="relative overflow-hidden bg-transparent py-20 sm:py-24 lg:py-28"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #c147e9 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] rounded-full blur-[120px] pointer-events-none transition-all duration-700"
        style={{ background: `${current.accent}08` }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
            Active Programs
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
          </span>
          <h2 className="text-3xl font-black leading-[1.02] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
            Explore Our{" "}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: current.accent }}>
                Courses
              </span>
              <span
                className="absolute bottom-1 left-0 right-0 h-[0.3em] rounded-sm -z-0"
                style={{ background: `${current.accent}20` }}
              ></span>
            </span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mt-4">
            Our curriculum is designed in partnership with industry giants to
            ensure our graduates are day-one ready.
          </p>
        </div>

        {/* 3D COVERFLOW CAROUSEL */}
        <div className="relative flex items-center justify-center">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-0 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg shadow-gray-300 border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-90 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scroll Track */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex items-center gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-12 px-10 w-full max-w-4xl no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {programs.map((program, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={program.id}
                  onClick={() => {
                    setActiveIndex(idx);
                    setSelectedProgram(program);
                  }}
                  className={`flex-shrink-0 snap-center transition-all duration-500 ease-out rounded-2xl overflow-hidden relative cursor-pointer ${
                    isActive
                      ? "w-[230px] h-[330px] scale-100 z-20 shadow-2xl"
                      : "w-[200px] h-[290px] scale-90 z-10 opacity-60"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 20px 40px ${program.accent}25`
                      : "0 5px 15px rgba(0,0,0,0.08)",
                    border: isActive
                      ? `2px solid ${program.accent}40`
                      : "2px solid transparent",
                  }}
                >
                  {/* Background Image */}
                  <img
                    src={program.image || "/gygishot.jpg"}
                    alt={program.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x500?text=Program";
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

                  {/* Accent tint */}
                  <div
                    className="absolute inset-0"
                    style={{ background: `${program.accent}10` }}
                  ></div>

                  {/* Card Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: `${program.accent}cc` }}
                      >
                        <program.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold">{program.title}</span>
                    </div>
                    {isActive && (
                      <>
                        <p className="text-[10px] text-gray-300 line-clamp-2 mb-2">
                          {program.desc}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {program.students}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {program.duration}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-[9px] font-bold"
                      style={{ background: program.accent }}
                    >
                      Active
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-0 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg shadow-gray-300 border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-90 transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* DYNAMIC CAPTION */}
        <div className="text-center max-w-md mx-auto mt-4 text-xs text-gray-600 leading-relaxed px-4 min-h-[40px]">
          {current.desc}
        </div>

        {/* PAGINATION DOTS */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {programs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === activeIndex ? "28px" : "7px",
                height: "7px",
                background: idx === activeIndex ? current.accent : "#D1D5DB",
              }}
            />
          ))}
        </div>
      </div>

      {/* PROGRAM DETAIL MODAL */}
      {selectedProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProgram(null)}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedProgram(null)}
          ></div>
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProgram(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-48 overflow-hidden">
              <img
                src={selectedProgram.image || "/gygishot.jpg"}
                alt={selectedProgram.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x300?text=Program";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-5 flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: selectedProgram.accent }}
                >
                  <selectedProgram.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {selectedProgram.title}
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="flex flex-wrap gap-4 mb-5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Users
                    className="w-3.5 h-3.5"
                    style={{ color: selectedProgram.accent }}
                  />
                  {selectedProgram.students} students
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Clock
                    className="w-3.5 h-3.5"
                    style={{ color: selectedProgram.accent }}
                  />
                  {selectedProgram.duration}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Award
                    className="w-3.5 h-3.5"
                    style={{ color: selectedProgram.accent }}
                  />
                  {selectedProgram.level}
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {selectedProgram.detailedDesc}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedProgram.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${selectedProgram.accent}15`,
                      color: selectedProgram.accent,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {selectedProgram.youtubeUrl && (
                <a
                  href={selectedProgram.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors duration-300"
                >
                  <Youtube className="w-4.5 h-4.5" />
                  Watch on YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      )}

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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default Programs;
