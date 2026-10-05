import { useState } from "react";
import {
  Users,
  GraduationCap,
  HeartHandshake,
  ArrowRight,
  Image as ImageIcon,
  Pencil,
  Trash2,
  MoreHorizontal,
  Award,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: category;
  onView?: (category: category) => void;
  onEdit?: (category: category) => void;
  onDelete?: (category: category) => void;
  onAssignTutor?: (category: category) => void;
  onAssignMentor?: (category: category) => void;
  isAdmin?: boolean;
  isEnrolled?: boolean;
}

const CategoryCard = ({
  category,
  onView,
  onEdit,
  onDelete,
  onAssignTutor,
  onAssignMentor,
  isAdmin = false,
  isEnrolled = false,
}: CategoryCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    onView?.(category);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={cn(
        "group relative h-full cursor-pointer overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all duration-300 active:scale-[0.99] hover:shadow-lg hover:shadow-primary/5 sm:hover:-translate-y-1",
        isAdmin && "border-[#E5E7EB]",
      )}
      onClick={handleCardClick}
    >
      <div className="absolute top-0 left-0 h-1 w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />

      {/* Mobile: compact horizontal row · Desktop: stacked */}
      <div className="flex flex-row sm:flex-col">
        {category.bannerImage && !imageError ? (
          <div className="h-auto w-28 shrink-0 overflow-hidden bg-muted sm:h-32 sm:w-full">
            <img
              src={category.bannerImage}
              alt={category.name}
              className="h-full min-h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:min-h-0"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-auto w-28 shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-[#F7F3FF] to-[#FFF8F5] sm:h-32 sm:w-full">
            {category.icon ? (
              <span className="text-3xl transition-transform duration-300 group-hover:scale-110 sm:text-4xl">
                {category.icon}
              </span>
            ) : (
              <ImageIcon className="h-7 w-7 text-primary/40 sm:h-8 sm:w-8" />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {isEnrolled && !isAdmin ? (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:px-2.5 sm:py-1">
                <CheckCircle2 className="h-3 w-3" />
                Enrolled
              </span>
            </div>
          ) : null}

          {isAdmin && (
            <div
              className="absolute top-2 right-2 sm:top-3 sm:right-3"
              onClick={handleDropdownClick}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white sm:h-8 sm:w-8"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  )}
                  {onAssignTutor && (
                    <DropdownMenuItem onClick={() => onAssignTutor(category)}>
                      <GraduationCap className="mr-2 h-4 w-4" /> Assign Tutor
                    </DropdownMenuItem>
                  )}
                  {onAssignMentor && (
                    <DropdownMenuItem onClick={() => onAssignMentor(category)}>
                      <HeartHandshake className="mr-2 h-4 w-4" /> Assign Mentor
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(category)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <CardHeader className="space-y-1 p-3 pb-1.5 sm:p-6 sm:pb-2">
            <CardTitle className="flex items-start justify-between gap-2 text-base sm:text-lg">
              <span className="line-clamp-2 pr-1 leading-snug">
                {category.name}
              </span>
              {!isAdmin && (
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-all sm:mt-1 sm:opacity-0 sm:group-hover:translate-x-1 sm:group-hover:opacity-100" />
              )}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs sm:text-sm">
              {category.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 p-3 pt-0 sm:space-y-3 sm:p-6 sm:pt-0 sm:pb-4">
            <div className="flex flex-wrap gap-1.5">
              {category.durationWeeks ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-700 sm:text-xs"
                >
                  <Clock className="h-3 w-3" />
                  {category.durationWeeks}w
                </Badge>
              ) : null}
              {category.certificateEnabled !== false ? (
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full bg-amber-50 text-[10px] font-medium text-amber-800 sm:text-xs"
                >
                  <Award className="h-3 w-3" />
                  Cert
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className="gap-1 rounded-full text-[10px] sm:text-xs"
              >
                <Users className="h-3 w-3" />
                {category.studentCount || 0}
              </Badge>
            </div>

            {isAdmin && (
              <div
                className="flex gap-2 border-t border-[#E5E7EB] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {onAssignTutor && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-full text-xs sm:h-8"
                    onClick={() => onAssignTutor(category)}
                  >
                    <GraduationCap className="mr-1 h-3.5 w-3.5" />
                    Tutor
                  </Button>
                )}
                {onAssignMentor && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-full text-xs sm:h-8"
                    onClick={() => onAssignMentor(category)}
                  >
                    <HeartHandshake className="mr-1 h-3.5 w-3.5" />
                    Mentor
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;
