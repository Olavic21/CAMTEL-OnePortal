import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import i18n from './i18n';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('i18n resources', () => {
  it('defines every statically used translation key in French and English', () => {
    const sourceDirectory = join(process.cwd(), 'src');
    expect(existsSync(sourceDirectory)).toBe(true);

    const usedKeys = new Set<string>();
    const keyPattern = /\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]/g;

    for (const file of sourceFiles(sourceDirectory)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(keyPattern)) {
        if (match[1] !== '...') usedKeys.add(match[1]);
      }
    }

    const missing = ['fr', 'en'].flatMap((language) =>
      [...usedKeys]
        .filter((key) => i18n.getResource(language, 'translation', key) === undefined)
        .map((key) => `${language}: ${key}`),
    );

    expect(missing, `Missing translations:\n${missing.join('\n')}`).toEqual([]);
  });
});
