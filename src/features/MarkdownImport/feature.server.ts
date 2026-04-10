import { createServerFeature } from '@payloadcms/richtext-lexical'

export const MarkdownImportFeature = createServerFeature({
  feature: {
    ClientFeature: '@/features/MarkdownImport/feature.client#MarkdownImportClientFeature',
  },
  key: 'markdownImport',
})
