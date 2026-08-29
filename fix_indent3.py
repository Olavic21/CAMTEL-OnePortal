path = 'frontend/camtel/frontend/src/shared/lib/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = "                featuredProducts: 'Produits phares',"
new = "        featuredProducts: 'Produits phares',"

if old in content:
    content = content.replace(old, new, 1)
    print('Fixed featuredProducts indentation')
else:
    print('Pattern not found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
