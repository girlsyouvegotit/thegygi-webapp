import mongoose, { Schema, Document } from "mongoose";

export type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "live"
  | "completed"
  | "cancelled"
  | "rescheduled";
export type SessionType = "one_on_one" | "group";
export type MeetingPlatform = "zoom" | "google_meet" | "teams" | "in_app";

export interface IMentorshipSession extends Document {
  mentor: mongoose.Types.ObjectId;
  mentee: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  type: SessionType;
  topic: string;
  description: string;
  scheduledDate: Date;
  duration: number;
  status: SessionStatus;
  notes?: string;
  recordingUrl?: string;
  meetingUrl?: string;
  meetingPlatform?: MeetingPlatform;
  reminderSent: boolean;
  reminderSentAt?: Date;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mentorshipSessionSchema = new Schema<IMentorshipSession>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentee: {
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
    type: {
      type: String,
      enum: ["one_on_one", "group"],
      default: "one_on_one",
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: { type: String, maxlength: 2000, default: "" },
    scheduledDate: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, min: 15, max: 180, default: 45 },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "live",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "scheduled",
      index: true,
    },
    notes: { type: String, maxlength: 5000, default: "" },
    recordingUrl: { type: String, default: null },
    meetingUrl: { type: String, default: null },
    meetingPlatform: {
      type: String,
      enum: ["zoom", "google_meet", "teams", "in_app"],
      default: "in_app",
    },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date, default: null },
    cancellationReason: { type: String, maxlength: 500, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

mentorshipSessionSchema.index({ mentor: 1, scheduledDate: 1, status: 1 });
mentorshipSessionSchema.index({ mentee: 1, scheduledDate: 1 });
mentorshipSessionSchema.index({ category: 1, scheduledDate: 1 });
mentorshipSessionSchema.index({ status: 1, reminderSent: 1 });

mentorshipSessionSchema.pre<IMentorshipSession>("save", function (next) {
  if (this.isNew && this.scheduledDate <= new Date()) {
    next(new Error("Scheduled date must be in the future"));
  }

  if (this.mentor.toString() === this.mentee.toString()) {
    next(new Error("Mentor and mentee cannot be the same person"));
  }

  next();
});

mentorshipSessionSchema.virtual("isUpcoming").get(function () {
  return this.status === "scheduled" && this.scheduledDate > new Date();
});

mentorshipSessionSchema.virtual("isPast").get(function () {
  return this.scheduledDate < new Date();
});

const MentorshipSession = mongoose.model<IMentorshipSession>(
  "MentorshipSession",
  mentorshipSessionSchema,
);

export default MentorshipSession;
