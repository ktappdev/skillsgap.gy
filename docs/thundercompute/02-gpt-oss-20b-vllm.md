# Thunder Compute: gpt-oss-20b with vLLM

This runbook serves `openai/gpt-oss-20b` as an OpenAI-compatible HTTP API on the Thunder Compute instance. The API is intentionally bound to localhost so only the Go backend can call it.

The official OpenAI/vLLM recipe lists about 16 GB of VRAM for the 20B model and uses the command `vllm serve openai/gpt-oss-20b`. The model is MXFP4-quantized. See the [OpenAI vLLM recipe](https://github.com/openai/openai-cookbook/blob/main/articles/gpt-oss/run-vllm.md) and [vLLM GPT-OSS recipe](https://github.com/vllm-project/recipes/blob/main/OpenAI/GPT-OSS.md).

## Target layout

```text
Go API → http://127.0.0.1:8000/v1
vLLM  → 127.0.0.1:8000
```

Never expose port `8000` through Thunder. The Go service is the only public processing entry point.

## 1. Verify the GPU and persistent storage

```bash
nvidia-smi
df -h "$HOME"
```

Thunder supplies the NVIDIA driver and CUDA environment. Do not reinstall CUDA. Keep model downloads under the persistent home directory, not `/ephemeral`, so an instance modification does not require downloading the weights again.

## 2. Create an isolated Python environment

The vLLM and PaddleOCR environments should be separate. This avoids dependency conflicts between the LLM server and OCR pipeline.

```bash
mkdir -p "$HOME/skillsgap/models/huggingface" "$HOME/skillsgap/venvs"
export HF_HOME="$HOME/skillsgap/models/huggingface"

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

uv venv --python 3.12 "$HOME/skillsgap/venvs/vllm"
source "$HOME/skillsgap/venvs/vllm/bin/activate"
uv pip install --upgrade pip
uv pip install vllm --torch-backend=auto
vllm --version
```

If the instance reports a model or kernel compatibility error, capture the exact error before changing versions. The vLLM GPT-OSS recipe is a living compatibility guide, particularly for non-Hopper GPUs.

## 3. Create a private API key

```bash
export VLLM_API_KEY="$(openssl rand -hex 32)"
umask 077
printf '%s\n' "$VLLM_API_KEY" > "$HOME/skillsgap/vllm-api-key"
```

The key is for the local Go-to-vLLM boundary. It is not a browser-facing secret.

## 4. Start vLLM

Start with a conservative context and memory budget because PP-StructureV3 will also use the GPU. Use a separate terminal or a systemd service.

```bash
source "$HOME/skillsgap/venvs/vllm/bin/activate"
export HF_HOME="$HOME/skillsgap/models/huggingface"
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"

vllm serve openai/gpt-oss-20b \
  --host 127.0.0.1 \
  --port 8000 \
  --served-model-name gpt-oss-20b \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.75 \
  --api-key "$VLLM_API_KEY"
```

The first launch downloads the model from Hugging Face. Wait for the startup message before testing.

## 5. Verify the server

```bash
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"
curl --fail --silent --show-error \
  http://127.0.0.1:8000/v1/models \
  -H "Authorization: Bearer $VLLM_API_KEY"
```

Send a small structured-output request:

```bash
curl --fail --silent --show-error \
  http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-20b",
    "messages": [
      {"role":"system","content":"Extract only facts present in the text. Return valid JSON."},
      {"role":"user","content":"Worked as a diesel mechanic for four years. Holds a forklift certificate."}
    ],
    "temperature": 0,
    "include_reasoning": false,
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "resume_facts",
        "strict": true,
        "schema": {
          "type": "object",
          "properties": {
            "skills": {"type":"array","items":{"type":"string"}},
            "certifications": {"type":"array","items":{"type":"string"}}
          },
          "required": ["skills", "certifications"],
          "additionalProperties": false
        }
      }
    }
  }'
```

The response should contain JSON with a diesel-mechanic skill and forklift certification. The Go service must still validate this JSON and must calculate match percentages itself.

## 6. Optional systemd service

Create `/etc/systemd/system/skillsgap-vllm.service`:

```ini
[Unit]
Description=SkillsGap gpt-oss-20b vLLM server
After=network-online.target
Wants=network-online.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/skillsgap
Environment=HF_HOME=/home/ubuntu/skillsgap/models/huggingface
EnvironmentFile=/home/ubuntu/skillsgap/vllm.env
ExecStart=/home/ubuntu/skillsgap/venvs/vllm/bin/vllm serve openai/gpt-oss-20b --host 127.0.0.1 --port 8000 --served-model-name gpt-oss-20b --max-model-len 32768 --gpu-memory-utilization 0.75 --api-key ${VLLM_API_KEY}
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Create the environment file with restrictive permissions:

```bash
umask 077
printf 'VLLM_API_KEY=%s\n' "$(cat "$HOME/skillsgap/vllm-api-key")" > "$HOME/skillsgap/vllm.env"
sudo install -o ubuntu -g ubuntu -m 0600 "$HOME/skillsgap/vllm.env" /home/ubuntu/skillsgap/vllm.env
sudo systemctl daemon-reload
sudo systemctl enable --now skillsgap-vllm
sudo systemctl status --no-pager skillsgap-vllm
```

## Troubleshooting

- GPU out of memory: stop other GPU processes, lower `--gpu-memory-utilization` to `0.60`, or run OCR sequentially instead of concurrently.
- The model loads but output is malformed: keep `response_format` JSON Schema, validate the response in Go, and test with `include_reasoning: false`.
- vLLM fails during startup on an RTX A6000/Ada: check the current [vLLM GPT-OSS recipe](https://github.com/vllm-project/recipes/blob/main/OpenAI/GPT-OSS.md) and preserve the error; do not randomly reinstall CUDA.
- API unreachable from Go: confirm vLLM is running and Go uses `http://127.0.0.1:8000/v1`; do not use the Thunder public hostname for this internal call.
