import { useState } from "react";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecording } from "@/hooks/useRecording";

interface TranscriptSearchProps {
  recordingId: string;
  onJumpToTimestamp: (timestamp: string) => void;
}

const TranscriptSearch = ({
  recordingId,
  onJumpToTimestamp,
}: TranscriptSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchTranscript } = useRecording(recordingId);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;

    setLoading(true);
    const searchResults = await searchTranscript(query);
    setResults(searchResults);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in recording..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => onJumpToTimestamp(result.timestamp)}
              className="w-full text-left p-2 rounded hover:bg-muted flex items-start gap-2"
            >
              <Clock className="h-3 w-3 text-primary mt-1 shrink-0" />
              <div>
                <span className="text-xs text-primary font-mono">
                  {result.timestamp}
                </span>
                <p className="text-sm text-muted-foreground">
                  {result.snippet}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptSearch;
