import mongoose, { Schema, Document } from "mongoose";

export type RoomStatus = "waiting" | "active" | "ended" | "cancelled";
export type RoomType = "class" | "meeting" | "mentorship" | "office_hours";
export type ParticipantRole =
  | "host"
  | "co_host"
  | "presenter"
  | "participant"
  | "observer";
export type ParticipantStatus =
  | "invited"
  | "joined"
  | "left"
  | "rejected"
  | "disconnected";
export type DeviceType = "camera" | "microphone" | "screen" | "speaker";

export interface IRoomParticipant {
  userId: mongoose.Types.ObjectId;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  connectionId?: string;
  deviceInfo: {
    camera?: string;
    microphone?: string;
    speaker?: string;
  };
}

export interface IRoomSettings {
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  allowRaiseHand: boolean;
  allowBreakoutRooms: boolean;
  allowReactions: boolean;
  allowWhiteboard: boolean;
  allowFileShare: boolean;
  maxParticipants: number;
  autoRecord: boolean;
  waitingRoomEnabled: boolean;
  muteOnJoin: boolean;
  videoOnJoin: boolean;
}

export interface IRoomRecording {
  startedAt: Date;
  endedAt?: Date;
  recordingId?: mongoose.Types.ObjectId;
  status: "recording" | "processing" | "completed" | "failed";
  storageUrl?: string;
}

export interface IBreakoutRoom {
  name: string;
  participants: mongoose.Types.ObjectId[];
  startedAt: Date;
  endedAt?: Date;
  status: "active" | "ended";
}

export interface IVideoRoom extends Document {
  name: string;
  type: RoomType;
  status: RoomStatus;
  host: mongoose.Types.ObjectId;
  coHosts: mongoose.Types.ObjectId[];
  participants: IRoomParticipant[];
  settings: IRoomSettings;
  sessionId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  mentorshipSessionId?: mongoose.Types.ObjectId;
  roomToken: string;
  roomUrl: string;
  recording?: IRoomRecording;
  breakoutRooms: IBreakoutRoom[];
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  participantCount: number;
  maxDuration: number;
  isRecorded: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IRoomParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["host", "co_host", "presenter", "participant", "observer"],
      default: "participant",
    },
    status: {
      type: String,
      enum: ["invited", "joined", "left", "rejected", "disconnected"],
      default: "invited",
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
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
    connectionId: {
      type: String,
      default: null,
    },
    deviceInfo: {
      camera: String,
      microphone: String,
      speaker: String,
    },
  },
  {
    _id: false,
  },
);

