export interface ModuleProgress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export function calculateModuleProgress(
  completedLessons: number,
  totalLessons: number,
): ModuleProgress {
  const total = Math.max(0, Math.floor(totalLessons));
  const completed = Math.min(total, Math.max(0, Math.floor(completedLessons)));

  return {
    totalLessons: total,
    completedLessons: completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
  };
}
