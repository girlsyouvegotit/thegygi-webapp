export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Build a unique slug from a name given an existing slug list. */
export function generateUniqueSlug(
  name: string,
  existingSlugs: string[] = [],
): string {
  const base = slugify(name) || `item-${Date.now()}`;
  const taken = new Set(existingSlugs.map((s) => s.toLowerCase()));
  if (!taken.has(base)) return base;

  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
