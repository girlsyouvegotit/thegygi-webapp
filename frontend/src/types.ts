/**
 * Canonical app types live in `./types/index`.
 * This file exists because `@/types` resolves to `src/types.ts` before `src/types/`.
 */
export * from "./types/index";

// ============================================
// DEPRECATED / LEGACY (still imported by older forms)
// ============================================

import type { user, ID } from "./types/index";

/** @deprecated Use `category` instead */
export interface subject {
  _id: ID;
  name: string;
  code: string;
  teacher?: user[];
  isActive: boolean;
}

/** @deprecated Use category-based system */
export interface academicYear {
  _id: ID;
  name: string;
  fromYear: Date;
  toYear: Date;
  isCurrent: boolean;
}

/** @deprecated Use `liveClass` instead */
export interface Class {
  _id: ID;
  name: string;
  academicYear?: academicYear;
  classTeacher?: user;
  subjects?: subject[];
  students?: user[];
  capacity: number;
}

export interface Visual {
  _id: ID;
  prompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  generatedBy: { _id: ID; name: string };
  isSaved: boolean;
  createdAt: string;
}

export interface StudyMaterial {
  _id: ID;
  title: string;
  description?: string;
  fileUrl: string;
  type: "pdf" | "doc" | "video" | "link" | "other";
  subject?: { _id: ID; name: string; code: string };
  category?: { _id: ID; name: string };
  class?: { _id: ID; name: string };
  uploadedBy: { _id: ID; name: string };
  uploadedAt: string;
  isActive: boolean;
}

export interface team {
  _id: ID;
  name: string;
  logo?: string;
  members: user[];
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
}
