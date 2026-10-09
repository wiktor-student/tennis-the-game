import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { verifyCareer, type VerifyInput, type VerifyResult } from './verify';

interface Job {
  id: number;
  input: VerifyInput;
  resolve: (r: VerifyResult) => void;
}

/**
 * Small fixed-size worker pool. A full career replay takes ~0.5–1 s of CPU, so it must not
 * run on the request thread. With `size = 0` verification runs inline (tests).
 */
export class VerificationPool {
  private workers: { worker: Worker; busy: Job | null }[] = [];
  private queue: Job[] = [];
  private nextId = 1;

  constructor(size: number) {
    if (size <= 0) return;
    const built = new URL('./verification/worker.js', import.meta.url);
    const source = new URL('./worker.ts', import.meta.url);
    const useBuilt = existsSync(fileURLToPath(built));
    for (let i = 0; i < size; i++) {
      const worker = useBuilt
        ? new Worker(built)
        : new Worker(source, { execArgv: ['--import', 'tsx'] });
      const slot = { worker, busy: null as Job | null };
      worker.on('message', (msg: { id: number; result: VerifyResult }) => {
        if (slot.busy?.id === msg.id) slot.busy.resolve(msg.result);
        slot.busy = null;
        this.pump();
      });
      worker.on('error', () => {
        slot.busy?.resolve({ ok: false, reason: 'worker_crashed' });
        slot.busy = null;
      });
      this.workers.push(slot);
    }
  }

  verify(input: VerifyInput): Promise<VerifyResult> {
    if (this.workers.length === 0) return Promise.resolve(verifyCareer(input));
    return new Promise((resolve) => {
      this.queue.push({ id: this.nextId++, input, resolve });
      this.pump();
    });
  }

  get pending(): number {
    return this.queue.length + this.workers.filter((w) => w.busy).length;
  }

  private pump(): void {
    for (const slot of this.workers) {
      if (slot.busy) continue;
      const job = this.queue.shift();
      if (!job) return;
      slot.busy = job;
      slot.worker.postMessage({ id: job.id, input: job.input });
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.worker.terminate()));
    this.workers = [];
  }
}
