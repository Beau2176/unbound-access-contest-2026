// Hold the origin's model lease for the entire worker lifetime. This avoids
// simultaneous model allocations and writes invalidating another tab's File.
const MODEL_LOCK = "unbound-meta-runtime-v1";
export type ModelLocks = {
  request(name: string, options: { ifAvailable: true; mode: "exclusive" }, callback: (lock: unknown | null) => Promise<void>): Promise<void>;
};
export type ModelLease = { release(): void };

export function acquireModelLease(locks: ModelLocks | undefined): Promise<ModelLease> {
  if (!locks) return Promise.reject(new Error("This browser cannot coordinate on-device AI between tabs. Use a prepared form or reviewed manual proposal."));
  return new Promise((resolve, reject) => {
    let release: (() => void) | undefined;
    try {
      const held = locks.request(MODEL_LOCK, { ifAvailable: true, mode: "exclusive" }, async lock => {
        if (!lock) throw new Error("On-device AI is already active in another UNBOUND Access tab. Turn it off there, or continue here without AI. Your answers are unchanged.");
        const lifetime = new Promise<void>(done => { release = done; });
        resolve({ release() { release?.(); release = undefined; } });
        await lifetime;
      });
      void held.catch(reject);
    } catch (error) { reject(error); }
  });
}

export async function withModelLease<T>(locks: ModelLocks | undefined, action: () => Promise<T>): Promise<T> {
  const lease = await acquireModelLease(locks);
  try { return await action(); }
  finally { lease.release(); }
}
