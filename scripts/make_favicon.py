# -*- coding: utf-8 -*-
"""Genere le favicon PNG (64x64) depuis la source officielle du logo.

Usage:
    python scripts/make_favicon.py [chemin_source] [chemin_sortie]

Defaut: public/logo-new.png -> public/favicon.png
Reutilisable quand un nouveau logo sera fourni (regle #28 : branding centralise).
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

DEFAULT_SRC = Path(__file__).resolve().parent.parent / "frontend" / "camtel" / "frontend" / "public" / "logo-new.png"
DEFAULT_DST = DEFAULT_SRC.parent / "favicon.png"


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_DST
    if not src.exists():
        print(f"[ERREUR] Source introuvable : {src}", file=sys.stderr)
        return 1
    im = Image.open(src).convert("RGBA").resize((64, 64), Image.LANCZOS)
    im.save(dst, format="PNG")
    print(f"[OK] favicon genere : {dst} ({dst.stat().st_size} octets)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
