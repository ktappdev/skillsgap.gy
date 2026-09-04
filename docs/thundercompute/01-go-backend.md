# Thunder Compute: Go processor deployment

The Go processor is the only public Thunder service. It accepts an authenticated Supabase webhook, claims durable jobs, downloads private CVs, coordinates PDF extraction/OCR/vLLM, and writes validated results back to Supabase.

## Target layout

```text
Go API                 0.0.0.0:8080  (forward this port)
PP-StructureV3 OCR     127.0.0.1:8090 (internal only)
gpt-oss-20b via vLLM   127.0.0.1:8000 (internal only)
```

Thunder supplies the NVIDIA driver and HTTPS port forwarding. Do not forward ports `8000` or `8090`.

## 1. Install runtime dependencies

Run on the Thunder instance (Ubuntu example):

```bash
sudo apt-get update
sudo apt-get install -y golang-go poppler-utils curl ca-certificates openssl
go version
pdftotext -v
```

Do not reinstall CUDA. The OCR and vLLM runbooks install their own isolated Python environments.

## 2. Build the repository service

Copy this repository onto persistent storage first, then set `SKILLSGAP_APP_DIR` to that directory:

```bash
export SKILLSGAP_APP_DIR="$HOME/skillsgap/app"
cd "$SKILLSGAP_APP_DIR/services/processor"
mkdir -p "$HOME/skillsgap/bin"
go mod download
go fmt ./...
go vet ./...
go test ./...
go build -o "$HOME/skillsgap/bin/skillsgap-processor" ./...
```

The binary requires `WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OCR_SERVICE_SECRET`, and `VLLM_API_KEY`. Optional values are `PORT` (default `8080`), `OCR_URL`, `VLLM_URL`, `VLLM_MODEL`, and `PROCESSOR_SCRATCH_DIR` (default `/ephemeral/skillsgap-processor`). Keep secrets in a mode-0600 environment file.

## 3. Smoke-test the binary

Populate `/etc/skillsgap/processor.env` with the required values, then run the binary in a terminal:

```bash
set -a
source /etc/skillsgap/processor.env
set +a
"$HOME/skillsgap/bin/skillsgap-processor"
```

In a second SSH session:

```bash
set -a
source /etc/skillsgap/processor.env
set +a
curl --fail --silent http://127.0.0.1:8080/healthz
curl --fail --silent --show-error \
  -X POST http://127.0.0.1:8080/webhooks/resume \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"job_id":"00000000-0000-0000-0000-000000000000"}'
```

The health check returns `{"status":"ok"}`. The webhook returns HTTP `202`; the all-zero ID is harmless because the worker will not claim it.

## 4. Install as a systemd service

```bash
sudo install -d -o ubuntu -g ubuntu -m 0700 /etc/skillsgap
sudo install -o ubuntu -g ubuntu -m 0755 "$HOME/skillsgap/bin/skillsgap-processor" /opt/skillsgap-processor
sudoedit /etc/skillsgap/processor.env
sudo chmod 0600 /etc/skillsgap/processor.env
sudo chown ubuntu:ubuntu /etc/skillsgap/processor.env
```

Create `/etc/systemd/system/skillsgap-processor.service`:

```ini
[Unit]
Description=SkillsGap CV processor
After=network-online.target
Wants=network-online.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt
EnvironmentFile=/etc/skillsgap/processor.env
ExecStart=/opt/skillsgap-processor
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Start and verify it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now skillsgap-processor
sudo systemctl status --no-pager skillsgap-processor
curl --fail --silent http://127.0.0.1:8080/healthz
```

## 5. Configure the Supabase webhook

After the domain migration is applied, create one Supabase Database Webhook for `public.processing_jobs`, event `INSERT`, pointing to the forwarded Thunder URL:

```text
URL: https://<forwarded-host>/webhooks/resume
Header: X-Webhook-Secret: (the exact WEBHOOK_SECRET in processor.env)
```

The webhook body may be the standard Supabase envelope. The service reads only `record.id`, acknowledges quickly with `202`, and leaves durable recovery to its poller if delivery is delayed.

## Troubleshooting

- `connection refused`: inspect `sudo systemctl status skillsgap-processor` and `ss -ltnp | grep ':8080'`.
- `401 unauthorized`: compare the webhook header byte-for-byte with `WEBHOOK_SECRET`.
- OCR or vLLM unavailable: the worker records a safe retry/failure state; inspect those services locally on ports `8090` and `8000`.
- Never put a service-role key in a `NEXT_PUBLIC_` variable or expose ports `8000`/`8090` through Thunder.
