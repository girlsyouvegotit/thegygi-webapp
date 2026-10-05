import mongoose, { Schema, Document } from "mongoose";

export interface IVisual extends Document {
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  generatedBy: mongoose.Types.ObjectId;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const visualSchema = new Schema<IVisual>(
  {
    prompt: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Indexes
visualSchema.index({ generatedBy: 1, createdAt: -1 });
visualSchema.index({ isSaved: 1 });

const Visual = mongoose.model<IVisual>("Visual", visualSchema);
export default Visual;
