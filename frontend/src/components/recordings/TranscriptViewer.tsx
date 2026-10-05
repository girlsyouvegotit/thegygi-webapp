import { useState } from "react";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptViewerProps {
  transcript: string;
  onTimestampClick?: (timestamp: string) => void;
}

const TranscriptViewer = ({
  transcript,
  onTimestampClick,
}: TranscriptViewerProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!transcript) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Transcript not available yet</p>
      </div>
    );
  }

  const lines = transcript.split("\n").filter((line) => line.trim());

  const filteredLines = searchQuery
    ? lines.filter((line) =>
        line.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : lines;

  const handleLineClick = (line: string) => {
    const timestampMatch = line.match(/(\[?\d{2}:\d{2}:\d{2}\]?)/);
    if (timestampMatch && onTimestampClick) {
      const timestamp = timestampMatch[1].replace(/\[|\]/g, "");
      onTimestampClick(timestamp);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredLines.map((line, index) => {
            const timestampMatch = line.match(/(\[?\d{2}:\d{2}:\d{2}\]?)/);
            const timestamp = timestampMatch
              ? timestampMatch[1].replace(/\[|\]/g, "")
              : null;
            const content = line.replace(/\[?\d{2}:\d{2}:\d{2}\]?/, "").trim();

            return (
              <button
                key={index}
                onClick={() => handleLineClick(line)}
                className={cn(
                  "w-full text-left p-2 rounded transition-colors",
                  onTimestampClick
                    ? "hover:bg-muted cursor-pointer"
                    : "cursor-default",
                )}
              >
                {timestamp && (
                  <span className="text-xs text-primary font-mono mr-2">
                    {timestamp}
                  </span>
                )}
                <span className="text-sm">{content}</span>
              </button>
            );
          })}
          {filteredLines.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptViewer;
