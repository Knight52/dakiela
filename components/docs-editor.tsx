'use client';

import { MdxEditor, fumadocsUiComponents } from "@fumadocs-editor/ui";
import { featureSpec } from "@/components/infobox";

interface DocsEditorProps {
  initialContent: string;
  filePath: string;
}

export function DocsEditor({ initialContent, filePath }: DocsEditorProps) {
  return (
    <MdxEditor
      variant="page"
      defaultValue={initialContent}
      components={[...fumadocsUiComponents, featureSpec]}
      sync={{
        path: filePath, // Optional sync path for local development file writing
      }}
      onChange={(markdown) => {
        // Trigger your save logic or API mutation here
        console.log("Updated MDX content:", markdown);
      }}
    />
  );
}