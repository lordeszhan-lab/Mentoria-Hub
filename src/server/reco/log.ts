/**
 * Shared diagnostic logger for the recommender pipeline.
 * All messages are prefixed [reco:<stage>] for easy grep in the dev terminal.
 */
export function recoLog(
  stage: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (data !== undefined) {
    console.log(`[reco:${stage}] ${message}`, data);
  } else {
    console.log(`[reco:${stage}] ${message}`);
  }
}

export function recoError(
  stage: string,
  message: string,
  err: unknown,
  data?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = {
  ...(data ?? {}),
  error:
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err,
  };
  console.error(`[reco:${stage}] ${message}`, payload);
}
