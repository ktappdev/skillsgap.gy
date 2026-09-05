#!/usr/bin/env node
/**
 * Verify the private Qwen vision gate before a live CV rehearsal.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-vision-only-readiness.mjs
 */

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function endpoint(path) {
  return `${required("VLLM_URL").replace(/\/$/, "")}/${path}`;
}

const apiKey = required("VLLM_API_KEY");
const model = required("VLLM_MODEL");
const headers = { Authorization: `Bearer ${apiKey}` };
const requestOptions = { headers, signal: AbortSignal.timeout(60_000) };

const modelsResponse = await fetch(endpoint("models"), requestOptions);
assert(modelsResponse.ok, `Qwen model discovery failed with HTTP ${modelsResponse.status}.`);
const modelsPayload = await modelsResponse.json();
const modelIds = Array.isArray(modelsPayload.data) ? modelsPayload.data.map((entry) => entry?.id) : [];
assert(modelIds.includes(model), `Configured VLLM_MODEL was not served: ${model}.`);

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const visionResponse = await fetch(endpoint("chat/completions"), {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  signal: AbortSignal.timeout(60_000),
  body: JSON.stringify({
    model,
    temperature: 0,
    max_tokens: 32,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "This is a synthetic one-pixel image. Reply with JSON containing ok=true." },
        { type: "image_url", image_url: { url: image } },
      ],
    }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "vision_gate",
        strict: true,
        schema: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
          additionalProperties: false,
        },
      },
    },
  }),
});
assert(visionResponse.ok, `Qwen vision gate failed with HTTP ${visionResponse.status}.`);
const visionPayload = await visionResponse.json();
const content = visionPayload.choices?.[0]?.message?.content;
assert(typeof content === "string", "Qwen vision gate returned no structured content.");
let result;
try {
  result = JSON.parse(content);
} catch {
  throw new Error("Qwen vision gate returned malformed JSON.");
}
assert(result?.ok === true, "Qwen vision gate did not return ok=true.");

const processorUrl = process.env.PROCESSOR_URL?.trim().replace(/\/$/, "");
if (processorUrl) {
  const processorResponse = await fetch(`${processorUrl}/healthz`, { signal: AbortSignal.timeout(10_000) });
  assert(processorResponse.ok, `Go processor health check failed with HTTP ${processorResponse.status}.`);
}

console.log(`Vision-only readiness passed for ${model}.`);
