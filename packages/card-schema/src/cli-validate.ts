#!/usr/bin/env node
/**
 * CLI tool to validate all practice hands
 * Used in CI to ensure all YAML files are valid
 */

import { loadHandFromFile, loadRulesetFromFile } from './parser.js';
import { validateHand } from './validator.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

async function findYamlFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
      .map((entry) => join(dir, entry.name));
  } catch {
    return [];
  }
}

async function main() {
  let errorCount = 0;

  // Validate rulesets
  console.log('Validating rulesets...');
  const rulesetFiles = await findYamlFiles(join(repoRoot, 'content/rulesets'));

  for (const file of rulesetFiles) {
    try {
      const ruleset = await loadRulesetFromFile(join(repoRoot, file));
      console.log(`✓ ${file}`);
    } catch (error) {
      console.error(`✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
  }

  // Validate practice hands
  console.log('\nValidating practice hands...');
  const handFiles = (await findYamlFiles(join(repoRoot, 'content/practice-card'))).filter(
    (f) => !f.includes('/golden/')
  );

  for (const file of handFiles) {
    try {
      const hand = await loadHandFromFile(join(repoRoot, file));
      const errors = validateHand(hand);

      if (errors.length > 0) {
        console.error(`✗ ${file}:`);
        for (const error of errors) {
          console.error(`  - ${error}`);
        }
        errorCount += errors.length;
      } else {
        console.log(`✓ ${file}`);
      }
    } catch (error) {
      console.error(`✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.error(`\n${errorCount} validation error(s) found`);
    process.exit(1);
  } else {
    console.log(`\n✓ All content validated successfully`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
