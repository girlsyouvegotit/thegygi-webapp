import mongoose, { Schema, Document } from "mongoose";

export type CategoryChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ICategoryChangeRequest extends Document {
  student: mongoose.Types.ObjectId;
  fromCategory: mongoose.Types.ObjectId | null;
  toCategory: mongoose.Types.ObjectId;
  reason: string;
  status: CategoryChangeRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categoryChangeRequestSchema = new Schema<ICategoryChangeRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fromCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    toCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true },
);

categoryChangeRequestSchema.index({ student: 1, status: 1 });
categoryChangeRequestSchema.index({ status: 1, createdAt: -1 });

const CategoryChangeRequest = mongoose.model<ICategoryChangeRequest>(
  "CategoryChangeRequest",
  categoryChangeRequestSchema,
);

export default CategoryChangeRequest;
