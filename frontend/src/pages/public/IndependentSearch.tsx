import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "react-router";
import { Search, Loader2, FileText } from "lucide-react";
import { AxiosError } from "axios";
import EmptyState from "@/components/global/EmptyState";

interface Topic {
  _id: string;
  title: string;
  outline: string[];
  content?: Record<string, string>;
  isActive?: boolean;
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

export default function IndependentSearch() {
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(
        `/topics/search?q=${encodeURIComponent(query.trim())}`,
      );
      setTopics(data as Topic[]);
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error("Search failed:", err);
      toast.error(getErrorMessage(error, "Search failed"));
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Explore Topics</h1>
          <p className="text-muted-foreground">
            Search for educational topics and learning materials
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <Input
            placeholder="Search for a topic (e.g., Photosynthesis, World War II, Algebra)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searched && topics.length === 0 ? (
          <EmptyState
            title="No topics found"
            description={`No results for "${query}"`}
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          />
        ) : (
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Card
                key={topic._id}
                className="cursor-pointer hover:shadow-lg transition"
                onClick={() => navigate(`/topic/${topic._id}`)}
              >
                <CardHeader>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>
                    {topic.outline.length} sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {topic.outline
                      .slice(0, 5)
                      .map((section: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {section}
                        </li>
                      ))}
                  </ul>
                  {topic.outline.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{topic.outline.length - 5} more sections
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
