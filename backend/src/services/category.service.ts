import Category from "../models/category.model.js";
import Community from "../models/community.model.js";
import User from "../models/user.model.js";
import LiveClass from "../models/live-class.model.js";
import { generateUniqueSlug } from "../utils/slug.util.js";
import type { ICategory } from "../models/category.model.js";
import mongoose from "mongoose";

export interface CompletionRulesInput {
  attendanceWeight?: number;
  quizWeight?: number;
  assignmentWeight?: number;
  passThreshold?: number;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  icon?: string;
  bannerImage?: string;
  createdBy: string;
  durationWeeks?: number | null;
  certificateEnabled?: boolean;
  certificateTitle?: string | null;
  completionRules?: CompletionRulesInput;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  bannerImage?: string;
  isActive?: boolean;
  durationWeeks?: number | null;
  certificateEnabled?: boolean;
  certificateTitle?: string | null;
  completionRules?: CompletionRulesInput;
}

/**
 * Create a new category with associated community
 */
export const createCategory = async (
  input: CreateCategoryInput,
): Promise<ICategory> => {
  const {
    name,
    description,
    icon,
    bannerImage,
    createdBy,
    durationWeeks,
    certificateEnabled,
    certificateTitle,
    completionRules,
  } = input;

  // Generate unique slug
  const existingCategories = await Category.find({}, "slug");
  const slug = generateUniqueSlug(
    name,
    existingCategories.map((c) => c.slug),
  );

  // Create category
  const category = await Category.create({
    name,
    slug,
    description,
    icon,
    bannerImage,
    createdBy,
    isActive: true,
    ...(durationWeeks !== undefined ? { durationWeeks } : {}),
    ...(certificateEnabled !== undefined ? { certificateEnabled } : {}),
    ...(certificateTitle !== undefined ? { certificateTitle } : {}),
    ...(completionRules ? { completionRules } : {}),
  });

  // Create associated community
  const community = await Community.create({
    category: category._id,
    members: [createdBy],
    createdBy,
  });

  // Link community to category
  category.communityId = community._id;
  await category.save();

  return category;
};

type CategoryWithCounts = ICategory & {
  studentCount: number;
  tutorCount: number;
  mentorCount: number;
};

const toIdSet = (ids: unknown[] | undefined): Set<string> => {
  const set = new Set<string>();
  for (const id of ids || []) {
    if (id == null) continue;
    if (typeof id === "object" && id !== null && "_id" in id) {
      set.add(String((id as { _id: unknown })._id));
    } else {
      set.add(String(id));
    }
  }
  return set;
};

/**
 * Build per-category tutor/mentor/student id sets from:
 * - User.categories[] / User.assignedCategories[] by role
 * - LiveClass.tutor for classes in each category
 *
 * Promoted tutors often only have User.categories populated, which left
 * Category.tutors empty and tutorCount stuck at 0 on admin/categories.
 */
const buildMembershipMaps = async () => {
  const [staff, classes] = await Promise.all([
    User.find({
      role: { $in: ["tutor", "mentor", "student"] },
      isActive: { $ne: false },
    })
      .select("_id role categories assignedCategories")
      .lean(),
    LiveClass.find({}).select("tutor category").lean(),
  ]);

  const tutorsByCategory = new Map<string, Set<string>>();
  const mentorsByCategory = new Map<string, Set<string>>();
  const studentsByCategory = new Map<string, Set<string>>();

  const ensure = (map: Map<string, Set<string>>, catId: string) => {
    let set = map.get(catId);
    if (!set) {
      set = new Set<string>();
      map.set(catId, set);
    }
    return set;
  };

  for (const user of staff) {
    const userId = String(user._id);
    const catIds = [
      ...(user.categories || []),
      ...(user.assignedCategories || []),
    ];
    for (const cat of catIds) {
      const catId = String(cat);
      if (user.role === "tutor") ensure(tutorsByCategory, catId).add(userId);
      else if (user.role === "mentor")
        ensure(mentorsByCategory, catId).add(userId);
      else if (user.role === "student")
        ensure(studentsByCategory, catId).add(userId);
    }
  }

  for (const cls of classes) {
    if (!cls.category || !cls.tutor) continue;
    ensure(tutorsByCategory, String(cls.category)).add(String(cls.tutor));
  }

  return { tutorsByCategory, mentorsByCategory, studentsByCategory };
};

const computeCounts = (
  category: {
    _id: unknown;
    students?: unknown[];
    tutors?: unknown[];
    mentors?: unknown[];
  },
  tutorsByCategory: Map<string, Set<string>>,
  mentorsByCategory: Map<string, Set<string>>,
  studentsByCategory: Map<string, Set<string>>,
) => {
  const catId = String(category._id);

  const tutorIds = toIdSet(category.tutors);
  for (const id of tutorsByCategory.get(catId) || []) tutorIds.add(id);

  const mentorIds = toIdSet(category.mentors);
  for (const id of mentorsByCategory.get(catId) || []) mentorIds.add(id);

  const studentIds = toIdSet(category.students);
  for (const id of studentsByCategory.get(catId) || []) studentIds.add(id);

  return {
    tutorIds,
    mentorIds,
    studentIds,
    studentCount: studentIds.size,
    tutorCount: tutorIds.size,
    mentorCount: mentorIds.size,
  };
};

/**
 * Get category by ID with full details
 */
