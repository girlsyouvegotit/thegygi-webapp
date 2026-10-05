import mongoose, { Schema, Document } from "mongoose";

export interface IOfficialMessage {
  sender: mongoose.Types.ObjectId;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: Date;
}

export interface IOfficialMessageThread extends Document {
  targetUser: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  moderationAction?: mongoose.Types.ObjectId | null;
  subject: string;
  status: "open" | "closed";
  messages: IOfficialMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const officialMessageSchema = new Schema<IOfficialMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: { type: String, required: true },
    senderName: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const officialMessageThreadSchema = new Schema<IOfficialMessageThread>(
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
    moderationAction: {
      type: Schema.Types.ObjectId,
      ref: "ModerationAction",
      default: null,
      index: true,
    },
    subject: { type: String, required: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    messages: { type: [officialMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

officialMessageThreadSchema.index({ targetUser: 1, lastMessageAt: -1 });
officialMessageThreadSchema.index({ actor: 1, lastMessageAt: -1 });

const OfficialMessageThread = mongoose.model<IOfficialMessageThread>(
  "OfficialMessageThread",
  officialMessageThreadSchema,
);

export default OfficialMessageThread;
