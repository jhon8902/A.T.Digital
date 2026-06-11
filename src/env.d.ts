/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly DATABASE_URL: string;
	readonly NETLIFY_DATABASE_URL: string;
	readonly NETLIFY_DATABASE_URL_UNPOOLED: string;
	readonly FORMULARIO_ADMIN_USER?: string;
	readonly FORMULARIO_ADMIN_PASSWORD?: string;
	readonly DEALER_SESSION_SECRET?: string;
	readonly API_BASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
