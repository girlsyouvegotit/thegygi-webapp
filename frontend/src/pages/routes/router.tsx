import { createBrowserRouter, Navigate } from "react-router";
import { ScrollToTopLayout } from "@/components/ScrollToTop";

// Public pages
import Home from "@/pages/public/Home";
import Login from "@/pages/public/Login";
import Register from "@/pages/public/Register";
import ForgotPassword from "@/pages/public/ForgotPassword";
import ResetPassword from "@/pages/public/ResetPassword";
import CategoryExplorer from "@/pages/public/CategoryExplorer";
import About from "@/pages/public/About";
import Blog from "@/pages/public/Blog";
import BlogPost from "@/pages/public/BlogPost";
import RouteError from "@/pages/public/RouteError";
import NotFound from "@/pages/public/NotFound";

// Role wrappers
import StudentRoutes from "@/pages/routes/StudentRoutes";
import TutorRoutes from "@/pages/routes/TutorRoutes";
import MentorRoutes from "@/pages/routes/MentorRoutes";
import WriterRoutes from "@/pages/routes/WriterRoutes";
import AdminRoutes from "@/pages/routes/AdminRoutes";
import SuperAdminRoutes from "@/pages/routes/SuperAdminRoutes";
import AdminOpsShell from "@/components/layout/AdminOpsShell";

// Student pages
import StudentDashboard from "@/pages/student/Dashboard";
import MyLearning from "@/pages/student/MyLearning";
import Community from "@/pages/student/Community";
import LiveClasses from "@/pages/student/LiveClasses";
import Recordings from "@/pages/student/Recordings";
import RecordingPlayer from "@/pages/student/RecordingPlayer";
import Quizzes from "@/pages/student/Quizzes";
import QuizTaking from "@/pages/student/QuizTaking";
import Assignments from "@/pages/student/Assignments";
import StudentAssignmentDetail from "@/pages/student/AssignmentDetail";
import Mentorship from "@/pages/student/Mentorship";
import Progress from "@/pages/student/Progress";
import Calendar from "@/pages/student/Calendar";
import Profile from "@/pages/student/Profile";
import Certificates from "@/pages/student/Certificates";
import CertificateDetail from "@/pages/student/CertificateDetail";
import MyTestimonial from "@/pages/student/MyTestimonial";
import AfterGraduation from "@/pages/student/AfterGraduation";

// Live classroom (shared by student and tutor routes)
import LiveClassroom from "@/components/live/LiveClassroom";

// Tutor pages
import TutorDashboard from "@/pages/tutor/Dashboard";
import TutorClasses from "@/pages/tutor/MyClasses";
import ScheduleClass from "@/pages/tutor/ScheduleClass";
import TutorClassAnalytics from "@/pages/tutor/ClassAnalytics";
import TutorAnalytics from "@/pages/tutor/Analytics";
import TutorQuizBuilder from "@/pages/tutor/QuizBuilder";
import TutorQuizManagement from "@/pages/tutor/QuizManagement";
import TutorQuizDetail from "@/pages/tutor/QuizDetail";
import TutorAssignmentBuilder from "@/pages/tutor/AssignmentBuilder";
import TutorAssignmentDetail from "@/pages/tutor/AssignmentDetail";
import TutorGrading from "@/pages/tutor/Grading";
import TutorStudents from "@/pages/tutor/Students";
import TutorProfile from "@/pages/tutor/Profile";

// Mentor pages
import MentorDashboard from "@/pages/mentor/Dashboard";
import MentorMentees from "@/pages/mentor/MyMentees";
import MentorMenteeDetail from "@/pages/mentor/MenteeDetail";
import MentorSessions from "@/pages/mentor/Sessions";
import MentorGoals from "@/pages/mentor/Goals";
import MentorFeedback from "@/pages/mentor/Feedback";
import MentorNotes from "@/pages/mentor/Notes";
import MentorPortfolioReviews from "@/pages/mentor/PortfolioReviews";
import MentorProfile from "@/pages/mentor/Profile";

// Writer pages
import WriterDashboard from "@/pages/writer/Dashboard";
import WriterPosts from "@/pages/writer/Posts";
import WriterPostEditor from "@/pages/writer/PostEditor";
import WriterAboutEditor from "@/pages/writer/AboutEditor";
import WriterProfile from "@/pages/writer/Profile";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCategories from "@/pages/admin/Categories";
import AdminUsers from "@/pages/admin/Users";
import AdminMentorship from "@/pages/admin/MentorAssignment";
import AdminRecordings from "@/pages/admin/RecordingManagement";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminStudentPerformance from "@/pages/admin/StudentPerformance";
import AdminFinance from "@/pages/admin/Finance";
import AdminSettings from "@/pages/admin/Settings";
import AdminActivityLogs from "@/pages/admin/ActivityLogs";
import AdminProfile from "@/pages/admin/Profile";
import AdminTestimonialComments from "@/pages/admin/TestimonialComments";
import AdminAlumniOps from "@/pages/admin/AlumniOps";
import AdminCategoryChanges from "@/pages/admin/CategoryChanges";

