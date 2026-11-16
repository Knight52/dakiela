// studio.server.ts
import { defineServerConfig } from '@fumadocs-editor/studio';
import tailwindcss from '@tailwindcss/vite';

export default defineServerConfig({
  vite: { plugins: [tailwindcss()] },
});
