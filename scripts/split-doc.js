import fs from 'fs';
import path from 'path';

const INPUT_FILE = './content/docs/domain-religion/demigods/index.mdx';
const OUTPUT_DIR = './content/docs/domain-religion/demigods';

// Read the exported markdown file
const content = fs.readFileSync(INPUT_FILE, 'utf-8');

// Split the file at every H1 heading ("# ") at the start of a line
const sections = content.split("<img src=\"https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/fumadocs/images/media/image2.png\" alt=\"ขีดสั้น\" style={{ width: '0.4791666666666667in', height: '6.25e-2in' }} />").filter(Boolean);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

sections.forEach((section, index) => {
  const lines = section.split('\n');
  const title = lines[0].trim();
  const body = lines.slice(1).join('\n').trim();

  // Create a URL-friendly filename (slug)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `page-${index + 1}`;

  // Format with Fumadocs YAML frontmatter
  const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: ""
---

${body}
`;

  const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);
  fs.writeFileSync(filePath, mdxContent);
  console.log(`Created: ${filePath}`);
});
