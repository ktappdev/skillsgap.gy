# Thunder Compute: Go processor deployment

The Go processor is the only public Thunder service. It accepts an authenticated Supabase webhook, claims durable jobs, downloads private CVs, renders their pages, sends the images to Qwen vision, and writes validated results back to Supabase.

## Target layout

```text
Go API                 0.0.0.0:8080  (forward this port)
Qwen3.6-35B via vLLM  127.0.0.1:8000 (internal only)
```

Thunder supplies the NVIDIA driver and HTTPS port forwarding. Do not forward port `8000`; no OCR service is required for the active MVP path.
The current Go forwarding URL is `https://e2tpybmi-8080.thundercompute.net`.

## 1. Install runtime dependencies

Run on the Thunder instance (Ubuntu example):

```bash
sudo apt-get update
sudo apt-get install -y golang-go poppler-utils curl ca-certificates openssl jq
go version
pdfinfo -v
pdftoppm -v
```

Do not reinstall CUDA. The Qwen runbook owns the isolated model environment. Keep the OCR runbook as an optional rollback procedure only.

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

The binary requires `WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `VLLM_API_KEY`. Optional values are `PORT` (default `8080`), `VLLM_URL`, `VLLM_MODEL`, and `PROCESSOR_SCRATCH_DIR` (default `/ephemeral/skillsgap-processor`). Set `VLLM_MODEL` to the exact identifier returned by `GET /v1/models`. Keep secrets in a mode-0600 environment file. `OCR_URL` and `OCR_SERVICE_SECRET` are not needed unless the dormant rollback path is deliberately restored.

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

### Thunder container launcher

The current Thunder image uses `s6` as PID 1 and does not provide a running
systemd bus. On that image, the deployed `/home/ubuntu/skillsgap/run_processor.sh`
launcher starts the same binary with `nohup setsid`, a PID file, and a private
log. Restart it after replacing the binary:

```bash
/home/ubuntu/skillsgap/run_processor.sh
curl --fail --silent http://127.0.0.1:8080/healthz
```

The launcher is only a container-specific alternative; the systemd unit above
remains suitable for a normal VM image.

## 5. Configure the Supabase webhook

Migration `20260905221437_wire_processor_webhook.sql` enables `pg_net`, creates
the Vault secret, and installs one trigger for `resume_analysis` inserts. It
sends only the processing-job identifier to the Go endpoint:

```json
{ "job_id": "..." }
```

The production endpoint is:

```text
https://e2tpybmi-8080.thundercompute.net/webhooks/resume
```

Do not create a second dashboard webhook for the same table. The migration
keeps the secret in Supabase Vault and the matching value in Thunder's
mode-0600 `/etc/skillsgap/processor.env`.

The webhook body may be the standard Supabase envelope. The service reads only `record.id`, acknowledges quickly with `202`, and leaves durable recovery to its poller if delivery is delayed.

## Troubleshooting

- `connection refused`: inspect `sudo systemctl status skillsgap-processor` and `ss -ltnp | grep ':8080'`.
- `401 unauthorized`: compare the webhook header byte-for-byte with `WEBHOOK_SECRET`.
- vLLM unavailable: the worker records a safe retry/failure state; inspect the model locally on port `8000`.
- Never put a service-role key in a `NEXT_PUBLIC_` variable or expose ports `8000`/`8090` through Thunder.
