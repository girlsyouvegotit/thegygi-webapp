/** Circular GYGI eye shown above the login and register forms. */
export default function TrackingEye() {
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-full bg-[#0a0612] shadow-[0_0_36px_rgba(193,71,233,0.35)] ring-1 ring-white/10 sm:h-32 sm:w-32">
      <img
        src="/groupies.jpg"
        alt="GYGI community"
        className="h-full w-full object-cover object-[center_40%]"
        draggable={false}
      />
    </div>
  );
}
