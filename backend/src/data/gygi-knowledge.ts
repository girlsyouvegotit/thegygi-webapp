/**
 * Canonical GYGI knowledge used by the public FAQ chat bot.
 * Keep this factual and product-aligned so answers stay accurate without an LLM.
 */

export type GygiKnowledgeChunk = {
  id: string;
  title: string;
  keywords: string[];
  content: string;
};

export const GYGI_CONTACT = {
  email: "girlsyougotit25@gmail.com",
  phone: "+234 906 495 0175",
  phoneTel: "+2349064950175",
  site: "https://gygingo.vercel.app",
};

/**
 * Speech-to-text often mishears "GYGI" (esp. Nigerian English accents).
 * Normalize those aliases before intent matching / AI prompting.
 */
export const canonicalizeGygiQuestion = (raw: string): string => {
  let text = raw.trim();
  if (!text) return text;

  // Expand the org name first so later passes stay stable.
  text = text.replace(/\bgirls\s+you\s+got\s+it\b/gi, "GYGI");

  // Common voice mishearings → GYGI
  text = text
    .replace(/\bg\.?\s*y\.?\s*g\.?\s*i\.?\b/gi, "GYGI")
    .replace(/\bgee[\s-]?gee\b/gi, "GYGI")
    .replace(/\bgeegee\b/gi, "GYGI")
    .replace(/\bgeegi\b/gi, "GYGI")
    .replace(/\bgigi\b/gi, "GYGI")
    .replace(/\bgiji\b/gi, "GYGI")
    .replace(/\bjiji\b/gi, "GYGI")
    .replace(/\bguy\s*gee\b/gi, "GYGI")
    .replace(/\bg\s*y\s*g\s*i\b/gi, "GYGI")
    .replace(/\bgygy\b/gi, "GYGI")
    .replace(/\bgygee\b/gi, "GYGI");

  return text.replace(/\s+/g, " ").trim();
};

