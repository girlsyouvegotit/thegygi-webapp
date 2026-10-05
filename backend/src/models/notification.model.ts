import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
  | "class_scheduled"
  | "class_rescheduled"
  | "class_cancelled"
  | "class_starting"
  | "recording_available"
  | "quiz_available"
  | "quiz_result"
  | "assignment_created"
  | "assignment_due"
  | "assignment_graded"
  | "mentor_assigned"
  | "session_scheduled"
  | "session_reminder"
  | "mentor_feedback"
  | "goal_updated"
  | "community_mention"
  | "announcement"
  | "moderation_warning"
  | "moderation_message"
  | "account_suspended"
  | "account_banned"
  | "salary_paid"
  | "get_involved_inquiry";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "class_scheduled",
        "class_rescheduled",
        "class_cancelled",
        "class_starting",
        "recording_available",
        "quiz_available",
        "quiz_result",
        "assignment_created",
        "assignment_due",
        "assignment_graded",
        "mentor_assigned",
        "session_scheduled",
        "session_reminder",
        "mentor_feedback",
        "goal_updated",
        "community_mention",
        "announcement",
        "moderation_warning",
        "moderation_message",
        "account_suspended",
        "account_banned",
        "salary_paid",
        "get_involved_inquiry",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
export default Notification;
