import mongoose, { Schema, Document } from "mongoose";

export interface IAcademicYear extends Document {
  name: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const AcademicYear = mongoose.model<IAcademicYear>(
  "AcademicYear",
  academicYearSchema,
);
export default AcademicYear;
