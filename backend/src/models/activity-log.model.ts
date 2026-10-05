import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  details?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  isAudit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, maxlength: 500 },
    details: { type: String, maxlength: 5000, default: "" },
    resourceType: { type: String, default: null, index: true },
    resourceId: { type: String, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    isAudit: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ user: 1, action: 1, createdAt: -1 });

// TTL only for non-audit logs. Audit logs (isAudit: true) are exempt.
activityLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
    name: "activity_log_ttl_90_days",
    partialFilterExpression: { isAudit: false },
  },
);

const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema,
);
export default ActivityLog;
