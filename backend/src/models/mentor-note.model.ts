import mongoose, { Schema, Document } from "mongoose";

export interface IMentorNote extends Document {
  mentor: mongoose.Types.ObjectId;
  mentee: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mentorNoteSchema = new Schema<IMentorNote>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mentee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipSession",
      default: null,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
mentorNoteSchema.index({ mentor: 1, mentee: 1, createdAt: -1 });
mentorNoteSchema.index({ mentee: 1, createdAt: -1 });
mentorNoteSchema.index({ sessionId: 1 });

const MentorNote = mongoose.model<IMentorNote>("MentorNote", mentorNoteSchema);
export default MentorNote;
