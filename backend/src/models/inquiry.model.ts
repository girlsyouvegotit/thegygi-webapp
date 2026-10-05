import mongoose, { Schema, Document } from "mongoose";

export const GET_INVOLVED_INTERESTS = [
  "Volunteer",
  "Donate",
  "Partner with Us",
  "Become a Mentor",
] as const;

export type GetInvolvedInterest = (typeof GET_INVOLVED_INTERESTS)[number];

export interface IInquiry extends Document {
  name: string;
  email: string;
  interest: GetInvolvedInterest;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    interest: {
      type: String,
      enum: GET_INVOLVED_INTERESTS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

inquirySchema.index({ createdAt: -1 });

const Inquiry = mongoose.model<IInquiry>("Inquiry", inquirySchema);
export default Inquiry;
