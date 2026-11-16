import fs from 'node:fs';
import path from 'node:path';

// Change this to your Fumadocs content directory
const CONTENT_DIR = './content/docs';

function cleanPandocToMdx(content) {
  let result = content;

  // 1. Convert [text]{.mark} -> <mark>text</mark>
  result = result.replace(/\[([^\]]+)\]\{\.mark\}/g, '<mark>$1</mark>');

  // 2. Convert [text]{.underline} -> <u>text</u>
  result = result.replace(/\[([^\]]+)\]\{\.underline\}/g, '<u>$1</u>');

  // 3. Convert ![alt](src){width="..." height="..."} -> <img ... />
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g,
    (_, alt, src, attrs) => {
      const widthMatch = attrs.match(/width="([^"]+)"?/);
      const heightMatch = attrs.match(/height="([^"]+)"?/);

      const styles = [];
      if (widthMatch) {
        // Default bare numbers to px; preserve units like 'in', 'cm', '%'
        const w = /^\d+(\.\d+)?$/.test(widthMatch[1])
          ? `${widthMatch[1]}px`
          : widthMatch[1];
        styles.push(`width: '${w}'`);
      }
      if (heightMatch) {
        const h = /^\d+(\.\d+)?$/.test(heightMatch[1])
          ? `${heightMatch[1]}px`
          : heightMatch[1];
        styles.push(`height: '${h}'`);
      }

      const styleProp = styles.length > 0 ? ` style={{ ${styles.join(', ')} }}` : '';
      return `<img src="${src}" alt="${alt}"${styleProp} />`;
    }
  );

  // 4. Strip Pandoc heading IDs like "## Heading {#heading-id}"
  result = result.replace(/^(#{1,6}\s+.+?)\s*\{#[^}]+\}\s*$/gm, '$1');

  // 5. Convert remaining [text]{.other-class} -> <span>text</span>
  result = result.replace(/\[([^\]]+)\]\{\.[^}]+\}/g, '<span>$1</span>');

  return result;
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const cleaned = cleanPandocToMdx(original);
      if (original !== cleaned) {
        fs.writeFileSync(fullPath, cleaned, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walkDir(CONTENT_DIR);
console.log('Done!');
