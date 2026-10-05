import { useNavigate } from "react-router";
import { CalendarPlus } from "lucide-react";
import ScheduleClassForm from "@/components/classes/ScheduleClassForm";
import { useAuth } from "@/hooks/useAuthContext";

const ScheduleClass = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Tutor";

  return (
    <div className="relative mx-auto w-full max-w-3xl px-0 pb-8 sm:pb-10 lg:max-w-4xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl" />
      </div>

      <div className="animate-in fade-in space-y-4 duration-500 sm:space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Live sessions
              </p>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-[1.75rem]">
                Hi, {firstName}!
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                <span className="font-medium text-slate-700">
                  Schedule Class
                </span>
                <span className="mx-1.5 text-slate-300">|</span>
                Create a new live class session
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary">

            Live class
          </span>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:rounded-3xl">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Class details
              </h2>
              <p className="text-xs text-slate-500 sm:text-[13px]">
                Fill in the session info for your students — one step at a time
              </p>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <ScheduleClassForm
              onSuccess={() => navigate("/tutor/classes")}
              onCancel={() => navigate("/tutor/classes")}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScheduleClass;
