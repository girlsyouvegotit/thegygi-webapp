import mongoose, { Schema, Document } from "mongoose";

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface IAttendance extends Document {
  classId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  joinedAt: Date;
  leftAt: Date;
  attendancePercentage: number;
  status: AttendanceStatus;
  markedBy: "system" | "tutor" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      required: true,
      index: true,
    },
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
    joinedAt: {
      type: Date,
      required: true,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent", "excused"],
      default: "present",
      index: true,
    },
    markedBy: {
      type: String,
      enum: ["system", "tutor", "admin"],
      default: "system",
    },
  },
  {
    timestamps: true,
  },
);

// Unique: One attendance record per student per session
attendanceSchema.index({ sessionId: 1, student: 1 }, { unique: true });

// Compound indexes
attendanceSchema.index({ student: 1, createdAt: -1 });
attendanceSchema.index({ classId: 1, status: 1 });
attendanceSchema.index({ category: 1, createdAt: -1 });

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
export default Attendance;
