import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Award, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Certificate, user } from "@/types";
import { SimpleSectionSkeleton } from "@/components/loading/PageSkeleton";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const CertificateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCertificate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/certificates/${id}`);
      setCertificate(data.data.certificate as Certificate);
    } catch {
      toast.error("Failed to load certificate");
      navigate("/certificates");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <SimpleSectionSkeleton />;
  }

  if (!certificate) return null;

  const populatedStudent =
    typeof certificate.student === "object"
      ? (certificate.student as user)
      : null;

  const studentFullName =
    certificate.studentFullName || populatedStudent?.name || "Student";
  const studentEmail =
    certificate.studentEmail || populatedStudent?.email || "";
  const categoryName =
    certificate.categoryName ||
    (typeof certificate.category === "object"
      ? certificate.category.name
      : "Category");
  const categoryDescription =
    certificate.categoryDescription ||
    (typeof certificate.category === "object"
      ? certificate.category.description
      : "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/certificates")}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <Button size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>

      <div
        ref={printRef}
        className="mx-auto max-w-3xl rounded-2xl border-2 border-[#1C1C21]/10 bg-linear-to-br from-[#FFFEF9] via-white to-[#F3EEFF] p-6 shadow-lg sm:p-12"
      >
        <div className="space-y-6 text-center sm:space-y-7">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <Award className="h-8 w-8" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              GYGI Learning
            </p>
            <h1 className="mt-2 text-2xl font-black wrap-break-word text-gray-900 sm:text-3xl">
              {certificate.title}
            </h1>
          </div>

          <p className="text-sm text-gray-500">This certifies that</p>

          <div className="space-y-1">
            <p className="text-xl font-bold wrap-break-word text-gray-900 sm:text-2xl">
              {studentFullName}
            </p>
            {studentEmail ? (
              <p className="text-xs wrap-break-word text-gray-500 sm:text-sm">
                {studentEmail}
              </p>
            ) : null}
          </div>

          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-500">
            has successfully completed the learning phase for{" "}
            <span className="font-semibold text-gray-800">{categoryName}</span>
            .
          </p>

          {categoryDescription ? (
            <p className="mx-auto max-w-lg text-xs leading-relaxed text-gray-400 line-clamp-3 sm:text-sm">
              {categoryDescription}
            </p>
          ) : null}

          <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 border-t border-gray-100 pt-6 text-left sm:grid-cols-2 sm:gap-4">
            <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Category
              </p>
              <p className="mt-1 text-sm font-semibold wrap-break-word text-gray-800">
                {categoryName}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Certificate No.
              </p>
              <p className="mt-1 font-mono text-xs font-semibold wrap-break-word text-gray-800 sm:text-sm">
                {certificate.certificateNumber}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Enrolled
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(certificate.enrolledAt)}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Completed
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(certificate.completedAt)}
              </p>
            </div>
            <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Issued
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(certificate.issuedAt)}
              </p>
            </div>
            {certificate.durationWeeks ? (
              <div className="rounded-xl bg-white/70 px-3.5 py-3 sm:px-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Phase duration
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {certificate.durationWeeks} weeks
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetail;
