# Railway LLM configuration

Configure these Railway variables. The application uses the primary provider first and switches to the fallback only for transient failures such as 429, 503, and timeouts.

## Primary provider

```text
LLM_PROVIDER=gemini
LLM_API_KEY=<your Gemini key>
LLM_MODEL=gemini-3.8-flash
```

For an OpenAI-compatible provider, set its endpoint as well:

```text
LLM_PROVIDER=<provider-name>
LLM_API_KEY=<provider key>
LLM_MODEL=<model id>
LLM_BASE_URL=https://<provider-host>/v1
```

## Fallback provider

For a second Gemini model using the same key:

```text
LLM_FALLBACK_PROVIDER=gemini
LLM_FALLBACK_MODEL=gemini-2.5-flash
```

For a separate OpenAI-compatible provider:

```text
LLM_FALLBACK_PROVIDER=<provider-name>
LLM_FALLBACK_API_KEY=<fallback key>
LLM_FALLBACK_MODEL=<fallback model id>
LLM_FALLBACK_BASE_URL=https://<fallback-host>/v1
```

Never place provider keys in `VITE_*` variables. After saving variables, redeploy, run the validation suite, and confirm Gate 1 reports `READY` with a successful gateway connection test.

## Timeout variables

```text
LLM_REQUEST_TIMEOUT_MS=60000
LLM_DIAGNOSTIC_TIMEOUT_MS=90000
VITE_BACKEND_STATUS_TIMEOUT_MS=5000
VITE_LLM_DIAGNOSTIC_TIMEOUT_MS=95000
VITE_AI_REQUEST_TIMEOUT_MS=95000
```

`GET /api/health` and `GET /api/diagnostic` are fast status-only calls. Gate 1 performs its real provider check through `POST /api/diagnostic/llm-test`, where the longer diagnostic timeout applies. This prevents a slow LLM call from being aborted by the five-second status timeout.
