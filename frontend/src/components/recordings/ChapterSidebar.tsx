import { ListVideo } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { chapter } from "@/types";

interface ChapterSidebarProps {
  chapters: chapter[];
  currentChapter?: string;
  onChapterClick: (timestamp: string) => void;
}

const ChapterSidebar = ({
  chapters,
  currentChapter,
  onChapterClick,
}: ChapterSidebarProps) => {
  if (chapters.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <ListVideo className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No chapters available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => onChapterClick(chapter.timestamp)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              currentChapter === chapter.timestamp
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{chapter.title}</span>
              <span className="text-xs text-muted-foreground">
                {chapter.timestamp}
              </span>
            </div>
            {chapter.duration > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(chapter.duration / 60)} mins
              </p>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChapterSidebar;
