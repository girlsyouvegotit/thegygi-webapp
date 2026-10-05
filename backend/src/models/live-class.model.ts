import mongoose, { Schema, Document } from "mongoose";

export type ClassStatus =
  | "scheduled"
  | "live"
  | "ended"
  | "processing"
  | "recorded"
  | "cancelled";

export interface ILiveClass extends Document {
  category: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  scheduledDate: Date;
  duration: number; // in minutes
  status: ClassStatus;
  maxParticipants: number;
  sessionId?: mongoose.Types.ObjectId;
  recordingId?: mongoose.Types.ObjectId;
  isRecordable: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const liveClassSchema = new Schema<ILiveClass>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tutor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 300,
      default: 60,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "live",
        "ended",
        "processing",
        "recorded",
        "cancelled",
      ],
      default: "scheduled",
      index: true,
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 1,
      max: 500,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      default: null,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: "Recording",
      default: null,
    },
    isRecordable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
liveClassSchema.index({ category: 1, scheduledDate: 1, status: 1 });
liveClassSchema.index({ tutor: 1, scheduledDate: 1 });
liveClassSchema.index({ status: 1, scheduledDate: 1 });

const LiveClass = mongoose.model<ILiveClass>("LiveClass", liveClassSchema);
export default LiveClass;
