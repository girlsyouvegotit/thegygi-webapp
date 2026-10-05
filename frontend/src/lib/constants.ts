// App constants
export const APP_NAME = "GYGI Platform";
export const APP_VERSION = "3.0.0";
export const APP_DESCRIPTION = "Category-Based Live Learning & Mentorship Platform";

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    ME: "/auth/me",
  },
  CATEGORIES: {
    LIST: "/categories",
    DETAIL: (id: string) => `/categories/${id}`,
    CREATE: "/categories",
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
    ENROLL: (id: string) => `/categories/${id}/enroll`,
    ASSIGN_TUTOR: (id: string) => `/categories/${id}/assign-tutor`,
    ASSIGN_MENTOR: (id: string) => `/categories/${id}/assign-mentor`,
  },
  CLASSES: {
    LIST: "/classes",
    UPCOMING: "/classes/upcoming",
    DETAIL: (id: string) => `/classes/${id}`,
    CREATE: "/classes",
    UPDATE: (id: string) => `/classes/${id}`,
    DELETE: (id: string) => `/classes/${id}`,
    START: (id: string) => `/classes/${id}/start`,
    END: (id: string) => `/classes/${id}/end`,
    JOIN: (id: string) => `/classes/${id}/join`,
    LEAVE: (id: string) => `/classes/${id}/leave`,
  },
  RECORDINGS: {
    LIST: "/recordings",
    DETAIL: (id: string) => `/recordings/${id}`,
    PLAY: (id: string) => `/recordings/${id}/play`,
    TRANSCRIPT: (id: string) => `/recordings/${id}/transcript`,
    SEARCH: (id: string) => `/recordings/${id}/search`,
    DOWNLOAD: (id: string) => `/recordings/${id}/download`,
    DELETE: (id: string) => `/recordings/${id}`,
  },
  QUIZZES: {
    LIST: "/quizzes",
    DETAIL: (id: string) => `/quizzes/${id}`,
    CREATE: "/quizzes",
    UPDATE: (id: string) => `/quizzes/${id}`,
    DELETE: (id: string) => `/quizzes/${id}`,
    SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    RESULT: (id: string) => `/quizzes/${id}/result`,
    RESULTS: (id: string) => `/quizzes/${id}/results`,
    LAUNCH: (id: string) => `/quizzes/${id}/launch`,
  },
  ASSIGNMENTS: {
    LIST: "/assignments",
    DETAIL: (id: string) => `/assignments/${id}`,
    CREATE: "/assignments",
    UPDATE: (id: string) => `/assignments/${id}`,
    DELETE: (id: string) => `/assignments/${id}`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
    MY_SUBMISSION: (id: string) => `/assignments/${id}/my-submission`,
    SUBMISSIONS: (id: string) => `/assignments/${id}/submissions`,
    GRADE: (submissionId: string) => `/assignments/submissions/${submissionId}/grade`,
  },
  MENTORSHIP: {
    MY_MENTOR: "/mentorship/my-mentor",
    MY_MENTEES: "/mentorship/my-mentees",
    ASSIGNMENTS: "/mentorship/assignments",
    SESSIONS: "/mentorship/sessions",
    SESSION_DETAIL: (id: string) => `/mentorship/sessions/${id}`,
    GOALS: "/mentorship/goals",
    FEEDBACK: "/mentorship/feedback",
    NOTES: "/mentorship/notes",
  },
  ATTENDANCE: {
    CLASS: (classId: string) => `/attendance/class/${classId}`,
    STUDENT: (studentId: string) => `/attendance/student/${studentId}`,
    SUMMARY: (studentId: string) => `/attendance/summary/${studentId}`,
  },
  ANALYTICS: {
    STUDENT_PROGRESS: (studentId: string) => `/analytics/student/${studentId}/progress`,
    TUTOR: (tutorId: string) => `/analytics/tutor/${tutorId}`,
    MENTOR: (mentorId: string) => `/analytics/mentor/${mentorId}`,
    ADMIN_OVERVIEW: "/analytics/admin/overview",
    ADMIN_STUDENTS_PERFORMANCE: "/analytics/admin/students-performance",
  },
};

// Role-based navigation
export const ROLE_NAVIGATION = {
  student: [
    { title: "Dashboard", url: "/dashboard", icon: "LayoutDashboard" },
    { title: "My Learning", url: "/my-learning", icon: "BookOpen" },
    { title: "Community", url: "/community", icon: "Users" },
    { title: "Live Classes", url: "/live-classes", icon: "Video" },
    { title: "Recordings", url: "/recordings", icon: "PlayCircle" },
    { title: "Quizzes", url: "/quizzes", icon: "FileQuestion" },
    { title: "Assignments", url: "/assignments", icon: "FileText" },
    { title: "Mentorship", url: "/mentorship", icon: "HeartHandshake" },
    { title: "Progress", url: "/progress", icon: "TrendingUp" },
    { title: "Certificates", url: "/certificates", icon: "Award" },
    { title: "Calendar", url: "/calendar", icon: "Calendar" },
  ],
  tutor: [
    { title: "Dashboard", url: "/tutor/dashboard", icon: "LayoutDashboard" },
    { title: "My Classes", url: "/tutor/classes", icon: "Video" },
    { title: "Schedule Class", url: "/tutor/schedule", icon: "CalendarPlus" },
    { title: "Quizzes", url: "/tutor/quizzes", icon: "FileQuestion" },
    { title: "Assignments", url: "/tutor/assignments", icon: "FileText" },
    { title: "Students", url: "/tutor/students", icon: "Users" },
    { title: "Analytics", url: "/tutor/analytics", icon: "TrendingUp" },
  ],
  mentor: [
    { title: "Dashboard", url: "/mentor/dashboard", icon: "LayoutDashboard" },
    { title: "My Mentees", url: "/mentor/mentees", icon: "Users" },
    { title: "Sessions", url: "/mentor/sessions", icon: "Calendar" },
    { title: "Goals", url: "/mentor/goals", icon: "Target" },
    { title: "Feedback", url: "/mentor/feedback", icon: "MessageSquare" },
    { title: "Notes", url: "/mentor/notes", icon: "StickyNote" },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: "LayoutDashboard" },
    { title: "Categories", url: "/admin/categories", icon: "FolderTree" },
    { title: "Users", url: "/admin/users", icon: "Users" },
    { title: "Mentorship", url: "/admin/mentorship", icon: "HeartHandshake" },
    { title: "Recordings", url: "/admin/recordings", icon: "PlayCircle" },
    { title: "Analytics", url: "/admin/analytics", icon: "TrendingUp" },
    { title: "Finance", url: "/admin/finance", icon: "Banknote" },
    { title: "Settings", url: "/admin/settings", icon: "Settings" },
  ],
};

// Colors
export const COLORS = {
  primary: "#c147e9",
  primaryLight: "#e5b8f4",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};