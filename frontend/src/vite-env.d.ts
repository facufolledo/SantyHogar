/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** `true` = checkout con API + Mercado Pago. Omitido o distinto de `true` = pedido solo local. */
  readonly VITE_ENABLE_MP_CHECKOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
