# SkillsGap OCR service

This private FastAPI service accepts a PDF from the Go processor and returns ordered text extracted with PP-StructureV3. It must listen only on `127.0.0.1:8090` on the Thunder instance.

Use the deployment commands in [`docs/thundercompute/03-pp-structure-v3-ocr.md`](../../docs/thundercompute/03-pp-structure-v3-ocr.md). The Go processor authenticates requests with `X-OCR-Secret`.

The service never logs CV contents and removes its temporary PDF after each request.
