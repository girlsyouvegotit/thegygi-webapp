import mongoose, { Schema, Document } from "mongoose";

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface ITestimonial extends Document {
  name: string;
  role: string;
  body: string;
  country: string;
  flag: string;
  rating: number;
  accent: string;
  accentLight: string;
  initials: string;
  student?: mongoose.Types.ObjectId | null;
  status: TestimonialStatus;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    country: { type: String, required: true, trim: true, maxlength: 80 },
    flag: { type: String, default: "🌍", maxlength: 8 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    accent: { type: String, default: "#c147e9" },
    accentLight: { type: String, default: "#f3e0fb" },
    initials: { type: String, required: true, maxlength: 4 },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

testimonialSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });

const Testimonial = mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
export default Testimonial;
