import { defineConfig } from 'astro/config';
import staticAdapter from '@astrojs/static';

export default defineConfig({
  output: 'static',
  adapter: staticAdapter(),
});



