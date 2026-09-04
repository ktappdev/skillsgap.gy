from __future__ import annotations

import os
import secrets
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from fastapi import FastAPI, File, Header, HTTPException, UploadFile

MAX_PDF_BYTES = 15 * 1024 * 1024

app = FastAPI(title="SkillsGap OCR", docs_url=None, redoc_url=None)


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} must be set")
    return value


OCR_SERVICE_SECRET = required_env("OCR_SERVICE_SECRET")
SCRATCH_DIR = Path(os.environ.get("OCR_SCRATCH_DIR", "/tmp/skillsgap-ocr"))
SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
SCRATCH_DIR.chmod(0o700)


def create_pipeline() -> Any:
    from paddleocr import PPStructureV3

    return PPStructureV3(
        lang="en",
        device=os.environ.get("OCR_DEVICE", "gpu"),
        use_doc_orientation_classify=True,
        use_formula_recognition=False,
        use_table_recognition=False,
    )


PIPELINE = create_pipeline()


def markdown_text(result: Any) -> str:
    markdown = getattr(result, "markdown", None)
    if not isinstance(markdown, dict):
        return ""

    value = markdown.get("markdown_texts", markdown.get("text", ""))
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "\n".join(str(item) for item in value).strip()
    return ""


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/parse")
def parse_resume(
    file: UploadFile = File(...),
    x_ocr_secret: str | None = Header(default=None),
) -> dict[str, object]:
    if not secrets.compare_digest(x_ocr_secret or "", OCR_SERVICE_SECRET):
        raise HTTPException(status_code=401, detail="unauthorized")

    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="PDF files only")

    contents = file.file.read(MAX_PDF_BYTES + 1)
    if len(contents) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds 15 MB limit")
    if not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="PDF files only")

    temporary_path: Path | None = None
    try:
        with NamedTemporaryFile(dir=SCRATCH_DIR, suffix=".pdf", delete=False) as temporary_file:
            temporary_file.write(contents)
            temporary_path = Path(temporary_file.name)

        pages: list[dict[str, object]] = []
        for page_number, result in enumerate(PIPELINE.predict(input=str(temporary_path)), start=1):
            pages.append({"page": page_number, "text": markdown_text(result)})

        text = "\n\n".join(str(page["text"]) for page in pages).strip()
        if not text:
            raise HTTPException(status_code=422, detail="No readable text found in PDF")

        return {"pages": pages, "text": text}
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
