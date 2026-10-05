import mongoose, { Schema, Document } from "mongoose";

export interface ITestimonialLike extends Document {
  testimonial: mongoose.Types.ObjectId;
  clientKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialLikeSchema = new Schema<ITestimonialLike>(
  {
    testimonial: {
      type: Schema.Types.ObjectId,
      ref: "Testimonial",
      required: true,
      index: true,
    },
    clientKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true },
);

testimonialLikeSchema.index(
  { testimonial: 1, clientKey: 1 },
  { unique: true },
);

const TestimonialLike = mongoose.model<ITestimonialLike>(
  "TestimonialLike",
  testimonialLikeSchema,
);

export default TestimonialLike;
