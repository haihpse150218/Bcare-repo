import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

const queues: Map<string, Queue> = new Map();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: getRedisConnection() }));
  }
  return queues.get(name)!;
}

export async function closeAllQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}
