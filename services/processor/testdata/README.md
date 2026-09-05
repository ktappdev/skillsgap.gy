# Synthetic CV fixtures

Run `python3 generate_fixtures.py` from this folder to create fictional PDFs for processor rehearsal. The vision-only fixture test sends every page of the clean-text, scanned, mixed, two-column, and table-heavy PDFs to one fake vision request in page order. The remaining fixtures cover prompt injection, encryption, malformed data, an over-page document, and an oversized document.

Generated PDFs are intentionally ignored: the oversized fixture exceeds the product upload limit and should not bloat Git history.
