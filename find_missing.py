import re, os

# 1. Collect all keys used in source code via t('key')
used = set()
src_dir = 'frontend/camtel/frontend/src'
for root, dirs, files in os.walk(src_dir):
    if 'node_modules' in root:
        dirs.clear()
        continue
    for fname in files:
        if not fname.endswith(('.tsx', '.ts')):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            txt = f.read()
        # Simple t('key') and t("key")
        for m in re.finditer(r"t\(['\"]([a-zA-Z0-9_.]+)['\"]", txt):
            used.add(m.group(1))

# 2. Collect all defined keys from i18n.ts
defined = set()
with open('frontend/camtel/frontend/src/shared/lib/i18n.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

path = []  # stack of namespace keys
for line in lines:
    s = line.strip()
    if not s or s.startswith('//'):
        continue
    if s == '}' or s.startswith('}'):
        if path:
            path.pop()
        continue
    m = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)', s)
    if m:
        key = m.group(1)
        rest = m.group(2).strip()
        if rest.startswith('{'):
            path.append(key)
        elif rest.startswith('['):
            # skip array
            pass
        else:
            full = '.'.join(path + [key])
            # Only count keys in the fr.translation or en.translation namespace
            if 'translation' in path:
                # Remove fr/en/translation prefix
                idx = path.index('translation')
                dotted = '.'.join(path[idx+1:] + [key])
                defined.add(dotted)

# 3. Find missing keys (used but not defined)
missing = used - defined
print(f"Total used keys: {len(used)}")
print(f"Total defined keys: {len(defined)}")
print(f"\nMissing keys ({len(missing)}):")
for k in sorted(missing):
    print(f"  {k}")