export const GYGI_KNOWLEDGE_CHUNKS: GygiKnowledgeChunk[] = [
  {
    id: "about",
    title: "What is GYGI?",
    keywords: [
      "about gygi",
      "what is gygi",
      "what's gygi",
      "whats gygi",
      "what is this",
      "who is gygi",
      "explain gygi",
      "define gygi",
      "meaning of gygi",
      "gygi",
      "girls you got it",
      "who are you",
      "what do you do",
      "organization",
      "ngo",
      "mission",
      "vision",
      "tell me about",
      "introduce",
    ],
    content:
      "Girls You Got It (GYGI) is a free education movement unlocking skills, confidence, and opportunity for girls and young women across Africa. We deliver live classes, mentorship, vocational training, and dignity programs so learners can grow without tuition barriers. Mission: deliver free, excellent education that empowers girls with skills, dignity, and pathways to economic independence. Vision: an Africa where every girl can learn without limits and lead with confidence.",
  },
  {
    id: "join",
    title: "How to join",
    keywords: [
      "join",
      "register",
      "sign up",
      "signup",
      "enroll",
      "enrol",
      "create account",
      "get started",
      "apply",
      "how do i start",
    ],
    content:
      "To join GYGI, create a free student account on the platform, pick your learning category, and you are enrolled automatically. After signup you get access to live classes, recordings, quizzes, assignments, community chat, and a mentor where available. Start at /register or the Join Now button on the homepage.",
  },
  {
    id: "free",
    title: "Cost and funding",
    keywords: [
      "free",
      "cost",
      "price",
      "fee",
      "tuition",
      "pay",
      "payment",
      "donate",
      "donation",
      "funding",
      "money",
      "expensive",
    ],
    content:
      "All GYGI student programs are 100% free. Quality education should not depend on ability to pay. GYGI is funded through donations and partnerships. Supporters can donate or partner with us via the Get Involved / Make Impact sections, or email girlsyougotit25@gmail.com.",
  },
  {
    id: "programs",
    title: "Programs and categories",
    keywords: [
      "program",
      "course",
      "category",
      "track",
      "curriculum",
      "learn",
      "subject",
      "web",
      "ui/ux",
      "ux",
      "data",
      "ai",
      "cyber",
      "vocational",
      "coding",
      "offer",
    ],
    content:
      "GYGI offers live learning tracks such as Web Development, UI/UX Design, Data Science, AI Prompting, Cybersecurity, and Vocational Skills, plus career literacy and related tech pathways. Exact active categories on the platform may update over time — explore /explore or the Programs section after you register. Programs blend live instruction, practical work, mentorship, and community.",
  },
  {
    id: "live-classes",
    title: "Live classes",
    keywords: [
      "live",
      "class",
      "classes",
      "tutor",
      "teacher",
      "session",
      "schedule",
      "zoom",
      "classroom",
      "real-time",
      "realtime",
    ],
    content:
      "Live classes are taught in real time by GYGI tutors. Join from any device, ask questions, participate in discussions, and follow along with demos. If you miss a session, recordings (with transcripts and AI summaries when available) stay in your student dashboard.",
  },
  {
    id: "recordings",
    title: "Recordings and materials",
    keywords: [
      "recording",
      "recordings",
      "transcript",
      "material",
      "materials",
      "resource",
      "resources",
      "replay",
      "watch later",
      "summary",
      "notes",
    ],
    content:
      "Yes — class recordings, transcripts, study materials, and AI summaries (when processing completes) are available in your dashboard so you can revise anytime after class.",
  },
  {
    id: "mentorship",
    title: "Mentorship",
    keywords: [
      "mentor",
      "mentorship",
      "mentee",
      "guidance",
      "coach",
      "1:1",
      "one on one",
      "goal",
      "goals",
      "portfolio review",
    ],
    content:
      "Every student is supported with mentorship for personalized guidance, goal setting, project and portfolio reviews, and career development. Mentors help you stay accountable and turn learning into momentum through one-on-one or group sessions.",
  },
  {
    id: "community",
    title: "Community",
    keywords: [
      "community",
      "chat",
      "peers",
      "students",
      "connect",
      "network",
      "collaborate",
      "discord",
      "channel",
    ],
    content:
      "Each learning category has a community space where students chat, share resources, ask questions, and collaborate. There are also broader channels (including alumni spaces for graduates) so you are never learning alone.",
  },
  {
    id: "progress",
    title: "Progress tracking",
    keywords: [
      "progress",
      "track",
      "dashboard",
      "attendance",
      "quiz",
      "assignment",
      "score",
      "performance",
      "grade",
    ],
    content:
      "Your student dashboard tracks attendance, quiz scores, assignment submissions, mentorship goals, and overall learning progress so you always know where you stand.",
  },
  {
    id: "certificates",
    title: "Certificates",
    keywords: [
      "certif",
      "certificate",
      "certification",
      "credential",
      "diploma",
      "completion",
    ],
    content:
      "Upon completing a program (based on that category’s completion rules), you can earn a GYGI certificate of completion. Select programs may also support additional recognized credentials. Certificates appear in your student Certificates area once you qualify.",
  },
  {
    id: "after-graduation",
    title: "After graduation",
    keywords: [
      "graduate",
      "graduation",
      "after",
      "complete",
      "completed",
      "alumni",
      "job",
      "jobs",
      "career",
      "placement",
      "hire",
      "after graduation",
      "job placement",
    ],
    content:
      "After you complete a program you can access alumni community features, job-match / placement support, portfolio reviews, and continued mentorship. Explore the After Graduation area in the student app for next steps.",
  },
  {
    id: "who-we-serve",
    title: "Who we serve",
    keywords: [
      "who",
      "eligible",
      "eligibility",
      "girl",
      "women",
      "age",
      "africa",
      "country",
      "countries",
      "serve",
      "audience",
    ],
    content:
      "GYGI serves girls and young women hungry for skills — from secondary students discovering tech for the first time to learners building career literacy and independence. Programs reach learners across Africa (14+ countries and growing). Families, mentors, and partners walk with them.",
  },
  {
    id: "values",
    title: "Values and impact",
    keywords: [
      "value",
      "values",
      "impact",
      "stat",
      "stats",
      "reach",
      "excellence",
      "dignity",
      "access",
    ],
    content:
      "GYGI values Access first, Excellence, Dignity, and Community. Impact highlights include 10,000+ girls reached through health education, 500+ future-ready tech learners, 300+ career pathways guided, and reach across 14 countries — proof that free education can still be excellent.",
  },
  {
    id: "pad-a-girl",
    title: "Pad-A-Girl and dignity",
    keywords: [
      "pad",
      "pad-a-girl",
      "pad a girl",
      "hygiene",
      "menstrual",
      "dignity",
      "health",
      "abstinence",
    ],
    content:
      "GYGI’s dignity and health work includes Pad-A-Girl (menstrual hygiene support paired with community education) and health education so girls can stay present in class. Dignity is treated as infrastructure for education, not a side project.",
  },
  {
    id: "roles",
    title: "Roles on the platform",
    keywords: [
      "tutor",
      "mentor role",
      "teacher",
      "writer",
      "admin",
      "volunteer",
      "staff",
      "become a",
      "teach",
      "instruct",
    ],
    content:
      "The GYGI platform supports students, tutors (live teaching), mentors, writers (journal/content), admins, and super-admins. To volunteer, mentor, donate, or partner, use Get Involved on the site or contact girlsyougotit25@gmail.com / +234 906 495 0175.",
  },
  {
    id: "partners",
    title: "Partners",
    keywords: [
      "partner",
      "partners",
      "sponsorship",
      "sponsor",
      "collaboration",
      "internet society",
      "ideat",
      "wandel",
    ],
    content:
      "GYGI works with strategic partners such as Internet Society, IDEAT Africa, and Project Wandel. Organizations interested in partnership can reach out via Get Involved or email girlsyougotit25@gmail.com.",
  },
  {
    id: "contact",
    title: "Contact",
    keywords: [
      "contact",
      "email",
      "phone",
      "call",
      "whatsapp",
      "support",
      "help",
      "reach",
      "talk to",
      "human",
    ],
    content: `You can reach GYGI at ${GYGI_CONTACT.email} or call ${GYGI_CONTACT.phone}. For account or learning help, also use in-app support channels once signed in.`,
  },
  {
    id: "security-privacy",
    title: "Account safety",
    keywords: [
      "password",
      "login",
      "security",
      "privacy",
      "data",
      "safe",
      "forgot",
      "reset",
    ],
    content:
      "Use the Forgot Password flow on the login page if you cannot sign in. Keep your account credentials private. GYGI uses secure authentication for platform access; contact support if you suspect unauthorized access.",
  },
  {
    id: "switch-category",
    title: "Changing learning category",
    keywords: [
      "switch",
      "change category",
      "change program",
      "another course",
      "transfer",
      "locked",
    ],
    content:
      "Students can request a category change from the learning area when eligible. Changes may be rate-limited or locked for a period so learning stays focused — check Category Switch in your student workspace or ask support if the option is locked.",
  },
];

