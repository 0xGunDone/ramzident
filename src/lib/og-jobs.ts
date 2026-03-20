type OgJob = () => Promise<void>;

let ogQueue: Promise<void> = Promise.resolve();

export function enqueueOgJob(label: string, job: OgJob) {
  ogQueue = ogQueue
    .catch(() => undefined)
    .then(async () => {
      try {
        await job();
      } catch (error) {
        console.error(`[OG] Background task failed (${label}):`, error);
      }
    });
}
