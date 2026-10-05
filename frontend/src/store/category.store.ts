import { create } from "zustand";
import { api } from "@/lib/api";
import type { category } from "@/types";

interface CreateCategoryData {
  name: string;
  description: string;
  icon?: string;
  bannerImage?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  bannerImage?: string;
  isActive?: boolean;
}

interface CategoryState {
  categories: category[];
  selectedCategory: category | null;
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (categoryId: string) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (
    categoryId: string,
    data: UpdateCategoryData,
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  setSelectedCategory: (category: category | null) => void;
  clearError: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as ApiError;
  return err.response?.data?.message || fallback;
};

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  fetchCategories: async (): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/categories");
      const list = (data?.data?.categories || data?.categories || []) as category[];
      set({
        categories: Array.isArray(list)
          ? list.map((c) => ({
              ...c,
              _id: String(c._id),
              studentCount:
                c.studentCount ??
                (Array.isArray(c.students) ? c.students.length : 0),
              tutorCount:
                c.tutorCount ??
                (Array.isArray(c.tutors) ? c.tutors.length : 0),
              mentorCount:
                c.mentorCount ??
                (Array.isArray(c.mentors) ? c.mentors.length : 0),
            }))
          : [],
      });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to load categories"),
        categories: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategoryById: async (categoryId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/categories/${categoryId}`);
      set({ selectedCategory: data.data.category as category });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to load category") });
    } finally {
      set({ loading: false });
    }
  },

  createCategory: async (categoryData: CreateCategoryData): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/categories", categoryData);
      const newCategory = data.data.category as category;
      set(
        (state: CategoryState): Partial<CategoryState> => ({
          categories: [...state.categories, newCategory],
        }),
      );
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to create category") });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (
    categoryId: string,
    categoryData: UpdateCategoryData,
  ): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put(`/categories/${categoryId}`, categoryData);
      const updatedCategory = data.data.category as category;
      set(
        (state: CategoryState): Partial<CategoryState> => ({
          categories: state.categories.map((cat: category) =>
            cat._id === categoryId ? updatedCategory : cat,
          ),
          selectedCategory: updatedCategory,
        }),
      );
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to update category") });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/categories/${categoryId}`);
      set(
        (state: CategoryState): Partial<CategoryState> => ({
          categories: state.categories.filter(
            (cat: category) => cat._id !== categoryId,
          ),
          selectedCategory: null,
        }),
      );
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, "Failed to delete category") });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedCategory: (category: category | null): void => {
    set({ selectedCategory: category });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));
