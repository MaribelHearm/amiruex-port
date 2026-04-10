import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { revalidatePath } from 'next/cache'

export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: {
    singular: '照片',
    plural: '照片',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'takenAt', 'location', 'updatedAt'],
    description: '上传照片，显示在 /photography 摄影区页面。',
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: '照片文件，建议上传高分辨率原图，系统会自动生成缩略图。',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: '照片标题，可留空（留空则只显示图片）。',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: '照片说明文字，一两句话，可选。',
      },
    },
    {
      name: 'takenAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: '拍摄日期。',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: '拍摄地点，如「上海 · 外滩」，可选。',
      },
    },
  ],
  hooks: {
    afterChange: [({ doc }) => { revalidatePath('/photography'); return doc }],
    afterDelete: [({ doc }) => { revalidatePath('/photography'); return doc }],
  },
  versions: {
    drafts: {
      autosave: { interval: 100 },
      schedulePublish: true,
    },
    maxPerDoc: 10,
  },
}
