import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const { docs, meta } = defineDocs({
  dir: 'content/docs', // Directory where your markdown files will live
});

export default defineConfig({
  mdxOptions:{
    remarkImageOptions:{
      external:true,
      onError: "ignore"
    }
  }
});