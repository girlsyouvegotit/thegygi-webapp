import mongoose, { Schema, Document } from "mongoose";

export interface IQuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IQuizSubmission extends Document {
  quiz: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  attempt: number;
  submittedAt: Date;
  gradedAt?: Date;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IQuizAnswer>(
  {
    questionId: {
      type: String,
      required: true,
    },
    answer: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const quizSubmissionSchema = new Schema<IQuizSubmission>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Unique index: One submission per quiz per student per attempt
quizSubmissionSchema.index(
  { quiz: 1, student: 1, attempt: 1 },
  { unique: true },
);

// Compound indexes
quizSubmissionSchema.index({ quiz: 1, submittedAt: -1 });
quizSubmissionSchema.index({ student: 1, submittedAt: -1 });

const QuizSubmission = mongoose.model<IQuizSubmission>(
  "QuizSubmission",
  quizSubmissionSchema,
);
export default QuizSubmission;
