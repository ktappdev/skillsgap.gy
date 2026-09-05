# Thunder Compute: Qwen3.6-35B-A3B with vLLM

Qwen is the private semantic extraction and selective vision-verification service. It binds to loopback so only the Go processor can send CV text or page images to it.

```text
Go processor → http://127.0.0.1:8000/v1
vLLM         → 127.0.0.1:8000 (never forward publicly)
```

The vLLM recipe identifies Qwen3.6-35B-A3B as a multimodal 35B-total/3B-active MoE model, supports single-GPU FP8 deployment on RTX Pro 6000-class hardware, and requires vLLM 0.17.0 or newer. Use the exact checkpoint already proven on the Thunder instance; the Go `VLLM_MODEL` value must equal the served identifier returned by `/v1/models`.

- [Qwen model repository](https://github.com/QwenLM/Qwen3.5)
- [vLLM Qwen3.6-35B-A3B recipe](https://github.com/vllm-project/recipes/blob/main/models/Qwen/Qwen3.6-35B-A3B.yaml)

## 1. Verify the running model

Keep the existing Thunder model installation. Do not reinstall CUDA or replace a working checkpoint during the hackathon.

```bash
nvidia-smi
source "$HOME/skillsgap/venvs/vllm/bin/activate"
vllm --version
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"
curl --fail --silent --show-error \
  http://127.0.0.1:8000/v1/models \
  -H "Authorization: Bearer $VLLM_API_KEY" | jq '{models: [.data[].id]}'
```

Record the returned identifier in `/etc/skillsgap/processor.env` as `VLLM_MODEL`. Never guess or rename it only in the client.

## 2. Private serving baseline

If the model must be started from the official FP8 checkpoint, use this conservative single-GPU baseline:

```bash
source "$HOME/skillsgap/venvs/vllm/bin/activate"
export HF_HOME="$HOME/skillsgap/models/huggingface"
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"
vllm serve Qwen/Qwen3.6-35B-A3B-FP8 \
  --host 127.0.0.1 \
  --port 8000 \
  --served-model-name qwen3.6-35b-a3b \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.88 \
  --api-key "$VLLM_API_KEY"
```

Keep PP-StructureV3 on CPU initially. If this baseline does not fit the installed GPU/checkpoint, preserve the exact error and adjust the model quantization or memory utilization rather than reinstalling the NVIDIA stack.

## 3. Structured text gate

```bash
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"
export VLLM_MODEL="$(curl --fail --silent http://127.0.0.1:8000/v1/models -H "Authorization: Bearer $VLLM_API_KEY" | jq -r '.data[0].id')"
curl --fail --silent --show-error \
  http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg model "$VLLM_MODEL" '{model:$model,temperature:0,messages:[{role:"system",content:"Extract only facts supported by the text. Return JSON."},{role:"user",content:"Worked as a diesel mechanic for four years."}],response_format:{type:"json_schema",json_schema:{name:"resume_fact",strict:true,schema:{type:"object",properties:{trade:{type:"string"},years:{type:"number"}},required:["trade","years"],additionalProperties:false}}}}')" | jq '.choices[0].message.content'
```

The response must be schema-valid. Do not enable live CV processing if structured output is unsupported or free-form.

## 4. Vision gate

Use a synthetic image with no real PII. The Go test suite owns the final multimodal request shape and payload limits; this gate confirms that the served checkpoint actually accepts an OpenAI-compatible `image_url` content part.

```bash
export VLLM_API_KEY="$(cat "$HOME/skillsgap/vllm-api-key")"
export VLLM_MODEL="$(curl --fail --silent http://127.0.0.1:8000/v1/models -H "Authorization: Bearer $VLLM_API_KEY" | jq -r '.data[0].id')"
curl --fail --silent --show-error \
  http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer $VLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg model "$VLLM_MODEL" --arg image 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' '{model:$model,temperature:0,max_tokens:32,messages:[{role:"user",content:[{type:"text",text:"This is a synthetic one-pixel image. Reply with JSON containing ok=true."},{type:"image_url",image_url:{url:$image}}]}],response_format:{type:"json_schema",json_schema:{name:"vision_gate",strict:true,schema:{type:"object",properties:{ok:{type:"boolean"}},required:["ok"],additionalProperties:false}}}}')" | jq '.choices[0].message.content'
```

## 5. Service rules

- Store `VLLM_API_KEY` in a mode-0600 environment file and never print it in application logs.
- Bind only to `127.0.0.1:8000`; Thunder forwards only Go port `8080`.
- Keep one processor worker until latency and memory are measured.
- Disable request-body and model-output logging. CV text and page images are private PII.
- A model failure never changes matching or interview state; the durable job retries and ultimately shows a safe applicant message.

## Troubleshooting

- `404` on `/v1/models`: confirm the Thunder route is not being used for the internal call and that vLLM includes the `/v1` API.
- Image request rejected: verify the exact checkpoint includes its vision tower and the installed vLLM version supports Qwen3.6 multimodal input.
- JSON schema rejected: keep jobs queued until the serving configuration supports strict structured output.
- GPU out of memory: keep OCR on CPU, lower `--gpu-memory-utilization`, shorten the model context, or use the proven FP8 checkpoint.
