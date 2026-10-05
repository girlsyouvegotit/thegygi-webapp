import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { category } from "@/types";

export const useCategory = (categoryId?: string) => {
  const [category, setCategory] = useState<category | null>(null);
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!categoryId) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/categories/${categoryId}`);
      setCategory(data.data.category);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load category");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data.categories);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    category,
    categories,
    loading,
    error,
    fetchCategory,
    fetchCategories,
  };
};
