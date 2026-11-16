import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source, {
  // Ensure unique IDs if customizing buildIndex
  buildIndex(page) {
    return {
      id: page.url, // Must be unique across all pages
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData,
    };
  },
});