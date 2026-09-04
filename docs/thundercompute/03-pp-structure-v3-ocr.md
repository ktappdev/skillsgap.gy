# Thunder Compute: PP-StructureV3 OCR deployment

PP-StructureV3 is the private OCR/layout service used when a PDF has no usable native text. The production implementation is [`services/ocr/app.py`](../../services/ocr/app.py); it accepts authenticated PDFs, returns ordered page text, and deletes its temporary file after every request.

## Target layout

```text
Go processor → http://127.0.0.1:8090/parse
OCR service  → 127.0.0.1:8090 (internal only)
```

Do not forward port `8090` through Thunder.

## 1. Create an isolated OCR environment

```bash
nvidia-smi
mkdir -p "$HOME/skillsgap/venvs" "$HOME/skillsgap/ocr-scratch" "$HOME/skillsgap/app"

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

uv venv --python 3.12 "$HOME/skillsgap/venvs/ocr"
source "$HOME/skillsgap/venvs/ocr/bin/activate"
uv pip install --upgrade pip
uv pip install paddlepaddle-gpu==3.2.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
uv pip install 'paddleocr[doc-parser]' fastapi uvicorn python-multipart
python -c 'import paddle; print(paddle.__version__); print(paddle.device.get_device())'
```

Keep model caches under persistent storage. If the wheel is incompatible with the driver shown by `nvidia-smi`, use the current PaddlePaddle compatibility matrix instead of randomly changing CUDA packages.

## 2. Run the repository service

Set the repository directory and service secret, then start the actual app:

```bash
export SKILLSGAP_APP_DIR="$HOME/skillsgap/app"
cd "$SKILLSGAP_APP_DIR/services/ocr"
export OCR_SERVICE_SECRET="$(openssl rand -hex 32)"
export OCR_SCRATCH_DIR="/ephemeral/skillsgap-ocr"
mkdir -p "$OCR_SCRATCH_DIR"
umask 077
printf 'OCR_SERVICE_SECRET=%s\nOCR_SCRATCH_DIR=%s\n' "$OCR_SERVICE_SECRET" "$OCR_SCRATCH_DIR" > "$HOME/skillsgap/ocr.env"
"$HOME/skillsgap/venvs/ocr/bin/uvicorn" app:app --host 127.0.0.1 --port 8090
```

The first startup downloads PP-StructureV3 model weights. In a second terminal:

```bash
curl --fail --silent http://127.0.0.1:8090/healthz
set -a
source "$HOME/skillsgap/ocr.env"
set +a
export RESUME_PDF="$HOME/skillsgap/test-resume.pdf"
curl --fail --silent --show-error \
  -X POST http://127.0.0.1:8090/parse \
  -H "X-OCR-Secret: $OCR_SERVICE_SECRET" \
  -F "file=@$RESUME_PDF;type=application/pdf"
```

The response contains ordered page text. The Go processor passes this text to vLLM; browsers never call this endpoint.

## 3. Install as a systemd service

Create `/etc/skillsgap/ocr.env` with mode `0600` containing:

```text
OCR_SERVICE_SECRET=the-shared-secret
OCR_SCRATCH_DIR=/ephemeral/skillsgap-ocr
OCR_DEVICE=gpu
```

Create `/etc/systemd/system/skillsgap-ocr.service`:

```ini
[Unit]
Description=SkillsGap PP-StructureV3 OCR service
After=network-online.target
Wants=network-online.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/skillsgap/app/services/ocr
EnvironmentFile=/etc/skillsgap/ocr.env
ExecStart=/home/ubuntu/skillsgap/venvs/ocr/bin/uvicorn app:app --host 127.0.0.1 --port 8090
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Start and verify:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now skillsgap-ocr
sudo systemctl status --no-pager skillsgap-ocr
curl --fail --silent http://127.0.0.1:8090/healthz
```

## Operational rules

- Native `pdftotext` runs first; OCR is the fallback for scans or unusable text.
- Requests are PDF-only and capped at 15 MB.
- Temporary PDFs use a private scratch directory and are deleted in a `finally` block.
- Do not log CV contents, OCR text, request bodies, or service secrets.
- If GPU memory is exhausted while vLLM is loaded, lower vLLM utilization or set `OCR_DEVICE=cpu` for the fallback path.