export const getCategoryById = async (
  categoryId: string,
): Promise<CategoryWithCounts | null> => {
  const [category, maps] = await Promise.all([
    Category.findById(categoryId)
      .populate("tutors", "name email avatar")
      .populate("mentors", "name email avatar")
      .populate("communityId", "channels members")
      .lean(),
    buildMembershipMaps(),
  ]);

  if (!category) return null;

  const counts = computeCounts(
    category,
    maps.tutorsByCategory,
    maps.mentorsByCategory,
    maps.studentsByCategory,
  );

  return {
    ...category,
    studentCount: counts.studentCount,
    tutorCount: counts.tutorCount,
    mentorCount: counts.mentorCount,
  } as unknown as CategoryWithCounts;
};

/**
 * Get all active categories with membership counts.
 * Counts union Category arrays + User.categories + class tutors so promoted
 * tutors/mentors still appear even when Category.tutors was never written.
 */
export const getActiveCategories = async (): Promise<CategoryWithCounts[]> => {
  const [categories, maps] = await Promise.all([
    Category.find({ isActive: { $ne: false } })
      .select(
        "_id name slug description icon bannerImage tutors mentors students isActive",
      )
      .sort({ name: 1 })
      .lean(),
    buildMembershipMaps(),
  ]);

  // Backfill missing Category.tutors / mentors so future reads stay in sync
  const syncOps: Promise<unknown>[] = [];
  for (const c of categories) {
    const catId = String(c._id);
    const existingTutors = toIdSet(c.tutors);
    const liveTutors = maps.tutorsByCategory.get(catId);
    if (liveTutors) {
      for (const tutorId of liveTutors) {
        if (
          !existingTutors.has(tutorId) &&
          mongoose.Types.ObjectId.isValid(tutorId)
        ) {
          syncOps.push(
            Category.updateOne(
              { _id: c._id },
              {
                $addToSet: {
                  tutors: new mongoose.Types.ObjectId(tutorId),
                },
              },
            ),
          );
        }
      }
    }

    const existingMentors = toIdSet(c.mentors);
    const liveMentors = maps.mentorsByCategory.get(catId);
    if (liveMentors) {
      for (const mentorId of liveMentors) {
        if (
          !existingMentors.has(mentorId) &&
          mongoose.Types.ObjectId.isValid(mentorId)
        ) {
          syncOps.push(
            Category.updateOne(
              { _id: c._id },
              {
                $addToSet: {
                  mentors: new mongoose.Types.ObjectId(mentorId),
                },
              },
            ),
          );
        }
      }
    }
  }
  if (syncOps.length > 0) {
    void Promise.all(syncOps).catch((err) =>
      console.error("Category membership backfill failed:", err),
    );
  }

  return categories.map((c) => {
    const counts = computeCounts(
      c,
      maps.tutorsByCategory,
      maps.mentorsByCategory,
      maps.studentsByCategory,
    );
    return {
      ...c,
      tutors: Array.from(counts.tutorIds),
      mentors: Array.from(counts.mentorIds),
      students: Array.from(counts.studentIds),
      studentCount: counts.studentCount,
      tutorCount: counts.tutorCount,
      mentorCount: counts.mentorCount,
    };
  }) as unknown as CategoryWithCounts[];
};

/**
 * Update category
 */
export const updateCategory = async (
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<ICategory | null> => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { ...input },
    { new: true, runValidators: true },
  ).lean();

  return category as unknown as ICategory | null;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { isActive: false },
    { new: true },
  );

  return !!category;
};

/**
 * Add tutor to category — keeps Category.tutors and User.categories in sync
 */
export const addTutorToCategory = async (
  categoryId: string,
  tutorId: string,
): Promise<ICategory | null> => {
  const [category] = await Promise.all([
    Category.findByIdAndUpdate(
      categoryId,
      { $addToSet: { tutors: tutorId } },
      { new: true },
    ).lean(),
    User.findByIdAndUpdate(tutorId, {
      $addToSet: { categories: categoryId },
    }),
  ]);

  return category as unknown as ICategory | null;
};

/**
 * Add mentor to category — keeps Category.mentors and User.categories in sync
 */
export const addMentorToCategory = async (
  categoryId: string,
  mentorId: string,
): Promise<ICategory | null> => {
  const [category] = await Promise.all([
    Category.findByIdAndUpdate(
      categoryId,
      { $addToSet: { mentors: mentorId } },
      { new: true },
    ).lean(),
    User.findByIdAndUpdate(mentorId, {
      $addToSet: { categories: categoryId },
    }),
  ]);

  return category as unknown as ICategory | null;
};

/**
 * Remove tutor from category
 */
export const removeTutorFromCategory = async (
  categoryId: string,
  tutorId: string,
): Promise<ICategory | null> => {
  const [category] = await Promise.all([
    Category.findByIdAndUpdate(
      categoryId,
      { $pull: { tutors: tutorId } },
      { new: true },
    ).lean(),
    User.findByIdAndUpdate(tutorId, {
      $pull: { categories: categoryId },
    }),
  ]);

  return category as unknown as ICategory | null;
};

/**
 * Remove mentor from category
 */
export const removeMentorFromCategory = async (
  categoryId: string,
  mentorId: string,
): Promise<ICategory | null> => {
  const [category] = await Promise.all([
    Category.findByIdAndUpdate(
      categoryId,
      { $pull: { mentors: mentorId } },
      { new: true },
    ).lean(),
    User.findByIdAndUpdate(mentorId, {
      $pull: { categories: categoryId },
    }),
  ]);

  return category as unknown as ICategory | null;
};
