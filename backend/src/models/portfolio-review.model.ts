import mongoose, { Schema, Document } from "mongoose";

export type PortfolioReviewStatus = "pending" | "reviewed" | "needs_changes";

export interface IPortfolioReview extends Document {
  student: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId | null;
  title: string;
  url: string;
  notes?: string;
  status: PortfolioReviewStatus;
  feedback?: string;
  reviewer?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioReviewSchema = new Schema<IPortfolioReview>(
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
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "needs_changes"],
      default: "pending",
      index: true,
    },
    feedback: { type: String, trim: true, maxlength: 4000, default: "" },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

portfolioReviewSchema.index({ student: 1, createdAt: -1 });

const PortfolioReview = mongoose.model<IPortfolioReview>(
  "PortfolioReview",
  portfolioReviewSchema,
);
export default PortfolioReview;
