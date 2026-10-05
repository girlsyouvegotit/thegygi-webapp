import mongoose, { Schema, Document } from "mongoose";

export interface IMentorAssignment extends Document {
  mentor: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  mentees: mongoose.Types.ObjectId[];
  maxMentees: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mentorAssignmentSchema = new Schema<IMentorAssignment>(
  {
    mentor: {
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
    mentees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxMentees: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
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

// Unique: One assignment per mentor per category
mentorAssignmentSchema.index({ mentor: 1, category: 1 }, { unique: true });

// Compound indexes
mentorAssignmentSchema.index({ category: 1, isActive: 1 });
mentorAssignmentSchema.index({ mentees: 1 });

const MentorAssignment = mongoose.model<IMentorAssignment>(
  "MentorAssignment",
  mentorAssignmentSchema,
);
export default MentorAssignment;
