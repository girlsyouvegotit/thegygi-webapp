import mongoose, { Schema, Document } from "mongoose";

export interface ICompletionRules {
  attendanceWeight: number;
  quizWeight: number;
  assignmentWeight: number;
  passThreshold: number;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  bannerImage?: string;
  isActive: boolean;
  tutors: mongoose.Types.ObjectId[];
  mentors: mongoose.Types.ObjectId[];
  students: mongoose.Types.ObjectId[];
  communityId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  /** Learning-phase length; used to set Enrollment.phaseEndsAt */
  durationWeeks?: number | null;
  certificateEnabled: boolean;
  certificateTitle?: string | null;
  completionRules: ICompletionRules;
  metadata?: {
    color?: string;
    tags?: string[];
    level?: "beginner" | "intermediate" | "advanced";
    prerequisites?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    icon: {
      type: String,
      default: null,
    },
    bannerImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    tutors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    mentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    durationWeeks: {
      type: Number,
      default: null,
      min: 1,
      max: 104,
    },
    certificateEnabled: {
      type: Boolean,
      default: true,
    },
    certificateTitle: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    completionRules: {
      attendanceWeight: { type: Number, default: 40, min: 0, max: 100 },
      quizWeight: { type: Number, default: 30, min: 0, max: 100 },
      assignmentWeight: { type: Number, default: 30, min: 0, max: 100 },
      passThreshold: { type: Number, default: 100, min: 1, max: 100 },
    },
    metadata: {
      color: {
        type: String,
        default: "#c147e9",
      },
      tags: [String],
      level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
      },
      prerequisites: [String],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // ONLY delete __v, KEEP _id
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Virtual fields
categorySchema.virtual("studentCount").get(function () {
  return this.students?.length || 0;
});

categorySchema.virtual("tutorCount").get(function () {
  return this.tutors?.length || 0;
});

categorySchema.virtual("mentorCount").get(function () {
  return this.mentors?.length || 0;
});

// Compound indexes
categorySchema.index({ isActive: 1, name: 1 });
categorySchema.index({ tutors: 1, isActive: 1 });
categorySchema.index({ mentors: 1, isActive: 1 });

// Pre-save to generate slug if not provided
categorySchema.pre<ICategory>("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Static method to get active categories with counts
categorySchema.statics.getActiveCategoriesWithCounts = async function () {
  return await this.find({ isActive: true })
    .select("name slug description icon bannerImage metadata")
    .lean();
};

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;
