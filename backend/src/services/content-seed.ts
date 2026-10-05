import type { AboutSections } from "../models/about-page.model.js";

export const defaultAboutSections = (): AboutSections => ({
  hero: {
    headline: "Education without limits across Africa",
    subheadline:
      "Girls You Got It (GYGI) is a free education movement unlocking skills, confidence, and opportunity for girls and young women.",
    ctaLabel: "Join GYGI free",
    ctaHref: "/register",
  },
  story: {
    title: "Our story",
    body: "GYGI began with a simple conviction: every girl deserves access to excellent education — not someday, not for a fee, but now. What started as community workshops grew into a live learning platform spanning classrooms, mentorship, and digital skills across Africa.\n\nToday, GYGI runs free live classes, mentorship, vocational training, and dignity programs that keep girls learning without interruption. We measure success not by tuition collected, but by futures opened.",
    milestones: [
      {
        year: "Founding",
        title: "A community promise",
        description:
          "GYGI launched to put free, high-quality learning in the hands of girls who were being left behind.",
      },
      {
        year: "Growth",
        title: "Live classrooms online",
        description:
          "Tutors and mentors scaled live sessions so learners could join from anywhere with a connection.",
      },
      {
        year: "Today",
        title: "14 countries & counting",
        description:
          "Programs now reach learners across Africa with tech, career literacy, health education, and vocational skills.",
      },
    ],
  },
  mission: {
    mission:
      "To deliver free, excellent education that empowers girls with skills, dignity, and pathways to economic independence.",
    vision:
      "An Africa where every girl can learn without limits — and lead with confidence.",
    values: [
      {
        title: "Access first",
        description: "Quality learning stays free so cost never blocks potential.",
      },
      {
        title: "Excellence",
        description: "Live teaching, mentorship, and curricula held to a high bar.",
      },
      {
        title: "Dignity",
        description: "Programs like Pad-A-Girl protect the right to keep learning.",
      },
      {
        title: "Community",
        description: "Students, tutors, and mentors grow together across borders.",
      },
    ],
  },
  whatWeDo: {
    title: "What we do",
    body: "GYGI blends live instruction, mentorship, and practical programs so learning sticks — in the classroom and in life.",
    items: [
      {
        title: "Live tech & career classes",
        description:
          "Coding, AI, UI/UX, data, and career literacy taught live by practitioners.",
      },
      {
        title: "Mentorship",
        description:
          "1:1 and group mentoring that guides goals, confidence, and next steps.",
      },
      {
        title: "Vocational skills",
        description:
          "Hands-on training that opens doors to income and independence.",
      },
      {
        title: "Health & dignity",
        description:
          "Abstinence education and Pad-A-Girl support so learning never pauses.",
      },
    ],
  },
  impact: {
    title: "Impact that compounds",
    body: "Our metrics track reach, readiness, and resilience — proof that free education can still be excellent.",
    stats: [
      { label: "Girls reached (health ed.)", value: "10,000+" },
      { label: "Future-ready tech learners", value: "500+" },
      { label: "Career pathways guided", value: "300+" },
      { label: "Countries reached", value: "14" },
    ],
  },
  whoWeServe: {
    title: "Who we serve",
    body: "We serve girls and young women hungry for skills — from secondary students discovering tech for the first time, to aspiring founders sharpening career literacy. Families, mentors, and community partners walk with them. If you believe education should be free and excellent, you belong here too.",
  },
  team: {
    title: "Leadership & educators",
    members: [
      {
        name: "Teniade",
        role: "CEO",
        bio: "Leads GYGI’s vision for free, excellent education and steers program quality across the platform.",
        image: "/CEO.jpg",
      },
      {
        name: "Joy",
        role: "Mentorship",
        bio: "Builds mentor-mentee relationships that turn goals into momentum.",
        image: "/joy.jpg",
      },
      {
        name: "Daniel",
        role: "Tech instruction",
        bio: "Teaches practical web and digital skills for the future of work.",
        image: "/daniel.jpg",
      },
    ],
  },
  partners: {
    title: "Strategic partners",
    names: ["Internet Society", "IDEAT Africa", "Project Wandel"],
  },
  getInvolved: {
    title: "Get involved",
    body: "Learn free. Mentor a student. Support a classroom. Partner with GYGI. Every action expands access.",
    ctas: [
      { label: "Join as a student", href: "/register" },
      { label: "Explore programs", href: "/#programs" },
      { label: "Make an impact", href: "/#impact" },
    ],
  },
});

