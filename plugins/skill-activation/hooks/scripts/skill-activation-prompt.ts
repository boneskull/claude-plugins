#!/usr/bin/env node

import { accessSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface FileTriggers {
  contentPatterns?: string[];
  pathExclusions?: string[];
  pathPatterns?: string[];
}

interface HookInput {
  cwd: string;
  permission_mode: string;
  prompt: string;
  session_id: string;
  transcript_path: string;
}

interface InstalledPlugin {
  gitCommitSha?: string;
  installedAt: string;
  installPath: string;
  isLocal?: boolean;
  lastUpdated: string;
  scope: 'project' | 'user';
  version: string;
}

interface InstalledPlugins {
  plugins: Record<string, InstalledPlugin[]>; // Array per plugin (multiple scopes)
  version: number;
}

interface MatchedSkill {
  config: SkillRule;
  displayName: string;
  matchType: 'intent' | 'keyword';
  name: string;
  skillPath: null | string;
}

interface PromptTriggers {
  intentPatterns?: string[];
  keywords?: string[];
}

interface SkillRule {
  blockMessage?: string;
  description?: string;
  enforcement: 'block' | 'suggest' | 'warn';
  fileTriggers?: FileTriggers;
  priority: 'critical' | 'high' | 'low' | 'medium';
  promptTriggers?: PromptTriggers;
  skipConditions?: SkipConditions;
  type: 'domain' | 'guardrail';
}

interface SkillRules {
  description?: string;
  notes?: Record<string, any>;
  skills: Record<string, SkillRule>;
  version: string;
}

interface SkipConditions {
  envOverride?: string;
  fileMarkers?: string[];
  sessionSkillUsed?: boolean;
}

/**
 * Get the best plugin installation for a given plugin ID. Prefers "user" scope,
 * falls back to first available.
 */
const getPluginInstall = (
  pluginInstalls: InstalledPlugin[] | undefined,
): InstalledPlugin | undefined => {
  if (!pluginInstalls || pluginInstalls.length === 0) {
    return undefined;
  }
  // Prefer user-scoped installation
  return pluginInstalls.find((p) => p.scope === 'user') ?? pluginInstalls[0];
};

/**
 * Load installed plugins metadata from Claude's global config
 */
const loadInstalledPlugins = (): InstalledPlugins => {
  const pluginsPath = join(
    homedir(),
    '.claude',
    'plugins',
    'installed_plugins.json',
  );

  try {
    const content = readFileSync(pluginsPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    // If we can't read installed plugins, return empty structure
    console.error('Warning: Could not load installed plugins:', err);
    return { plugins: {}, version: 1 };
  }
};

/**
 * Parse a skill reference in format "plugin@marketplace:skill-name" Returns
 * null if the reference is in legacy format (no plugin qualifier)
 */
const parseSkillRef = (
  skillRef: string,
): null | { pluginId: string; skillName: string } => {
  const match = skillRef.match(/^(.+?)@(.+?):(.+)$/);
  if (!match) {
    return null; // Legacy format (local project skill)
  }
  const [, pluginName, marketplace, skillName] = match;
  return {
    pluginId: `${pluginName}@${marketplace}`,
    skillName: skillName!,
  };
};

/**
 * Resolve a skill reference to an absolute file path Returns null if:
 *
 * - Plugin is not installed
 * - Skill file doesn't exist in the plugin
 *
 * For legacy format (no plugin qualifier), looks in project .claude/skills/
 */
const resolveSkillPath = (
  skillRef: string,
  installedPlugins: InstalledPlugins,
): null | string => {
  const parsed = parseSkillRef(skillRef);

  if (!parsed) {
    // Legacy format: local project skill
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const skillPath = join(
      projectDir,
      '.claude',
      'skills',
      skillRef,
      'SKILL.md',
    );

    try {
      accessSync(skillPath);
      return skillPath;
    } catch {
      return null;
    }
  }

  const { pluginId, skillName } = parsed;

  // Check if plugin is installed and has valid installPath
  const plugin = getPluginInstall(installedPlugins.plugins[pluginId]);
  if (!plugin?.installPath) {
    return null; // Plugin not installed or malformed - gracefully skip
  }

  // Construct skill path
  const skillPath = join(plugin.installPath, 'skills', skillName, 'SKILL.md');

  // Verify skill exists
  try {
    accessSync(skillPath);
    return skillPath;
  } catch {
    return null; // Skill doesn't exist - gracefully skip
  }
};

/**
 * Create a display name for the skill For plugin skills:
 * "plugin-name:skill-name" For local skills: just "skill-name"
 */
const getDisplayName = (skillRef: string): string => {
  const parsed = parseSkillRef(skillRef);
  if (!parsed) {
    return skillRef; // Legacy format
  }

  const { pluginId, skillName } = parsed;
  // Extract just the plugin name (before @)
  const pluginName = pluginId.split('@')[0];
  return `${pluginName}:${skillName}`;
};

const loadSkillRules = (rulesPath: string): SkillRules | undefined => {
  try {
    accessSync(rulesPath);
    const pluginRules: SkillRules = JSON.parse(
      readFileSync(rulesPath, 'utf-8'),
    );

    return pluginRules;
  } catch {}
};

/**
 * Load and merge skill rules from all sources in priority order:
 *
 * 1. Plugin-defined rules (lowest priority - defaults)
 * 2. Global user rules ~/.claude/skill-rules.json (middle priority)
 * 3. Project rules .claude/skill-rules.json (highest priority)
 *
 * Higher priority rules override lower priority rules
 */
const loadAllSkillRules = (
  installedPlugins: InstalledPlugins,
  projectDir: string,
): SkillRules => {
  const mergedRules: SkillRules = {
    skills: {},
    version: '1.0',
  };

  // 1. Load plugin-defined rules (lowest priority - defaults)
  let pluginRulesLoaded = 0;
  for (const pluginInstalls of Object.values(installedPlugins.plugins)) {
    const plugin = getPluginInstall(pluginInstalls);
    if (!plugin?.installPath) {
      continue;
    }
    const rulesPath = join(plugin.installPath, 'skills', 'skill-rules.json');

    const pluginRules = loadSkillRules(rulesPath);
    if (pluginRules) {
      Object.assign(mergedRules.skills, pluginRules.skills);
      pluginRulesLoaded++;
    }
  }

  // 2. Load global user rules (middle priority - overrides plugin defaults)
  let globalRulesLoaded = false;
  const globalRulesPath = join(homedir(), '.claude', 'skill-rules.json');
  const globalRules = loadSkillRules(globalRulesPath);
  if (globalRules) {
    Object.assign(mergedRules.skills, globalRules.skills);
    globalRulesLoaded = true;
  }

  // 3. Load project rules (highest priority - overrides everything)
  const projectRulesPath = join(projectDir, '.claude', 'skill-rules.json');
  let projectRulesLoaded = false;
  const projectRules = loadSkillRules(projectRulesPath);
  if (projectRules) {
    Object.assign(mergedRules.skills, projectRules.skills);
    projectRulesLoaded = true;
  }

  // Debug info (only if no rules found at all)
  if (pluginRulesLoaded === 0 && !globalRulesLoaded && !projectRulesLoaded) {
    console.error(
      'Warning: No skill rules found in plugins, global config, or project config',
    );
  }

  return mergedRules;
};

const main = async () => {
  // Read input from stdin
  const input = readFileSync(0, 'utf-8');
  const data: HookInput = JSON.parse(input);
  const prompt = data.prompt.toLowerCase();

  // Load installed plugins
  const installedPlugins = loadInstalledPlugins();

  // Get project directory
  const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd;

  // Load and merge all skill rules
  const rules = loadAllSkillRules(installedPlugins, projectDir);

  const matchedSkills: MatchedSkill[] = [];

  // Check each skill for matches
  for (const [skillRef, config] of Object.entries(rules.skills)) {
    const triggers = config.promptTriggers;
    if (!triggers) {
      continue;
    }

    let matched = false;
    let matchType: 'intent' | 'keyword' = 'keyword';

    // Keyword matching
    if (triggers.keywords) {
      const keywordMatch = triggers.keywords.some((kw) =>
        prompt.includes(kw.toLowerCase()),
      );
      if (keywordMatch) {
        matched = true;
        matchType = 'keyword';
      }
    }

    // Intent pattern matching (only if not already matched by keyword)
    if (!matched && triggers.intentPatterns) {
      const intentMatch = triggers.intentPatterns.some((pattern) => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(prompt);
      });
      if (intentMatch) {
        matched = true;
        matchType = 'intent';
      }
    }

    if (matched) {
      // Resolve skill path
      const skillPath = resolveSkillPath(skillRef, installedPlugins);

      // Only skip if skill doesn't exist
      // Still show in output but mark as unavailable
      matchedSkills.push({
        config,
        displayName: getDisplayName(skillRef),
        matchType,
        name: skillRef,
        skillPath,
      });
    }
  }

  // Generate output if matches found
  if (matchedSkills.length > 0) {
    let output = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '🎯 SKILL ACTIVATION CHECK\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // Group by priority
    const critical = matchedSkills.filter(
      (s) => s.config.priority === 'critical',
    );
    const high = matchedSkills.filter((s) => s.config.priority === 'high');
    const medium = matchedSkills.filter((s) => s.config.priority === 'medium');
    const low = matchedSkills.filter((s) => s.config.priority === 'low');

    // Helper to format skill with availability status
    const formatSkill = (s: MatchedSkill): string => {
      if (s.skillPath === null) {
        return `  → ${s.displayName} ⚠️ (plugin not installed)`;
      }
      return `  → ${s.displayName}`;
    };

    if (critical.length > 0) {
      output += '⚠️ CRITICAL SKILLS (REQUIRED):\n';
      critical.forEach((s) => (output += formatSkill(s) + '\n'));
      output += '\n';
    }

    if (high.length > 0) {
      output += '📚 RECOMMENDED SKILLS:\n';
      high.forEach((s) => (output += formatSkill(s) + '\n'));
      output += '\n';
    }

    if (medium.length > 0) {
      output += '💡 SUGGESTED SKILLS:\n';
      medium.forEach((s) => (output += formatSkill(s) + '\n'));
      output += '\n';
    }

    if (low.length > 0) {
      output += '📌 OPTIONAL SKILLS:\n';
      low.forEach((s) => (output += formatSkill(s) + '\n'));
      output += '\n';
    }

    // Check if any skills are unavailable
    const unavailable = matchedSkills.filter((s) => s.skillPath === null);
    if (unavailable.length > 0) {
      output += '💡 TIP: Some skills require installing additional plugins\n';
    }

    output += 'ACTION: Use Skill tool BEFORE responding\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    // Output JSON for UserPromptSubmit hook
    const hookOutput = {
      hookSpecificOutput: {
        additionalContext: output, // Added to Claude's context
        hookEventName: 'UserPromptSubmit',
      },
      // systemMessage: output, // Displayed directly to the user (commented out - too noisy)
    };

    console.log(JSON.stringify(hookOutput, null, 2));
  }
  // No output when no skills match (allow prompt to proceed normally)
};

main().catch((err) => {
  console.error('Uncaught error:', err);
  process.exitCode = 1;
});
