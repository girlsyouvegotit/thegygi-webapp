import { useState, useEffect } from "react";
import {
  Briefcase,
  Cpu,
  Wrench,
  Droplet,
  ArrowRight,
  Users,
} from "lucide-react";

interface ImpactMetric {
  id: string;
  icon: React.ElementType;
  value: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const impactMetrics: ImpactMetric[] = [
  {
    id: "girls-educated",
    icon: Users,
    value: "10,000+",
    label: "Girls Educated",
    description:
      "Across Africa, we've reached thousands of girls with quality education",
    color: "#EC4899",
    bgColor: "#FCE7F3",
  },
  {
    id: "career-programs",
    icon: Briefcase,
    value: "300+",
    label: "Career Programs",
    description:
      "Comprehensive career literacy programs guiding girls toward fulfilling paths",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
  },
  {
    id: "tech-graduates",
    icon: Cpu,
    value: "500+",
    label: "Tech Graduates",
    description:
      "Coding, AI, and digital skills training producing industry-ready graduates",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  {
    id: "vocational-skills",
    icon: Wrench,
    value: "150+",
    label: "Vocational Skills",
    description:
      "Practical skills training for economic independence and entrepreneurship",
    color: "#F97316",
    bgColor: "#FFEDD5",
  },
  {
    id: "pad-a-girl",
    icon: Droplet,
    value: "1,300+",
    label: "Pad-A-Girl",
    description:
      "Menstrual hygiene management and dignity support for young girls",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
];

const Impact = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    const section = document.getElementById("impact");
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="impact"
      className="py-24 bg-background overflow-hidden relative"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary opacity-[0.02] blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/4 h-full bg-primary opacity-[0.02] blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
            Our Impact
            <span className="w-8 h-0.5 bg-primary rounded-full"></span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-[1.02] tracking-[-0.03em]">
            Making a{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">
                Real Difference
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-[0.3em] bg-primary/20 rounded-sm"></span>
            </span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mt-4">
            Our programs are transforming lives across Africa through education,
            mentorship, and community support.
          </p>
        </div>

        {/* Impact Metrics Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {impactMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const isActive = index === activeMetric;

            return (
              <div
                key={metric.id}
                onClick={() => setActiveMetric(index)}
                className={`group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-card shadow-xl shadow-primary/10 border-2 border-primary/30"
                    : "bg-card/50 hover:bg-card hover:shadow-lg border border-border"
                }`}
              >
                {/* Background accent */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: metric.color }}
                />

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative z-10"
                  style={{ background: metric.bgColor }}
                >
                  <Icon className="w-7 h-7" style={{ color: metric.color }} />
                </div>

                {/* Value */}
                <div className="relative z-10">
                  <p className="text-3xl font-black text-foreground">
                    {metric.value}
                  </p>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={{ color: metric.color }}
                  >
                    {metric.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {metric.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <ArrowRight
                  className={`absolute bottom-4 right-4 w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ color: metric.color }}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-card rounded-2xl border border-border">
          <div className="text-center">
            <p className="text-2xl font-black text-primary">14</p>
            <p className="text-xs text-muted-foreground mt-1">
              Countries Reached
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-primary">50K+</p>
            <p className="text-xs text-muted-foreground mt-1">
              Students we aim to reach soon
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-primary">200+</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mentors & Tutors
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-primary">95%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Completion Rate
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Impact;
