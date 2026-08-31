"""Extraction du contenu d'un PDF officiel CAMTEL (produits + images).

Pipeline d'import (#39 du cahier des charges) :
  1. Ce script extrait le TEXTE (page par page) et les IMAGES embarquees ;
  2. Le texte sert a construire le snapshot data/camtel_catalog/<date>/
     (offers.json, services.json, sources.json...) ;
  3. Les images vont dans backend/media/products/pdf-import/ pour etre
     rattachees aux produits via manage.py attach_official_images.

Usage :
    python scripts/extract_official_pdf.py <fichier.pdf> [--images-only] [--min-size 64]

Sorties :
    data/camtel_catalog/pdf-extracts/<nom>-texte.txt   (texte page par page)
    backend/media/products/pdf-import/<nom>_p<page>_<n>.<ext>
    Rapport recapitulatif affiche en fin d'execution.
"""
import argparse
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def extract_text(pdf_path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    chunks = [f"=== PDF : {pdf_path.name} - {len(reader.pages)} pages ==="]
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = (page.extract_text() or "").strip()
        except Exception as exc:  # page corrompue : on continue
            text = f"[ERREUR extraction page {i}: {exc}]"
        chunks.append(f"\n----- PAGE {i} -----\n{text}")
    return "\n".join(chunks)


def extract_images(pdf_path: Path, out_dir: Path, min_size: int) -> int:
    """Extrait les images embarquees (filtre : >= min_size px de cote).

    Retourne le nombre d'images effectivement sauvegardees. Les formats
    exotiques (DIB, SMask) sont convertis en JPEG via PIL si disponible ;
    les images trop petites (icones, puces) sont ecartees via le meme filtre.
    """
    from pypdf import PdfReader

    try:
        from PIL import Image
    except ImportError:
        Image = None  # type: ignore[assignment]

    out_dir.mkdir(parents=True, exist_ok=True)
    reader = PdfReader(str(pdf_path))
    saved = 0
    stem = pdf_path.stem.replace(" ", "_")[:40]
    for page_num, page in enumerate(reader.pages, start=1):
        try:
            images = page.images
        except Exception:
            continue
        for img_idx, img in enumerate(images, start=1):
            pil_img = None
            if Image is not None:
                try:
                    pil_img = Image.open(io.BytesIO(img.data))
                    if pil_img.width < min_size or pil_img.height < min_size:
                        continue  # icone/puce : ecartee
                except Exception:
                    pil_img = None  # illisible : on tentera la sauvegarde brute
            ext = (Path(img.name).suffix.lower().lstrip(".") or "bin")
            name = (Path(img.name).stem or f"img{img_idx}")[:24]
            target = out_dir / f"{stem}_p{page_num}_{img_idx}_{name}.{ext}"
            try:
                if pil_img is not None and ext not in ("jpg", "jpeg", "png"):
                    # Format non web (DIB, PPM...) : conversion JPEG.
                    target = target.with_suffix(".jpg")
                    pil_img.convert("RGB").save(target, "JPEG", quality=90)
                else:
                    target.write_bytes(img.data)
                saved += 1
            except Exception:
                continue
    return saved


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("pdf", type=str, help="Chemin du PDF officiel CAMTEL.")
    parser.add_argument("--images-only", action="store_true",
                        help="N'extraire que les images (pas le texte).")
    parser.add_argument("--min-size", type=int, default=64,
                        help="Taille minimale (px) pour garder une image (defaut 64).")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.is_absolute():
        pdf_path = ROOT / pdf_path
    if not pdf_path.exists():
        print(f"ERREUR : fichier introuvable : {pdf_path}")
        sys.exit(1)

    print(f"Traitement : {pdf_path}")
    saved_images = 0
    if not args.images_only:
        text = extract_text(pdf_path)
        text_dir = ROOT / "data" / "camtel_catalog" / "pdf-extracts"
        text_dir.mkdir(parents=True, exist_ok=True)
        text_file = text_dir / f"{pdf_path.stem.replace(' ', '_')}-texte.txt"
        text_file.write_text(text, encoding="utf-8")
        words = len(text.split())
        print(f"[OK] Texte  : {text_file} ({words} mots)")

    saved_images = extract_images(pdf_path, ROOT / "backend" / "media" / "products" / "pdf-import",
                                 args.min_size)
    print(f"[OK] Images : {saved_images} sauvegardees dans backend/media/products/pdf-import/")

    print(
        "\nEtapes suivantes :\n"
        "  1. Construire le snapshot data/camtel_catalog/<date>/ (offers.json...) "
        "a partir du texte extrait ;\n"
        "  2. python manage.py seed_camtel_data --snapshot <date> ;\n"
        "  3. python manage.py attach_official_images (rattache les images aux produits)."
    )


if __name__ == "__main__":
    main()
