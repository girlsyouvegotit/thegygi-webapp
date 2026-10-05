import mongoose, { Schema, Document } from "mongoose";

export type SubmissionType = "file" | "text" | "github_url";

export interface IAssignment extends Document {
  category: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  submissionTypes: SubmissionType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
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
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 100,
    },
    submissionTypes: [
      {
        type: String,
        enum: ["file", "text", "github_url"],
        default: ["text"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
assignmentSchema.index({ category: 1, isActive: 1, dueDate: 1 });
assignmentSchema.index({ tutor: 1, createdAt: -1 });

const Assignment = mongoose.model<IAssignment>("Assignment", assignmentSchema);
export default Assignment;
