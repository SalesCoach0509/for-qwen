/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_PROVIDER: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_OPENAI_MODEL: string;

  readonly VITE_GEMINI_MODEL: string;
  readonly VITE_QWEN_API_KEY: string;
  readonly VITE_QWEN_MODEL: string;
  readonly VITE_QWEN_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_USE_MOCK_AI: string;
  readonly VITE_BACKEND_STATUS_TIMEOUT_MS: string;
  readonly VITE_LLM_DIAGNOSTIC_TIMEOUT_MS: string;
  readonly VITE_AI_REQUEST_TIMEOUT_MS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
