import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { category } from "@/types";

interface CategorySelectionProps {
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
}

const CategorySelection = ({
  selectedCategory,
  onSelect,
}: CategorySelectionProps) => {
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        const list = (data?.data?.categories || data?.categories || []) as category[];
        setCategories(
          Array.isArray(list)
            ? list.map((c) => ({
                ...c,
                _id: String(c._id),
                studentCount:
                  c.studentCount ??
                  (Array.isArray(c.students) ? c.students.length : 0),
                tutorCount:
                  c.tutorCount ??
                  (Array.isArray(c.tutors) ? c.tutors.length : 0),
              }))
            : [],
        );
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {categories.map((category) => (
        <button
          key={category._id}
          type="button"
          onClick={() => onSelect(category._id)}
          className={cn(
            "relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
            selectedCategory === category._id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
          )}
        >
          {selectedCategory === category._id && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{category.name}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {category.description}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <span>{category.studentCount || 0} students</span>
              <span>•</span>
              <span>{category.tutorCount || 0} tutors</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CategorySelection;
