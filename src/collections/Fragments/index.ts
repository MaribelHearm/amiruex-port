import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { revalidatePath } from 'next/cache'

export const Fragments: CollectionConfig = {
  slug: 'fragments',
  labels: {
    singular: '碎片',
    plural: '碎片',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'updatedAt'],
    description: '短随笔、过程性想法和未完成线索，显示在 /wandering 碎片区页面。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: '碎片标题，一句话即可。',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: '碎片正文，几句话的短想法或随笔。',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: '发布时间，留空则发布时自动填入当前时间。',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath('/wandering')
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidatePath('/wandering')
        return doc
      },
    ],
  },
  versions: {
    drafts: {
      autosave: { interval: 100 },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
}