// Super-admin pages
import SuperAdminDashboard from "@/pages/super-admin/Dashboard";
import SuperAdminAdmins from "@/pages/super-admin/Admins";
import SuperAdminPeople from "@/pages/super-admin/People";
import SuperAdminPersonDetail from "@/pages/super-admin/PersonDetail";
import SuperAdminFinance from "@/pages/super-admin/Finance";
import SuperAdminMentorship from "@/pages/super-admin/Mentorship";
import SuperAdminLiveOps from "@/pages/super-admin/LiveOps";
import SuperAdminSecurity from "@/pages/super-admin/Security";
import SuperAdminOrg from "@/pages/super-admin/Org";
import SuperAdminGrowth from "@/pages/super-admin/Growth";
import SuperAdminComms from "@/pages/super-admin/Comms";
import SuperAdminContent from "@/pages/super-admin/Content";
import SuperAdminAcademics from "@/pages/super-admin/Academics";
import SuperAdminWorkforce from "@/pages/super-admin/Workforce";
import SuperAdminTrust from "@/pages/super-admin/Trust";
import SuperAdminSystem from "@/pages/super-admin/System";
import SuperAdminSupport from "@/pages/super-admin/Support";
import SuperAdminModeration from "@/pages/super-admin/Moderation";

export const router = createBrowserRouter([
  {
    element: <ScrollToTopLayout />,
    errorElement: <RouteError />,
    children: [
      // ────────────────────────────────────────────
      // Public + Student (shared `/` tree — avoids sibling `/` rank conflicts)
      // ────────────────────────────────────────────
      {
        path: "/",
        children: [
          { index: true, element: <Home /> },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "reset-password/:token", element: <ResetPassword /> },
          { path: "explore", element: <CategoryExplorer /> },
          { path: "about", element: <About /> },
          { path: "blog", element: <Blog /> },
          { path: "blog/:slug", element: <BlogPost /> },

          // Student shell (pathless layout so /certificates etc. match this tree)
          {
            element: <StudentRoutes />,
            children: [
              { path: "dashboard", element: <StudentDashboard /> },
              { path: "my-learning", element: <MyLearning /> },
              // Legacy enrollment notification links used /my-learning/:categoryId
              {
                path: "my-learning/:categoryId",
                element: <Navigate to="/my-learning" replace />,
              },
              { path: "categories", element: <CategoryExplorer /> },
              {
                path: "categories/:categoryId",
                element: <Navigate to="/categories" replace />,
              },
              { path: "community", element: <Community /> },
              { path: "live-classes", element: <LiveClasses /> },
              { path: "live-class/:classId", element: <LiveClassroom /> },
              { path: "recordings", element: <Recordings /> },
              { path: "recordings/:id", element: <RecordingPlayer /> },
              { path: "quizzes", element: <Quizzes /> },
              { path: "quizzes/:id", element: <QuizTaking /> },
              { path: "assignments", element: <Assignments /> },
              { path: "assignments/:id", element: <StudentAssignmentDetail /> },
              { path: "mentorship", element: <Mentorship /> },
              { path: "progress", element: <Progress /> },
              { path: "certificates", element: <Certificates /> },
              { path: "certificates/:id", element: <CertificateDetail /> },
              { path: "my-testimonial", element: <MyTestimonial /> },
              { path: "after-graduation", element: <AfterGraduation /> },
              { path: "calendar", element: <Calendar /> },
              { path: "profile", element: <Profile /> },
            ],
          },
        ],
      },

      // ────────────────────────────────────────────
      // Tutor
      // ────────────────────────────────────────────
      {
        path: "/tutor",
        element: <TutorRoutes />,
        children: [
          { path: "dashboard", element: <TutorDashboard /> },
          { path: "classes", element: <TutorClasses /> },
          { path: "recordings", element: <Recordings /> },
          { path: "recordings/:id", element: <RecordingPlayer /> },
          // param is :classId — matches LiveClassroom's useParams<{ classId }>()
          { path: "classes/:classId/live", element: <LiveClassroom /> },
          // analytics uses :id internally (it reads useParams<{ id }>())
          { path: "classes/:id/analytics", element: <TutorClassAnalytics /> },
          // details alias — redirects to analytics for now, no dedicated page
          {
            path: "classes/:id",
            element: <Navigate to="analytics" replace />,
          },
          { path: "analytics", element: <TutorAnalytics /> },
          { path: "schedule", element: <ScheduleClass /> },
          { path: "quizzes", element: <TutorQuizManagement /> },
          { path: "quizzes/new", element: <TutorQuizBuilder /> },
          { path: "quizzes/:id", element: <TutorQuizDetail /> },
          { path: "assignments", element: <TutorAssignmentBuilder /> },
          { path: "assignments/:id", element: <TutorAssignmentDetail /> },
          { path: "assignments/:id/grade", element: <TutorGrading /> },
          {
            path: "assignments/:id/submissions",
            element: <TutorAssignmentDetail />,
          },
          { path: "students", element: <TutorStudents /> },
          { path: "profile", element: <TutorProfile /> },
        ],
      },

      // ────────────────────────────────────────────
      // Mentor
      // ────────────────────────────────────────────
      {
        path: "/mentor",
        element: <MentorRoutes />,
        children: [
          { path: "dashboard", element: <MentorDashboard /> },
          { path: "mentees", element: <MentorMentees /> },
          { path: "mentees/:id", element: <MentorMenteeDetail /> },
          { path: "sessions", element: <MentorSessions /> },
          { path: "goals", element: <MentorGoals /> },
          { path: "feedback", element: <MentorFeedback /> },
          { path: "portfolio-reviews", element: <MentorPortfolioReviews /> },
          { path: "notes", element: <MentorNotes /> },
          { path: "profile", element: <MentorProfile /> },
        ],
      },

      // ────────────────────────────────────────────
      // Writer
      // ────────────────────────────────────────────
      {
        path: "/writer",
        element: <WriterRoutes />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <WriterDashboard /> },
          { path: "posts", element: <WriterPosts /> },
          { path: "posts/new", element: <WriterPostEditor /> },
          { path: "posts/:id/edit", element: <WriterPostEditor /> },
          { path: "about", element: <WriterAboutEditor /> },
          { path: "profile", element: <WriterProfile /> },
        ],
      },

      // ────────────────────────────────────────────
      // Admin
      // ────────────────────────────────────────────
      {
        path: "/admin",
        element: <AdminRoutes />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "categories", element: <AdminCategories /> },
          { path: "users", element: <AdminUsers /> },
          { path: "mentorship", element: <AdminMentorship /> },
          { path: "recordings", element: <AdminRecordings /> },
          { path: "recordings/:id", element: <RecordingPlayer /> },
          { path: "analytics", element: <AdminAnalytics /> },
          { path: "student-performance", element: <AdminStudentPerformance /> },
          { path: "finance", element: <AdminFinance /> },
          {
            path: "testimonials",
            element: <AdminTestimonialComments />,
          },
          { path: "alumni-ops", element: <AdminAlumniOps /> },
          { path: "category-changes", element: <AdminCategoryChanges /> },
          { path: "settings", element: <AdminSettings /> },
          { path: "profile", element: <AdminProfile /> },
          { path: "activity-logs", element: <AdminActivityLogs /> },
        ],
      },

      // ────────────────────────────────────────────
      // Super Admin
      // ────────────────────────────────────────────
      {
        path: "/super-admin",
        element: <SuperAdminRoutes />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <SuperAdminDashboard /> },
          { path: "admins", element: <SuperAdminAdmins /> },
          { path: "people", element: <SuperAdminPeople /> },
          { path: "people/:id", element: <SuperAdminPersonDetail /> },
          { path: "finance", element: <SuperAdminFinance /> },
          { path: "mentorship", element: <SuperAdminMentorship /> },
          { path: "live-ops", element: <SuperAdminLiveOps /> },
          { path: "security", element: <SuperAdminSecurity /> },
          { path: "org", element: <SuperAdminOrg /> },
          { path: "growth", element: <SuperAdminGrowth /> },
          { path: "comms", element: <SuperAdminComms /> },
          { path: "content", element: <SuperAdminContent /> },
          { path: "academics", element: <SuperAdminAcademics /> },
          { path: "workforce", element: <SuperAdminWorkforce /> },
          { path: "trust", element: <SuperAdminTrust /> },
          { path: "system", element: <SuperAdminSystem /> },
          { path: "support", element: <SuperAdminSupport /> },
          { path: "moderation", element: <SuperAdminModeration /> },
          // Full admin portal feature set inside Super Admin shell
          {
            path: "ops",
            element: <AdminOpsShell />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <AdminDashboard /> },
              { path: "categories", element: <AdminCategories /> },
              { path: "users", element: <AdminUsers /> },
              { path: "mentorship", element: <AdminMentorship /> },
              { path: "recordings", element: <AdminRecordings /> },
              { path: "recordings/:id", element: <RecordingPlayer /> },
              { path: "analytics", element: <AdminAnalytics /> },
              {
                path: "student-performance",
                element: <AdminStudentPerformance />,
              },
              { path: "finance", element: <AdminFinance /> },
              {
                path: "testimonials",
                element: <AdminTestimonialComments />,
              },
              { path: "alumni-ops", element: <AdminAlumniOps /> },
              { path: "category-changes", element: <AdminCategoryChanges /> },
              { path: "settings", element: <AdminSettings /> },
              { path: "activity-logs", element: <AdminActivityLogs /> },
              { path: "profile", element: <AdminProfile /> },
            ],
          },
        ],
      },

      // Fallback
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;