export type StudioVideoWarning = "missing-category" | "missing-description";

export function getStudioVideoWarnings({
  hasCategory,
  description,
}: {
  hasCategory: boolean;
  description: string;
}): StudioVideoWarning[] {
  const warnings: StudioVideoWarning[] = [];

  if (!hasCategory) warnings.push("missing-category");
  if (!description.trim()) warnings.push("missing-description");

  return warnings;
}