export const seedBlogPosts = (authorId: string) => [
  {
    title: "Why free education still demands excellence",
    slug: "why-free-education-still-demands-excellence",
    excerpt:
      "Free should never mean second-rate. Here's how GYGI holds the bar high for every live class.",
    content: `At GYGI, free is a promise of access — not a compromise on quality.

Our tutors prepare live sessions with the same rigor you'd expect from a paid academy: clear outcomes, practical demos, and feedback loops that help girls retain skills.

Excellence shows up in small ways too — punctual starts, accessible recordings, and mentors who follow through. When education is free, trust is the currency. We earn it every class.`,
    coverImage: "/tech1.jpg",
    category: "Education",
    tags: ["excellence", "live learning", "GYGI"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2025-11-12"),
    seoTitle: "Why free education still demands excellence | GYGI",
    seoDescription:
      "How Girls You Got It delivers free live classes without lowering the quality bar.",
  },
  {
    title: "Inside Pad-A-Girl: dignity that keeps learning open",
    slug: "inside-pad-a-girl-dignity-that-keeps-learning-open",
    excerpt:
      "Period poverty shouldn't end a school week. Pad-A-Girl protects attendance and confidence.",
    content: `When a girl misses class because of period poverty, the cost is more than one lesson — it's momentum.

Pad-A-Girl pairs menstrual hygiene support with community education so learners stay present. Dignity is not a side project at GYGI; it is infrastructure for education.

Supporters who fund kits and outreach help us keep classrooms full and futures on track.`,
    coverImage: "/pad1.jpg",
    category: "Impact",
    tags: ["Pad-A-Girl", "dignity", "health"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2025-12-02"),
    seoTitle: "Inside Pad-A-Girl | GYGI",
    seoDescription:
      "How GYGI's Pad-A-Girl program protects dignity and keeps girls learning.",
  },
  {
    title: "From first line of code to career confidence",
    slug: "from-first-line-of-code-to-career-confidence",
    excerpt:
      "Tech training at GYGI is about more than syntax — it's about belonging in the future of work.",
    content: `Many of our learners open a code editor for the first time in a GYGI classroom.

We start with foundations, then layer projects, peer feedback, and mentor check-ins. The goal isn't a certificate alone — it's confidence to speak up in interviews, ship a portfolio piece, and keep learning after class ends.

Coding, AI literacy, and digital skills are doors. Mentorship is the hand that helps girls walk through.`,
    coverImage: "/tech2.jpg",
    category: "Tech",
    tags: ["coding", "AI", "careers"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2026-01-18"),
    seoTitle: "From first line of code to career confidence | GYGI",
    seoDescription:
      "How GYGI tech training builds skills and confidence for African girls.",
  },
  {
    title: "Career literacy: choosing paths with clarity",
    slug: "career-literacy-choosing-paths-with-clarity",
    excerpt:
      "Practical guidance that helps girls map interests to real opportunities.",
    content: `Career literacy at GYGI is practical: strengths inventories, industry overviews, CV clinics, and mentor conversations.

We don't tell girls what to become. We equip them to choose — with information, role models, and safe spaces to ask hard questions.

Guided pathways turn ambition into a plan.`,
    coverImage: "/career1.jpg",
    category: "Careers",
    tags: ["career literacy", "mentorship"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2026-02-09"),
    seoTitle: "Career literacy at GYGI",
    seoDescription:
      "How GYGI helps girls choose career paths with clarity and confidence.",
  },
  {
    title: "What mentorship looks like in a GYGI week",
    slug: "what-mentorship-looks-like-in-a-gygi-week",
    excerpt:
      "Goals, check-ins, and encouragement — the quiet engine behind student progress.",
    content: `A GYGI mentorship week might include a goal review, a practice interview, or simply a message that says: keep going.

Mentors help translate classroom skills into personal momentum. They celebrate wins, normalize setbacks, and keep accountability kind.

If you've ever wanted to multiply impact without teaching a full course, mentorship is one of the highest-leverage ways to serve.`,
    coverImage: "/gygishot.jpg",
    category: "Mentorship",
    tags: ["mentors", "students", "community"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2026-03-01"),
    seoTitle: "What mentorship looks like at GYGI",
    seoDescription:
      "A look inside weekly mentorship that powers student progress at GYGI.",
  },
  {
    title: "Building vocational skills for economic independence",
    slug: "building-vocational-skills-for-economic-independence",
    excerpt:
      "Shoemaking, crafts, and maker skills that open income pathways.",
    content: `Not every future is behind a laptop — and that's by design.

GYGI vocational tracks teach tangible skills that can generate income while learners continue studying. Craftsmanship builds pride; markets build options.

Economic independence and education reinforce each other. We invest in both.`,
    coverImage: "/skillUp.jpg",
    category: "Skills",
    tags: ["vocational", "independence"],
    status: "published" as const,
    author: authorId,
    publishedAt: new Date("2026-03-20"),
    seoTitle: "Vocational skills for independence | GYGI",
    seoDescription:
      "How GYGI vocational training opens doors to economic independence.",
  },
];
