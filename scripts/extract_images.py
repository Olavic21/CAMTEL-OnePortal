"""Extraction des URLs d'assets officiels depuis une page CAMTEL archivee.

Usage :
    python scripts/extract_images.py <html_file> [domaine_filtre]

Liste toutes les images/liens statiques du domaine CAMTEL concerne,
pour telechargement trace vers media/products/ (#20/#21).
"""
import io
import re
import sys


def main():
    if len(sys.argv) < 2:
        print("usage: extract_images.py <file.html> [domain_filter]")
        sys.exit(1)
    path = sys.argv[1]
    domain = sys.argv[2] if len(sys.argv) > 2 else ""

    html = io.open(path, encoding="utf-8", errors="ignore").read()
    urls = set()
    for match in re.findall(r'(?:src|href|content|data-src)=["\']([^"\']+)["\']', html):
        low = match.lower()
        if any(low.endswith(ext) or ext in low.split("?")[0][-8:] for ext in (".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".gif")):
            urls.add(match)
    for url in sorted(urls):
        if domain and domain not in url:
            continue
        print(url)
    print(f"TOTAL: {len([u for u in urls if domain in u]) if domain else len(urls)}")


if __name__ == "__main__":
    main()
