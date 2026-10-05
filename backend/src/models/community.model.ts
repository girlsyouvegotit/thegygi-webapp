import mongoose, { Schema, Document } from "mongoose";

export type ChannelType =
  | "general"
  | "announcements"
  | "learning"
  | "mentorship"
  | "alumni"
  | "self"
  | "dm";

export interface IChannel {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: ChannelType;
  description?: string;
  /** Owner of a private `self` channel — only that user can see/post. */
  owner?: mongoose.Types.ObjectId | null;
  /** Participants of a 1:1 `dm` channel within the community. */
  participants?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface ICommunity extends Document {
  category: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  channels: IChannel[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "general",
        "announcements",
        "learning",
        "mentorship",
        "alumni",
        "self",
        "dm",
      ],
      required: true,
      default: "general",
    },
    description: {
      type: String,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const communitySchema = new Schema<ICommunity>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      unique: true,
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    channels: {
      type: [channelSchema],
      default: () => [
        {
          name: "general",
          type: "general",
          description: "General discussion",
        },
        {
          name: "announcements",
          type: "announcements",
          description: "Important announcements",
        },
        {
          name: "learning",
          type: "learning",
          description: "Class discussions and questions",
        },
        {
          name: "mentorship",
          type: "mentorship",
          description: "Mentorship discussions",
        },
        {
          name: "alumni",
          type: "alumni",
          description: "For graduates — career wins, job tips, and alumni support",
        },
      ],
    } as any,
    isActive: {
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

communitySchema.index({ category: 1, isActive: 1 });
communitySchema.index({ members: 1 });
communitySchema.index({ "channels.owner": 1, "channels.type": 1 });
communitySchema.index({ "channels.participants": 1, "channels.type": 1 });

const Community = mongoose.model<ICommunity>("Community", communitySchema);
export default Community;
