import { DocsEditor } from "@/components/docs-editor";
import fs from 'fs/promises';
import path from 'path';

export default async function Page() {
  // Example loading an MDX file from your content directory
  const filePath = "content/docs/index.mdx";
  const absolutePath = path.join(process.cwd(), filePath);
  const initialContent = await fs.readFile(absolutePath, "utf8");

  return (
    <main className="min-h-screen">
      <DocsEditor initialContent={initialContent} filePath={filePath} />
    </main>
  );
}