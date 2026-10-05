import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureFlag {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  roles?: string[];
  categoryIds?: mongoose.Types.ObjectId[];
  rolloutPercent?: number;
}

export interface IKillSwitch {
  key: string;
  label: string;
  enabled: boolean;
}

export interface IExperiment {
  key: string;
  label: string;
  enabled: boolean;
  variants: string[];
}

export interface IStaffChangelogEntry {
  version: string;
  title: string;
  body: string;
  publishedAt: Date;
}

export interface IReportPreset {
  key: string;
  label: string;
  description: string;
}

export interface IWebhook {
  name: string;
  url: string;
  enabled: boolean;
  lastStatus?: string;
}

export interface IScheduledMaintenance {
  enabled: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  message?: string;
}

export interface IPlatformControl extends Document {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  bannerEnabled: boolean;
  bannerMessage?: string;
  bannerTone: "info" | "warning" | "critical";
  featureFlags: IFeatureFlag[];
  scheduledMaintenance: IScheduledMaintenance;
  ipBlocklist: string[];
  emailBlocklist: string[];
  killSwitches: IKillSwitch[];
  experiments: IExperiment[];
  staffChangelog: IStaffChangelogEntry[];
  reportPresets: IReportPreset[];
  webhooks: IWebhook[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
    roles: { type: [String], default: [] },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    rolloutPercent: { type: Number, min: 0, max: 100, default: undefined },
  },
  { _id: false },
);

const killSwitchSchema = new Schema<IKillSwitch>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const experimentSchema = new Schema<IExperiment>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    variants: { type: [String], default: [] },
  },
  { _id: false },
);

const staffChangelogSchema = new Schema<IStaffChangelogEntry>(
  {
    version: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const reportPresetSchema = new Schema<IReportPreset>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const webhookSchema = new Schema<IWebhook>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    lastStatus: { type: String, default: null },
  },
  { _id: false },
);

const scheduledMaintenanceSchema = new Schema<IScheduledMaintenance>(
  {
    enabled: { type: Boolean, default: false },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    message: { type: String, default: "" },
  },
  { _id: false },
);

const platformControlSchema = new Schema<IPlatformControl>(
  {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
    bannerEnabled: { type: Boolean, default: false },
    bannerMessage: { type: String, default: "" },
    bannerTone: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    featureFlags: { type: [featureFlagSchema], default: [] },
    scheduledMaintenance: {
      type: scheduledMaintenanceSchema,
      default: () => ({ enabled: false }),
    },
    ipBlocklist: { type: [String], default: [] },
    emailBlocklist: { type: [String], default: [] },
    killSwitches: { type: [killSwitchSchema], default: [] },
    experiments: { type: [experimentSchema], default: [] },
    staffChangelog: { type: [staffChangelogSchema], default: [] },
    reportPresets: { type: [reportPresetSchema], default: [] },
    webhooks: { type: [webhookSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const PlatformControl = mongoose.model<IPlatformControl>(
  "PlatformControl",
  platformControlSchema,
);

export default PlatformControl;

export const DEFAULT_FEATURE_FLAGS: IFeatureFlag[] = [
  {
    key: "live_classes",
    label: "Live classes",
    description: "Allow scheduling and joining live classes",
    enabled: true,
    roles: ["student", "tutor", "admin", "super_admin"],
  },
  {
    key: "mentorship",
    label: "Mentorship",
    description: "Mentorship booking and sessions",
    enabled: true,
    roles: ["student", "mentor", "admin", "super_admin"],
  },
  {
    key: "community",
    label: "Community",
    description: "Category community channels",
    enabled: true,
    roles: ["student", "tutor", "mentor", "writer", "admin", "super_admin"],
  },
  {
    key: "certificates",
    label: "Certificates",
    description: "Certificate issuance and downloads",
    enabled: true,
    roles: ["student", "admin", "super_admin"],
  },
  {
    key: "new_enrollments",
    label: "New enrollments",
    description: "Allow students to enroll in categories",
    enabled: true,
    roles: ["student", "admin", "super_admin"],
  },
];

export const DEFAULT_REPORT_PRESETS: IReportPreset[] = [
  {
    key: "census",
    label: "Census",
    description: "Active user counts by role",
  },
  {
    key: "finance_mtd",
    label: "Finance MTD",
    description: "Month-to-date fees, salaries, and expenses",
  },
  {
    key: "live_now",
    label: "Live now",
    description: "Active rooms and live classes snapshot",
  },
  {
    key: "risk_board",
    label: "Risk board",
    description: "Locked users, overdue fees, failed recordings",
  },
];
