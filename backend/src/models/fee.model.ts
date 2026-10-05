import mongoose, { Schema, Document } from "mongoose";

export interface IFee extends Document {
  student: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  status: "paid" | "pending" | "overdue";
  paymentDate?: Date;
  academicYear?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feeSchema = new Schema<IFee>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "overdue"],
      default: "pending",
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true },
);

// Compound indexes
feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ dueDate: 1, status: 1 });

const Fee = mongoose.model<IFee>("Fee", feeSchema);
export default Fee;
