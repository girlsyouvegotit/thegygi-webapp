import mongoose, { Schema, Document } from "mongoose";

export interface IMessageReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IMessageReport {
  user: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
}

export interface ICommunityMessage extends Document {
  community: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  attachments: string[];
  isAnnouncement: boolean;
  isPinned: boolean;
  /** Quoted / in-channel reply */
  replyTo?: mongoose.Types.ObjectId | null;
  /** Original author name snapshot when forwarded */
  forwardedFrom?: {
    messageId?: mongoose.Types.ObjectId | null;
    userName: string;
    preview: string;
  } | null;
  /** Soft-hide for specific users (delete for me) */
  deletedFor: mongoose.Types.ObjectId[];
  /** Per-user stars */
  starredBy: mongoose.Types.ObjectId[];
  /** Quick emoji reactions */
  reactions: IMessageReaction[];
  reports: IMessageReport[];
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  /** Delete for everyone */
  deletedAt?: Date;
}

const reactionSchema = new Schema<IMessageReaction>(
  {
    emoji: { type: String, required: true, maxlength: 16 },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false },
);

const reportSchema = new Schema<IMessageReport>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const communityMessageSchema = new Schema<ICommunityMessage>(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    attachments: [{ type: String }],
    isAnnouncement: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false, index: true },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "CommunityMessage",
      default: null,
    },
    forwardedFrom: {
      type: {
        messageId: { type: Schema.Types.ObjectId, default: null },
        userName: { type: String, default: "" },
        preview: { type: String, default: "" },
      },
      default: null,
    },
    deletedFor: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    starredBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    reactions: { type: [reactionSchema], default: [] },
    reports: { type: [reportSchema], default: [] },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

communityMessageSchema.index({ community: 1, channel: 1, createdAt: -1 });
communityMessageSchema.index({ user: 1, createdAt: -1 });
communityMessageSchema.index({ isAnnouncement: 1, createdAt: -1 });

const CommunityMessage = mongoose.model<ICommunityMessage>(
  "CommunityMessage",
  communityMessageSchema,
);
export default CommunityMessage;
