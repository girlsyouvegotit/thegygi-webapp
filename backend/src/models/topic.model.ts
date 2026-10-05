import mongoose, { Schema, Document } from "mongoose";

export interface ITopic extends Document {
  title: string;
  outline: string[];
  content: Map<string, string>;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    outline: [
      {
        type: String,
        maxlength: 200,
      },
    ],
    content: {
      type: Map,
      of: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

const Topic = mongoose.model<ITopic>("Topic", topicSchema);
export default Topic;
