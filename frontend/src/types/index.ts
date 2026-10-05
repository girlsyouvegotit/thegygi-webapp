// ============================================
// BASE
// ============================================
export type UserRole =
  | "student"
  | "tutor"
  | "mentor"
  | "writer"
  | "admin"
  | "super_admin";
export type ID = string;

export interface pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  pagination?: pagination;
}

// ============================================
// USER
// ============================================
export interface user {
  _id: ID;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  coverImage?: string;
  avatarUpdatedAt?: string;
  coverImageUpdatedAt?: string;
  communityChatTheme?: string;
  communityChatWallpaper?: string;
  communityChatWallpaperUpdatedAt?: string;
  dashboardTheme?: string;
  bio?: string;
  phone?: string;
  socialLinks?: {
    twitter?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    website?: string | null;
  };
  isActive: boolean;
  categories?: category[];
  assignedCategories?: category[];
  /** ISO date — student cannot request another category change until this time */
  categoryChangeLockedUntil?: string | null;
  /** @deprecated school-era class link */
  studentClass?: ID | { _id: ID; name?: string } | null;
  /** @deprecated school-era subject links */
  teacherSubjects?: Array<{ _id: ID; name?: string; code?: string }>;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface categoryChangeRequest {
  _id: ID;
  student:
    | ID
    | {
        _id: ID;
        name?: string;
        email?: string;
        avatar?: string;
      };
  fromCategory?:
    | ID
    | {
        _id: ID;
        name?: string;
        slug?: string;
        icon?: string;
      }
    | null;
  toCategory:
    | ID
    | {
        _id: ID;
        name?: string;
        slug?: string;
        icon?: string;
      };
  reason: string;
  status: CategoryChangeRequestStatus;
  reviewedBy?:
    | ID
    | {
        _id: ID;
        name?: string;
        email?: string;
      }
    | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// CATEGORY
// ============================================
export interface category {
  _id: ID;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  bannerImage?: string;
  isActive: boolean;
  tutors: user[];
  mentors: user[];
  students: user[];
  communityId?: ID;
  studentCount?: number;
  tutorCount?: number;
  mentorCount?: number;
  durationWeeks?: number | null;
  certificateEnabled?: boolean;
  certificateTitle?: string | null;
  completionRules?: {
    attendanceWeight: number;
    quizWeight: number;
    assignmentWeight: number;
    passThreshold: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  icon?: string;
  bannerImage?: string;
  durationWeeks?: number | null;
  certificateEnabled?: boolean;
  certificateTitle?: string | null;
  completionRules?: {
    attendanceWeight: number;
    quizWeight: number;
    assignmentWeight: number;
    passThreshold: number;
  };
}

export interface Enrollment {
  _id: ID;
  student: user;
  category: category;
  enrolledAt: string;
  status: "active" | "completed" | "dropped" | "suspended";
  progress: number;
  completedAt?: string;
  droppedAt?: string;
  phaseEndsAt?: string | null;
  breakdown?: ProgressBreakdown | null;
}

export interface ProgressBreakdown {
  overall: number;
  attendance: { score: number; attended: number; total: number };
  quizzes: { score: number; passed: number; total: number };
  assignments: { score: number; submitted: number; total: number };
  weights: { attendance: number; quizzes: number; assignments: number };
  passThreshold: number;
  phaseEndsAt: string | null;
  isPastDeadline: boolean;
  canComplete: boolean;
}

export interface Certificate {
  _id: ID;
  student: user | ID;
  category: category;
  enrollment: Enrollment | ID;
  certificateNumber: string;
  title: string;
  studentFullName: string;
  studentEmail: string;
  categoryName: string;
  categoryDescription?: string | null;
  enrolledAt: string;
  completedAt: string;
  durationWeeks?: number | null;
  phaseEndsAt?: string | null;
  issuedAt: string;
  status: "issued" | "revoked";
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// COMMUNITY
// ============================================
export interface channel {
  _id: ID;
  name: string;
  type:
    | "general"
    | "announcements"
    | "learning"
    | "mentorship"
    | "alumni"
    | "self"
    | "dm";
  description?: string;
  owner?: ID | null;
  participants?: ID[];
  peer?: {
    _id: ID;
    name?: string;
    avatar?: string;
    role?: string;
  } | null;
}

export interface community {
  _id: ID;
  category: category;
  members: user[];
  channels: channel[];
  isActive: boolean;
  isAdmin?: boolean;
  viewerId?: ID;
  createdAt: string;
  updatedAt: string;
}

export interface communityMessage {
  _id: ID;
  community: ID;
  channel: ID;
  user: user;
  content: string;
  attachments: string[];
  isAnnouncement: boolean;
  isPinned: boolean;
  replyTo?: {
    _id: ID;
    content?: string;
    user?: { name?: string };
    deletedAt?: string;
  } | null;
  forwardedFrom?: {
    messageId?: ID;
    userName?: string;
    preview?: string;
  } | null;
  isStarredByMe?: boolean;
  starCount?: number;
  reactions?: {
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }[];
  reportedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  deletedAt?: string;
}

// ============================================
// LIVE CLASS
// ============================================
export type ClassStatus =
  | "scheduled"
  | "live"
  | "ended"
  | "processing"
  | "recorded"
  | "cancelled";

export interface liveClass {
  _id: ID;
  category: category;
  tutor: user;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  status: ClassStatus;
  maxParticipants: number;
  sessionId?: ID;
  recordingId?: ID;
  isRecordable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface participant {
  userId: ID;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  attendancePercentage: number;
}

export interface liveSession {
  _id: ID;
  classId: ID;
  tutor: user;
  category: category;
  startedAt: string;
  endedAt?: string;
  status: "live" | "ended";
  participants: participant[];
  launchedQuizzes: ID[];
  launchedPolls: ID[];
}

export interface sessionChatMessage {
  userId: ID;
  userName: string;
  message: string;
  timestamp: string;
  type: "text" | "system" | "quiz" | "poll";
}

// ============================================
// RECORDING
// ============================================
export type RecordingStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"
  | "archived";

export interface chapter {
  timestamp: string;
  title: string;
  duration: number;
}

export interface practiceQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: "ai-generated" | "manual";
}

export interface recording {
  _id: ID;
  classId: liveClass;
  sessionId: ID;
  category: category;
  tutor: user;
  date: string;
  duration: number;
  storageUrl: string;
  thumbnailUrl: string;
  processingStatus: RecordingStatus;
  transcript: string;
  chapters: chapter[];
  summary: string;
  aiNotes: string;
  practiceQuestions: practiceQuestion[];
  viewCount: number;
  downloadCount: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// QUIZ
// ============================================
export type QuestionType =
  | "MCQ"
  | "multiple_select"
  | "true_false"
  | "short_answer"
  | "fill_blank";

export interface quizQuestion {
  _id: ID;
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface quiz {
  _id: ID;
  category: category;
  tutor: user;
  title: string;
  description: string;
  questions: quizQuestion[];
  duration: number;
  passingScore: number;
  attempts: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isLiveQuiz: boolean;
  randomization: boolean;
  showAnswers: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface quizSubmission {
  _id: ID;
  quiz: quiz;
  student: user;
  answers: { questionId: ID; answer: string | string[] }[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  attempt: number;
  submittedAt: string;
  gradedAt?: string;
  feedback?: string;
}

// ============================================
// ASSIGNMENT
// ============================================
export type SubmissionType = "file" | "text" | "github_url";
export type SubmissionStatus = "submitted" | "graded" | "returned" | "late";

export interface assignment {
  _id: ID;
  category: category;
  tutor: user;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionTypes: SubmissionType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface assignmentSubmission {
  _id: ID;
  assignment: assignment;
  student: user;
  submissionType: SubmissionType;
  content: string;
  attachments: string[];
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: user;
  gradedAt?: string;
}

// ============================================
// MENTORSHIP
// ============================================
export interface mentorAssignment {
  _id: ID;
  mentor: user;
  category: category;
  mentees: user[];
  maxMentees: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface milestone {
  _id: ID;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface mentorshipGoal {
  _id: ID;
  mentor: user;
  mentee: user;
  category: category;
  title: string;
  description: string;
  targetDate: string;
  milestones: milestone[];
  status: "active" | "completed" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

export interface mentorshipSession {
  _id: ID;
  mentor: user;
  mentee: user;
  category: category;
  type: "one_on_one" | "group";
  topic: string;
  description: string;
  scheduledDate: string;
  duration: number;
  status: "scheduled" | "confirmed" | "live" | "completed" | "cancelled";
  notes?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface mentorFeedback {
  _id: ID;
  mentor: user;
  mentee: user;
  category: category;
  projectTitle: string;
  technicalSkills: number;
  uiUx?: number;
  problemSolving?: number;
  communication?: number;
  overall: number;
  feedback: string;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface mentorNote {
  _id: ID;
  mentor: user;
  mentee: user;
  sessionId?: ID;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ATTENDANCE
// ============================================
export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface attendance {
  _id: ID;
  classId: liveClass;
  sessionId: ID;
  student: user;
  category: category;
  joinedAt: string;
  leftAt: string;
  attendancePercentage: number;
  status: AttendanceStatus;
  markedBy: "system" | "tutor" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface attendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

// ============================================
// ANALYTICS
// ============================================
export interface studentProgress {
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
  };
  quizzes: {
    totalQuizzes: number;
    averageScore: number;
    passed: number;
  };
  assignments: {
    totalAssignments: number;
    submitted: number;
    graded: number;
    averageScore: number;
  };
  mentorship: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
  };
}

export interface tutorAnalytics {
  totalClasses: number;
  totalRecordings: number;
  totalStudents: number;
  averageAttendance: number;
  averageQuizScore: number;
}

export interface mentorAnalytics {
  totalMentees: number;
  activeAssignments: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalSessions: number;
  completedSessions: number;
}

export interface adminOverview {
  totalStudents: number;
  totalTutors: number;
  totalMentors: number;
  totalWriters: number;
  totalAdmins: number;
  totalCategories: number;
  liveClasses: number;
  totalRecordings: number;
  activeMentorships: number;
}

export interface studentPerformanceEnrollment {
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  status: string;
  progress: number;
  enrolledAt?: string;
}

export interface studentPerformanceRow {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  categories: string[];
  enrollments: studentPerformanceEnrollment[];
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
  };
  quizzes: {
    totalQuizzes: number;
    averageScore: number;
    passed: number;
  };
  assignments: {
    totalAssignments: number;
    submitted: number;
    graded: number;
    averageScore: number;
  };
  mentorship: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completionRate: number;
  };
  overallScore: number;
}

export interface studentsPerformanceSummary {
  totalStudents: number;
  averageAttendance: number;
  averageQuizScore: number;
  averageAssignmentScore: number;
  averageOverallScore: number;
}

export interface studentsPerformanceResponse {
  students: studentPerformanceRow[];
  summary: studentsPerformanceSummary;
}

// ============================================
// NOTIFICATION
// ============================================
export type NotificationType =
  | "class_scheduled"
  | "class_rescheduled"
  | "class_cancelled"
  | "class_starting"
  | "recording_available"
  | "quiz_available"
  | "quiz_result"
  | "assignment_created"
  | "assignment_due"
  | "assignment_graded"
  | "mentor_assigned"
  | "session_scheduled"
  | "session_reminder"
  | "mentor_feedback"
  | "goal_updated"
  | "community_mention"
  | "announcement"
  | "moderation_warning"
  | "moderation_message"
  | "account_suspended"
  | "account_banned"
  | "salary_paid"
  | "get_involved_inquiry";

export interface notification {
  _id: ID;
  user: ID;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// FINANCE
// ============================================
export interface Expense {
  _id: ID;
  date: string;
  category: "salary" | "utilities" | "maintenance" | "supplies" | "other";
  description: string;
  amount: number;
  academicYear?: { _id: ID; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Salary {
  _id: ID;
  employee: { _id: ID; name: string; email: string };
  amount: number;
  month: number;
  year: number;
  status: "paid" | "pending";
  paymentDate?: string;
  academicYear?: { _id: ID; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface Fee {
  _id: ID;
  student: { _id: ID; name: string; email: string };
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paymentDate?: string;
  academicYear?: { _id: ID; name: string };
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// SETTINGS
// ============================================
export interface SchoolSettings {
  _id?: ID;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  primaryColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  module: string;
  actions: string[];
}

export interface Role {
  _id: ID;
  name: string;
  label?: string;
  permissions: Permission[];
}

// ============================================
// ACTIVITY LOG
// ============================================
export interface ActivityLog {
  _id: ID;
  user: { _id: ID; name: string; email: string; role: UserRole } | null;
  action: string;
  details?: string;
  resourceType?: string;
  resourceId?: ID;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TOPIC (kept for /topics pages)
// ============================================
export interface topic {
  _id: ID;
  title: string;
  outline: string[];
  content: Record<string, string>;
  createdBy?: ID;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// SOCKET EVENT PAYLOADS
// ============================================
export interface JoinClassPayload {
  sessionId: ID;
}
export interface ChatMessagePayload {
  sessionId: ID;
  message: string;
  userName: string;
}
export interface QuizLaunchPayload {
  sessionId: ID;
  quizId: ID;
}
export interface PollPayload {
  sessionId: ID;
  pollId: ID;
  question: string;
  options: string[];
}
export interface CommunityMessagePayload {
  categoryId: ID;
  channelId: ID;
  content: string;
  userName: string;
}
