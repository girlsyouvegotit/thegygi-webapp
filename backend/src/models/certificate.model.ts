import mongoose, { Schema, Document } from "mongoose";

export type CertificateStatus = "issued" | "revoked";

export interface ICertificate extends Document {
  student: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  certificateNumber: string;
  title: string;
  /** Snapshot at issue time — preserved if profile/category later change */
  studentFullName: string;
  studentEmail: string;
  categoryName: string;
  categoryDescription?: string | null;
  enrolledAt: Date;
  completedAt: Date;
  durationWeeks?: number | null;
  phaseEndsAt?: Date | null;
  issuedAt: Date;
  status: CertificateStatus;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    studentFullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    categoryDescription: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    enrolledAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    durationWeeks: {
      type: Number,
      default: null,
    },
    phaseEndsAt: {
      type: Date,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["issued", "revoked"],
      default: "issued",
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

certificateSchema.index({ student: 1, status: 1 });
certificateSchema.index({ category: 1, status: 1 });

const Certificate = mongoose.model<ICertificate>(
  "Certificate",
  certificateSchema,
);
export default Certificate;
