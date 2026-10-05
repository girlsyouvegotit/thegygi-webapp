import mongoose, { Schema, Document } from "mongoose";

export interface ITestimonialAdminReply {
  body: string;
  authorName: string;
  repliedBy?: mongoose.Types.ObjectId | null;
  repliedAt: Date;
}

export interface ITestimonialComment extends Document {
  testimonial: mongoose.Types.ObjectId;
  authorName: string;
  body: string;
  isHidden: boolean;
  adminReply?: ITestimonialAdminReply | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminReplySchema = new Schema<ITestimonialAdminReply>(
  {
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    repliedAt: { type: Date, required: true },
  },
  { _id: false },
);

const testimonialCommentSchema = new Schema<ITestimonialComment>(
  {
    testimonial: {
      type: Schema.Types.ObjectId,
      ref: "Testimonial",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminReply: {
      type: adminReplySchema,
      default: null,
    },
  },
  { timestamps: true },
);

testimonialCommentSchema.index({ testimonial: 1, createdAt: -1 });

const TestimonialComment = mongoose.model<ITestimonialComment>(
  "TestimonialComment",
  testimonialCommentSchema,
);

export default TestimonialComment;
