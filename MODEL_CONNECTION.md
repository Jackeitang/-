# DeepSeek / GLM connections

The owner requested replacing the former learning-content updater with external models. Both original ChatGPT automation tasks are paused. **Connecting a model does not enable unattended scheduling.** Do not tell the owner that daily content updates are running until a real provider call and the complete update/readback flow have succeeded and a scheduler has been activated. A ChatGPT research runner still uses ChatGPT resources even if drafting is delegated; do not promise otherwise. An independent scheduler requires separate supported infrastructure and authorization to this private Site.

The owner can open `/?settings=models`, select DeepSeek or GLM, enter a standard platform API Key and a model ID, then click “验证并保存连接”. One brief, possibly billable request verifies the provider before replacing the old config. The model ID is editable to match account permissions. API endpoints are fixed to official providers. The custom option retains the older, browser-only temporary interface and cannot be used by background jobs.

`LINGOLOOP_KEY_ENCRYPTION` is a 256-bit base64 AES-GCM key provisioned as a Sites runtime secret. Never rotate it without a migration: previously stored credentials would become unreadable. API credentials entered by the owner are encrypted in R2 at `private/model-connection-v1.json`, bound to the signing-in Site user. No endpoint returns a credential. Mutation routes require the model-v1 header and deny cross-site browser requests. The Site must remain owner-private; do not broaden access to make jobs work. API Key management and interactive chat require the signed-in user's Site identity. No provider key is stored in client storage, source or schedule prompts.

Endpoints:
- GET `/api/models/config`: sanitized connection state, storage readiness, paused scheduling state.
- POST `/api/models/config`: `{provider: "deepseek"|"glm", model, key}`; requires signed-in identity. Tests provider before encrypting and saving. Blank key only reuses an existing key for the same provider.
- DELETE `/api/models/config`: delete the encrypted connection.
- POST `/api/models/chat`: `{messages:[{role,content}]}`; server calls the selected provider, with bounded output and no automatic retries.
- POST `/api/models/reading-draft`: `{research:{candidates:[{title,reason}, ...at least 3],facts,eventDate,sources:[{name,url,published}]}}`. A research runner must first retrieve, verify and compare sources using READING_UPDATES.md. This route is callable through the existing owner-private Site service access, sends the evidence to the selected provider and returns `{article,provider,model,persisted:false,usage}`. It does not discover sources or publish a draft. The runner must verify accuracy, source attribution and copyright limits, set the article ID to date + event slug, then use the existing reading PUT/readback flow. Inadequate evidence or invalid output must preserve the old article.

All POST/DELETE requests include `X-LingoLoop-Model: model-v1`; JSON writes also include `Content-Type: application/json`. Service callers obtain fresh private Site access as described in READING_UPDATES.md. Never save or forward Sites bearer tokens to a model provider.

CBS discovery, actual VideoObject/HLS verification, and source dates remain governed by LISTENING_UPDATES.md. A saved model alone does not perform those checks. Do not generate substitute audio, transcripts, or unsupported answer keys. The current daily jobs remain paused until the replacement pipeline is completed and verified.

Official API docs: https://api-docs.deepseek.com/ and https://docs.bigmodel.cn/llms.txt (OpenAI-compatible standard API). Presets checked 2026-11-09; model availability depends on the provider account. Tests use synthetic keys and mock provider responses; only a user's actual successful verification establishes a live connection.
