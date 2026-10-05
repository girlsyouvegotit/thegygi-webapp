import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  userName: string;
  joinedAt: Date;
  leftAt?: Date;
  attendancePercentage: number;
  isMuted?: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    connectionType?: string;
  };
}

export interface ISessionChatMessage {
  userId: mongoose.Types.ObjectId;
  userName: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "quiz" | "poll";
  metadata?: Record<string, any>;
}

export interface ILiveSession extends Document {
  classId: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  status: "live" | "ended" | "interrupted";
  participants: IParticipant[];
  chatMessages: ISessionChatMessage[];
  launchedQuizzes: mongoose.Types.ObjectId[];
  launchedPolls: mongoose.Types.ObjectId[];
  recordingStarted: boolean;
  recordingId?: mongoose.Types.ObjectId;
  totalDuration: number;
  maxParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isMuted: {
      type: Boolean,
      default: true,
    },
    isVideoOn: {
      type: Boolean,
      default: false,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
    deviceInfo: {
      platform: String,
      browser: String,
      connectionType: String,
    },
  },
  {
    _id: false,
  },
);

const chatMessageSchema = new Schema<ISessionChatMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["text", "system", "quiz", "poll"],
      default: "text",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const liveSessionSchema = new Schema<ILiveSession>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },
    tutor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["live", "ended", "interrupted"],
      default: "live",
      index: true,
    },
    participants: [participantSchema],
    chatMessages: [chatMessageSchema],
    launchedQuizzes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    launchedPolls: [
      {
        type: Schema.Types.ObjectId,
        ref: "Poll",
      },
    ],
    recordingStarted: {
      type: Boolean,
      default: false,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: "Recording",
      default: null,
    },
    totalDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 1,
      max: 500,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
liveSessionSchema.index({ classId: 1, status: 1 });
liveSessionSchema.index({ tutor: 1, status: 1 });
liveSessionSchema.index({ category: 1, startedAt: -1 });
liveSessionSchema.index({ "participants.userId": 1, status: 1 });

// Pre-save to calculate total duration
liveSessionSchema.pre<ILiveSession>("save", function (next) {
  if (this.endedAt && this.startedAt) {
    this.totalDuration = Math.round(
      (this.endedAt.getTime() - this.startedAt.getTime()) / 1000,
    );
  }
  next();
});

// Method to end session
liveSessionSchema.methods.endSession = async function (): Promise<void> {
  this.status = "ended";
  this.endedAt = new Date();
  this.totalDuration = Math.round(
    (this.endedAt.getTime() - this.startedAt.getTime()) / 1000,
  );

  // Calculate attendance percentages
  const totalDuration = this.totalDuration;
  this.participants.forEach((participant: IParticipant) => {
    if (participant.joinedAt && !participant.leftAt) {
      participant.attendancePercentage = 100;
    } else if (participant.joinedAt && participant.leftAt) {
      const participantDuration = Math.round(
        (participant.leftAt.getTime() - participant.joinedAt.getTime()) / 1000,
      );
      participant.attendancePercentage = Math.min(
        100,
        Math.round((participantDuration / totalDuration) * 100),
      );
    }
  });

  await this.save();
};

// Method to add chat message
liveSessionSchema.methods.addChatMessage = async function (
  userId: mongoose.Types.ObjectId,
  userName: string,
  message: string,
  type: string = "text",
): Promise<void> {
  this.chatMessages.push({
    userId,
    userName,
    message,
    timestamp: new Date(),
    type,
  });

  // Keep only last 500 messages to prevent document size issues
  if (this.chatMessages.length > 500) {
    this.chatMessages = this.chatMessages.slice(-500);
  }

  await this.save();
};

const LiveSession = mongoose.model<ILiveSession>(
  "LiveSession",
  liveSessionSchema,
);
export default LiveSession;
