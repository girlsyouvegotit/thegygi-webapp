import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { AxiosError } from "axios";
import EmptyState from "@/components/global/EmptyState";

interface Topic {
  _id: string;
  title: string;
  outline: string[];
  content: Record<string, string>;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTopic = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/topics/${id}`);
      const topicData = data as Topic;
      setTopic(topicData);
      if (topicData.outline.length > 0) {
        setSelectedSection(topicData.outline[0]);
      }
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error("Failed to fetch topic:", err);
      toast.error(getErrorMessage(error, "Failed to load topic"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-6">
        <EmptyState
          title="Topic not found"
          description="The topic you're looking for doesn't exist"
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">{topic.title}</h1>
        <p className="text-muted-foreground mb-6">
          {topic.outline.length} sections
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Outline</CardTitle>
              <CardDescription>Click a section to view</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <ul className="space-y-1">
                  {topic.outline.map((section: string) => (
                    <li key={section}>
                      <button
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedSection === section
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedSection(section)}
                      >
                        {section}
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{selectedSection || "Select a section"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {selectedSection ? (
                  <div className="prose dark:prose-invert max-w-none">
                    {topic.content[selectedSection] || "Content not available."}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a section from the outline to view its content
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
