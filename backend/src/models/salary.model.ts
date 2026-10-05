import mongoose, { Schema, Document } from "mongoose";

export interface ISalary extends Document {
  employee: mongoose.Types.ObjectId;
  amount: number;
  month: number;
  year: number;
  status: "paid" | "pending";
  paymentDate?: Date;
  academicYear?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const salarySchema = new Schema<ISalary>(
  {
    employee: {
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
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
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
  },
  { timestamps: true },
);

// Unique: One salary per employee per month/year
salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Compound indexes
salarySchema.index({ status: 1, year: 1, month: 1 });

const Salary = mongoose.model<ISalary>("Salary", salarySchema);
export default Salary;
