'use client'

import { createClientFeature, toolbarFeatureButtonsGroupWithItems } from '@payloadcms/richtext-lexical/client'
import { MarkdownImportPlugin, OPEN_MARKDOWN_IMPORT_COMMAND } from './MarkdownImportPlugin'
import { MarkdownImportIcon } from './icon'

export const MarkdownImportClientFeature = createClientFeature({
  plugins: [
    {
      Component: MarkdownImportPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: [
      toolbarFeatureButtonsGroupWithItems([
        {
          ChildComponent: MarkdownImportIcon,
          isActive: () => false,
          key: 'markdownImport',
          label: 'Import Markdown',
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined)
          },
        },
      ]),
    ],
  },
})
