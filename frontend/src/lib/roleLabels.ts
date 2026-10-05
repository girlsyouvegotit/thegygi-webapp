/** Display labels for roles — Super stays invisible to admins in lists */
export function roleLabel(role?: string | null): string {
  if (!role) return "User";
  if (role === "super_admin") return "Super";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function roleBadgeClass(role?: string | null): string {
  switch (role) {
    case "super_admin":
      return "bg-slate-900 text-amber-300";
    case "admin":
      return "bg-[#f3e0fb] text-[#9b2ec4]";
    case "tutor":
      return "bg-sky-50 text-sky-700";
    case "mentor":
      return "bg-amber-50 text-amber-800";
    case "writer":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}
