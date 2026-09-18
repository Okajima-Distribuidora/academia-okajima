if (process.env.NODE_ENV === "development") {
  const originalMeasure = performance.measure.bind(performance);

  performance.measure = ((...args: Parameters<typeof performance.measure>) => {
    try {
      return originalMeasure(...args);
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("cannot have a negative time stamp")
      ) {
        return undefined as unknown as PerformanceMeasure;
      }

      throw error;
    }
  }) as typeof performance.measure;
}
