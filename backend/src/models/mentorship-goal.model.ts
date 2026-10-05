import mongoose, { Schema, Document } from "mongoose";

export type GoalStatus = "active" | "completed" | "abandoned";

export interface IMilestone {
  _id: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IMentorshipGoal extends Document {
  mentor: mongoose.Types.ObjectId;
  mentee: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetDate: Date;
  milestones: IMilestone[];
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const mentorshipGoalSchema = new Schema<IMentorshipGoal>(
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
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    targetDate: {
      type: Date,
      required: true,
    },
    milestones: [milestoneSchema],
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
mentorshipGoalSchema.index({ mentor: 1, mentee: 1, status: 1 });
mentorshipGoalSchema.index({ mentee: 1, status: 1 });
mentorshipGoalSchema.index({ category: 1, status: 1 });

const MentorshipGoal = mongoose.model<IMentorshipGoal>(
  "MentorshipGoal",
  mentorshipGoalSchema,
);
export default MentorshipGoal;
