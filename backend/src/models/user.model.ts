import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export enum UserRole {
  STUDENT = "student",
  TUTOR = "tutor",
  MENTOR = "mentor",
  WRITER = "writer",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export type userRoles =
  | "student"
  | "tutor"
  | "mentor"
  | "writer"
  | "admin"
  | "super_admin";

export type SuperAdminCapability =
  | "manage_admins"
  | "freeze_platform"
  | "view_raw_finance"
  | "force_payouts"
  | "impersonate_user"
  | "manage_feature_flags"
  | "manage_webhooks"
  | "purge_data"
  | "export_pii"
  | "override_photo_lock"
  | "moderate_users"
  | "ban_users";

export const ALL_SUPER_ADMIN_CAPABILITIES: SuperAdminCapability[] = [
  "manage_admins",
  "freeze_platform",
  "view_raw_finance",
  "force_payouts",
  "impersonate_user",
  "manage_feature_flags",
  "manage_webhooks",
  "purge_data",
  "export_pii",
  "override_photo_lock",
  "moderate_users",
  "ban_users",
];

export type ModerationStatus =
  | "clear"
  | "warned"
  | "suspended"
  | "banned"
  | "muted";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: userRoles;
  isActive: boolean;
  avatar?: string;
  coverImage?: string;
  avatarUpdatedAt?: Date;
  coverImageUpdatedAt?: Date;
  /** Community chat appearance */
  communityChatTheme?: string;
  communityChatWallpaper?: string;
  communityChatWallpaperUpdatedAt?: Date;
  /** Dashboard accent color theme */
  dashboardTheme?: string;
  bio?: string;
  /** Optional public social links (writers / profiles). */
  socialLinks?: {
    twitter?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    website?: string | null;
  };
  phone?: string;
  capabilities?: SuperAdminCapability[];
  categories: mongoose.Types.ObjectId[];
  assignedCategories?: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  lastLoginAt?: Date;
  lastPasswordChange?: Date;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  /** After an approved category change, student cannot request another until this date */
  categoryChangeLockedUntil?: Date | null;
  sessionsRevokedAt?: Date;
  deletedAt?: Date | null;
  moderationStatus?: ModerationStatus;
  strikeCount?: number;
  bannedAt?: Date | null;
  banReason?: string | null;
  suspendUntil?: Date | null;
  suspendReason?: string | null;
  mutedUntil?: Date | null;
  pushSubscriptions?: Array<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
    createdAt?: Date;
  }>;
  notificationPrefs?: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
  generatePasswordResetToken: () => string;
  generateEmailVerificationToken: () => string;
  incrementLoginAttempts: () => Promise<void>;
  resetLoginAttempts: () => Promise<void>;
  isLocked: () => boolean;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.STUDENT,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    avatar: { type: String, default: null },
    coverImage: { type: String, default: null },
    avatarUpdatedAt: { type: Date, default: null },
    coverImageUpdatedAt: { type: Date, default: null },
    communityChatTheme: {
      type: String,
      default: "gygi",
      maxlength: 40,
    },
    communityChatWallpaper: { type: String, default: null },
    communityChatWallpaperUpdatedAt: { type: Date, default: null },
    dashboardTheme: {
      type: String,
      default: "gygi-purple",
      maxlength: 40,
    },
    bio: { type: String, maxlength: 500, default: null },
    socialLinks: {
      twitter: { type: String, default: null, maxlength: 200 },
      linkedin: { type: String, default: null, maxlength: 200 },
      instagram: { type: String, default: null, maxlength: 200 },
      facebook: { type: String, default: null, maxlength: 200 },
      website: { type: String, default: null, maxlength: 200 },
    },
    phone: {
      type: String,
      default: null,
      match: [/^[+]?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    capabilities: {
      type: [String],
      default: [],
    },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category", index: true }],
    assignedCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    lastLoginAt: { type: Date },
    lastPasswordChange: { type: Date, default: Date.now },
    emailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },
    failedLoginAttempts: { type: Number, default: 0, min: 0, max: 10 },
    lockedUntil: { type: Date, default: null },
    categoryChangeLockedUntil: { type: Date, default: null, index: true },
    sessionsRevokedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    moderationStatus: {
      type: String,
      enum: ["clear", "warned", "suspended", "banned", "muted"],
      default: "clear",
      index: true,
    },
    strikeCount: { type: Number, default: 0, min: 0 },
    bannedAt: { type: Date, default: null },
    banReason: { type: String, default: null, maxlength: 1000 },
    suspendUntil: { type: Date, default: null },
    suspendReason: { type: String, default: null, maxlength: 1000 },
    mutedUntil: { type: Date, default: null },
    pushSubscriptions: {
      type: [
        {
          endpoint: { type: String, required: true },
          keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
          },
          userAgent: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.emailVerificationToken;
        delete ret.failedLoginAttempts;
        delete ret.lockedUntil;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, role: 1 });
userSchema.index({ categories: 1, role: 1 });
userSchema.index({ isActive: 1, emailVerified: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ sessionsRevokedAt: 1 });
userSchema.index({ isActive: 1, lastLoginAt: 1 });


userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.lastPasswordChange = new Date();
});

userSchema.methods.matchPassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = Math.min(this.failedLoginAttempts + 1, 10);
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  await this.save();
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

userSchema.statics.findActiveUsers = function (role?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (role) filter.role = role;
  return this.find(filter).select("-password");
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
