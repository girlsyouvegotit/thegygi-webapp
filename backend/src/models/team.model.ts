import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  logo?: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    logo: {
      type: String,
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
teamSchema.index({ members: 1 });
teamSchema.index({ createdBy: 1 });

const Team = mongoose.model<ITeam>("Team", teamSchema);
export default Team;
