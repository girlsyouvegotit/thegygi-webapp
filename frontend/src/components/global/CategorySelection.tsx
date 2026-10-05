import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Check, Users, GraduationCap, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { category } from "@/types";
import EmptyState from "./EmptyState";

interface CategorySelectionProps {
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  multiple?: boolean;
  selectedCategories?: string[];
  onSelectMultiple?: (categoryIds: string[]) => void;
  showCounts?: boolean;
  className?: string;
  disabled?: boolean;
}

const CategorySelection = ({
  selectedCategory,
  onSelect,
  multiple = false,
  selectedCategories = [],
  onSelectMultiple,
  showCounts = true,
  className,
  disabled = false,
}: CategorySelectionProps) => {
  const [categories, setCategories] = useState<category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
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
                mentorCount:
                  c.mentorCount ??
                  (Array.isArray(c.mentors) ? c.mentors.length : 0),
              }))
            : [],
        );
      } catch (error: any) {
        console.error("Failed to load categories:", error);
        setError(error.response?.data?.message || "Failed to load categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSelect = (categoryId: string) => {
    if (disabled) return;

    if (multiple && onSelectMultiple) {
      const isSelected = selectedCategories.includes(categoryId);
      if (isSelected) {
        onSelectMultiple(selectedCategories.filter((id) => id !== categoryId));
      } else {
        onSelectMultiple([...selectedCategories, categoryId]);
      }
    } else {
      onSelect(categoryId);
    }
  };

  const isSelected = (categoryId: string) => {
    if (multiple) {
      return selectedCategories.includes(categoryId);
    }
    return selectedCategory === categoryId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load categories"
        description={error}
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories available"
        description="Categories will appear here once created"
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {categories.map((category) => {
        const selected = isSelected(category._id);
        
        return (
          <Card
            key={category._id}
            className={cn(
              "cursor-pointer transition-all duration-200",
              selected
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/50 hover:shadow-md",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            )}
            onClick={() => handleSelect(category._id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Selection Indicator */}
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    selected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30",
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">
                      {category.name}
                    </h4>
                    {category.isActive === false && (
                      <Badge variant="outline" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {category.description}
                  </p>

                  {showCounts && (
                    <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {category.studentCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {category.tutorCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartHandshake className="h-3 w-3" />
                        {category.mentorCount || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CategorySelection;