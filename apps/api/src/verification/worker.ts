import { parentPort } from 'node:worker_threads';
import { verifyCareer, type VerifyInput } from './verify';

/** Worker-thread entry: replays careers off the main event loop. */
parentPort?.on('message', (msg: { id: number; input: VerifyInput }) => {
  let result;
  try {
    result = verifyCareer(msg.input);
  } catch (error) {
    result = { ok: false as const, reason: `worker_error:${(error as Error).message}`.slice(0, 200) };
  }
  parentPort?.postMessage({ id: msg.id, result });
});
