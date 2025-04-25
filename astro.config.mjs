import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/server';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
});

