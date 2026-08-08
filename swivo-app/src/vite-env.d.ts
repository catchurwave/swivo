/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WP_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