/** Compact handbook injected into the LLM system prompt. */
export const buildGygiHandbook = (liveCategories: string[] = []): string => {
  const categoryLine =
    liveCategories.length > 0
      ? `Currently active learning categories on the platform: ${liveCategories.join(", ")}.`
      : "Active categories typically include Web Development, UI/UX, Data Science, AI Prompting, Cybersecurity, and Vocational Skills (list may vary).";

  return `
You are the official GYGI (Girls You Got It) assistant on the public website.

ABOUT GYGI:
${GYGI_KNOWLEDGE_CHUNKS.find((c) => c.id === "about")!.content}

KEY FACTS:
${GYGI_KNOWLEDGE_CHUNKS.map((c) => `- ${c.title}: ${c.content}`).join("\n")}

${categoryLine}

CONTACT:
- Email: ${GYGI_CONTACT.email}
- Phone: ${GYGI_CONTACT.phone}

RULES:
1. Answer ANY question about GYGI, its programs, platform features, mentorship, community, certificates, alumni path, impact, partners, how to join, volunteering, or contacting the team.
2. Be warm, clear, and concise (usually 2–5 short sentences). Use plain language.
3. If the user asks something unrelated to GYGI/education on this platform, politely say you only help with GYGI topics and invite a GYGI-related question.
4. Never invent private student data, payment amounts, or unpublished internal policies. If unsure, say what you know and point to ${GYGI_CONTACT.email} or ${GYGI_CONTACT.phone}.
5. Do not refuse GYGI-related questions just because they are broad — give the best accurate overview from the handbook.
6. Prefer actionable next steps (register, explore programs, contact, open dashboard features).
`.trim();
};
