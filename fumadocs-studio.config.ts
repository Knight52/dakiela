// fumadocs-studio.config.ts
import { defineConfig } from '@fumadocs-editor/studio';
import { fumadocsUiComponents } from '@fumadocs-editor/ui';
import { featureSpec } from './components/infobox';

export default defineConfig({
  root: 'content/docs',
  components: [...fumadocsUiComponents, featureSpec],
  styles: ['./styles/globals.css'],
  server: './studio.server.ts',
});
