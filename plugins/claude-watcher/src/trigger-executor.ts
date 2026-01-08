/**
 * Executes trigger executables and parses their output
 */

import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

import { parse as parseYaml } from 'yaml';

import { TriggerMetadata, TriggerOutput } from './types.js';
import { getTriggersDir } from './utils.js';

const execFileAsync = promisify(execFile);

/** Result of executing a trigger */
export interface TriggerResult {
  /** Whether condition was met (exit code 0) */
  fired: boolean;
  /** Parsed JSON output if fired */
  output: TriggerOutput | null;
  /** Error message if execution failed */
  error?: string;
}

/** Execute a trigger executable with params */
export async function executeTrigger(
  triggerName: string,
  params: string[],
  triggersDir?: string,
): Promise<TriggerResult> {
  const triggerPath = join(triggersDir ?? getTriggersDir(), triggerName);

  // Check trigger exists and is executable
  try {
    await access(triggerPath, constants.X_OK);
  } catch {
    return {
      fired: false,
      output: null,
      error: `Trigger not found or not executable: ${triggerName}`,
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(triggerPath, params, {
      timeout: 30000, // 30 second timeout
    });

    // Log stderr if present
    if (stderr.trim()) {
      console.error(`[trigger:${triggerName}] ${stderr.trim()}`);
    }

    // Exit code 0 - trigger fired, parse JSON output
    try {
      const output = JSON.parse(stdout.trim()) as TriggerOutput;
      return { fired: true, output };
    } catch {
      // Still fired, but no valid JSON output
      return {
        fired: true,
        output: {},
        error: `Trigger fired but output was not valid JSON: ${stdout}`,
      };
    }
  } catch (err) {
    const execErr = err as {
      code?: number | string;
      message: string;
      stderr?: string;
    };

    // Log stderr if present
    if (execErr.stderr?.trim()) {
      console.error(`[trigger:${triggerName}] ${execErr.stderr.trim()}`);
    }

    // Non-zero exit means condition not met
    if (typeof execErr.code === 'number' && execErr.code !== 0) {
      return { fired: false, output: null };
    }

    // Actual execution error (not found, permission denied, timeout, etc.)
    return {
      fired: false,
      output: null,
      error: `Failed to execute trigger: ${execErr.message}`,
    };
  }
}

/** List available triggers with their metadata */
export async function listTriggers(
  triggersDirOverride?: string,
): Promise<TriggerMetadata[]> {
  const triggersDir = triggersDirOverride ?? getTriggersDir();
  const triggers: TriggerMetadata[] = [];

  try {
    const files = await readdir(triggersDir);

    for (const file of files) {
      // Skip YAML sidecars and hidden files
      if (
        file.endsWith('.yaml') ||
        file.endsWith('.yml') ||
        file.startsWith('.')
      ) {
        continue;
      }

      const triggerPath = join(triggersDir, file);

      // Check if executable
      try {
        await access(triggerPath, constants.X_OK);
      } catch {
        continue; // Not executable, skip
      }

      const name = basename(file).replace(/\.[^.]+$/, ''); // Remove extension if any

      // Try to load YAML sidecar
      let metadata: TriggerMetadata = { name };

      for (const ext of ['.yaml', '.yml']) {
        try {
          const yamlPath = join(triggersDir, `${name}${ext}`);
          const yamlContent = await readFile(yamlPath, 'utf-8');
          const parsed = parseYaml(yamlContent) as Partial<TriggerMetadata>;
          metadata = { name, ...parsed };
          break;
        } catch {
          // No sidecar found, continue
        }
      }

      triggers.push(metadata);
    }
  } catch {
    // Triggers directory doesn't exist yet
  }

  return triggers;
}

/** Check if a trigger exists */
export async function triggerExists(
  triggerName: string,
  triggersDir?: string,
): Promise<boolean> {
  const triggerPath = join(triggersDir ?? getTriggersDir(), triggerName);
  try {
    await access(triggerPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