const roomSettingsSchema = new Schema<IRoomSettings>(
  {
    allowChat: {
      type: Boolean,
      default: true,
    },
    allowScreenShare: {
      type: Boolean,
      default: true,
    },
    allowRecording: {
      type: Boolean,
      default: true,
    },
    allowRaiseHand: {
      type: Boolean,
      default: true,
    },
    allowBreakoutRooms: {
      type: Boolean,
      default: false,
    },
    allowReactions: {
      type: Boolean,
      default: true,
    },
    allowWhiteboard: {
      type: Boolean,
      default: false,
    },
    allowFileShare: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 2,
      max: 1000,
    },
    autoRecord: {
      type: Boolean,
      default: false,
    },
    waitingRoomEnabled: {
      type: Boolean,
      default: false,
    },
    muteOnJoin: {
      type: Boolean,
      default: true,
    },
    videoOnJoin: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const recordingSchema = new Schema<IRoomRecording>(
  {
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: "Recording",
      default: null,
    },
    status: {
      type: String,
      enum: ["recording", "processing", "completed", "failed"],
      default: "recording",
    },
    storageUrl: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const breakoutRoomSchema = new Schema<IBreakoutRoom>(
  {
    name: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
      enum: ["active", "ended"],
      default: "active",
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

const videoRoomSchema = new Schema<IVideoRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["class", "meeting", "mentorship", "office_hours"],
      required: true,
      default: "meeting",
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "ended", "cancelled"],
      default: "waiting",
      index: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coHosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    participants: [participantSchema],
    settings: {
      type: roomSettingsSchema,
      default: () => ({}),
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "LiveSession",
      default: null,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "LiveClass",
      default: null,
    },
    mentorshipSessionId: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipSession",
      default: null,
    },
    roomToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roomUrl: {
      type: String,
      required: true,
    },
    recording: {
      type: recordingSchema,
      default: null,
    },
    breakoutRooms: [breakoutRoomSchema],
    scheduledStartTime: {
      type: Date,
      index: true,
    },
    scheduledEndTime: {
      type: Date,
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    actualEndTime: {
      type: Date,
      default: null,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDuration: {
      type: Number,
      default: 120,
      min: 15,
      max: 480,
    },
    isRecorded: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Indexes
videoRoomSchema.index({ status: 1, scheduledStartTime: 1 });
videoRoomSchema.index({ host: 1, status: 1 });
videoRoomSchema.index({ type: 1, isActive: 1 });
videoRoomSchema.index({ "participants.userId": 1, status: 1 });
videoRoomSchema.index({ classId: 1, status: 1 });
videoRoomSchema.index({ mentorshipSessionId: 1, status: 1 });

// Virtual for active participant count
videoRoomSchema.virtual("activeParticipantCount").get(function () {
  return this.participants.filter((p) => p.status === "joined").length;
});

// Virtual for isRoomFull
videoRoomSchema.virtual("isRoomFull").get(function () {
  return this.participantCount >= this.settings.maxParticipants;
});

// Pre-save middleware to update participant count
videoRoomSchema.pre<IVideoRoom>("save", function (next) {
  if (this.isModified("participants")) {
    this.participantCount = this.participants.filter(
      (p) => p.status === "joined",
    ).length;
  }
  next();
});

// Method to check if user is in room
videoRoomSchema.methods.isUserInRoom = function (
  userId: mongoose.Types.ObjectId,
): boolean {
  return this.participants.some(
    (p) => p.userId.toString() === userId.toString() && p.status === "joined",
  );
};

// Method to get participant by user ID
videoRoomSchema.methods.getParticipant = function (
  userId: mongoose.Types.ObjectId,
): IRoomParticipant | undefined {
  return this.participants.find(
    (p) => p.userId.toString() === userId.toString(),
  );
};

// Method to check if room is at capacity
videoRoomSchema.methods.isAtCapacity = function (): boolean {
  const activeParticipants = this.participants.filter(
    (p) => p.status === "joined",
  ).length;
  return activeParticipants >= this.settings.maxParticipants;
};

// Method to add participant
videoRoomSchema.methods.addParticipant = async function (
  userId: mongoose.Types.ObjectId,
  role: ParticipantRole = "participant",
): Promise<void> {
  const existingParticipant = this.getParticipant(userId);

  if (existingParticipant) {
    existingParticipant.status = "joined";
    existingParticipant.joinedAt = new Date();
    existingParticipant.role = role;
  } else {
    this.participants.push({
      userId,
      role,
      status: "joined",
      joinedAt: new Date(),
      isMuted: this.settings.muteOnJoin,
      isVideoOn: this.settings.videoOnJoin,
      isScreenSharing: false,
    });
  }

  this.participantCount = this.participants.filter(
    (p) => p.status === "joined",
  ).length;
};

// Method to remove participant
videoRoomSchema.methods.removeParticipant = function (
  userId: mongoose.Types.ObjectId,
): void {
  const participant = this.getParticipant(userId);

  if (participant) {
    participant.status = "left";
    participant.leftAt = new Date();
    participant.isMuted = true;
    participant.isVideoOn = false;
    participant.isScreenSharing = false;

    this.participantCount = this.participants.filter(
      (p) => p.status === "joined",
    ).length;
  }
};

// Method to start recording
videoRoomSchema.methods.startRecording = function (
  recordingId?: mongoose.Types.ObjectId,
): void {
  this.isRecorded = true;
  this.recording = {
    startedAt: new Date(),
    recordingId: recordingId || null,
    status: "recording",
  };
};

// Method to stop recording
videoRoomSchema.methods.stopRecording = function (storageUrl?: string): void {
  if (this.recording) {
    this.recording.endedAt = new Date();
    this.recording.status = storageUrl ? "completed" : "processing";
    if (storageUrl) {
      this.recording.storageUrl = storageUrl;
    }
  }
};

// Create and export the model
const VideoRoom = mongoose.model<IVideoRoom>("VideoRoom", videoRoomSchema);
export default VideoRoom;
