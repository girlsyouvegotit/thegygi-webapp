import mongoose, { Schema, Document } from "mongoose";

export type ModerationActionType =
  | "message"
  | "warning"
  | "suspend"
  | "unsuspend"
  | "ban"
  | "unban"
  | "mute"
  | "unmute";

export type ModerationSeverity = "notice" | "warning" | "final_warning" | "critical";

export interface IModerationAction extends Document {
  targetUser: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: ModerationActionType;
  severity?: ModerationSeverity;
  reason: string;
  internalNote?: string;
  messageTitle?: string;
  messageBody?: string;
  startsAt: Date;
  endsAt?: Date | null;
  status: "active" | "lifted" | "expired";
  strikeDelta: number;
  createdAt: Date;
  updatedAt: Date;
}

const moderationActionSchema = new Schema<IModerationAction>(
  {
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "message",
        "warning",
        "suspend",
        "unsuspend",
        "ban",
        "unban",
        "mute",
        "unmute",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["notice", "warning", "final_warning", "critical"],
      default: "warning",
    },
    reason: { type: String, required: true, maxlength: 1000 },
    internalNote: { type: String, default: "", maxlength: 2000 },
    messageTitle: { type: String, default: "", maxlength: 200 },
    messageBody: { type: String, default: "", maxlength: 2000 },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "lifted", "expired"],
      default: "active",
      index: true,
    },
    strikeDelta: { type: Number, default: 0 },
  },
  { timestamps: true },
);

moderationActionSchema.index({ targetUser: 1, createdAt: -1 });
moderationActionSchema.index({ type: 1, createdAt: -1 });

const ModerationAction = mongoose.model<IModerationAction>(
  "ModerationAction",
  moderationActionSchema,
);

export default ModerationAction;
