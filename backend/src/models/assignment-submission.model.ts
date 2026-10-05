import mongoose, { Schema, Document } from "mongoose";

export type SubmissionStatus = "submitted" | "graded" | "returned" | "late";
export type SubmissionType = "file" | "text" | "github_url";

export interface IAssignmentSubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  submissionType: SubmissionType;
  content: string;
  attachments: string[];
  submittedAt: Date;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  resubmittedAt?: Date;
  resubmissionCount: number;
  isLate: boolean;
  plagiarismScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      enum: ["file", "text", "github_url"],
      required: true,
      default: "text",
    },
    content: { type: String, required: true, maxlength: 40000 },
    attachments: [{ type: String, maxlength: 2000 }],
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["submitted", "graded", "returned", "late"],
      default: "submitted",
      index: true,
    },
    score: { type: Number, min: 0, default: null },
    feedback: { type: String, maxlength: 5000, default: "" },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
    resubmittedAt: { type: Date, default: null },
    resubmissionCount: { type: Number, default: 0, min: 0 },
    isLate: { type: Boolean, default: false },
    plagiarismScore: { type: Number, min: 0, max: 100, default: null },
  },
  { timestamps: true },
);

assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true },
);
assignmentSubmissionSchema.index({ assignment: 1, status: 1 });
assignmentSubmissionSchema.index({ student: 1, submittedAt: -1 });
assignmentSubmissionSchema.index({ gradedBy: 1, gradedAt: -1 });

assignmentSubmissionSchema.pre<IAssignmentSubmission>(
  "save",
  async function () {
    if (this.isNew) {
      const Assignment = mongoose.model("Assignment");
      const assignment = await Assignment.findById(this.assignment);
      if (assignment && this.submittedAt > assignment.dueDate) {
        this.isLate = true;
        this.status = "late";
      }
    }
  },
);

assignmentSubmissionSchema.methods.grade = async function (
  score: number,
  feedback: string,
  gradedBy: mongoose.Types.ObjectId,
): Promise<void> {
  this.score = score;
  this.feedback = feedback;
  this.gradedBy = gradedBy;
  this.gradedAt = new Date();
  this.status = "graded";
  await this.save();
};

assignmentSubmissionSchema.methods.returnForRevision = async function (
  feedback: string,
): Promise<void> {
  this.feedback = feedback;
  this.status = "returned";
  this.resubmissionCount += 1;
  await this.save();
};

const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  "AssignmentSubmission",
  assignmentSubmissionSchema,
);
export default AssignmentSubmission;
