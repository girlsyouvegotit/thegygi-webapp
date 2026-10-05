import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityChannelRead extends Document {
  user: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  lastReadAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

const communityChannelReadSchema = new Schema<ICommunityChannelRead>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

communityChannelReadSchema.index(
  { user: 1, community: 1, channel: 1 },
  { unique: true },
);

const CommunityChannelRead = mongoose.model<ICommunityChannelRead>(
  "CommunityChannelRead",
  communityChannelReadSchema,
);

export default CommunityChannelRead;
