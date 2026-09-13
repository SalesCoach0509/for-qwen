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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
