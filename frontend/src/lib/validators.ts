import { z } from "zod";

// Auth validators
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    categoryId: z.string().min(1, "Please select a category"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Category validators
export const categorySchema = z
  .object({
    name: z.string().min(2, "Category name is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    icon: z.string().optional(),
    bannerImage: z.string().optional(),
    durationWeeks: z.number().min(1).max(104).nullable().optional(),
    certificateEnabled: z.boolean().optional(),
    certificateTitle: z.string().max(200).optional().or(z.literal("")),
    completionRules: z
      .object({
        attendanceWeight: z.number().min(0).max(100),
        quizWeight: z.number().min(0).max(100),
        assignmentWeight: z.number().min(0).max(100),
        passThreshold: z.number().min(1).max(100),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.certificateEnabled !== false &&
      (!data.certificateTitle || !data.certificateTitle.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Certificate title is required",
        path: ["certificateTitle"],
      });
    }
  });

// Class validators
export const createClassSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  scheduledDate: z.date(),
  duration: z.number().min(15).max(300),
  maxParticipants: z.number().min(1).max(500).optional(),
  isRecordable: z.boolean().optional(),
});

// Quiz validators
export const createQuizSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  duration: z.number().min(1).max(300),
  passingScore: z.number().min(0).max(100),
  attempts: z.number().min(1).max(10),
  startDate: z.date(),
  endDate: z.date(),
});

// Assignment validators
export const createAssignmentSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  dueDate: z.date(),
  maxScore: z.number().min(1).max(1000),
  submissionTypes: z.array(z.enum(["file", "text", "github_url"])),
});

// Mentorship validators
export const createGoalSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  targetDate: z.date(),
});

export const createSessionSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  topic: z.string().min(3, "Topic is required"),
  description: z.string().optional(),
  scheduledDate: z.date(),
  duration: z.number().min(15).max(180),
  type: z.enum(["one_on_one", "group"]).optional(),
});

export const createFeedbackSchema = z.object({
  menteeId: z.string().min(1, "Mentee is required"),
  categoryId: z.string().min(1, "Category is required"),
  projectTitle: z.string().min(3, "Project title is required"),
  technicalSkills: z.number().min(0).max(10),
  uiUx: z.number().min(0).max(10).optional(),
  problemSolving: z.number().min(0).max(10).optional(),
  communication: z.number().min(0).max(10).optional(),
  overall: z.number().min(0).max(10),
  feedback: z.string().min(1, "Feedback is required"),
});
