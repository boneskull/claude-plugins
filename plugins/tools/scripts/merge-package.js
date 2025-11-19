import { readFileSync, writeFileSync } from 'fs';

/**
 * Merge package.json files from template into target Usage: node
 * merge-package.js <target-package.json> <template-package.json>
 */

/**
 * @typedef {Object} ParsedVersion
 * @property {number[]} parts
 * @property {string} prefix
 * @property {string} version
 */

/**
 * @typedef {Record<string, string>} Dependencies
 */

/**
 * @typedef {Object} PackageJson
 * @property {Dependencies} [dependencies]
 * @property {Dependencies} [devDependencies]
 * @property {Dependencies} [peerDependencies]
 * @property {Dependencies} [optionalDependencies]
 * @property {Record<string, string>} [scripts]
 * @property {Record<string, any>} [engines]
 * @property {Record<string, any>} [knip]
 * @property {Record<string, any>} [lint-staged]
 * @property {Record<string, any>} [prettier]
 */

/**
 * @typedef {Object} MergeChanges
 * @property {string[]} added
 * @property {{ pkg: string; oldVer: string; newVer: string }[]} updated
 */

/**
 * @typedef {Object} ScriptChanges
 * @property {string[]} added
 */

/**
 * @typedef {Object} ChangeLog
 * @property {MergeChanges} dependencies
 * @property {MergeChanges} devDependencies
 * @property {{ added: string[] }} fields
 * @property {ScriptChanges} scripts
 */

const targetPath = process.argv[2];
const templatePath = process.argv[3];

if (!targetPath || !templatePath) {
  console.error(
    'Usage: node merge-package.js <target-package.json> <template-package.json>',
  );
  process.exit(1);
}

/** @type {PackageJson} */
const target = JSON.parse(readFileSync(targetPath, 'utf8'));
/** @type {PackageJson} */
const template = JSON.parse(readFileSync(templatePath, 'utf8'));

/**
 * Compare two version strings
 *
 * @param {string} v1
 * @param {string} v2
 * @returns {number}
 */
const compareVersions = (v1, v2) => {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);

  for (let i = 0; i < 3; i++) {
    const part1 = p1.parts[i] ?? 0;
    const part2 = p2.parts[i] ?? 0;
    if (part1 > part2) {
      return 1;
    }
    if (part1 < part2) {
      return -1;
    }
  }

  // If versions are equal, prefer exact over ranges
  if (p1.prefix === '' && p2.prefix !== '') {
    return 1;
  }
  if (p1.prefix !== '' && p2.prefix === '') {
    return -1;
  }

  return 0;
};

/**
 * Merge dependencies from template into target
 *
 * @param {Dependencies} [targetDeps={}] Default is `{}`
 * @param {Dependencies} [templateDeps={}] Default is `{}`
 * @returns {{ merged: Dependencies; changes: MergeChanges }}
 */
const mergeDependencies = (targetDeps = {}, templateDeps = {}) => {
  const merged = { ...targetDeps };
  /** @type {MergeChanges} */
  const changes = { added: [], updated: [] };

  for (const [pkg, templateVer] of Object.entries(templateDeps)) {
    if (!merged[pkg]) {
      merged[pkg] = templateVer;
      changes.added.push(pkg);
    } else if (compareVersions(templateVer, merged[pkg]) > 0) {
      const oldVer = merged[pkg];
      merged[pkg] = templateVer;
      changes.updated.push({ newVer: templateVer, oldVer, pkg });
    }
  }

  return { changes, merged };
};

/**
 * Merge scripts from template into target
 *
 * @param {Record<string, string>} [targetScripts={}] Default is `{}`
 * @param {Record<string, string>} [templateScripts={}] Default is `{}`
 * @returns {{ merged: Record<string, string>; changes: ScriptChanges }}
 */
const mergeScripts = (targetScripts = {}, templateScripts = {}) => {
  const merged = { ...targetScripts };
  /** @type {ScriptChanges} */
  const changes = { added: [] };

  for (const [name, script] of Object.entries(templateScripts)) {
    if (!merged[name]) {
      merged[name] = script;
      changes.added.push(name);
    }
  }

  return { changes, merged };
};

/**
 * Parse semver-like version strings for comparison
 *
 * @param {string} version
 * @returns {ParsedVersion}
 */
const parseVersion = (version) => {
  if (!version || version === 'latest') {
    return {
      parts: [999, 999, 999],
      prefix: '',
      version: version || '999.999.999',
    };
  }
  const match = version.match(/^([~^]?)(\d+\.\d+\.\d+.*)/);
  if (!match) {
    return { parts: [0, 0, 0], prefix: '', version };
  }
  const [, prefix = '', ver = '0.0.0'] = match;
  const parts = ver
    .split('.')
    .map((/** @type {string} */ p) => parseInt(p) || 0);
  return { parts, prefix, version: ver };
};

// Track all changes
/** @type {ChangeLog} */
const changeLog = {
  dependencies: { added: [], updated: [] },
  devDependencies: { added: [], updated: [] },
  fields: { added: [] },
  scripts: { added: [] },
};

// Merge dependencies
const depTypes = /** @type {const} */ ([
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]);
for (const depType of depTypes) {
  if (template[depType]) {
    const result = mergeDependencies(target[depType], template[depType]);
    target[depType] = result.merged;
    if (depType === 'dependencies' || depType === 'devDependencies') {
      changeLog[depType] = result.changes;
    }
  }
}

// Merge scripts (add missing, don't overwrite)
if (template.scripts) {
  const result = mergeScripts(target.scripts, template.scripts);
  target.scripts = result.merged;
  changeLog.scripts = result.changes;
}

// Add missing fields from template (don't overwrite existing)
const fieldsToConsider = /** @type {const} */ ([
  'engines',
  'knip',
  'lint-staged',
]);
for (const field of fieldsToConsider) {
  const templateField = template[field];
  const targetField = target[field];
  if (templateField && !targetField) {
    target[field] = templateField;
    changeLog.fields.added.push(field);
  }
}

// Merge prettier config (add plugins if missing)
if (template.prettier && target.prettier) {
  if (template.prettier.plugins && !target.prettier.plugins) {
    target.prettier.plugins = template.prettier.plugins;
    changeLog.fields.added.push('prettier.plugins');
  }
  // Add other prettier options that don't exist
  for (const [key, value] of Object.entries(template.prettier)) {
    if (key !== 'plugins' && target.prettier[key] === undefined) {
      target.prettier[key] = value;
    }
  }
}

// Write merged package.json
writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n');

// Output change log as JSON
console.log(JSON.stringify(changeLog, null, 2));
