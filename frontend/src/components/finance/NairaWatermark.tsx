import { cn } from "@/lib/utils";

/** Large decorative ₦ used as a card background mark. */
export default function NairaWatermark({
  className,
  tone = "light",
}: {
  className?: string;
  /** `light` for colored cards; `brand` for white/glass cards */
  tone?: "light" | "brand";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -right-1 -bottom-6 select-none font-black leading-none tracking-tight sm:-bottom-8",
        "text-[6.5rem] sm:text-[8rem]",
        tone === "light" ? "text-white/20" : "text-primary/15",
        className,
      )}
    >
      ₦
    </span>
  );
}
