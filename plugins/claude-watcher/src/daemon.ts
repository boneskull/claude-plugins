/**
 * Daemon process that polls triggers and executes actions
 */

import { executeAndWriteResult } from './action-executor.js';
import { closeDatabase, getDatabase } from './db.js';
import { executeTrigger } from './trigger-executor.js';
import { Watch } from './types.js';
import { ensureConfigDirs, getIntervalMs } from './utils.js';

/** Daemon configuration */
interface DaemonConfig {
  /** Minimum interval between checking any single watch (ms) */
  minPollInterval: number;
  /** How often to check for expired watches (ms) */
  expiryCheckInterval: number;
}

const DEFAULT_CONFIG: DaemonConfig = {
  minPollInterval: 5000, // 5 seconds
  expiryCheckInterval: 60000, // 1 minute
};

/** Daemon state */
interface DaemonState {
  running: boolean;
  lastPollTimes: Map<string, number>;
}

/** Start the daemon */
export async function startDaemon(
  config: DaemonConfig = DEFAULT_CONFIG,
): Promise<void> {
  console.log('Starting claude-watcher daemon...');

  // Ensure directories exist
  ensureConfigDirs();

  const db = getDatabase();
  const state: DaemonState = {
    running: true,
    lastPollTimes: new Map(),
  };

  // Handle shutdown
  const shutdown = () => {
    console.log('Shutting down daemon...');
    state.running = false;
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Expiry check loop
  const expiryLoop = setInterval(() => {
    const expired = db.expireOldWatches();
    if (expired > 0) {
      console.log(`Expired ${expired} watch(es)`);
    }
  }, config.expiryCheckInterval);

  // Main polling loop
  console.log('Daemon started. Polling active watches...');

  while (state.running) {
    try {
      const watches = db.getActiveWatches();

      for (const watch of watches) {
        if (!state.running) break;

        // Check if enough time has passed since last poll
        const lastPoll = state.lastPollTimes.get(watch.id) ?? 0;
        const intervalMs = getIntervalMs(watch.interval);
        const now = Date.now();

        if (now - lastPoll < intervalMs) {
          continue; // Not time yet
        }

        // Update last poll time
        state.lastPollTimes.set(watch.id, now);
        db.updateLastCheck(watch.id, new Date(now).toISOString());

        // Execute trigger
        await pollWatch(watch, db);
      }

      // Small delay between loop iterations
      await sleep(config.minPollInterval);
    } catch (error) {
      console.error('Error in polling loop:', error);
      await sleep(5000); // Wait before retrying
    }
  }

  clearInterval(expiryLoop);
}

/** Poll a single watch */
async function pollWatch(
  watch: Watch,
  db: ReturnType<typeof getDatabase>,
): Promise<void> {
  const { id, trigger, params, action } = watch;

  console.log(`Polling ${trigger} ${params.join(' ')} (${id})`);

  try {
    const result = await executeTrigger(trigger, params);

    if (result.error) {
      console.error(`Trigger error for ${id}: ${result.error}`);
      return;
    }

    if (result.fired) {
      console.log(`Trigger fired for ${id}!`);

      const firedAt = new Date().toISOString();
      db.markFired(id, firedAt);

      // Execute action
      console.log(`Executing action for ${id}...`);
      const watchResult = await executeAndWriteResult(
        id,
        trigger,
        params,
        action,
        result.output ?? {},
        firedAt,
      );

      console.log(
        `Action completed for ${id} with exit code ${watchResult.action.exitCode}`,
      );
    }
  } catch (error) {
    console.error(`Error polling ${id}:`, error);
  }
}

/** Sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run if executed directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('/daemon.js');

if (isMainModule) {
  startDaemon().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
