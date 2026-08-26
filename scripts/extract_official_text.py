"""Extraction brute du texte des pages officielles CAMTEL (traçabilité).

Usage :
    python scripts/extract_official_text.py <html_file> [motif_de_depart] [longueur]

Sort le texte visible d'une page sauvegardee dans data/camtel_catalog/raw/,
utilise pour verifier manuellement les donnees avant import.
"""
import io
import re
import sys


def main():
    if len(sys.argv) < 2:
        print("usage: extract_official_text.py <file.html> [start_marker] [length]")
        sys.exit(1)
    path = sys.argv[1]
    marker = sys.argv[2] if len(sys.argv) > 2 else ""
    length = int(sys.argv[3]) if len(sys.argv) > 3 else 8000

    h = io.open(path, encoding="utf-8", errors="ignore").read()
    h = re.sub(r"<script.*?</script>", "", h, flags=re.S)
    h = re.sub(r"<style.*?</style>", "", h, flags=re.S)
    txt = re.sub(r"<[^>]+>", "|", h)
    txt = re.sub(r"[|\s]+", " ", txt)
    i = 0
    if marker:
        i = txt.find(marker)
        if i < 0:
            print(f"MARKER NOT FOUND: {marker}")
            return
    print(txt[i:i + length])


if __name__ == "__main__":
    main()
