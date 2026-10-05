import mongoose, { Schema, Document } from "mongoose";

export type EnrollmentStatus = "active" | "completed" | "dropped" | "suspended";

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: EnrollmentStatus;
  completedAt?: Date;
  droppedAt?: Date;
  /** Deadline for completing the learning phase (enrolledAt + category.durationWeeks) */
  phaseEndsAt?: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
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
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "dropped", "suspended"],
      default: "active",
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    droppedAt: {
      type: Date,
      default: null,
    },
    phaseEndsAt: {
      type: Date,
      default: null,
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

// Unique: One enrollment per student per category
enrollmentSchema.index({ student: 1, category: 1 }, { unique: true });

// Compound indexes
enrollmentSchema.index({ category: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

const Enrollment = mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
export default Enrollment;
