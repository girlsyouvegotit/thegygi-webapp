import mongoose, { Schema, Document } from "mongoose";

export type QuestionType =
  "MCQ" | "multiple_select" | "true_false" | "short_answer" | "fill_blank";

export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
}

export interface IQuiz extends Document {
  category: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: IQuestion[];
  duration: number;
  passingScore: number;
  attempts: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isLiveQuiz: boolean;
  randomization: boolean;
  showAnswers: boolean;
  totalPoints: number;
  questionCount: number;
  averageScore?: number;
  completionRate?: number;
  createdAt: Date;
  updatedAt: Date;
  isAvailable: () => boolean;
  getPublicQuestions: () => Partial<IQuestion>[];
}

const questionSchema = new Schema<IQuestion>(
  {
    type: {
      type: String,
      enum: [
        "MCQ",
        "multiple_select",
        "true_false",
        "short_answer",
        "fill_blank",
      ],
      required: true,
      default: "MCQ",
    },
    questionText: { type: String, required: true, maxlength: 1000 },
    options: [{ type: String, maxlength: 500 }],
    correctAnswer: { type: Schema.Types.Mixed, required: true, select: false },
    points: { type: Number, default: 1, min: 1, max: 100 },
    explanation: { type: String, maxlength: 2000, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    tags: [String],
  },
  { _id: true },
);

const quizSchema = new Schema<IQuiz>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tutor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: { type: String, maxlength: 2000, default: "" },
    questions: [questionSchema],
    duration: { type: Number, required: true, min: 1, max: 300, default: 30 },
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 60,
    },
    attempts: { type: Number, default: 1, min: 1, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    isLiveQuiz: { type: Boolean, default: false },
    randomization: { type: Boolean, default: false },
    showAnswers: { type: Boolean, default: true },
    totalPoints: { type: Number, default: 0, min: 0 },
    questionCount: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: null },
    completionRate: { type: Number, default: null },
  },
  { timestamps: true },
);

quizSchema.index({ category: 1, isActive: 1, startDate: 1 });
quizSchema.index({ tutor: 1, createdAt: -1 });
quizSchema.index({ isLiveQuiz: 1, startDate: 1, endDate: 1 });

quizSchema.pre<IQuiz>("save", function () {
  this.questionCount = this.questions.length;
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);

  if (this.endDate <= this.startDate) {
    throw new Error("End date must be after start date");
  }

  for (const question of this.questions) {
    if (
      question.type === "multiple_select" &&
      !Array.isArray(question.correctAnswer)
    ) {
      question.correctAnswer = String(question.correctAnswer)
        .split(",")
        .map((s: string) => s.trim());
    }
  }
});

quizSchema.methods.isAvailable = function (): boolean {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
};

quizSchema.methods.getPublicQuestions = function () {
  return this.questions.map((q) => ({
    _id: q._id,
    type: q.type,
    questionText: q.questionText,
    options: q.options,
    points: q.points,
    difficulty: q.difficulty,
  }));
};

const Quiz = mongoose.model<IQuiz>("Quiz", quizSchema);
export default Quiz;
