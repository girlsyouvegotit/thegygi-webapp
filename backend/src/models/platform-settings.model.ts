import mongoose, { Schema, Document } from "mongoose";

export type SettingsRole = "student" | "tutor" | "mentor" | "admin";

export interface IPermissionModule {
  module: string;
  actions: string[];
}

export interface ISchoolSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  primaryColor: string;
}

export interface INotificationSettings {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  events: Record<string, boolean>;
}

export interface ISecuritySettings {
  require2faForAdmins: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
  allowSelfRegistration: boolean;
  forcePasswordResetDays: number;
}

export interface IPlatformSettings extends Document {
  school: ISchoolSettings;
  notifications: INotificationSettings;
  security: ISecuritySettings;
  rolePermissions: Record<SettingsRole, IPermissionModule[]>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SCHOOL: ISchoolSettings = {
  name: "GYGI Platform",
  address: "",
  phone: "+234 906 495 0175",
  email: "contact@gygi.org",
  website: "",
  logo: "",
  primaryColor: "#c147e9",
};

export const DEFAULT_NOTIFICATION_EVENTS: Record<string, boolean> = {
  class_scheduled: true,
  class_starting: true,
  recording_available: true,
  quiz_result: true,
  assignment_graded: true,
  mentor_assigned: true,
  session_reminder: true,
  fee_reminder: true,
  platform_announcement: true,
  get_involved_inquiry: true,
};

export const DEFAULT_NOTIFICATIONS: INotificationSettings = {
  emailEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  events: { ...DEFAULT_NOTIFICATION_EVENTS },
};

export const DEFAULT_SECURITY: ISecuritySettings = {
  require2faForAdmins: false,
  sessionTimeoutMinutes: 480,
  maxLoginAttempts: 5,
  lockoutMinutes: 30,
  passwordMinLength: 8,
  requireStrongPassword: true,
  allowSelfRegistration: true,
  forcePasswordResetDays: 0,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<
  SettingsRole,
  IPermissionModule[]
> = {
  student: [
    { module: "dashboard", actions: ["read"] },
    { module: "categories", actions: ["read"] },
    { module: "classes", actions: ["read", "join"] },
    { module: "recordings", actions: ["read", "watch"] },
    { module: "quizzes", actions: ["read", "submit"] },
    { module: "assignments", actions: ["read", "submit"] },
    { module: "mentorship", actions: ["read"] },
    { module: "community", actions: ["read", "write"] },
  ],
  tutor: [
    { module: "dashboard", actions: ["read"] },
    { module: "categories", actions: ["read"] },
    {
      module: "classes",
      actions: ["create", "read", "update", "delete", "start", "end"],
    },
    { module: "recordings", actions: ["read", "watch"] },
    {
      module: "quizzes",
      actions: ["create", "read", "update", "delete", "launch"],
    },
    {
      module: "assignments",
      actions: ["create", "read", "update", "delete", "grade"],
    },
    { module: "community", actions: ["read", "write", "announce"] },
    { module: "analytics", actions: ["read"] },
  ],
  mentor: [
    { module: "dashboard", actions: ["read"] },
    { module: "mentorship", actions: ["create", "read", "update"] },
    { module: "community", actions: ["read", "write"] },
    { module: "analytics", actions: ["read"] },
  ],
  admin: [
    { module: "dashboard", actions: ["read"] },
    {
      module: "categories",
      actions: ["create", "read", "update", "delete", "assign"],
    },
    {
      module: "users",
      actions: ["create", "read", "update", "delete", "suspend"],
    },
    {
      module: "classes",
      actions: ["create", "read", "update", "delete", "start", "end"],
    },
    { module: "recordings", actions: ["read", "watch", "download", "delete"] },
    {
      module: "quizzes",
      actions: ["create", "read", "update", "delete", "launch"],
    },
    {
      module: "assignments",
      actions: ["create", "read", "update", "delete", "grade"],
    },
    {
      module: "mentorship",
      actions: ["create", "read", "update", "delete", "assign"],
    },
    { module: "community", actions: ["read", "write", "announce", "moderate"] },
    { module: "analytics", actions: ["read"] },
    { module: "finance", actions: ["create", "read", "update", "delete"] },
    { module: "settings", actions: ["read", "update"] },
  ],
};

const permissionModuleSchema = new Schema<IPermissionModule>(
  {
    module: { type: String, required: true },
    actions: { type: [String], default: [] },
  },
  { _id: false },
);

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    school: {
      name: { type: String, default: DEFAULT_SCHOOL.name },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      logo: { type: String, default: "" },
      primaryColor: { type: String, default: DEFAULT_SCHOOL.primaryColor },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      inAppEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: true },
      events: { type: Map, of: Boolean, default: () => DEFAULT_NOTIFICATION_EVENTS },
    },
    security: {
      require2faForAdmins: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 480 },
      maxLoginAttempts: { type: Number, default: 5 },
      lockoutMinutes: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      requireStrongPassword: { type: Boolean, default: true },
      allowSelfRegistration: { type: Boolean, default: true },
      forcePasswordResetDays: { type: Number, default: 0 },
    },
    rolePermissions: {
      student: { type: [permissionModuleSchema], default: () => DEFAULT_ROLE_PERMISSIONS.student },
      tutor: { type: [permissionModuleSchema], default: () => DEFAULT_ROLE_PERMISSIONS.tutor },
      mentor: { type: [permissionModuleSchema], default: () => DEFAULT_ROLE_PERMISSIONS.mentor },
      admin: { type: [permissionModuleSchema], default: () => DEFAULT_ROLE_PERMISSIONS.admin },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const PlatformSettings = mongoose.model<IPlatformSettings>(
  "PlatformSettings",
  platformSettingsSchema,
);

export default PlatformSettings;

export async function getOrCreatePlatformSettings() {
  let doc = await PlatformSettings.findOne();
  if (!doc) {
    doc = await PlatformSettings.create({
      school: DEFAULT_SCHOOL,
      notifications: DEFAULT_NOTIFICATIONS,
      security: DEFAULT_SECURITY,
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    });
  }
  return doc;
}
