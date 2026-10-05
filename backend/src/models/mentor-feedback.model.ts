import mongoose, { Schema, Document } from "mongoose";

export interface IMentorFeedback extends Document {
  mentor: mongoose.Types.ObjectId;
  mentee: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  projectTitle: string;
  technicalSkills: number;
  uiUx?: number;
  problemSolving?: number;
  communication?: number;
  overall: number;
  feedback: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const mentorFeedbackSchema = new Schema<IMentorFeedback>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    projectTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    technicalSkills: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    uiUx: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    communication: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    feedback: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    recommendations: [
      {
        type: String,
        maxlength: 500,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound indexes
mentorFeedbackSchema.index({ mentor: 1, mentee: 1, createdAt: -1 });
mentorFeedbackSchema.index({ mentee: 1, createdAt: -1 });
mentorFeedbackSchema.index({ category: 1, createdAt: -1 });

const MentorFeedback = mongoose.model<IMentorFeedback>(
  "MentorFeedback",
  mentorFeedbackSchema,
);
export default MentorFeedback;
