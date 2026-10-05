import mongoose, { Schema, Document } from "mongoose";

export type BlogPostStatus = "draft" | "published" | "archived";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  status: BlogPostStatus;
  author: mongoose.Types.ObjectId;
  publishedAt?: Date | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: String, required: true },
    coverImage: { type: String, default: null },
    category: {
      type: String,
      default: "Education",
      trim: true,
      maxlength: 80,
      index: true,
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    publishedAt: { type: Date, default: null },
    seoTitle: { type: String, default: null, maxlength: 120 },
    seoDescription: { type: String, default: null, maxlength: 200 },
    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ title: "text", excerpt: "text", tags: "text" });

export const BlogPost = mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
