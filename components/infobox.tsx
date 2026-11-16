// components/infobox.tsx
import React from 'react';
import "tailwindcss"

import {
  emptyComponent,
  type ComponentRenderProps,
  type UiComponentSpec,
} from '@fumadocs-editor/ui';

export const featureSpec: UiComponentSpec = {
  name: 'Infobox',
  label: 'Infobox',
  // Only `title` should be an inline editable text region
  attributeRegions: [
    { attribute: 'title', region: 'title', placeholder: 'Title' },
  ],
  childrenRegion: {
    region: 'body',
    placeholder: 'Describe the feature…',
  },
  // Move `float` here so it appears in the attributes panel instead of the text canvas
  props: [
    { name: 'float', label: 'Float', type: 'string', default: 'left' },
  ],
  // Style the `title` region directly here instead of wrapping it in an <h3>
  regions: {
    title: 'font-semibold text-base mb-3 pb-2 border-b border-fd-border text-center',
  },
  insert: (specs) => emptyComponent(featureSpec, specs),
  render: InfoboxRenderer,
};

interface InfoboxProps {
  title?: string;
  float?: 'left' | 'right';
  children: React.ReactNode;
}
export function InfoboxRenderer({ props, children }: ComponentRenderProps) {
  let title = props.title;
  let float = props.float;
    let margin = float == "right"? "ml-6": "mr-6";
  return (
    <div className={"float-" + float +" clear-" + float +" " + margin + " mb-4 w-72 rounded-xl border border-fd-border bg-fd-card p-4 text-fd-card-foreground shadow-sm text-sm"}>
      {children}
    </div>
  );
}
export function Infobox({ title, children,float }: InfoboxProps) {
    let margin = float == "right"? "ml-6": "mr-6";
  return (
    <div className={"float-" + float +" clear-" + float +" " + margin + " mb-4 w-72 rounded-xl border border-fd-border bg-fd-card p-4 text-fd-card-foreground shadow-sm text-sm"}>
      {title && (
        <h3 className="font-semibold text-base mb-3 pb-2 border-b border-fd-border flex flex-col text-center items-center">
          {title}
        </h3>
      )}
      <div className="flex flex-col items-center text-center gap-2 w-full">
        {children}
      </div>
    </div>
  );
}