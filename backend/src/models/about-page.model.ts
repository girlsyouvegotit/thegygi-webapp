import mongoose, { Schema, Document } from "mongoose";

export interface AboutMilestone {
  year: string;
  title: string;
  description: string;
}

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutItem {
  title: string;
  description: string;
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutTeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export interface AboutCta {
  label: string;
  href: string;
}

export interface AboutSections {
  hero: {
    headline: string;
    subheadline: string;
    ctaLabel: string;
    ctaHref: string;
  };
  story: {
    title: string;
    body: string;
    milestones: AboutMilestone[];
  };
  mission: {
    mission: string;
    vision: string;
    values: AboutValue[];
  };
  whatWeDo: {
    title: string;
    body: string;
    items: AboutItem[];
  };
  impact: {
    title: string;
    body: string;
    stats: AboutStat[];
  };
  whoWeServe: {
    title: string;
    body: string;
  };
  team: {
    title: string;
    members: AboutTeamMember[];
  };
  partners: {
    title: string;
    names: string[];
  };
  getInvolved: {
    title: string;
    body: string;
    ctas: AboutCta[];
  };
}

export interface IAboutPage extends Document {
  status: "draft" | "published";
  sections: AboutSections;
  seoTitle?: string | null;
  seoDescription?: string | null;
  updatedBy?: mongoose.Types.ObjectId | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const aboutPageSchema = new Schema<IAboutPage>(
  {
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    sections: { type: Schema.Types.Mixed, required: true },
    seoTitle: { type: String, default: null, maxlength: 120 },
    seoDescription: { type: String, default: null, maxlength: 220 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const AboutPage = mongoose.model<IAboutPage>(
  "AboutPage",
  aboutPageSchema,
);
