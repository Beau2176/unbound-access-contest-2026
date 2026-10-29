// Own the entire inference worker so cancellation does not depend on a model
// library finishing initialization or observing an AbortSignal.
export type ModelProgress = { stage: "checking" | "downloading" | "loading"; progress?: number; detail?: string };
export type CompletionInput = {
  messages: { role: "system" | "user"; content: string }[];
  response_format: { type: "json_schema"; json_schema: { name: string; schema: unknown; strict: boolean } };
  temperature: number; seed: number; max_tokens: number;
};
export type CompletionResult = { choices: { message: { content: string | null }; finish_reason: string | null }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
export type ModelLoaded = { metadata: Record<string, string>; backend: "WebGPU" | "CPU / WebAssembly"; storage: string; temporaryStorage: boolean; params: { n_ctx: number; n_parallel: number; warmup: boolean; n_batch?: number; n_ubatch?: number; n_threads?: number; runtime?: "native" | "compatibility"; isolated?: boolean } };
export type RuntimeCommand = { id: number; task: "load"; modelKey: "small" | "large" | "compact"; preferGpu: boolean; origin: string } | { id: number; task: "complete"; input: CompletionInput };
export type RuntimeReply = { id: number; task: "progress"; progress: ModelProgress } | { id: number; task: "loaded"; result: ModelLoaded } | { id: number; task: "complete"; result: CompletionResult } | { id: number; task: "error"; message: string };
export type ModelWorker = { postMessage(message: RuntimeCommand): void; terminate(): void; onmessage: ((event: MessageEvent<RuntimeReply>) => void) | null; onerror: ((event: ErrorEvent) => void) | null };
type Clock = { set(run: () => void, delay: number): () => void };
const clock: Clock = { set(run, delay) { const timer = setTimeout(run, delay); return () => clearTimeout(timer); } };
type Pending = { id: number; task: "load" | "complete"; prefix?: string; resolve(value: unknown): void; reject(error: Error): void; cleanup(): void; progress?(value: ModelProgress): void; resetIdle?(stage: ModelProgress["stage"]): void };

export class LocalModelRuntime {
  private pending: Pending | null = null;
  private sequence = 0;
  private ready = false;
  private hasCompleted = false;
  private completedPrefix: string | undefined;
  private closed = false;
  private worker: ModelWorker;
  private timers: Clock;
  private releaseLease: () => void;
  constructor(worker: ModelWorker, timers: Clock = clock, releaseLease: () => void = () => {}) {
    this.worker = worker; this.timers = timers; this.releaseLease = releaseLease;
    worker.onmessage = event => this.receive(event.data);
    worker.onerror = () => this.destroy("The on-device AI worker could not continue. Your confirmed answers are unchanged. Reload this page before loading it again.");
  }
  isModelLoaded() { return this.ready && !this.closed; }
  load(options: { modelKey: "small" | "large" | "compact"; preferGpu: boolean; origin: string }, signal: AbortSignal, progress: (value: ModelProgress) => void) {
    return this.request<ModelLoaded>({ task: "load", ...options }, signal, progress);
  }
  complete(input: CompletionInput, signal: AbortSignal) {
    if (!this.isModelLoaded()) return Promise.reject(new Error("Load the optional on-device Meta model first."));
    const prefix = JSON.stringify(input.messages.filter(message=>message.role==="system"));
    return this.request<CompletionResult>({ task: "complete", input }, signal, undefined, this.hasCompleted && this.completedPrefix===prefix ? 90000 : 180000);
  }
  destroy(reason = "On-device AI stopped. Your confirmed answers are unchanged.") {
    if (this.closed) return;
    this.closed = true; this.ready = false;
    this.worker.onmessage = null; this.worker.onerror = null;
    // Release from the page, without awaiting a busy worker's termination.
    try { this.releaseLease(); } catch { /* Teardown must still settle the request. */ }
    try { this.worker.terminate(); } catch { /* Teardown must still settle the request. */ }
    const job = this.pending; this.pending = null;
    if (job) { job.cleanup(); job.reject(new Error(reason)); }
  }
  private request<T>(command: Omit<Extract<RuntimeCommand, {task:"load"}>, "id"> | Omit<Extract<RuntimeCommand, {task:"complete"}>, "id">, signal: AbortSignal, progress?: (value: ModelProgress) => void, completionDeadline = 90000): Promise<T> {
    if (this.closed || signal.aborted) return Promise.reject(new Error("AI task cancelled. Your confirmed answers are unchanged."));
    if (this.pending) return Promise.reject(new Error("Wait for the current AI task or cancel it first."));
    return new Promise<T>((resolve, reject) => {
      const id = ++this.sequence;
      let cancelIdle = () => {}, cancelTotal = () => {};
      const abort = () => this.destroy("AI task cancelled. Your confirmed answers are unchanged.");
      const resetIdle = (stage: ModelProgress["stage"]) => {
        cancelIdle();
        cancelIdle = this.timers.set(() => this.destroy(stage === "loading"
          ? "The model took too long to load. It has been stopped. Your form and confirmed answers are unchanged; you can retry or continue without AI."
          : "The model download stopped making progress. It has been stopped. Your form and confirmed answers are unchanged; check your connection before retrying."), stage === "loading" ? 120000 : 90000);
      };
      const cleanup = () => { cancelIdle(); cancelTotal(); signal.removeEventListener("abort", abort); };
      this.pending = { id, task: command.task, ...(command.task==="complete"?{prefix:JSON.stringify(command.input.messages.filter(message=>message.role==="system"))}:{}), resolve: value => resolve(value as T), reject, cleanup, progress, resetIdle };
      signal.addEventListener("abort", abort, { once: true });
      cancelTotal = this.timers.set(() => this.destroy(command.task === "load" ? "The model did not finish loading within ten minutes. It has been stopped. Your confirmed answers are unchanged." : "This AI answer took too long. It has been stopped. Your confirmed answers are unchanged."), command.task === "load" ? 600000 : completionDeadline);
      if (command.task === "load") resetIdle("checking");
      try { this.worker.postMessage({ ...command, id } as RuntimeCommand); }
      catch { this.destroy("The on-device AI worker could not start. Your confirmed answers are unchanged."); }
    });
  }
  private receive(reply: RuntimeReply) {
    const job = this.pending;
    if (this.closed || !job || reply.id !== job.id) return;
    if (reply.task === "progress" && job.task === "load") { job.resetIdle?.(reply.progress.stage); job.progress?.(reply.progress); return; }
    if (reply.task === "error") {
      if (job.task === "load") { this.destroy(reply.message); return; }
      this.pending = null; job.cleanup(); job.reject(new Error(reply.message)); return;
    }
    if ((reply.task === "loaded" && job.task === "load") || (reply.task === "complete" && job.task === "complete")) {
      this.pending = null; job.cleanup();
      if (reply.task === "loaded") this.ready = true;
      if (reply.task === "complete") { this.hasCompleted = true; this.completedPrefix = job.prefix; }
      job.resolve(reply.result);
    }
  }
}
