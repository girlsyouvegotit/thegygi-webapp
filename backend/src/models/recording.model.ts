import mongoose, { Schema, Document } from "mongoose";

export type RecordingStatus =
  "pending" | "processing" | "ready" | "failed" | "archived";

export interface IChapter {
  timestamp: string;
  title: string;
  duration: number;
  summary?: string;
}

export interface IPracticeQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: "ai-generated" | "manual";
  difficulty?: "easy" | "medium" | "hard";
}

export interface IRecording extends Document {
  classId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  date: Date;
  duration: number;
  storageUrl: string;
  thumbnailUrl: string;
  processingStatus: RecordingStatus;
  transcript: string;
  chapters: IChapter[];
  summary: string;
  aiNotes: string;
  practiceQuestions: IPracticeQuestion[];
  viewCount: number;
  downloadCount: number;
  lastDownloadedBy?: mongoose.Types.ObjectId;
  lastDownloadedAt?: Date;
  fileSize?: number;
  format?: string;
  resolution?: string;
  language?: string;
  processingError?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  /** Wall-clock when the browser MediaRecorder started (for chat sync). */
  recordingStartedAt?: Date;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  incrementViewCount: () => Promise<void>;
  incrementDownloadCount: (userId: mongoose.Types.ObjectId) => Promise<void>;
}

const chapterSchema = new Schema<IChapter>(
  {
    timestamp: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    duration: { type: Number, required: true, min: 0 },
    summary: { type: String, maxlength: 500, default: null },
  },
  { _id: false },
);

const practiceQuestionSchema = new Schema<IPracticeQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
    source: {
      type: String,
      enum: ["ai-generated", "manual"],
      default: "ai-generated",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false },
);

const recordingSchema = new Schema<IRecording>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    tutor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now },
    duration: { type: Number, default: 0, min: 0 },
    storageUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "failed", "archived"],
      default: "pending",
      index: true,
    },
    transcript: { type: String, default: "" },
    chapters: { type: [chapterSchema], default: [] },
    summary: { type: String, default: "" },
    aiNotes: { type: String, default: "" },
    practiceQuestions: { type: [practiceQuestionSchema], default: [] },
    viewCount: { type: Number, default: 0, min: 0 },
    downloadCount: { type: Number, default: 0, min: 0 },
    lastDownloadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastDownloadedAt: { type: Date, default: null },
    fileSize: { type: Number, default: null },
    format: { type: String, default: "webm" },
    resolution: { type: String, default: "720p" },
    language: { type: String, default: "en" },
    processingError: { type: String, default: null },
    processingStartedAt: { type: Date, default: null },
    processingCompletedAt: { type: Date, default: null },
    recordingStartedAt: { type: Date, default: null },
    isPublic: { type: Boolean, default: false, index: true },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

recordingSchema.index({ category: 1, processingStatus: 1, date: -1 });
recordingSchema.index({ tutor: 1, date: -1 });
recordingSchema.index({ classId: 1, processingStatus: 1 });
recordingSchema.index({ isPublic: 1, date: -1 });
recordingSchema.index({ tags: 1, processingStatus: 1 });

recordingSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  return Math.floor((now.getTime() - this.createdAt.getTime()) / 86400000);
});

recordingSchema.methods.incrementViewCount = async function (): Promise<void> {
  await Recording.updateOne({ _id: this._id }, { $inc: { viewCount: 1 } });
};

recordingSchema.methods.incrementDownloadCount = async function (
  userId: mongoose.Types.ObjectId,
): Promise<void> {
  await Recording.updateOne(
    { _id: this._id },
    {
      $inc: { downloadCount: 1 },
      $set: { lastDownloadedBy: userId, lastDownloadedAt: new Date() },
    },
  );
};

recordingSchema.methods.markAsProcessing = async function (): Promise<void> {
  this.processingStatus = "processing";
  this.processingStartedAt = new Date();
  await this.save();
};

recordingSchema.methods.markAsReady = async function (): Promise<void> {
  this.processingStatus = "ready";
  this.processingCompletedAt = new Date();
  await this.save();
};

recordingSchema.methods.markAsFailed = async function (
  error: string,
): Promise<void> {
  this.processingStatus = "failed";
  this.processingError = error;
  this.processingCompletedAt = new Date();
  await this.save();
};

const Recording = mongoose.model<IRecording>("Recording", recordingSchema);
export default Recording;
