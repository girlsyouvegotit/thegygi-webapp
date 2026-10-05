import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Award, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/global/EmptyState";
import type { Certificate } from "@/types";
import { PageListSkeleton } from "@/components/loading/PageSkeleton";

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/certificates/me");
      setCertificates((data.data.certificates as Certificate[]) || []);
    } catch {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  if (loading) {
    return <PageListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Credentials earned by completing learning phases
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/my-learning")}
        >
          <BookOpen className="w-4 h-4 mr-1.5" />
          My Learning
        </Button>
      </header>

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Complete a category learning phase to earn your first certificate"
          icon={<Award className="h-8 w-8 text-muted-foreground" />}
          actionLabel="Go to My Learning"
          onAction={() => navigate("/my-learning")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => {
            const categoryName =
              cert.categoryName ||
              (typeof cert.category === "object" ? cert.category.name : null) ||
              "Category";
            return (
              <button
                key={cert._id}
                onClick={() => navigate(`/certificates/${cert._id}`)}
                className="group text-left rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">
                        {cert.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {cert.studentFullName
                          ? `${cert.studentFullName} · ${categoryName}`
                          : categoryName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span className="font-mono text-[11px] text-gray-400 truncate">
                    {cert.certificateNumber}
                  </span>
                  <span className="shrink-0">
                    Issued{" "}
                    {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {certificates.length > 0 && (
        <div className="rounded-2xl bg-[#1C1C21] text-white p-6 flex items-center gap-3">
          <Award className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-gray-300">
            Keep completing categories to grow your credential collection.
          </p>
        </div>
      )}
    </div>
  );
};

export default Certificates;
