import mongoose, { Schema, Document } from "mongoose";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "medium" | "high" | "critical";

export interface ISupportTicket extends Document {
  subject: string;
  body: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  requesterName?: string;
  requesterEmail?: string;
  user?: mongoose.Types.ObjectId | null;
  assignedTo?: mongoose.Types.ObjectId | null;
  slaDueAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    requesterName: { type: String, default: null, maxlength: 100 },
    requesterEmail: { type: String, default: null, lowercase: true, trim: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    slaDueAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ slaDueAt: 1, status: 1 });

const SupportTicket = mongoose.model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema,
);

export default SupportTicket;
