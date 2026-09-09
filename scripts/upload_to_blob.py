"""Carica le immagini di un post sul Vercel Blob Store e stampa gli URL pubblici.

Uso:
    export BLOB_READ_WRITE_TOKEN=...   # da Vercel Storage -> Blob store -> .env.local
    pip install vercel
    python scripts/upload_to_blob.py content/post-1-chatbot-vs-agente

Il token NON va mai passato come argomento da riga di comando o hardcoded:
si legge solo dalla variabile d'ambiente BLOB_READ_WRITE_TOKEN.
"""

import os
import sys
from pathlib import Path

from vercel import blob


def main() -> None:
    if len(sys.argv) != 2:
        print("Uso: python scripts/upload_to_blob.py <cartella-post>", file=sys.stderr)
        sys.exit(1)

    token = os.environ.get("BLOB_READ_WRITE_TOKEN")
    if not token:
        print("Errore: variabile d'ambiente BLOB_READ_WRITE_TOKEN non impostata", file=sys.stderr)
        sys.exit(1)

    post_dir = Path(sys.argv[1])
    if not post_dir.is_dir():
        print(f"Errore: {post_dir} non è una cartella", file=sys.stderr)
        sys.exit(1)

    image_files = sorted(
        p for p in post_dir.iterdir() if p.suffix.lower() in (".jpg", ".jpeg")
    )
    if not image_files:
        print(f"Nessuna immagine .jpg trovata in {post_dir}", file=sys.stderr)
        sys.exit(1)

    urls = []
    for path in image_files:
        data = path.read_bytes()
        result = blob.put(
            f"ig-posts/{post_dir.name}/{path.name}",
            data,
            access="public",
            content_type="image/jpeg",
            add_random_suffix=False,
            overwrite=True,
            token=token,
        )
        print(f"{path.name} -> {result.url}")
        urls.append(result.url)

    print("\nArray per l'INSERT in ig_posts_queue:")
    print("array[" + ", ".join(f"'{u}'" for u in urls) + "]")


if __name__ == "__main__":
    main()
