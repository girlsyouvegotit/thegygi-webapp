import CategoryCard from "./CategoryCard";
import type { category } from "@/types";

interface CategoryGridProps {
  categories: category[];
  loading?: boolean;
  onView?: (category: category) => void;
  enrolledIds?: Set<string>;
  isAdmin?: boolean;
  onEdit?: (category: category) => void;
  onDelete?: (category: category) => void;
  onAssignTutor?: (category: category) => void;
  onAssignMentor?: (category: category) => void;
}

const CategoryGrid = ({
  categories,
  onView,
  enrolledIds,
  isAdmin,
  onEdit,
  onDelete,
  onAssignTutor,
  onAssignMentor,
}: CategoryGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category, index) => (
        <div
          key={category._id}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{
            animationDelay: `${Math.min(index, 8) * 40}ms`,
            animationDuration: "400ms",
          }}
        >
          <CategoryCard
            category={category}
            onView={onView}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onAssignTutor={onAssignTutor}
            onAssignMentor={onAssignMentor}
            isEnrolled={enrolledIds?.has(category._id)}
          />
        </div>
      ))}
    </div>
  );
};

export default CategoryGrid;
