import mongoose, { Schema, Document } from "mongoose";

export interface IExpense extends Document {
  date: Date;
  category: "salary" | "utilities" | "maintenance" | "supplies" | "other";
  description: string;
  amount: number;
  academicYear?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["salary", "utilities", "maintenance", "supplies", "other"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
  },
  { timestamps: true },
);

// Compound indexes
expenseSchema.index({ date: -1, category: 1 });
expenseSchema.index({ category: 1, amount: 1 });

const Expense = mongoose.model<IExpense>("Expense", expenseSchema);
export default Expense;
