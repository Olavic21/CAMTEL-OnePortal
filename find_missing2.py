import re, os, json

# Use TypeScript/JavaScript parsing via eval to extract all keys
# Instead of parsing, let's import the actual module

path = 'frontend/camtel/frontend/src/shared/lib/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the resources object using regex
# The file has: const resources = { fr: { translation: { ... } }, en: { translation: { ... } } };

# Remove comments
content_no_comments = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)

# Find the resources object
resources_match = re.search(r'const\s+resources\s*=\s*(\{.*?\});\s*\n', content_no_comments, re.DOTALL)
if not resources_match:
    # Try without the semicolon
    resources_match = re.search(r'const\s+resources\s*=\s*(\{.*?\});', content_no_comments, re.DOTALL)

if resources_match:
    resources_text = resources_match.group(1)
    # Try to parse it as JSON by removing TypeScript syntax
    # Replace single quotes with double quotes, handle escaped chars
    resources_text = resources_text.replace("\\'", "\\'").replace("'", '"')
    # Handle unicode escapes
    # Remove trailing commas
    resources_text = re.sub(r',\s*([}\]])', r'\1', resources_text)
    try:
        resources = json.loads(resources_text)
        
        # Collect all defined keys
        def collect_keys(obj, prefix=''):
            keys = set()
            if isinstance(obj, dict):
                for k, v in obj.items():
                    full_key = f"{prefix}.{k}" if prefix else k
                    if isinstance(v, dict):
                        keys.add(full_key)
                        keys.update(collect_keys(v, full_key))
                    elif isinstance(v, list):
                        keys.add(full_key)
                    else:
                        keys.add(full_key)
            return keys
        
        # Extract keys from fr.translation (and en.translation for completeness)
        fr_keys = collect_keys(resources.get('fr', {}).get('translation', {}))
        en_keys = collect_keys(resources.get('en', {}).get('translation', {}))
        defined_keys = fr_keys | en_keys
        
        # Now collect all used keys from source files
        used_keys = set()
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
                # Match t('key') or t("key") - simple string literals only
                for m in re.finditer(r"t\(['\"]([a-zA-Z0-9_.]+)['\"]", txt):
                    used_keys.add(m.group(1))
        
        missing = used_keys - defined_keys
        # Filter out false positives: keys that are too short or don't look like namespace.key
        real_missing = set()
        for k in missing:
            parts = k.split('.')
            if len(parts) >= 2 and len(parts[0]) > 2:
                real_missing.add(k)
        
        print(f"Defined keys: {len(defined_keys)}")
        print(f"Used keys: {len(used_keys)}")
        print(f"Missing keys: {len(real_missing)}")
        for k in sorted(real_missing):
            print(f"  {k}")
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        # Fall back to line-by-line parsing
        print("Falling back to regex-based key extraction...")
